import ExecuteMultiBatcherButton from "./_components/ExecuteMultiBatcherButton";
import MetaMaskWalletButton from "./_components/MetaMaskWalletButton";

export default function Home() {
  return (
    <div className="space-y-6 p-6">
      <MetaMaskWalletButton />
      <ExecuteMultiBatcherButton />
    </div>
  );
}
