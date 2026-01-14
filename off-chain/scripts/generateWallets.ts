import { ethers } from "ethers";
import fs from "fs";

const WALLET_COUNT = 80;

async function createArmy() {
  console.log(`🤖 Generating ${WALLET_COUNT} wallets...`);

  const wallets = [];

  for (let i = 0; i < WALLET_COUNT; i++) {
    const wallet = ethers.Wallet.createRandom();

    wallets.push({
      id: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  // Save to a JSON file
  const jsonContent = JSON.stringify(wallets, null, 2);
  fs.writeFileSync("lib/wallets.json", jsonContent);

  console.log(`Created 'wallets.json' with ${wallets.length} wallets.`);
  console.log(`First Wallet: ${wallets[0].address}`);
  console.log(`Last Wallet: ${wallets[79].address}`);
}

createArmy();
