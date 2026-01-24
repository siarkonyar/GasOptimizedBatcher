import {
  generateRandomTransaction,
  generateRandomVeChainTransaction,
} from "../lib/generateRandomUSDCTransaction";
import { ethers } from "ethers";
import type { SimulationLog, Transaction } from "../types/types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { VECHAIN_BATCH_CONTRACT_ABI } from "@/lib/ABI";
import { godWallet } from "@/lib/vechain-wallets";

dotenv.config();

const SOLO_NODE_RPC_URL = "http://127.0.0.1:8545";
const USDC_ADDRESS = process.env
  .NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as `0x${string}`; // VeChain USDC Address
const VECHAIN_BATCH_ADDRESS = process.env
  .NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS as `0x${string}`;
const SIMULATION_DURATION = 5 * 60 * 1000;

interface SignedTransaction extends Transaction {
  v: number;
  r: string;
  s: string;
}

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
] as const;

//batching variables
const BATCH_SIZE = 5;
const BATCH_INTERVAL_MIN = 1;
const BATCH_INTERVAL_MS = BATCH_INTERVAL_MIN * 60 * 1000;

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

function saveLog() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `simulation-log-${timestamp}.json`;
  const logPath = path.join(
    process.cwd(),
    "simulation/VeChainSimulationLogs",
    logFileName,
  );

  const totalIndividualGas = simulationLog.individualTransactions.reduce(
    (sum, tx) => sum + BigInt(tx.gasUsed),
    BigInt(0),
  );
  const totalBatchGas = simulationLog.batches.reduce(
    (sum, batch) => sum + BigInt(batch.gasUsed),
    BigInt(0),
  );

  simulationLog.summary = {
    totalIndividualTransactions: simulationLog.individualTransactions.length,
    totalBatches: simulationLog.batches.length,
    totalIndividualGasUsed: totalIndividualGas.toString(),
    totalBatchGasUsed: totalBatchGas.toString(),
  };

  fs.writeFileSync(logPath, JSON.stringify(simulationLog, null, 2));
  console.log(`\n📝 Log saved to: ${logFileName}`);
}

async function executeBatch(
  batch: SignedTransaction[],
  batcherWallet: ethers.Wallet,
  batchNumber: number,
) {
  if (batch.length === 0) {
    console.log(`\n⚠️ Batch #${batchNumber}: No transactions. Skipping...`);
    return;
  }

  console.log(
    `\n📦 Batch #${batchNumber}: Batching ${batch.length} transactions...`,
  );

  const batchStructs = batch.map((tx) => ({
    sender: tx.sender,
    recipient: tx.recipient,
    amount: tx.amount, // ethers handles BigInt automatically
    v: tx.v,
    r: tx.r,
    s: tx.s,
  }));

  const contract = new ethers.Contract(
    VECHAIN_BATCH_ADDRESS,
    VECHAIN_BATCH_CONTRACT_ABI,
    batcherWallet,
  );

  try {
    const batchedTx = await contract.executeBatch(batchStructs);

    console.log(`🚀 Batch #${batchNumber} Tx Sent: ${batchedTx.hash}`);

    const receipt = await batchedTx.wait();
    const gasUsed = receipt?.gasUsed.toString() || "0";

    console.log(`🎉 Batch #${batchNumber} Confirmed! Gas: ${gasUsed}`);
    console.log("------------------------------------------------");

    simulationLog.batches.push({
      batchNumber,
      txHash: batchedTx.hash,
      gasUsed: gasUsed,
      blockNumber: receipt?.blockNumber || null,
      timestamp: Date.now(),
      transactionCount: batch.length,
      transactions: batch.map((tx) => ({
        sender: tx.sender,
        recipient: tx.recipient,
        amount: tx.amount.toString(),
      })),
    });
  } catch (error) {
    console.error(`\n❌ Batch #${batchNumber} execution failed:`, error);
  }
}

