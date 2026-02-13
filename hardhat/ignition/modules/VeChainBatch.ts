import { ethers } from "hardhat";
import { stringifyData } from "@vechain/sdk-errors";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

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

  const contractAddress = await txResponse.getAddress();

  saveAddressToEnv(contractAddress);
}

function saveAddressToEnv(value: string) {
  const envFilePath = path.join(__dirname, "../../../off-chain/.env");
  const key = "NEXT_PUBLIC_VECHAIN_BATCHER_ADDRESS";

  let envContent = "";

  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf8");
  }

  const formattedValue = `"${value}"`;

  // check if the key already exists
  const regex = new RegExp(`^${key}=.*`, "m");

  if (regex.test(envContent)) {
    // replace existing key
    envContent = envContent.replace(regex, `${key}=${formattedValue}`);
    console.log(`Updated ${key} in ${envFilePath}`);
  } else {
    // new key
    const prefix =
      envContent.length > 0 && !envContent.endsWith("\n") ? "\n" : "";
    envContent += `${prefix}${key}=${formattedValue}\n`;
    console.log(`Added ${key} to ${envFilePath}`);
  }

  fs.writeFileSync(envFilePath, envContent);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
