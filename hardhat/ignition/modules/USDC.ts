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
  const envConfigs = [
    {
      path: path.join(__dirname, "../../.env"), // hardhat/.env
      key: "USDC_ADDRESS",
      asString: false,
    },
    {
      path: path.join(__dirname, "../../../off-chain/.env"), // off-chain/.env
      key: "NEXT_PUBLIC_VECHAIN_USDC_ADDRESS",
      asString: true,
    },
  ];

  envConfigs.forEach(({ path: envFilePath, key, asString }) => {
    let envContent = "";

    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf8");
    }

    const formattedValue = asString ? `"${value}"` : value;

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
  });
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
