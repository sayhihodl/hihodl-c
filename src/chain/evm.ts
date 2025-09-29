// src/chain/evm.ts
import { CHAINS } from './chains';

export type ChainKey = keyof typeof CHAINS;

export type EvmTokenMeta = {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
};

export type Erc20Balance = {
  address: string; // checksum/0x...
  raw: string;     // cantidad en unidades mínimas (string)
};

// ✅ EXPORTA las funciones
export async function getNativeBalance(
  chain: ChainKey,
  address: string
): Promise<string> {
  // ...impl real (provider.getBalance etc.)
  // Devuelve en wei como string
  return '0';
}

export async function getErc20Balances(
  chain: ChainKey,
  address: string,
  tokens: readonly EvmTokenMeta[]
): Promise<Erc20Balance[]> {
  // ...impl real (multicall, balanceOf)
  return tokens.map(t => ({ address: t.address, raw: '0' }));
}