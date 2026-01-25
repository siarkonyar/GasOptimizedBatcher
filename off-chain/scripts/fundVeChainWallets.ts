import {
  ThorClient,
  VeChainPrivateKeySigner,
  VeChainProvider,
} from "@vechain/sdk-network";
import { Clause, Address, VET, VTHO, Units } from "@vechain/sdk-core";
import * as dotenv from "dotenv";
import { recipients, godWallet } from "../lib/vechain-wallets";
import { Mnemonic } from "@vechain/sdk-core";

dotenv.config();

// CONFIGURATION
const THOR_URL = "http://127.0.0.1:8669";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_VECHAIN_USDC_ADDRESS as string;
const VTHO_ADDRESS = "0x0000000000000000000000000000456E65726779"; // Built-in VTHO token address

const USDC_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "name_", type: "string", internalType: "string" },
      { name: "symbol_", type: "string", internalType: "string" },
      { name: "decimal_", type: "uint8", internalType: "uint8" },
    ],
    stateMutability: "nonpayable",
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    name: "OwnershipTransferred",
    type: "event",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "burn",
    type: "function",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "burn",
    type: "function",
    inputs: [
      { name: "account_", type: "address", internalType: "address" },
      { name: "value_", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "burnFrom",
    type: "function",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    name: "decreaseAllowance",
    type: "function",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "subtractedValue", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "increaseAllowance",
    type: "function",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "addedValue", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "account_", type: "address", internalType: "address" },
      { name: "value_", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "name",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    name: "owner",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    name: "renounceOwnership",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    name: "totalSupply",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "transferFrom",
    type: "function",
    inputs: [
      { name: "sender", type: "address", internalType: "address" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "transferOwner",
    type: "function",
    inputs: [{ name: "newOwner_", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "transferOwnership",
    type: "function",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "update",
    type: "function",
    inputs: [
      { name: "name_", type: "string", internalType: "string" },
      { name: "symbol_", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const VTHO_ABI = [
  {
    constant: false,
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const godMnemonic =
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross";
const godPrivateKey = Mnemonic.toPrivateKey(godMnemonic.split(" "));

async function seed() {
  console.log("🚀 Starting Seeding Process (Native SDK Mode)...");

  const thorClient = ThorClient.at(THOR_URL);

  const godSigner = new VeChainPrivateKeySigner(
    godPrivateKey,
    new VeChainProvider(thorClient),
  );

  // Define Amounts
  const usdcAmount = BigInt(Units.parseUnits("10000", 6).toString()); // 10,000 USDC (6 decimals)
  const vetAmount = VET.of(10); // 10 VET in wei (returns bigint)
  const vthoAmount = VTHO.of(5).wei; // 500 VTHO in wei (returns bigint)

  console.log(`📝 Funding ${recipients.length} wallets...`);
  console.log(
    `💰 Amounts: ${usdcAmount} USDC, ${vetAmount} VET, ${vthoAmount} VTHO`,
  );

  // Create contract interfaces
  const usdcContract = thorClient.contracts.load(USDC_ADDRESS, USDC_ABI);

  const code = await thorClient.accounts.getBytecode(Address.of(USDC_ADDRESS));
  if (!code) {
    throw new Error(`No contract found at address ${USDC_ADDRESS}`);
  }
  console.log(code);
  const vthoContract = thorClient.contracts.load(VTHO_ADDRESS, VTHO_ABI);

  // Loop & Fund
  for (const recipient of recipients) {
    try {
      console.log(`💸 Funding wallet ${recipient.id}: ${recipient.address}`);

      // Build clauses using contract interface
      const clauses = [
        // 1. USDC Mint
        usdcContract.clause.mint(recipient.address, usdcAmount).clause,
        // 2. VET Transfer (Native transfer)
        Clause.transferVET(Address.of(recipient.address), vetAmount),
        // 3. VTHO Transfer
        vthoContract.clause.transfer(recipient.address, vthoAmount).clause,
      ];

      // Estimate Gas
      const gasResult = await thorClient.gas.estimateGas(
        clauses,
        godWallet.address,
      );

      // Build Transaction Body
      const txBody = await thorClient.transactions.buildTransactionBody(
        clauses,
        gasResult.totalGas,
      );

      // Fix dependsOn type for signTransaction
      const txBodyFixed = {
        ...txBody,
        dependsOn: txBody.dependsOn ?? undefined,
      };

      // Sign & Send
      const signedTx = await godSigner.signTransaction(txBodyFixed);
      // CORRECT
      const txResult =
        await thorClient.transactions.sendRawTransaction(signedTx);

      // Wait for Receipt
      const receipt = await thorClient.transactions.waitForTransaction(
        txResult.id,
      );

      if (!receipt) {
        console.error(
          `⏰ Timeout waiting for receipt for ${recipient.address}`,
        );
        continue;
      }
    } catch (e) {
      console.error(`❌ Failed to fund ${recipient.address}:`, e);
      if (e instanceof Error) {
        console.error(`   Error message: ${e.message}`);
        if (e.stack) console.error(`   Stack: ${e.stack}`);
      }
    }
  }
  console.log("🏁 Seeding Complete.");
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
