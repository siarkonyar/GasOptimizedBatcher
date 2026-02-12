import { adminWallet, senders } from "@/lib/ethereum-wallets";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const HARDHAT_RPC_URL = "http://127.0.0.1:8545";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const BATCH_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_ETHEREUM_BATCHER_ADDRESS as `0x${string}`;

async function approveBatcherForAll() {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);

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

approveBatcherForAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
