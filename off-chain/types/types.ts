export type Transaction = {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  senderPrivateKey?: `0x${string}`;
};
