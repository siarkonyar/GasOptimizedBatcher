"use client";

import { useState } from "react";
import { useChainId } from "wagmi";
import { config } from "@/config";
import { ETH_BATCH_CONTRACT_ABI } from "../lib/ABI";
import { Transaction } from "@/types/types";
import { ethers } from "ethers";
import { adminWallet } from "@/lib/USDCWallets";

export default function useExecuteETHBatchContract() {
  const chainId = useChainId();
  const chain = config.chains.find((c) => c.id === chainId);

  if (!chain) {
    throw new Error("unsupported chain");
  }

  const [manualStatus, setManualStatus] = useState<string>("");
  const [receipt, setReceipt] = useState<ethers.TransactionReceipt | null>(
    null,
  );

  const contractAddress = chain?.contracts?.multiBatch?.address
    ? (chain.contracts.multiBatch.address as `0x${string}`)
    : undefined;

  const executeBatch = async (batch: Transaction[]) => {
    try {
      setManualStatus("Preparing Multi Batch Transfer...");

      // Check if contract address is available
      if (!contractAddress) {
        setManualStatus("Contract address not found for this chain!");
        return;
      }

      setManualStatus("Connecting admin wallet...");

      // Connect to the chain using admin wallet's private key
      const RPC_URL = chain.rpcUrls.default.http[0];
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(adminWallet.privateKey, provider);
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        ETH_BATCH_CONTRACT_ABI,
        wallet,
      );

      setManualStatus("Collecting signatures from senders...");

      const signatures: string[] = [];
      const senders = [];
      const recipients = [];
      const amounts = [];

      for (let i = 0; i < senders.length; i++) {
        const tx = batch[i];

        const senderWallet = new ethers.Wallet(
          tx.senderPrivateKey as string,
          provider,
        );

        const nonce = await contract.nonces(tx.sender);

        const messageHash = ethers.solidityPackedKeccak256(
          ["address", "address", "uint256", "uint256"],
          [tx.sender, tx.recipient, tx.amount, nonce],
        );

        const signature = await senderWallet.signMessage(
          ethers.getBytes(messageHash),
        );

        signatures.push(signature);
        senders.push(tx.sender);
        recipients.push(tx.recipient);
        amounts.push(tx.amount);
      }

      setManualStatus("Submitting batch to blockchain...");
      const txResponse = await contract.executeBatch(
        senders,
        recipients,
        amounts,
        signatures,
      );

      setManualStatus("Waiting for confirmation...");
      const txReceipt = await txResponse.wait();

      setReceipt(txReceipt);
      setManualStatus("Batch Successful!");
      return txReceipt;
    } catch (error) {
      console.error("Error:", error);
      setManualStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  };

  return {
    executeBatch,
    manualStatus,
    receipt,
  };
}
