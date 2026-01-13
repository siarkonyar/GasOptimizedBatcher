"use client";

import useExecuteBatchContract from "@/lib/useExecuteBatchContract";
import React from "react";
import { formatEther } from "viem";

export default function ExecuteSmartContractButton() {
  const {
    executeBatch,
    status,
    loading,
    balanceInEther,
    isConfirmed,
    txHash,
    recipients,
  } = useExecuteBatchContract();

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">Batch ETH Transfer</h2>

      <div className="w-full space-y-2">
        <h3 className="font-semibold text-gray-700">
          Recipients (10 ETH each):
        </h3>
        {recipients.map((recipient, index) => (
          <div
            key={index}
            className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded"
          >
            <span className="font-semibold">{recipient.name}:</span>{" "}
            {recipient.address}
          </div>
        ))}
      </div>

      <div className="text-lg font-semibold text-gray-700">
        Total: <span className="text-blue-600">30 ETH</span>
      </div>

      <div className="text-gray-700">
        Balance: <span className="text-blue-700">{balanceInEther} ETH</span>
      </div>

      <button
        onClick={executeBatch}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        }`}
      >
        {loading ? "Processing..." : "Send 30 ETH to Recipients"}
      </button>

      {status && (
        <div
          className={`mt-4 p-4 rounded-lg w-full ${
            status.includes("Error") || status.includes("failed")
              ? "bg-red-50 border border-red-200"
              : status.includes("confirmed")
              ? "bg-green-50 border border-green-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              status.includes("Error") || status.includes("failed")
                ? "text-red-800"
                : status.includes("confirmed")
                ? "text-green-800"
                : "text-blue-800"
            }`}
          >
            {status}
          </p>
          {txHash && (
            <p className="text-xs font-mono mt-2 break-all text-gray-600">
              TX: {txHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
