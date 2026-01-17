import { ethers } from "ethers";
import { recipients, sendersPrivateKeys } from "@/lib/keys";
import { getRandomAmount } from "@/lib/randomAmounts";
import { Transaction } from "@/types/types";

const senderAddresses = sendersPrivateKeys.map(
  (sender) => new ethers.Wallet(sender.address).address,
) as `0x${string}`[];

const recipientAddresses = recipients.map((r) => r.address) as `0x${string}`[];

// generates a batch with N number transaction
export function generateRandomBatch(count: number): Transaction[] {
  const batch: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const sender =
      senderAddresses[Math.floor(Math.random() * senderAddresses.length)];
    const recipient =
      recipientAddresses[Math.floor(Math.random() * recipientAddresses.length)];
    const amount = getRandomAmount();

    batch.push({
      sender: sender,
      recipient: recipient,
      amount: amount,
    });
  }

  return batch;
}

export function generateRandomTransaction(): Transaction{
  const sender =
    senderAddresses[Math.floor(Math.random() * senderAddresses.length)];
  const recipient =
    recipientAddresses[Math.floor(Math.random() * recipientAddresses.length)];
  const amount = getRandomAmount();

  const transaction = {
    sender,
    recipient,
    amount
  }

  return transaction;
}
