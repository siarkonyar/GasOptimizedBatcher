"use client";

import { useMemo, useState } from "react";
import { useChainId } from "wagmi";
import { parseUnits } from "viem";
import { ethers } from "ethers";
import { config } from "@/config";

const USDC_ADDRESS =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`;

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
] as const;

export function useUSDC() {
  const [manualStatus, setManualStatus] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [receipt, setReceipt] = useState<ethers.TransactionReceipt | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [writeError, setWriteError] = useState<Error | null>(null);

  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);

  const status = useMemo(() => {
    if (writeError) return `Error: ${writeError.message}`;
    if (isConfirming) return "Transaction pending... waiting for confirmation";
    if (isConfirmed && hash) return `Transaction confirmed! Hash: ${hash}`;
    return manualStatus;
  }, [writeError, isConfirming, isConfirmed, hash, manualStatus]);

  const sendUsdc = async (
    privateKey: string,
    to: `0x${string}`,
    amountUsdc: number,
  ) => {
    try {
      setManualStatus("preparing USDC transfer...");
      setWriteError(null);
      setIsConfirmed(false);
      setReceipt(null);

      if (!chain) {
        throw new Error("unsupported chain");
      }

      const RPC_URL = chain.rpcUrls.default.http[0];
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

      const amount = parseUnits(amountUsdc.toString(), 6); // USDC has 6 decimals

      setIsPending(true);
      const tx = await usdc.transfer(to, amount);
      setIsPending(false);

      setHash(tx.hash as `0x${string}`);
      setManualStatus("transaction sent. waiting for confirmation...");
      setIsConfirming(true);

      const txReceipt = await tx.wait();
      setReceipt(txReceipt);
      setIsConfirming(false);
      setIsConfirmed(true);
      setManualStatus(`transaction confirmed. Hash: ${tx.hash}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setWriteError(error instanceof Error ? error : new Error(message));
      setManualStatus(`Error: ${message}`);
      setIsPending(false);
      setIsConfirming(false);
      setIsConfirmed(false);
    }
  };

  return {
    sendUsdc,
    status,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    receipt,
    writeError,
  };
}
