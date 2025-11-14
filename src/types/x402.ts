// src/types/x402.ts
// Type definitions for x402 protocol

export type X402Chain = 'base' | 'ethereum' | 'polygon' | 'solana';
export type X402Token = 'usdc' | 'usdt';

export interface X402PaymentInfo {
  amount: string;
  currency: string;
  chain: X402Chain;
  address: string;
  expiresAt: string;
}

export interface X402ServiceInfo {
  id: string;
  name: string;
  description: string;
}

export interface X402Response {
  payment: X402PaymentInfo;
  service: X402ServiceInfo;
}

export interface X402TransactionProof {
  txHash: string;
  chain: X402Chain;
  token: X402Token;
  amount: string;
  timestamp: number;
  from: string;
  to: string;
}

export interface X402VerificationResult {
  verified: boolean;
  transaction?: X402TransactionProof;
  error?: string;
}

export interface X402ServiceConfig {
  serviceId: string;
  amount: string;
  token: X402Token;
  chain: X402Chain;
  description: string;
}



