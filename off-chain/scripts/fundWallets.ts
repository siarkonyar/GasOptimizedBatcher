import { adminWallet, senders } from "@/lib/keys";
import { ethers } from "ethers";
import fs from "fs";

const TENDERLY_RPC =
  "https://virtual.mainnet.eu.rpc.tenderly.co/068e308a-de93-4d7b-8e24-47fe5f7dbeec";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const senderAddresses = senders.map((s) => s.address) as `0x${string}`[];

const wallets = [adminWallet, ...senderAddresses];

async function fundWallets() {
  const provider = new ethers.JsonRpcProvider(TENDERLY_RPC);
  console.log(`Funding ${wallets.length} wallets`);

  for (const wallet of wallets) {
    await provider.send("tenderly_setErc20Balance", [
      USDC_ADDRESS,
      wallet,
      ethers.toQuantity(ethers.parseUnits("500", 6)),
    ]); // puts 500 USDC to each wallet

    console.log(`Funded Wallet: ${wallet}`);
  }
}

fundWallets();
