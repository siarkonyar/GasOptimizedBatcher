"use client";

import useExecuteMultiBatchContract from "@/hooks/useExecuteMultiBatchContract";
import { generateRandomBatch } from "@/lib/generateRandomTransaction";
import { recipients, sendersPrivateKeys } from "@/lib/keys";
import React from "react";

export default function ExecuteMultiBatcherButton() {
  const {
    executeMultiBatch,
    status,
    isApproving,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  } = useExecuteMultiBatchContract();

  const isLoading = isApproving || isPending || isConfirming;

  const batch = generateRandomBatch(5);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">
        Multi Batch USDC Transfer
      </h2>

      <div className="w-full grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Senders:</h3>
          {sendersPrivateKeys.map((sender, index) => (
            <div
              key={index}
              className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded"
            >
              {sender.name}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">
            Recipients (10 USDC each):
          </h3>
          {recipients.map((recipient, index) => (
            <div
              key={index}
              className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded"
            >
              {recipient.name}
            </div>
          ))}
        </div>
      </div>

      <div className="text-lg font-semibold text-gray-700">
        Total: <span className="text-blue-600">30 USDC</span>
      </div>

      <button
        onClick={() => executeMultiBatch(batch)}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        }`}
      >
        {isLoading ? "Processing..." : "Send 30 USDC via MultiBatch"}
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
          {hash && (
            <p className="text-xs font-mono mt-2 break-all text-gray-600">
              TX: {hash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
