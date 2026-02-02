import {
  ProviderInternalBaseWallet,
  signerUtils,
  ThorClient,
  VeChainPrivateKeySigner,
  VeChainProvider,
} from "@vechain/sdk-network";
import {
  Clause,
  Address,
  VET,
  VTHO,
  TransactionClause,
  HexUInt,
  Transaction,
  TransactionBody,
  networkInfo,
  Account,
  Secp256k1,
  Hex,
  Units,
} from "@vechain/sdk-core";
import * as dotenv from "dotenv";
import { recipients, godWallet } from "../lib/vechain-wallets";
import { Mnemonic } from "@vechain/sdk-core";

dotenv.config();

// CONFIGURATION
const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;

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

async function seed() {
  console.log("Starting Seeding Process (Native SDK Mode)...");

  const latestBlock = await thorSoloClient.blocks.getBestBlockCompressed();
  const chainTag = await thorSoloClient.nodes.getChaintag();

  const clauses: TransactionClause[] = recipients.map(
    (r) =>
      Clause.transferVTHOToken(Address.of(r.address), VTHO.of(10000))
        .clause as TransactionClause,
  );

  const gas = HexUInt.of(Transaction.intrinsicGas(clauses).wei).toString();

  const body: TransactionBody = {
    chainTag,
    blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
    expiration: 32,
    clauses,
    gasPriceCoef: 128,
    gas,
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
}


seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
