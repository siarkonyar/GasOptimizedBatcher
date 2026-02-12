import { VECHAIN_USDC_CONTRACT_ABI } from "@/lib/ABI";
import { recipients } from "@/lib/vechain-wallets";
import { Transaction, TransactionBody } from "@vechain/sdk-core";
import { ThorClient } from "@vechain/sdk-network";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;
const BATCHER_ADDRESS = process.env
  .NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS as string;

const thorSoloClient = ThorClient.at(THOR_URL, {
  isPollingEnabled: false,
});

async function approveBatcherForAll() {
  console.log("Approving smart contract for all...");

  console.log("This operation is performed only once.");

  const latestBlock = await thorSoloClient.blocks.getBestBlockCompressed();
  const chainTag = await thorSoloClient.nodes.getChaintag();

  try {
    for (let i = 0; i < recipients.length; i++) {
      console.log(`approving smart contract for wallet ${i + 1}`);
      const clauses = [
        thorSoloClient.contracts
          .load(USDC_ADDRESS, VECHAIN_USDC_CONTRACT_ABI)
          .clause.approve(BATCHER_ADDRESS, ethers.MaxUint256).clause,
      ];

      const gas = await thorSoloClient.gas.estimateGas(
        clauses,
        recipients[i].address,
      );

      const body: TransactionBody = {
        chainTag,
        blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
        expiration: 256,
        clauses,
        gasPriceCoef: 232,
        gas: gas.totalGas,
        dependsOn: null,
        nonce: Date.now(),
      };

      const signedTransaction = Transaction.of(body).sign(
        ethers.getBytes(recipients[i].privateKey),
      );

      await thorSoloClient.transactions.sendTransaction(signedTransaction);
    }

    console.log("✅ All wallets approved the smart contract.");
    console.log("------------------------------------------------");
  } catch (error) {
    console.log(`Error during approval: ${(error as Error).message}`);
    return false;
  }
}

approveBatcherForAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
