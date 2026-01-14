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
import { recipients, sendersPrivateKeys } from "./keys";
import { MULTI_BATCH_CONTRACT_ABI } from "./ABI";
import { useApproveSmartContract } from "./useApproveSmartContract";
import { ethers } from "ethers";

export default function useExecuteMultiBatchContract() {
  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);

  const [manualStatus, setManualStatus] = useState<string>("");

  const contractAddress =
    chain?.id === tenderly.id
      ? (tenderly.contracts.multiBatch.address as `0x${string}`)
      : undefined;

  const {
    data: hash,
    writeContractAsync,
    error: writeError,
    isPending,
  } = useWriteContract();

  const { approveForAll, isApproving, approvalStatus, approvalError } =
    useApproveSmartContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const getRandomAmount = () => {
    // random integer between 1 and 100 USDC
    const min = 1;
    const max = 100;
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return parseUnits(randomInt.toString(), 6);
  };

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

  const executeMultiBatch = async () => {
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

      // Prepare recipients and amounts arrays
      const recipientAddresses = recipients.map(
        (r) => r.address
      ) as `0x${string}`[];

      // Get actual wallet addresses from private keys
      const senderAddresses = sendersPrivateKeys.map(
        (sender) => new ethers.Wallet(sender.address).address
      ) as `0x${string}`[];

      const amounts = senderAddresses.map(() => getRandomAmount()); //random value for each transaction

      setManualStatus("Waiting for transaction approval...");

      // Call the smart contract
      writeContractAsync({
        address: contractAddress,
        abi: MULTI_BATCH_CONTRACT_ABI,
        functionName: "executeBatch",
        args: [senderAddresses, recipientAddresses, amounts],
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
    writeError,
  };
}
