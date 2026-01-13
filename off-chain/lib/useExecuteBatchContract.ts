"use client";
import { useMemo, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useBalance,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { config, tenderly } from "@/config";
import { CONTRACT_ABI } from "./batchContractABI";
import { recipients } from "./recipients";

export default function useExecuteBatchContract() {
  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);
  const contractAddress =
    chain?.id === tenderly.id
      ? (tenderly.contracts.batcher.address as `0x${string}`)
      : undefined;

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const balanceInEther = balance?.value ? formatEther(balance.value) : "0";
  const [manualStatus, setManualStatus] = useState<string>("");

  const {
    data: hash,
    writeContract,
    error: writeError,
    isPending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Derive status from transaction state - no setState in effects!
  const status = useMemo(() => {
    if (writeError) {
      return `Error: ${writeError.message}`;
    }
    if (isConfirming) {
      return "Transaction pending... waiting for confirmation";
    }
    if (isConfirmed && hash) {
      return `Transaction confirmed! Hash: ${hash}`;
    }
    // Fall back to manual status for pre-transaction messages
    return manualStatus;
  }, [isConfirming, isConfirmed, hash, writeError, manualStatus]);

  const executeBatch = async () => {
    try {
      setManualStatus("Preparing Batch Transfer...");

      // Check if wallet is connected
      if (!isConnected || !address) {
        setManualStatus("Please connect your wallet first!");
        return;
      }

      // Check if contract address is available
      if (!contractAddress) {
        setManualStatus("Contract address not found for this chain!");
        return;
      }

      // Prepare recipients and amounts arrays
      const recipientAddresses = recipients.map(
        (r) => r.address
      ) as `0x${string}`[];
      const amounts = recipientAddresses.map(() => parseEther("10")); // 10 ETH for each
      const totalAmount = parseEther("30"); // 10 ETH × 3 recipients

      setManualStatus("Waiting for transaction approval...");

      // Call the smart contract
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: "executeBatch",
        args: [recipientAddresses, amounts],
        value: totalAmount,
      });
    } catch (error) {
      console.error("Error:", error);
      setManualStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return {
    executeBatch,
    status,
    balanceInEther,
    loading: isPending || isConfirming,
    isConfirmed,
    txHash: hash,
    recipients,
  };
}
