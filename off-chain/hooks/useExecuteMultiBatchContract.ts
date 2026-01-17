"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useBalance,
} from "wagmi";
import { formatEther, parseEther, parseUnits } from "viem";
import { config, tenderly } from "@/config";
import { recipients, sendersPrivateKeys } from "../lib/keys";
import { MULTI_BATCH_CONTRACT_ABI } from "../lib/ABI";
import { useApproveSmartContract } from "./useApproveSmartContract";
import { ethers } from "ethers";
import { getRandomAmount } from "@/lib/randomAmounts";
import { Transaction } from "@/types/types";

export default function useExecuteMultiBatchContract() {
  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);

  const [manualStatus, setManualStatus] = useState<string>("");

  const contractAddress = chain?.contracts?.multiBatch?.address
    ? (chain.contracts.multiBatch.address as `0x${string}`)
    : undefined;

  const {
    data: hash,
    writeContractAsync,
    error: writeError,
    isPending,
  } = useWriteContract();

  const { approveForAll, isApproving, approvalStatus, approvalError } =
    useApproveSmartContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

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

  /* // Prepare recipients and amounts arrays
  const recipientAddresses = recipients.map(
    (r) => r.address
  ) as `0x${string}`[];

  // Get actual wallet addresses from private keys
  const senderAddresses = sendersPrivateKeys.map(
    (sender) => new ethers.Wallet(sender.address).address
  ) as `0x${string}`[]; */

  //const amounts = senderAddresses.map(() => getRandomAmount()); //random value for each transaction

  const executeMultiBatch = async (batch: Transaction[]) => {
    try {
      setManualStatus("Preparing Multi Batch Transfer...");

      //approve multi batch smart contract for all acount for the smart contract to withdraw usdc from wallets
      const approved = await approveForAll();

      if (!approved || approvalError) {
        setManualStatus(`Approval failed: ${approvalError}`);
        return;
      }

      // Check if contract address is available
      if (!contractAddress) {
        setManualStatus("Contract address not found for this chain!");
        return;
      }

      // derive arrays from the batch argument
      const senders = batch.map((tx) => tx.sender) as `0x${string}`[];
      const recipientsArr = batch.map((tx) => tx.recipient) as `0x${string}`[];
      const amounts = batch.map((tx) => tx.amount);

      setManualStatus("Waiting for transaction approval...");

      // Call the smart contract
      writeContractAsync({
        address: contractAddress,
        abi: MULTI_BATCH_CONTRACT_ABI,
        functionName: "executeBatch",
        args: [senders, recipientsArr, amounts],
      });
    } catch (error) {
      console.error("Error:", error);
      setManualStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return {
    executeMultiBatch,
    status,
    isApproving,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    receipt,
    writeError,
  };
}
