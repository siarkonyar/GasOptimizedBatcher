import { useState } from "react";

export default function ExecuteBatchContract() {
  const recipients = {
    batchAccount1: "0x6A88821ad52A2f5A54581A941cB38f39aaFb4aF4",
    batchAccount2: "0x9907bf95ea352e3ad20e656d056ef8011D1272F7",
    batchAccount3: "0xC3976D61f38164d86fCA69884C37977f788E7991",
  };

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  try {
    setLoading(true);
    setStatus("Connecting to wallet...");
    setTxHash("");

    
  } catch {}
}
