import { VECHAIN_BATCH_CONTRACT_ABI } from "@/lib/ABI";
import { godWallet } from "@/lib/vechain-wallets";
import {
  Keccak256,
  Secp256k1,
  ABIContract,
  ABIFunction,
  Address,
  Transaction,
  HexUInt,
  Mnemonic,
  Hex,
} from "@vechain/sdk-core";
import { ThorClient } from "@vechain/sdk-network";
import * as dotenv from "dotenv";
import { Abi } from "viem";
import { Transaction as MetaInputTx } from "@/types/types";
import { generateRandomVeChainTransaction } from "@/lib/generateRandomUSDCTransaction";

dotenv.config();

const THOR_RPC_URL = "http://127.0.0.1:8669";
const BATCH_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS!;

const godMnemonic =
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross";
const godPrivateKeyBytes = Mnemonic.toPrivateKey(godMnemonic.split(" "));
const ADMIN_PRIVATE_KEY = Hex.of(godPrivateKeyBytes).toString();
const godPublicKey = Secp256k1.derivePublicKey(godPrivateKeyBytes);
const ADMIN_ADDRESS = Address.ofPublicKey(godPublicKey).toString();

const thorClient = ThorClient.at(THOR_RPC_URL);

const contractABI = VECHAIN_BATCH_CONTRACT_ABI as Abi;

// Build ABI helpers
const batchContract = ABIContract.ofAbi(contractABI);
const executeBatchFn = batchContract.getFunction("executeBatch") as ABIFunction;
const noncesFn = batchContract.getFunction("nonces") as ABIFunction;

// Your transaction shape:
// { sender, recipient, amount, senderPrivateKey }

// Sign a single meta‑transaction according to your Solidity logic
async function signMetaTx(
  tx: MetaInputTx,
  nonce: bigint,
): Promise<{ v: number; r: string; s: string }> {
  // messageHash = keccak256(abi.encodePacked(sender, recipient, amount, nonce, address(this)))
  const encodedPacked = Buffer.concat([
    // address is 20 bytes left‑padded in abi.encodePacked
    Buffer.from(tx.sender.replace("0x", "").padStart(40, "0"), "hex"),
    Buffer.from(tx.recipient.replace("0x", "").padStart(40, "0"), "hex"),
    // uint256 amount
    Buffer.from(BigInt(tx.amount).toString(16).padStart(64, "0"), "hex"),
    // uint256 nonce
    Buffer.from(nonce.toString(16).padStart(64, "0"), "hex"),
    // address(this)
    Buffer.from(
      BATCH_CONTRACT_ADDRESS.replace("0x", "").padStart(40, "0"),
      "hex",
    ),
  ]);

  const messageHash = Keccak256.of(encodedPacked).bytes;

  // ethSignedMessageHash = keccak256("\x19Ethereum Signed Message:\n32" ++ messageHash)
  const prefix = Buffer.from("\x19Ethereum Signed Message:\n32", "utf-8");
  const finalHash = Keccak256.of(
    Buffer.concat([prefix, Buffer.from(messageHash)]),
  ).bytes;

  const pkBytes = Buffer.from(tx.senderPrivateKey!.replace("0x", ""), "hex");
  const sig = Secp256k1.sign(finalHash, pkBytes);

  const r = "0x" + Buffer.from(sig.slice(0, 32)).toString("hex");
  const s = "0x" + Buffer.from(sig.slice(32, 64)).toString("hex");
  const v = sig[64] + 27;

  return { v, r, s };
}

// Read nonce for a given sender from VeChainBatch.nonces(sender)
async function getNonce(sender: string): Promise<bigint> {
  const res = await thorClient.contracts.executeCall(
    BATCH_CONTRACT_ADDRESS,
    noncesFn, // ABIFunction for `nonces(address)`
    [sender],
  );

  // result.plain is `unknown` in the typings, so assert / narrow it
  const plain = res.result.plain as string | number | bigint;

  return BigInt(plain.toString());
}

// Main function: sign all meta‑txs and executeBatch
export async function executeMetaBatch(txs: MetaInputTx[]): Promise<void> {
  if (txs.length === 0) return;

  // Group by sender so we can increment nonces locally
  const bySender = new Map<string, MetaInputTx[]>();
  for (const t of txs) {
    const key = Address.of(t.sender).toString();
    if (!bySender.has(key)) bySender.set(key, []);
    bySender.get(key)!.push(t);
  }

  // Build BatchTransaction[] with signatures
  const batchTxs: {
    sender: string;
    recipient: string;
    amount: bigint;
    v: number;
    r: string;
    s: string;
  }[] = [];

  for (const [sender, list] of bySender.entries()) {
    let nonce = await getNonce(sender); // on‑chain nonce per sender

    for (const tx of list) {
      const sig = await signMetaTx(tx, nonce);
      batchTxs.push({
        sender,
        recipient: Address.of(tx.recipient).toString(),
        amount: BigInt(tx.amount),
        v: sig.v,
        r: sig.r,
        s: sig.s,
      });
      nonce += BigInt(1);
    }
  }

  // Encode executeBatch(BatchTransaction[])
  const data = executeBatchFn.encodeData([batchTxs]).toString();

  // Build clause
  const clauses = [
    {
      to: BATCH_CONTRACT_ADDRESS,
      value: 0,
      data,
    },
  ];

  // Estimate gas and build tx body using SDK helpers [[Build tx](https://docs.vechain.org/developer-resources/how-to-build-on-vechain/write-data/transactions#build-transaction)]
  const gasResult = await thorClient.gas.estimateGas(clauses, ADMIN_ADDRESS);

  const txBody = await thorClient.transactions.buildTransactionBody(
    clauses,
    gasResult.totalGas,
    {
      gasPriceCoef: 0,
      expiration: 32,
    },
  );

  // Sign and send transaction [[Transactions](https://docs.vechain.org/developer-resources/sdks-and-providers/sdk/transactions); [Thor client tx](https://docs.vechain.org/developer-resources/sdks-and-providers/sdk/thor-client#transactions)]
  const adminPkBytes = HexUInt.of(ADMIN_PRIVATE_KEY.replace("0x", "")).bytes;

  const signedTx = Transaction.of(txBody).sign(adminPkBytes);

  const sendResult = await thorClient.transactions.sendRawTransaction(
    HexUInt.of(signedTx.encoded).toString(),
  );

  console.log("Built tx body:", txBody);
  console.log("Signed tx id:", sendResult.id);

  const receipt = await thorClient.transactions.waitForTransaction(
    sendResult.id,
  );
  console.log("Receipt:", receipt);

  console.log("Batch tx id:", sendResult.id);
/*
  const reason = await thorClient.transactions.getRevertReason(sendResult.id);
  console.log("Revert reason:", reason); */
}

async function main() {
  const txs: MetaInputTx[] = [];

  for (let i = 0; i < 10; i++) {
    const t = await generateRandomVeChainTransaction(); // must return MetaInputTx
    txs.push(t);
  }
  await executeMetaBatch(txs);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
