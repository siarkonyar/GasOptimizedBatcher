import { ethers } from "ethers";
import fs from "fs";

const TENDERLY_RPC =
  "https://virtual.mainnet.eu.rpc.tenderly.co/068e308a-de93-4d7b-8e24-47fe5f7dbeec";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const wallets = JSON.parse(fs.readFileSync("lib/wallets.json", "utf8"));

async function fundWallets() {
  const provider = new ethers.JsonRpcProvider(TENDERLY_RPC);
  console.log(`Funding ${wallets.length} wallets`);

  for (const wallet of wallets) {
    /* await provider.send("tenderly_setBalance", [
      wallet.address,
      ethers.toQuantity(ethers.parseEther("5")),
    ]); */ // this funds loop them ethereum but these wallets do not need them since they dont pay the gas

    await provider.send("tenderly_setErc20Balance", [
      USDC_ADDRESS,
      wallet.address,
      ethers.toQuantity(ethers.parseUnits("500", 6)),
    ]); // puts 500 USDC to each wallet

    console.log(
      `Funded Wallet #${wallet.id}: ${wallet.address.slice(0, 6)}...`
    );
  }
}

fundWallets();
