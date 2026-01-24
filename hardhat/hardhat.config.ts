import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@vechain/sdk-hardhat-plugin";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    excludeContracts: [],
    // Disable for non-standard networks
    noColors: false,
  },
  networks: {
    //VeChain
    /* vechain_testnet: {
      url: process.env.VECHAIN_TESTNET_URL,
      accounts: {
        mnemonic: process.env.VECHAIN_TESTNET_MNEMONIC,
        path: "m/44'/818'/0'/0",
        count: 3,
        initialIndex: 0,
        passphrase: "vechainthor",
      },
      gas: "auto",
      gasPrice: "auto",
    }, */

    vechain_solo: {
      // Thor solo network
      url: "http://localhost:8669",
      accounts: {
        mnemonic:
          "denial kitchen pet squirrel other broom bar gas better priority spoil cross",
        count: 1,
        path: "m/44'/818'/0'/0", // Standard VeChain derivation path
        initialIndex: 0,
      },
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      timeout: 20000,
      httpHeaders: {},
      chainId: 1,
      from: undefined,
    },

    //hardhat node simulation
    hardhat: {
      accounts: {
        count: 150, //creates [index] number of wallets
      },
      forking: {
        //NOTE: put latest block number for caching, prevents eny error before presentation
        url: process.env.ALCHEMY_MAINNET_URL ?? "",
        blockNumber: 24293375,
        enabled: true,
      },
    },
  },
};

export default config;
