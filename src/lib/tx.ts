// src/lib/tx.ts
import { makeSendConn } from "./solana";     // ✅ alias correcto (sin /src)
import { Transaction } from "@solana/web3.js";

type TxInput = Uint8Array | string | Transaction;

function toRawBytes(input: TxInput): Uint8Array {
  if (input instanceof Transaction) {
    return input.serialize() as Uint8Array;
  }
  if (typeof input === "string") {
    const b = Buffer.from(input, "base64");
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  }
  return input;
}

export async function sendWithRebate(input: TxInput) {
  const conn = makeSendConn();
  const rawTx = toRawBytes(input);

  const sig = await conn.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });

  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}