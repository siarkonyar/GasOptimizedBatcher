import { useMemo, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { config } from "@/config";
import { CONTRACT_ABI } from "./batchContractABI";

export default function useExecuteBatchContract() {
  const recipients = {
    batchAccount1: "0x6A88821ad52A2f5A54581A941cB38f39aaFb4aF4",
    batchAccount2: "0x9907bf95ea352e3ad20e656d056ef8011D1272F7",
    batchAccount3: "0xC3976D61f38164d86fCA69884C37977f788E7991",
  };

  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);
  const contractAddress = chain?.contracts?.myContract
    ?.address as `0x${string}`;

  const { address, isConnected } = useAccount();
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
      const recipientAddresses = Object.values(recipients) as `0x${string}`[];
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
    loading: isPending || isConfirming,
    isConfirmed,
    txHash: hash,
    recipients,
  };
}
