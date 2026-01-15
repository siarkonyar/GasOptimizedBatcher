import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@vechain/sdk-hardhat-plugin";
import * as dotenv from "dotenv";
import * as tenderly from "@tenderly/hardhat-tenderly";

dotenv.config();

tenderly.setup({ automaticVerifications: true });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
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
      accounts: [
        "7f9290cc44c5fd2b95fe21d6ad6fe5fa9c177e1cd6f3b4c96a97b13e09eaa158",
      ],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      timeout: 20000,
      httpHeaders: {},
    },

    //hardhat node simulation
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_MAINNET_URL ?? "",
      },
    },

    //tenderly virtual testnet
    tenderly_virtual_mainnet: {
      url: process.env.TENDERLY_RPC ?? "",
      chainId: 1,
    },
  },
  tenderly: {
    // https://docs.tenderly.co/account/projects/account-project-slug
    project: "project",
    username: "siarkonyar",
  },
};

export default config;
