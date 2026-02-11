import {
  VECHAIN_BATCH_CONTRACT_ABI,
  VECHAIN_USDC_CONTRACT_ABI,
} from "@/lib/ABI";
import {
  IndividualTxLog,
  SimulationLog,
  Transaction as TransactionType,
} from "@/types/types";
import {
  ABIContract,
  Address,
  Clause,
  Hex,
  Transaction,
  Mnemonic,
  Secp256k1,
  TransactionBody,
  Blake2b256,
} from "@vechain/sdk-core";
import { ThorClient } from "@vechain/sdk-network";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { generateRandomVeChainTransaction } from "@/lib/generateRandomUSDCTransaction";
import { saveLog } from "@/lib/saveLog";

//batching variables
const BATCH_SIZE = 5;
const BATCH_INTERVAL_MIN = 0.2;
const BATCH_INTERVAL_MS = BATCH_INTERVAL_MIN * 60 * 1000;
const SIMULATION_DURATION = 1 * 60 * 1000;

dotenv.config();

const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;
const BATCHER_ADDRESS = process.env
  .NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS as string;

const thorSoloClient = ThorClient.at(THOR_URL, {
  isPollingEnabled: false,
});

const batchContract = thorSoloClient.contracts.load(
  BATCHER_ADDRESS,
  VECHAIN_BATCH_CONTRACT_ABI,
);

const godMnemonic =
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross";
const godPrivateKey = Mnemonic.toPrivateKey(godMnemonic.split(" "));

const simulationLog: SimulationLog = {
  simulationStartTime: Date.now(),
  simulationEndTime: 0,
  simulationDuration: SIMULATION_DURATION,
  batchSize: BATCH_SIZE,
  batchIntervalMinutes: BATCH_INTERVAL_MIN,
  individualTransactions: [],
  batches: [],
  summary: {
    totalIndividualTransactions: 0,
    totalBatches: 0,
    totalIndividualGasUsed: "0",
    totalBatchGasUsed: "0",
  },
};

let individualTransactionsBuffer: IndividualTxLog[] = [];

async function executeBatch(batch: TransactionType[], batchNumber: number) {
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

    //every sender needs to sign the transaction to be included in the batch
    for (let i = 0; i < batch.length; i++) {
      const tx = batch[i];

      // Note: The SDK returns an array of return values.
      // Since 'nonces' returns one value, we take the first item.
      const nonceResult = await batchContract.read.nonces(tx.sender);
      const nonce = nonceResult[0];

      const packedData = ethers.solidityPacked(
        ["address", "address", "uint256", "uint256"],
        [tx.sender, tx.recipient, tx.amount, nonce],
      );

      const rawBytes = ethers.getBytes(packedData);

      const messageHash = Blake2b256.of(rawBytes);

      const signature = Secp256k1.sign(
        messageHash.bytes,
        ethers.getBytes(tx.senderPrivateKey!),
      );

      signature[64] += 27;

      signatures.push(Hex.of(signature).toString());
      senders.push(tx.sender);
      recipients.push(tx.recipient);
      amounts.push(tx.amount);
    }

    const clause: Clause = Clause.callFunction(
      Address.of(BATCHER_ADDRESS),
      ABIContract.ofAbi(VECHAIN_BATCH_CONTRACT_ABI).getFunction("executeBatch"),
      [senders, recipients, amounts, signatures],
    );

    const batchTransaction = {
      clauses: [clause],
    };

    const batchGasEstimateGas = await thorSoloClient.gas.estimateGas(
      batchTransaction.clauses,
    );

    const batchTxBody = await thorSoloClient.transactions.buildTransactionBody(
      batchTransaction.clauses,
      batchGasEstimateGas.totalGas,
    );

    const signedTransaction = Transaction.of(batchTxBody).sign(godPrivateKey);

    const sendTransactionResult =
      await thorSoloClient.transactions.sendTransaction(signedTransaction);

    const txReceipt = await thorSoloClient.transactions.waitForTransaction(
      sendTransactionResult.id,
    );

    const batchGasUsed = String(txReceipt?.gasUsed);

    console.log(txReceipt);

    simulationLog.batches.push({
      batchNumber,
      gasUsed: batchGasUsed,
      timestamp: Date.now(),
      transactionCount: batch.length,
      transactions: batch.map((tx) => ({
        sender: tx.sender,
        recipient: tx.recipient,
        amount: tx.amount.toString(),
      })),
    });

    simulationLog.individualTransactions.push(...individualTransactionsBuffer);
    individualTransactionsBuffer = [];
  } catch (error) {
    console.error(`❌ Batch #${batchNumber} execution failed:`, error);
  }
}

