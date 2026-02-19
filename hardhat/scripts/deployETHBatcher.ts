import { ignition } from "hardhat";
import ETHBatchModule from "../ignition/modules/ETHBatch";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment...");

  await cleanDeployments();

  const deploymentId = `ETHBatch_deployment_${Date.now()}`;

  const { ETHBatch } = await ignition.deploy(ETHBatchModule, {
    deploymentId: deploymentId,
  });

  const address = await ETHBatch.getAddress();
  console.log(`✅ ETHBatch deployed to: ${address}`);

  saveAddressToEnv(address);
}

async function cleanDeployments() {
  const deploymentsPath = path.join(__dirname, "../ignition/deployments");

  if (fs.existsSync(deploymentsPath)) {
    fs.rmSync(deploymentsPath, { recursive: true, force: true });
    console.log(`Deleted deployments folder: ${deploymentsPath}`);
  }
}

function saveAddressToEnv(value: string) {
  // Adjust this path relative to WHERE you run the script from
  const envFilePath = path.join(__dirname, "../../off-chain/.env");
  const key = "NEXT_PUBLIC_ETHEREUM_BATCHER_ADDRESS";

  let envContent = "";
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf8");
  }

  const formattedValue = `"${value}"`;
  const regex = new RegExp(`^${key}=.*`, "m");

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${formattedValue}`);
    console.log(`Updated .env file`);
  } else {
    const prefix =
      envContent.length > 0 && !envContent.endsWith("\n") ? "\n" : "";
    envContent += `${prefix}${key}=${formattedValue}\n`;
    console.log(`Added to .env file`);
  }

  fs.writeFileSync(envFilePath, envContent);
}

main().catch(console.error);
