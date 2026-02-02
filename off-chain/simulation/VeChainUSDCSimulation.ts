import {
  VECHAIN_BATCH_CONTRACT_ABI,
  VECHAIN_USDC_CONTRACT_ABI,
} from "@/lib/ABI";
import { recipients } from "@/lib/vechain-wallets";
import { Transaction } from "@/types/types";
import {
  ABIContract,
  Address,
  Clause,
  Hex,
  HexUInt,
  Keccak256,
  Mnemonic,
  Secp256k1,
  TransactionBody,
} from "@vechain/sdk-core";
import {
  ProviderInternalBaseWallet,
  ThorClient,
  VeChainProvider,
} from "@vechain/sdk-network";
import * as dotenv from "dotenv";

//batching variables
const BATCH_SIZE = 5;
const BATCH_INTERVAL_MIN = 1;
const BATCH_INTERVAL_MS = BATCH_INTERVAL_MIN * 60 * 1000;

dotenv.config();

const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;
const BATCHER_ADDRESS = process.env
  .NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS as string;

const thorSoloClient = ThorClient.at(THOR_URL, {
  isPollingEnabled: false,
});

const godMnemonic =
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross";
const godPrivateKey = Mnemonic.toPrivateKey(godMnemonic.split(" "));
const godPublicKey = Secp256k1.derivePublicKey(godPrivateKey);
const godAddress = Address.ofPublicKey(godPublicKey).toString();

const senderAccount: { privateKey: string; address: string } = {
  privateKey: Hex.of(godPrivateKey).toString(),
  address: godAddress,
};

const provider = new VeChainProvider(
  // Thor client used by the provider
  thorSoloClient,

  // Internal wallet used by the provider (needed to call the getSigner() method)
  new ProviderInternalBaseWallet([
    {
      privateKey: HexUInt.of(senderAccount.privateKey).bytes,
      address: senderAccount.address,
    },
  ]),

  // Disable fee delegation (BY DEFAULT IT IS DISABLED)
  false,
);

async function approveSmartContractForAll(provider: VeChainProvider) {
  console.log("Approving smart contract for all...");

  console.log("This operation is performed only once.");

  try {
    const latestBlock = await thorSoloClient.blocks.getBestBlockCompressed();
    const chainTag = await thorSoloClient.nodes.getChaintag();

    const clauses: Clause[] = [
      ...recipients.map((r) =>
        Clause.callFunction(
          Address.of(USDC_ADDRESS),
          ABIContract.ofAbi(VECHAIN_USDC_CONTRACT_ABI).getFunction("approve"),
          [r.address, 100000],
        ),
      ),
    ];

    const gas = await thorSoloClient.gas.estimateGas(
      clauses,
      senderAccount.address,
    );

    const body: TransactionBody = {
      chainTag,
      blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
      expiration: 32,
      clauses,
      gasPriceCoef: 232,
      gas: gas.totalGas,
      dependsOn: null,
      nonce: 12345678,
    };

    const signedTransaction = Transaction.of(body).sign(godPrivateKey);

    const encodedRaw = signedTransaction.encoded;

    const decodedTx = Transaction.decode(encodedRaw, true);

    const sendTransactionResult =
      await thorSoloClient.transactions.sendTransaction(decodedTx);

    const txReceipt = await thorSoloClient.transactions.waitForTransaction(
      sendTransactionResult.id,
    );

    console.log(txReceipt);

    console.log("✅ All wallets approved the smart contract.");
    console.log("------------------------------------------------");
  } catch (error) {
    console.log(`Error during approval: ${(error as Error).message}`);
    return false;
  }
}

async function executeBatch(batch: Transaction[], batchNumber: number) {
  if (batch.length === 0) {
    console.log(
      `⚠️ Batch #${batchNumber}: No transactions to batch. Skipping...`,
    );
    return;
  }

  if (batch.length >= BATCH_SIZE) {
    console.log(`Batch size is reached.`);
  }

  console.log(
    `\n📦 Batch #${batchNumber}: Batching ${batch.length} transactions...`,
  );

  try {
    const signatures: string[] = [];
    const senders = [];
    const recipients = [];
    const amounts = [];

    const clause: Clause = Clause.callFunction(
      Address.of(BATCHER_ADDRESS),
      ABIContract.ofAbi(VECHAIN_BATCH_CONTRACT_ABI).getFunction("executeBatch"),
      [batch],
    );

    //every sender needs to sign the transaction to be included in the batch
    for (let i = 0; i < batch.length; i++) {
      const tx = batch[i];

      


      signatures.push(signature);
      senders.push(tx.sender);
      recipients.push(tx.recipient);
      amounts.push(tx.amount);
    }
  } catch (error) {
    console.error(`❌ Batch #${batchNumber} execution failed:`, error);
  }
}
