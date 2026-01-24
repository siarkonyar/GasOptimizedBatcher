import { ethers } from "hardhat";
import { stringifyData } from "@vechain/sdk-errors";

async function main(): Promise<void> {
  const signer = (await ethers.getSigners())[0];

  const vechainBatchFactory = await ethers.getContractFactory(
    "VeChainBatch",
    signer,
  );

  const txResponse = await vechainBatchFactory.deploy();

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
