# Batcher Smart Contract

Batch ETH transfer contract using Hardhat with Tenderly Virtual TestNet as the main testing environment.

## Dependencies

| Package | Purpose |
|---------|---------|
| `hardhat` | Development environment |
| `@nomicfoundation/hardhat-toolbox` | Plugin bundle |
| `@tenderly/hardhat-tenderly` | Tenderly integration & virtual testnet |
| `@vechain/sdk-hardhat-plugin` | VeChain support |
| `dotenv` | Environment variables |

## Test Environments

### Tenderly Virtual TestNet (Primary)
The main testing environment - a persistent virtual mainnet that doesn't require redeployment between sessions.

```bash
# Deploy to Tenderly Virtual TestNet
npx hardhat ignition deploy ignition/modules/Batcher.ts --network tenderly_virtual_mainnet
```

**Benefits:**
- Persistent state (no need to redeploy on restart)
- Real mainnet fork with UI dashboard
- Transaction debugging and simulation
- Free unlimited testing

### Local Mainnet Fork (Alternative)
Uses Alchemy to fork Ethereum mainnet locally. Configured via `ALCHEMY_MAINNET_URL`.

**Terminal 1:** Start local forked node
```bash
npx hardhat node
```

**Terminal 2:** Deploy contract
```bash
npx hardhat ignition deploy ignition/modules/Batcher.ts --network localhost
```

Deployment address saved to `ignition/deployments/chain-31337/deployed_addresses.json`.

## VeChain TestNet

Deploy to VeChain testnet:
```bash
npx hardhat ignition deploy ignition/modules/Batcher.ts --network vechain_testnet
```

## Commands

```bash
npx hardhat compile              # Compile contracts
npx hardhat test                 # Run tests
npx hardhat clean                # Clean artifacts
```

npx hardhat run scripts/fundEthereumWallets.ts --network localhost

npx hardhat run scripts/checkEthereumUsdcBalances.ts --network localhost

npx hardhat console --network localhost

npx hardhat ignition deploy ignition/modules/ETHBatch.ts --network localhost

//vechain

docker run -p 127.0.0.1:8669:8669 vechain/thor:latest solo --api-cors '*' --api-addr 0.0.0.0:8669

npx hardhat run ignition/modules/VeChainBatch.ts --network vechain_solo

npx hardhat run ignition/modules/USDC.ts --network vechain_solo