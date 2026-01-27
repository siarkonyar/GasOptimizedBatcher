"use client";

import React, { useEffect, useState } from "react";
import type { Transaction } from "@/types/types";
import useExecuteETHBatchContract from "@/hooks/useExecuteETHBatchContract";
import { useUSDC } from "@/hooks/useUSDC";
import { generateRandomTransaction } from "@/lib/generateRandomUSDCTransaction";
import { useApproveSmartContract } from "@/hooks/useApproveSmartContract";

type TransactionWithGas = Transaction & { gasUsed: string };

export default function SimulateUSDCTransactions() {
  const { executeBatch, receipt: batchReceipt } = useExecuteETHBatchContract();

  const { sendUsdc } = useUSDC();

  const { approveForAll, isApproving } = useApproveSmartContract();

  const [isRunning, setIsRunning] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithGas[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [simulationComplete, setSimulationComplete] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    // The Simulation Loop
    const runSimulation = async () => {
      const batch: Transaction[] = [];

      // First, wait for approvals to complete
      const approved = await approveForAll();
      if (!approved) {
        console.error("Approval failed, stopping simulation");
        setIsRunning(false);
        return;
      }

      // After approvals are done, start the countdown and simulation
      const simulationDuration = 0.2 * 60 * 1000; // 12 seconds
      const endTime = Date.now() + simulationDuration;

      // Countdown timer
      const countdownInterval = setInterval(() => {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        setCountdown(remaining > 0 ? remaining : 0);
      }, 1000);

      while (Date.now() < endTime) {
        const tx = await generateRandomTransaction();
        const txReceipt = await sendUsdc(tx);

        if (txReceipt) {
          const gasUsedString =
            typeof txReceipt.gasUsed === "bigint"
              ? txReceipt.gasUsed.toString()
              : String(txReceipt.gasUsed);

          setTransactions((prev) => [
            ...prev,
            { ...tx, gasUsed: gasUsedString },
          ]);
        }

        batch.push(tx);

        // wait random time
        await new Promise((r) => setTimeout(r, Math.random() * 3000));
      }

      clearInterval(countdownInterval);
      setSimulationComplete(true);
      await executeBatch(batch);
    };

    runSimulation();
  }, [isRunning]);

  const batchGasUsed =
    batchReceipt &&
    (typeof batchReceipt.gasUsed === "bigint"
      ? batchReceipt.gasUsed.toString()
      : String(batchReceipt.gasUsed));

  const totalIndividualGas = transactions.reduce(
    (sum, tx) => sum + BigInt(tx.gasUsed),
    BigInt(0),
  );

  const handleStart = () => {
    setIsRunning(true);
    setTransactions([]);
    setSimulationComplete(false);
    setCountdown(12);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Transaction Batching Simulation
        </h1>

        {!isRunning && (
          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 mb-6 rounded-lg transition"
          >
            Start Simulation
          </button>
        )}

        {isApproving && (
          <div className="text-2xl font-bold text-blue-600">
            All Account are approving the Batching Smart Contract. Please Wait
          </div>
        )}

        {isRunning && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-blue-600">
                {countdown > 0 ? `${countdown}s remaining` : "Simulation over"}
              </div>
              {countdown > 0 && (
                <div className="text-sm text-gray-500">Keep tab open</div>
              )}
            </div>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Individual Transactions ({transactions.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((tx, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded p-3 text-sm"
                >
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <span className="text-gray-500">From:</span>
                      <div className="font-mono text-xs  text-black">
                        {tx.sender.slice(0, 6)}...{tx.sender.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">To:</span>
                      <div className="font-mono text-xsm text-black">
                        {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-semibold text-black">
                        {Number(tx.amount) / 1000000} USDC
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Gas:</span>
                      <div className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        {tx.gasUsed}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {simulationComplete && (
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Gas Comparison
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-gray-500 mb-2">Total Individual Gas</div>
                <div className="text-3xl font-bold text-red-600">
                  {totalIndividualGas.toString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {transactions.length} transactions
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-gray-500 mb-2">Batched Gas</div>
                <div className="text-3xl font-bold text-green-600">
                  {batchGasUsed ?? "Processing..."}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Single batch transaction
                </div>
              </div>
            </div>
            {batchGasUsed && (
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-gray-700">
                  Gas Saved:{" "}
                  <span className="text-green-600">
                    {(totalIndividualGas - BigInt(batchGasUsed)).toString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {(
                    (Number(totalIndividualGas - BigInt(batchGasUsed)) /
                      Number(totalIndividualGas)) *
                    100
                  ).toFixed(2)}
                  % reduction
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
