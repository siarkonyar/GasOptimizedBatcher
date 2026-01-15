import { ethers, network } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Any mainnet address that holds a lot of USDC.
// You can replace this with another rich holder from Etherscan.
const USDC_WHALE = "0x55fe002aeff02f77364de339a1292923a15844b8";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

async function main() {
  // Get the default Hardhat accounts (the ones printed when you run `npx hardhat node`)
  const signers = await ethers.getSigners();
  const recipients = signers.map((s) => s.address); // or slice(0, 3) etc.

  // Impersonate the USDC whale
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_WHALE],
  });

  const whaleSigner = await ethers.getSigner(USDC_WHALE);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, whaleSigner);

  const amountPerWallet = ethers.parseUnits("1000", 6); // 1,000 USDC per wallet

  console.log(`Funding ${recipients.length} accounts with 1000 USDC each...`);

  for (const addr of recipients) {
    const tx = await usdc.transfer(addr, amountPerWallet);
    await tx.wait();
    console.log(`Sent 1000 USDC to ${addr} (tx: ${tx.hash})`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
