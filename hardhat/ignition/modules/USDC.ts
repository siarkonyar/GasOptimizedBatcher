import { ethers } from "hardhat";
import { stringifyData } from "@vechain/sdk-errors";
import { USDC_ABI, USDCCreationByteCode } from "../../lib/USDC_Artifact";

async function main(): Promise<void> {
  const signer = (await ethers.getSigners())[0];

  const USDCFactory = await ethers.getContractFactory(
    USDC_ABI,
    USDCCreationByteCode,
    signer,
  );

  const txResponse = await USDCFactory.deploy("USDC", "USDC", 6);

  await txResponse.waitForDeployment;

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
