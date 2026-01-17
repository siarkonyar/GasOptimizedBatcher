import { ethers } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

const MY_WALLET = "0xE9f4e4826a71d4327D8621C16daF33371705c845";

async function main() {
  const signers = await ethers.getSigners();
  const addresses = signers.map((s) => s.address);

  if (!addresses.includes(MY_WALLET)) {
    addresses.push(MY_WALLET);
  }

  const provider = ethers.provider;
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

  console.log("USDC balances:");

  for (const addr of addresses) {
    const bal: bigint = await usdc.balanceOf(addr);
    const formatted = Number(ethers.formatUnits(bal, 6));
    console.log(`${addr}: ${formatted} USDC`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
