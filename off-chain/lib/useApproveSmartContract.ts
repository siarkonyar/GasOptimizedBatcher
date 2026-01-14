"use client";

import { ethers } from "ethers";
import { sendersPrivateKeys } from "./keys";
import { config, tenderly } from "@/config";
import { useChainId } from "wagmi";
import { useState } from "react";

export function useApproveSmartContract() {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string>("");
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const approveForAll = async () => {
    setIsApproving(true);
    setApprovalError(null);

    try {
      const TENDERLY_RPC = tenderly.rpcUrls.default.http[0];
      const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC
      const MULTI_BATCH_CONTRACT_ADDRESS =
        tenderly.contracts.multiBatch.address;

      console.log("starting approvals...");

      //connect to tenderly
      const provider = new ethers.JsonRpcProvider(TENDERLY_RPC);

      const abi = [
        "function approve(address spender, uint256 amount) public returns (bool)",
      ];

      for (const sender of sendersPrivateKeys) {
        try {
          //connect to wallet
          const wallet = new ethers.Wallet(sender.address, provider);

          //connect to smart contract
          const usdcContract = new ethers.Contract(USDC_ADDRESS, abi, wallet);

          setApprovalStatus(
            `${sender.name} (${wallet.address}) is approving...`
          );

          // Send the approval transaction
          const tx = await usdcContract.approve(
            MULTI_BATCH_CONTRACT_ADDRESS,
            ethers.MaxUint256
          );

          await tx.wait();
          setApprovalStatus(`${sender.name} approved. Hash: ${tx.hash}`);
        } catch (error) {
          const errorMsg = `Failed for ${sender.name}: ${
            (error as Error).message
          }`;
          console.error(errorMsg);
          setApprovalError(errorMsg);
          return false
        }
      }

      setApprovalStatus(
        "All users have approved the multi Batch smart contract."
      );
      setIsApproving(false);
      return true;
    } catch (error) {
      const errorMsg = `Error during approval: ${(error as Error).message}`;
      setApprovalError(errorMsg);
      setApprovalStatus("");
      setIsApproving(false);
      return false;
    }
  };

  return {
    approveForAll,
    isApproving,
    approvalStatus,
    approvalError,
  };
}