async function VeChainUSDCSimulation() {
  console.log("Starting Background Worker...");

  console.log(
    `⏱️ Simulation Duration: ${SIMULATION_DURATION / 1000 / 60} minutes`,
  );
  console.log(`⏱️ Batch Interval: Every ${BATCH_INTERVAL_MIN} minutes\n`);

  const startTime = Date.now();
  const endTime = startTime + SIMULATION_DURATION;
  let nextBatchTime = startTime + BATCH_INTERVAL_MS;
  let batch: TransactionType[] = [];
  let batchNumber = 1;

  const countdownInterval = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    const nextBatchIn = Math.ceil((nextBatchTime - Date.now()) / 1000);
    if (remaining > 0) {
      process.stdout.write(
        `\r⏳ Total remaining: ${remaining}s | Next batch in: ${nextBatchIn}s | Collected: ${batch.length} txs `,
      );
    } else {
      process.stdout.write(
        `\r⌛ Time Window Closed.                                          \n`,
      );
      clearInterval(countdownInterval);
    }
  }, 1000);

  try {
    const latestBlock = await thorSoloClient.blocks.getBestBlockCompressed();
    const chainTag = await thorSoloClient.nodes.getChaintag();
    while (Date.now() < endTime) {
      // Check if it's time to execute a batch
      if (Date.now() >= nextBatchTime || batch.length >= BATCH_SIZE) {
        if (Date.now() >= nextBatchTime) nextBatchTime += BATCH_INTERVAL_MS; // schedule the next batch
        await executeBatch(batch, batchNumber);
        batch = []; // Clear the batch
        batchNumber++;
      }

      try {
        const transaction = await generateRandomVeChainTransaction();

        const individualWallet = {
          privateKey: transaction.senderPrivateKey,
          address: transaction.sender,
        };
        const clauses: Clause[] = [
          Clause.callFunction(
            Address.of(USDC_ADDRESS),
            ABIContract.ofAbi(VECHAIN_USDC_CONTRACT_ABI).getFunction(
              "transfer",
            ),
            [transaction.recipient, transaction.amount / BigInt(1000000)],
          ),
        ];

        const gas = await thorSoloClient.gas.estimateGas(
          clauses,
          individualWallet.address,
        );

        const body: TransactionBody = {
          chainTag,
          blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
          expiration: 32,
          clauses,
          gasPriceCoef: 0,
          gas: gas.totalGas,
          dependsOn: null,
          nonce: Date.now(),
        };

        const signedTransaction = Transaction.of(body).sign(
          Hex.of(transaction.senderPrivateKey!).bytes,
        );

        const sendTransactionResult =
          await thorSoloClient.transactions.sendTransaction(signedTransaction);

        const txReceipt = await thorSoloClient.transactions.waitForTransaction(
          sendTransactionResult.id,
        );

        const gasUsed = String(txReceipt!.gasUsed);

        console.log("------------------------------------------------");

        console.log(
          `\n✅ Individual Tx executed reverted: ${txReceipt?.reverted}`,
        );
        console.log(`\n⛽ Gas Used: ${gasUsed}`);

        console.log("------------------------------------------------");

        //add the transaction to the log, if it fails it wont be added
        //add them to the buffer first. if the batch fails, we wont add these transactions to the data.
        individualTransactionsBuffer.push({
          sender: transaction.sender,
          recipient: transaction.recipient,
          amount: transaction.amount.toString(),
          gasUsed: gasUsed,
          timestamp: Date.now(),
        });

        batch.push(transaction);
      } catch (batchTxError) {
        console.error("Transaction failed:", batchTxError);
        continue;
      }

      //random delay
      await new Promise((r) => setTimeout(r, Math.random() * 3000));
    }
    // Execute any remaining transactions in the batch after simulation ends
    if (batch.length > 0) {
      console.log("Executing final batch with remaining transactions...");
      await executeBatch(batch, batchNumber);
    }

    console.log(`--- Simulation Complete ---`);

    simulationLog.simulationEndTime = Date.now();
    saveLog(simulationLog, "simulation/VeChainSimulationLogs");
  } catch (error) {
    console.error("❌ FATAL ERROR:", error);
    simulationLog.simulationEndTime = Date.now();
    saveLog(simulationLog, "simulation/VeChainSimulationLogs");
  } finally {
    clearInterval(countdownInterval);
  }
}

VeChainUSDCSimulation()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
