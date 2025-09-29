// balances-helpers.ts
export type Chain = 'solana' | 'ethereum' | 'base' | 'polygon'; // etc

export type TokenMeta = {
  address?: string; // para EVM
  mint?: string;    // para Solana
  decimals: number;
  symbol: string;
  name?: string;
};