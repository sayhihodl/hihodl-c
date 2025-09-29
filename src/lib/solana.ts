// src/lib/solana.ts
import { Connection } from '@solana/web3.js';

const BASE = process.env.EXPO_PUBLIC_HELIUS_RPC_BASE!;
const REBATE = process.env.EXPO_PUBLIC_SOL_REBATE_ADDRESS; // puede venir vacío

// Lecturas (getBalance, getLatestBlockhash, etc.)
export const readConn = new Connection(BASE, 'confirmed');

// SOLO para enviar transacciones (añade rebate-address si existe)
export function makeSendConn(rebateAddress?: string) {
  const addr = rebateAddress ?? REBATE;
  const url = addr ? `${BASE}&rebate-address=${addr}` : BASE;
  return new Connection(url, 'confirmed');
}