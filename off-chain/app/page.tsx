"use client";

import { generateRandomTransaction } from "@/lib/generateRandomTransaction";
import { useUSDC } from "@/hooks/useUSDC";
import ExecuteMultiBatcherButton from "./_components/ExecuteMultiBatcherButton";
import MetaMaskWalletButton from "./_components/MetaMaskWalletButton";
import SimulateUSDCTransactions from "./_components/SimulateUSDCTransactions";

export default function Home() {
  const tx = generateRandomTransaction();
  const { sendUsdc, receipt, writeError, status, isPending } = useUSDC();

  const handleSendSingleTx = async () => {
    try {
      const txReceipt = await sendUsdc(tx);
      console.log("USDC transaction receipt:", txReceipt);
    } catch (error) {
      console.error("Error sending USDC transaction:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <MetaMaskWalletButton />
      <ExecuteMultiBatcherButton />
      <SimulateUSDCTransactions />

      <div className="space-y-2">
        <button
          onClick={handleSendSingleTx}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
        >
          {isPending
            ? "Sending USDC transaction..."
            : "Send Single USDC Transaction"}
        </button>

        {status && <p className="text-sm text-gray-800">{status}</p>}

        {receipt && (
          <pre className="text-xs bg-gray-100 p-2 rounded max-h-64 overflow-auto break-all">
            {JSON.stringify(receipt, null, 2)}
          </pre>
        )}

        {writeError && (
          <p className="text-sm text-red-600">Error: {writeError.message}</p>
        )}
      </div>
    </div>
  );
}
