import { ethers, network } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Any mainnet address that holds a lot of USDC.
const USDC_WHALE = "0x55fe002aeff02f77364de339a1292923a15844b8";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// MY MetaMask wallet address on the localhost network
const MY_WALLET = "0xE9f4e4826a71d4327D8621C16daF33371705c845";

async function main() {
  // Get the default Hardhat accounts
  const signers = await ethers.getSigners();
  const recipients = signers.map((s) => s.address);
  recipients.push(MY_WALLET);

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

  // Also fund my MetaMask wallet with 1000 ETH to pay gas cost
  const fundingSigner = signers[0];
  const ethAmount = ethers.parseEther("1000");
  const ethTx = await fundingSigner.sendTransaction({
    to: MY_WALLET,
    value: ethAmount,
  });
  await ethTx.wait();
  console.log(`Sent 1000 ETH to ${MY_WALLET} (tx: ${ethTx.hash})`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
