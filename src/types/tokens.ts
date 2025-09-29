export type TokenId =
  | "USDC.circle"
  | "USDT.tether"
  | "SOL.native"
  | "ETH.native"
  | "POL.native";

export type WalletToken = {
  id: TokenId;
  symbol: string;
  name: string;
  balance: number;     // balance en unidades del token (no fiat)
  fiat?: number;       // opcional: valor en $
  decimals: number;
};