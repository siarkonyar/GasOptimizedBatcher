import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { metaMask } from "wagmi/connectors";

// Define Hardhat local network with mainnet fork
const hardhatLocal = defineChain({
  id: 31337, // Hardhat's default chain ID
  name: "Hardhat Local (Mainnet Fork)",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  contracts: {
    multiBatch: {
      address: "0x2d929838d32Ea33a0994D37F82965C2d284E3b4F",
    },
  },
});

export const tenderly = defineChain({
  id: 1,
  name: "Virtual Mainnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_TENDERLY_RPC ?? ""],
    },
  },
  blockExplorers: {
    default: {
      name: "Tenderly Explorer",
      url: "https://virtual.mainnet.eu.rpc.tenderly.co/121506b9-56f9-43b7-9788-d913588b8654",
    },
  },
  contracts: {
    batcher: {
      address: "0x020eca6d44dc38b25c5ecd07d4fd15754cb5ab4d",
    },
    multiBatch: {
      address: "0xc08f7ef9235760a86ad18c4beef7ff3b91512b97",
    },
  },
});

export const config = createConfig({
  chains: [
    hardhatLocal,
    tenderly,
    /* mainnet,
    sepolia, */
  ],
  //NOTE - this batch setting is comming from view
  batch: {
    multicall: {
      batchSize: 512,
      wait: 16,
    },
  },
  connectors: [
    metaMask({
      infuraAPIKey: process.env.NEXT_PUBLIC_INFURA_API_KEY!,
    }),
  ],
  transports: {
    [hardhatLocal.id]: http(),
    [tenderly.id]: http(),
    /* [mainnet.id]: http(),
    [sepolia.id]: http(), */
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
