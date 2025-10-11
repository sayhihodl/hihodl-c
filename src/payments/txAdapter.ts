// Adaptador: Tx (del thread) -> TxDetails (del sheet global)

import type { TxDetails } from "@/components/tx/TransactionDetailsSheet";

export type ThreadTx = {
  id: string;
  direction: "out" | "in";
  token: string;
  amount: number;       // positivo
  fiat: string;         // ej: "$12.99"
  timestamp: string;    // ej: "08:40" (puedes pasar a fecha real más tarde)
  chain: "Solana" | "Base" | "Ethereum";
  status: "confirmed" | "pending" | "failed";
  hash?: string;
  peer?: string;
  fee?: string;
};

export function mapThreadTxToDetails(tx: ThreadTx): TxDetails {
  const netMap: Record<string, string> = {
    Solana: "solana:mainnet",
    Base: "eip155:8453",
    Ethereum: "eip155:1",
  };

  const statusMap: Record<ThreadTx["status"], "Succeeded" | "Failed" | "Pending"> = {
    confirmed: "Succeeded",
    failed: "Failed",
    pending: "Pending",
  };

  const fiatNum = Number(String(tx.fiat).replace(/[^0-9.-]/g, "") || "0");

  return {
    id: tx.id,
    dir: tx.direction === "in" ? "in" : "out",
    when: tx.timestamp,
    peer: tx.peer,
    hash: tx.hash,
    status: statusMap[tx.status],
    tokenSymbol: tx.token,
    tokenAmount: tx.direction === "out" ? -tx.amount : tx.amount,
    fiatAmount: tx.direction === "out" ? -fiatNum : fiatNum,
    fee: tx.fee,
    network: netMap[tx.chain] ?? tx.chain,
  };
}