/**
 * Types for QuickSendScreen component
 */
import type { ChainKey } from "@/config/sendMatrix";

export type AccountId = "daily" | "savings" | "social";

export type BalItem = {
  tokenId: string;
  chain: ChainKey;
  amount: number;
  account: AccountId;
};

export type PaymentType = "crypto" | "pix" | "mercado_pago";

export interface PIXData {
  pixKey: string;
  merchantName: string;
  description: string;
  currency: string;
}

export interface MercadoPagoData {
  mercadoPagoId: string;
  merchantName: string;
  description: string;
  currency: string;
  reference: string;
}

export interface QuickSendInnerProps {
  title: string;
  navReturn: { pathname: string; alias: string; avatar?: string };
  paymentType?: PaymentType;
  pixData?: PIXData;
  mercadoPagoData?: MercadoPagoData;
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

