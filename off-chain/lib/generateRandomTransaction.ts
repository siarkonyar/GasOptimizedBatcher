import { recipients, senders } from "@/lib/keys";
import { getRandomAmount } from "@/lib/randomAmounts";
import { Transaction } from "@/types/types";

const senderAddresses = senders.map((s) => s.address) as `0x${string}`[];

const senderPrivateKeys = senders.map((s) => s.privateKey) as `0x${string}`[];

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

export function generateRandomTransaction(): Transaction {
  const index = Math.floor(Math.random() * senders.length);
  const senderAddress = senderAddresses[index];
  const senderPrivateKey = senderPrivateKeys[index];
  const recipient =
    recipientAddresses[Math.floor(Math.random() * recipientAddresses.length)];
  const amount = getRandomAmount();

  const transaction = {
    sender: senderAddress,
    recipient,
    amount,
    senderPrivateKey,
  };

  return transaction;
}
