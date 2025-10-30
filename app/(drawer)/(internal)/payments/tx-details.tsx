import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import TxDetailsModal from "@/payments/TxDetailsModal";
import { TxDetails } from "@/components/tx/TransactionDetailsSheet";

// Asegúrate en tu stack de:
// <Stack.Screen name="tx-details" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />

export default function TxDetailsRoute() {
  const p = useLocalSearchParams<{
    id?: string;
    dir?: "in" | "out" | "refund";
    token?: string;
    amount?: string;          // "20.5"
    fiat?: string;            // "10.00" -> opcional
    status?: "Succeeded" | "Failed" | "Pending";
    dateISO?: string;         // ISO date
    time?: string;            // "21:17"
    chain?: string;           // "Solana" | "Base" | "Ethereum" | "Polygon" | ...
    network?: string;         // eip155:1 / eip155:8453 / solana:mainnet ...
    hash?: string;
    peer?: string;            // handle
    fee?: string;             // "0.0005 ETH"
  }>();

  const when =
    p?.dateISO
      ? new Date(String(p.dateISO)).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";

  const tx: TxDetails = {
    id: String(p?.id ?? ""),
    dir: (p?.dir as any) ?? "in",
    when,
    peer: p?.peer,
    hash: p?.hash,
    status: p?.status,
    tokenSymbol: p?.token,
    tokenAmount: typeof p?.amount === "string" ? Number(p.amount) : undefined,
    fiatAmount: typeof p?.fiat === "string" ? Number(p.fiat) : undefined,
    fee: p?.fee,
    network: p?.network || (p?.chain ? chainGuessToCAIP(p.chain) : undefined),
  };

  return <TxDetailsRouteImpl tx={tx} />;
}

function TxDetailsRouteImpl({ tx }: { tx: TxDetails }) {
  return <TxDetailsModal tx={tx} onClose={() => router.back()} />;
}

// Muy básico: si sólo llega "Base"/"Solana", intenta mapear a CAIP
function chainGuessToCAIP(name?: string) {
  const n = String(name ?? "").toLowerCase();
  if (n.includes("sol")) return "solana:mainnet";
  if (n.includes("base")) return "eip155:8453";
  if (n.includes("eth")) return "eip155:1";
  if (n.includes("poly") || n.includes("matic")) return "eip155:137";
  return undefined;
}