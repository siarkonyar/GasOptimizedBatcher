import { generateRandomTransaction } from "../lib/generateRandomUSDCTransaction";
import { adminWallet, senders } from "../lib/USDCWallets";
import { ethers } from "ethers";
import type {
  IndividualTxLog,
  SimulationLog,
  Transaction,
} from "../types/types";
import { ETH_BATCH_CONTRACT_ABI } from "../lib/ABI";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const HARDHAT_RPC_URL = "http://127.0.0.1:8545";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const BATCH_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_ETHEREUM_BATCHER_ADDRESS as `0x${string}`;
const SIMULATION_DURATION = 5 * 60 * 1000;
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

let individualTransactionsBuffer: IndividualTxLog[] = [];

async function approveSmartContractForAll(provider: ethers.JsonRpcProvider) {
  console.log("Approving smart contract for all...");

  console.log("This operation is performed only once.");

  try {
    const abi = [
      "function approve(address spender, uint256 amount) public returns (bool)",
    ];

    const approveList = [adminWallet, ...senders];

    for (const sender of approveList) {
      try {
        //connect to wallet
        const wallet = new ethers.Wallet(sender.privateKey, provider);

        //connect to smart contract
        const usdcContract = new ethers.Contract(USDC_ADDRESS, abi, wallet);

        // Send the approval transaction
        const tx = await usdcContract.approve(
          BATCH_CONTRACT_ADDRESS,
          ethers.MaxUint256,
        );

        await tx.wait();
      } catch (error) {
        const errorMsg = `Failed for ${sender.name}: ${
          (error as Error).message
        }`;
        console.error(errorMsg);
        return false;
      }
    }

    console.log("✅ All wallets approved the smart contract.");
    console.log("------------------------------------------------");
  } catch (error) {
    console.log(`Error during approval: ${(error as Error).message}`);
    return false;
  }
}

function saveLog() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `simulation-log-${timestamp}.json`;
  const logPath = path.join(
    process.cwd(),
    "simulation/EthereumSimulationLogs",
    logFileName,
  );

  // Calculate total gas for individual and batched transactions
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
  batch: Transaction[],
  batcherWallet: ethers.Wallet,
  batchNumber: number,
  provider: ethers.JsonRpcProvider,
) {
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

  const contract = new ethers.Contract(
    BATCH_CONTRACT_ADDRESS,
    ETH_BATCH_CONTRACT_ABI,
    batcherWallet,
  );

  try {
    const signatures: string[] = [];
    const senders = [];
    const recipients = [];
    const amounts = [];

    //every sender needs to sign the transaction to be included in the batch
    for (let i = 0; i < batch.length; i++) {
      const tx = batch[i];

      const senderWallet = new ethers.Wallet(
        tx.senderPrivateKey as string,
        provider,
      );

      const nonce = await contract.nonces(tx.sender);

      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "uint256"],
        [tx.sender, tx.recipient, tx.amount, nonce],
      );

      const signature = await senderWallet.signMessage(
        ethers.getBytes(messageHash),
      );

      signatures.push(signature);
      senders.push(tx.sender);
      recipients.push(tx.recipient);
      amounts.push(tx.amount);
    }

    const batchedTx = await contract.executeBatch(
      senders,
      recipients,
      amounts,
      signatures,
    );

    console.log(`Batch #${batchNumber} Tx Sent: ${batchedTx.hash}`);

    const batchedTxReceipt = await batchedTx.wait();

    const batchGasUsed =
      batchedTxReceipt &&
      (typeof batchedTxReceipt.gasUsed === "bigint"
        ? batchedTxReceipt.gasUsed.toString()
        : String(batchedTxReceipt.gasUsed));

    console.log(
      `🎉 Batch #${batchNumber} Confirmed! Total Gas: ${batchGasUsed}`,
    );

    console.log("------------------------------------------------");

    //add batch to the log

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

    //data of individual transactions wont be added to the dataset until the batch is executed without any issues.
    simulationLog.individualTransactions.push(...individualTransactionsBuffer);
    individualTransactionsBuffer = [];
  } catch (error) {
    console.error(`❌ Batch #${batchNumber} execution failed:`, error);
  }
}

async function USDCSimulation() {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);

  await approveSmartContractForAll(provider);

  console.log("Starting Background Worker...");
  console.log(
    `⏱️ Simulation Duration: ${SIMULATION_DURATION / 1000 / 60} minutes`,
  );
  console.log(`⏱️ Batch Interval: Every ${BATCH_INTERVAL_MIN} minutes\n`);

  const batcherWallet = new ethers.Wallet(adminWallet.privateKey, provider);

  const startTime = Date.now();
  const endTime = startTime + SIMULATION_DURATION;
  let nextBatchTime = startTime + BATCH_INTERVAL_MS;
  let batch: Transaction[] = [];
  let batchNumber = 1;

  // Send countdown updates
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
    while (Date.now() < endTime) {
      // Check if it's time to execute a batch
      if (Date.now() >= nextBatchTime || batch.length >= BATCH_SIZE) {
        if (Date.now() >= nextBatchTime) nextBatchTime += BATCH_INTERVAL_MS; // schedule the next batch
        await executeBatch(batch, batcherWallet, batchNumber, provider);
        batch = []; // Clear the batch
        batchNumber++;
      }
      const transaction = await generateRandomTransaction();

      const recipient = transaction.recipient;
      const txamount = transaction.amount;
      const individualWallet = new ethers.Wallet(
        transaction.senderPrivateKey as string,
        provider,
      );
      const individualUsdc = new ethers.Contract(
        USDC_ADDRESS,
        USDC_ABI,
        individualWallet,
      );

      try {
        const tx = await individualUsdc.transfer(recipient, txamount);
        const txReceipt = await tx.wait();

        const gasUsed =
          txReceipt &&
          (typeof txReceipt.gasUsed === "bigint"
            ? txReceipt.gasUsed.toString()
            : String(txReceipt.gasUsed));

        console.log(`✅ Individual Tx: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${gasUsed}`);

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
      } catch (txError) {
        console.error("Transaction failed:", txError);
        continue;
      }

      //random delay
      await new Promise((r) => setTimeout(r, Math.random() * 3000));
    }
    // Execute any remaining transactions in the batch after simulation ends
    if (batch.length > 0) {
      console.log("Executing final batch with remaining transactions...");
      await executeBatch(batch, batcherWallet, batchNumber, provider);
    }

    console.log(`--- Simulation Complete ---`);

    simulationLog.simulationEndTime = Date.now();
    saveLog();
  } catch (error) {
    console.error("❌ FATAL ERROR:", error);
    simulationLog.simulationEndTime = Date.now();
    saveLog();
  } finally {
    clearInterval(countdownInterval);
  }
}

USDCSimulation()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
