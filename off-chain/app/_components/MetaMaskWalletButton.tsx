"use client";
import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Image from "next/image";

export default function MetaMaskWalletButton() {
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {address ? (
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Connected:{" "}
              <span className="font-mono">{formatAddress(address)}</span>
            </p>
          </div>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 active:scale-95"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 transform hover:scale-105 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
                width={48}
                height={48}
                className="w-8 h-8"
              />
              <span>Connect {connector.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
