import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { parseUnits } from "viem";
import { useUSDC } from "@/hooks/useUSDC";

// Mock wagmi's useChainId so the hook always finds a chain
vi.mock("wagmi", () => ({
  useChainId: () => 31337,
}));

// Mock config so the hook gets an RPC URL
vi.mock("@/config", () => ({
  config: {
    chains: [
      {
        id: 31337,
        rpcUrls: {
          default: {
            http: ["http://localhost:8545"],
          },
        },
      },
    ],
  },
}));

// Mock ethers so no real network calls are made
const mockTransfer = vi.fn();

vi.mock("ethers", () => {
  class JsonRpcProvider {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }

  class Wallet {
    privateKey: string;
    provider: JsonRpcProvider;
    address: string;
    constructor(privateKey: string, provider: JsonRpcProvider) {
      this.privateKey = privateKey;
      this.provider = provider;
      this.address = "0xMockWalletAddress";
    }
  }

  class Contract {
    address: string;
    abi: unknown;
    wallet: Wallet;

    constructor(address: string, abi: unknown, wallet: Wallet) {
      this.address = address;
      this.abi = abi;
      this.wallet = wallet;
    }

    // Simulate ERC20.transfer(to, amount)
    transfer(to: string, amount: bigint) {
      mockTransfer(to, amount);
      return Promise.resolve({
        hash: "0xmockhash" as `0x${string}`,
        wait: () =>
          Promise.resolve({
            // avoid BigInt literal: use constructor
            gasUsed: BigInt(123456),
          }),
      });
    }
  }

  return {
    ethers: {
      JsonRpcProvider,
      Wallet,
      Contract,
    },
  };
});

describe("useUSDC", () => {
  it("sends USDC from the given private key", async () => {
    const privateKey = "0xprivkey";
    const recipient = "0xRecipientAddress000000000000000000000000";
    const amountUsdc = 10;

    const { result } = renderHook(() => useUSDC());

    await act(async () => {
      await result.current.sendUsdc(
        privateKey,
        recipient as `0x${string}`,
        amountUsdc,
      );
    });

    // Check that transfer was called once with correct args
    expect(mockTransfer).toHaveBeenCalledTimes(1);
    const [toArg, amountArg] = mockTransfer.mock.calls[0];

    expect(toArg).toBe(recipient);
    expect(amountArg).toBe(parseUnits(amountUsdc.toString(), 6));

    // Check basic status states
    expect(result.current.hash).toBe("0xmockhash");
    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.status.toLowerCase()).toContain(
      "transaction confirmed",
    );
  });
});
