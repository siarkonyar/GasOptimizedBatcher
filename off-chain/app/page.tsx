import ExecuteMultiBatcherButton from "./_components/ExecuteMultiBatcherButton";
import MetaMaskWalletButton from "./_components/MetaMaskWalletButton";
import SimulateUSDCTransactions from "./_components/SimulateUSDCTransactions";

export default function Home() {
  return (
    <div className="space-y-6 p-6">
      <MetaMaskWalletButton />
      <ExecuteMultiBatcherButton />
      <SimulateUSDCTransactions />
    </div>
  );
}
