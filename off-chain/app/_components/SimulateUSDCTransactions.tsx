"use client";

import React, { useEffect, useState } from "react";
import type { Transaction } from "@/types/types";
import useExecuteMultiBatchContract from "@/hooks/useExecuteMultiBatchContract";
import { useUSDC } from "@/hooks/useUSDC";
import { generateRandomTransaction } from "@/lib/generateRandomTransaction";

export default function SimulateUSDCTransactions() {
  const {
    executeMultiBatch,
    status: batchStatus,
    isApproving,
    isPending: batchIsPending,
    isConfirming: batchIsConfirming,
    isConfirmed: batchIsConfirmed,
    hash: batchHash,
    receipt: batchReceipt,
  } = useExecuteMultiBatchContract();

  const {
    sendUsdc,
    status: individualStatus,
    isPending: individualIsPending,
    isConfirming: individualIsConfirming,
    isConfirmed: individualIsConfirmed,
    hash: individualHash,
    receipt: individualReceipt,
    writeError: individualWriteError,
  } = useUSDC();
  const [isRunning, setIsRunning] = useState(false);
  const [individualGasUsed, setIndividualGasUsed] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) return;

    // The Simulation Loop
    const runSimulation = async () => {
      const endTime = Date.now() + 0.2 * 60 * 1000;
      const batch: Transaction[] = [];

      while (Date.now() < endTime) {
        // random Individual tx
        const tx = await generateRandomTransaction();

        console.log(tx);

        const txReceipt = await sendUsdc(tx);

        console.log(txReceipt);

        if (txReceipt) {
          const gasUsedString =
            typeof txReceipt.gasUsed === "bigint"
              ? txReceipt.gasUsed.toString()
              : String(txReceipt.gasUsed);
          console.log("Individual tx gas used:", gasUsedString);
          setIndividualGasUsed((prev) => [...prev, gasUsedString]);
        }

        batch.push(tx);

        // wait random time
        await new Promise((r) => setTimeout(r, Math.random() * 3000));
      }

      await executeMultiBatch(batch);
    };

    runSimulation();
  }, [isRunning]);

  const batchGasUsed =
    batchReceipt &&
    (typeof batchReceipt.gasUsed === "bigint"
      ? batchReceipt.gasUsed.toString()
      : String(batchReceipt.gasUsed));

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 p-4 text-white">
      <p>Simulation: {isRunning ? "RUNNING (Keep Tab Open)" : "STOPPED"}</p>
      <button onClick={() => setIsRunning(true)}>Start 15m Simulation</button>
      <div className="mt-2 text-xs">
        <p>Individual gas used:</p>
        <p>
          {individualGasUsed.length > 0
            ? individualGasUsed.join(", ")
            : "No transactions yet"}
        </p>
        <p className="mt-1">Batch gas used: {batchGasUsed ?? "N/A"}</p>
      </div>
    </div>
  );
}
