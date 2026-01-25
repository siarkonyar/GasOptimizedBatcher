import { ethers } from "hardhat";
import { stringifyData } from "@vechain/sdk-errors";
import * as dotenv from "dotenv";

dotenv.config();

async function main(): Promise<void> {
  const signer = (await ethers.getSigners())[0];

  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error("USDC_ADDRESS not set in .env");
  }

  const vechainBatchFactory = await ethers.getContractFactory(
    "VeChainBatch",
    signer,
  );

  const txResponse = await vechainBatchFactory.deploy(usdcAddress);

  console.log(
    "✅ Contract deployment with the following transaction:",
    stringifyData(txResponse),
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
