import { Address, Units } from "@vechain/sdk-core";
import * as dotenv from "dotenv";
import { recipients } from "../lib/vechain-wallets";
import { ThorClient } from "@vechain/sdk-network";

dotenv.config();

// CONFIGURATION
const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;

const MINIMAL_ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const;

async function checkBalances() {
  console.log("Checking Wallet Balances...\n");
  const thorClient = ThorClient.at(THOR_URL);

  // Load USDC Contract Interface
  const usdcContract = thorClient.contracts.load(
    USDC_ADDRESS,
    MINIMAL_ERC20_ABI,
  );

  console.log("------------------------------------------------------------");
  console.log("ID | Address | VET | VTHO | USDC");
  console.log("------------------------------------------------------------");

  for (const recipient of recipients) {
    try {
      const accountInfo = await thorClient.accounts.getAccount(
        Address.of(recipient.address),
      );

      const usdcRawBalance = await usdcContract.read.balanceOf(
        recipient.address,
      );

      console.log(
        `${recipient.id.toString().padEnd(2)} | ` +
          `${recipient.address} | ` +
          `${accountInfo.balance} VET | ` +
          `${accountInfo.energy} VTHO | ` +
          `${usdcRawBalance[0]} USDC`,
      );
    } catch (error) {
      console.error(`❌ Error checking ${recipient.address}:`, error);
    }
  }
  console.log("------------------------------------------------------------");
}

checkBalances().catch(console.error);
