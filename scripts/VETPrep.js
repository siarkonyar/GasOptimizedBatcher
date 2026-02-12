#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const hardhatDir = path.join(rootDir, 'hardhat');
const offChainDir = path.join(rootDir, 'off-chain');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
    console.log(`📁 Directory: ${cwd}\n`);

    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('VeChain Preparation Script Starting\n');

    console.log('=' .repeat(50));

    //deploy USDC contract
    console.log('\nStep 1: Deploying USDC contract');
    await runCommand('npx', ['hardhat', 'run', 'ignition/modules/USDC.ts', '--network', 'vechain_solo'], hardhatDir);

    //deploy VeChainBatch contract
    console.log('\nStep 2: Deploying VeChainBatch contract');
    await runCommand('npx', ['hardhat', 'run', 'ignition/modules/VeChainBatch.ts', '--network', 'vechain_solo'], hardhatDir);

    //fund VeChain wallets
    console.log('\nStep 3: Funding VeChain wallets');
    await runCommand('npx', ['tsx', 'scripts/fundVeChainWallets.ts'], offChainDir);

    //approve VeChain batcher
    console.log('\n Step 4: Approving VeChain batcher');
    await runCommand('npx', ['tsx', 'scripts/approveVeChainBatcher.ts'], offChainDir);

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All preparation steps completed successfully\n');
  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    process.exit(1);
  }
}

main();