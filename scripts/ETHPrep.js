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
    console.log('Ethereum Preparation Script Starting\n');
    console.log('=' .repeat(50));

    //deploy ETH Batcher contract
    console.log('\nStep 1: Deploying ETH Batcher contract');
    await runCommand('npx', ['tsx', 'scripts/deployETHBatcher.ts'], hardhatDir);

    //fund Ethereum wallets
    console.log('\nStep 2: Funding Ethereum wallets');
    await runCommand('npx', ['hardhat', 'run', 'scripts/fundEthereumWallets.ts', '--network', 'localhost'], hardhatDir);

    //approve ETH batcher
    console.log('\nStep 3: Approving ETH batcher');
    await runCommand('npx', ['tsx', 'scripts/approveETHBatcher.ts'], offChainDir);

    console.log('\n' + '='.repeat(50));
    console.log('All preparation steps completed successfully\n');

  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    process.exit(1);
  }
}

main();