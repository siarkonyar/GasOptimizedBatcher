import { ethers } from "hardhat";
import { stringifyData } from "@vechain/sdk-errors";
import { USDC_ABI, USDCCreationByteCode } from "../../lib/USDC_Artifact";
import * as fs from "fs";
import * as path from "path";

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

  const contractAddress = await txResponse.getAddress();

  saveAddressToEnv(contractAddress);
}

function saveAddressToEnv(value: string) {
  const envFilePath = path.join(__dirname, "../../.env");
  let envContent = "";

  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf8");
  }

  // check if the key already exists
  const regex = new RegExp(`^USDC_ADDRESS=.*`, "m");

  if (regex.test(envContent)) {
    // replace existing key
    envContent = envContent.replace(regex, `USDC_ADDRESS=${value}`);
    console.log(`Updated USDC_ADDRESS in .env`);
  } else {
    // new key
    const prefix =
      envContent.length > 0 && !envContent.endsWith("\n") ? "\n" : "";
    envContent += `${prefix}USDC_ADDRESS=${value}\n`;
    console.log(`Added USDC_ADDRESS to .env`);
  }

  fs.writeFileSync(envFilePath, envContent);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