async function VeChainUSDCSimulation() {
  console.log("Starting VeChain Signed Batch Simulation...");
  console.log(`⏱️ Duration: ${SIMULATION_DURATION / 60000} mins`);

  const provider = new ethers.JsonRpcProvider(SOLO_NODE_RPC_URL);
  const batcherWallet = new ethers.Wallet(godWallet.privateKey, provider);

  const batcherContract = new ethers.Contract(
    VECHAIN_BATCH_ADDRESS,
    VECHAIN_BATCH_CONTRACT_ABI,
    provider,
  );

  const startTime = Date.now();
  const endTime = startTime + SIMULATION_DURATION;
  let nextBatchTime = startTime + BATCH_INTERVAL_MS;
  let batch: SignedTransaction[] = [];
  let batchNumber = 1;

  const countdownInterval = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    if (remaining <= 0) clearInterval(countdownInterval);
    process.stdout.write(
      `\r⏳ Secs: ${remaining} | Batch Size: ${batch.length} `,
    );
  }, 1000);

  try {
    while (Date.now() < endTime) {
      if (Date.now() >= nextBatchTime || batch.length >= BATCH_SIZE) {
        if (Date.now() >= nextBatchTime) nextBatchTime += BATCH_INTERVAL_MS;
        await executeBatch(batch, batcherWallet, batchNumber++);
        batch = [];
      }

      //generate random transaction
      const transaction = await generateRandomVeChainTransaction();
      //adding checks for type safety
      if (!transaction || !transaction.senderPrivateKey) {
        console.warn(
          "Skipping iteration: Failed to generate a valid transaction.",
        );
        continue; // Skip to the next loop iteration
      }

      const userWallet = new ethers.Wallet(
        transaction.senderPrivateKey,
        provider,
      );

      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        USDC_ABI,
        userWallet,
      );

      try {
        const transferTx = await usdcContract.transfer(
          transaction.recipient,
          transaction.amount,
        );
        const transferReceipt = await transferTx.wait();
        const transferGasUsed = transferReceipt?.gasUsed.toString() || "0";

        console.log(`\n✅ Individual Transfer Tx: ${transferTx.hash}`);
        console.log(`⛽ Individual Gas: ${transferGasUsed}`);

        // Add to log as the "Individual Transaction"
        simulationLog.individualTransactions.push({
          txHash: transferTx.hash,
          sender: transaction.sender,
          recipient: transaction.recipient,
          amount: transaction.amount.toString(),
          gasUsed: transferGasUsed,
          blockNumber: transferReceipt?.blockNumber || null,
          timestamp: Date.now(),
        });

        //NOTE: approve may not be included in the simulation since it is done only once.
        const approveTx = await usdcContract.approve(
          VECHAIN_BATCH_ADDRESS,
          transaction.amount,
        );
        await approveTx.wait();
        console.log(`📝 Approved Batcher: ${approveTx.hash}`);

        console.log(`\n✅ Individual Approve Tx: ${approveTx.hash}`);

        console.log("------------------------------------------------");

        const nonce = await batcherContract.nonces(transaction.sender);

        //create the messsage hash
        const messageHash = ethers.solidityPackedKeccak256(
          ["address", "address", "uint256", "uint256", "address"],
          [
            transaction.sender,
            transaction.recipient,
            transaction.amount,
            nonce,
            VECHAIN_BATCH_ADDRESS,
          ],
        );

        //sign the message
        const signature = await userWallet.signMessage(
          ethers.getBytes(messageHash),
        );

        //parse the signature
        const sig = ethers.Signature.from(signature);

        simulationLog.individualTransactions.push({
          txHash: approveTx.hash,
          sender: transaction.sender,
          recipient: VECHAIN_BATCH_ADDRESS, // Approval target
          amount: transaction.amount.toString(),
          gasUsed: transferGasUsed,
          blockNumber: transferReceipt?.blockNumber || null,
          timestamp: Date.now(),
        });

        // Add signed data to batch
        batch.push({
          ...transaction,
          v: sig.v,
          r: sig.r,
          s: sig.s,
        });
      } catch (txError) {
        console.error("User Action failed:", txError);
      }

      await new Promise((r) => setTimeout(r, Math.random() * 3000));
    }

    if (batch.length > 0) {
      console.log("\n🔚 Executing final batch...");
      await executeBatch(batch, batcherWallet, batchNumber);
    }

    console.log(`\n--- Simulation Complete ---`);
    saveLog();
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error);
    saveLog();
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
