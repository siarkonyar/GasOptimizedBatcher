"use client";

import useExecuteMultiBatchContract from "@/hooks/useExecuteETHBatchContract";
import { generateRandomBatch } from "@/lib/generateRandomUSDCTransaction";
import React from "react";

export default function ExecuteMultiBatcherButton() {
  const { executeMultiBatch, status, receipt } = useExecuteMultiBatchContract();

  const batch = generateRandomBatch(20);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">
        Execute Multi-Batch Transfer
      </h2>

      <button
        onClick={() => executeMultiBatch(batch)}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200`}
      >
        Execute Batch
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
        </div>
      )}

      {receipt && (
        <div className="mt-6 w-full rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-md">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">
                  Transaction Receipt
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  Batch execution confirmed on-chain
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="rounded-lg bg-white/70 border border-indigo-100 px-3 py-3 flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Gas Used
                </span>
                <span className="mt-1 text-2xl font-extrabold text-indigo-700 tracking-tight">
                  {receipt.gasUsed?.toString()}
                </span>
                <span className="mt-1 text-[11px] text-gray-500">
                  Total gas consumed by this batch transaction
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
