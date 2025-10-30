export type EvmStatus = "pending" | "confirmed" | "failed" | "unknown";

type ChainKey = "base" | "ethereum" | "polygon" | string;

const RPCS: Record<string, string | undefined> = {
  base: process.env.EXPO_PUBLIC_BASE_RPC,
  ethereum: process.env.EXPO_PUBLIC_ETHEREUM_RPC,
  polygon: process.env.EXPO_PUBLIC_POLYGON_RPC,
};

function rpcFor(chain: ChainKey): string | undefined {
  const k = String(chain).toLowerCase();
  return RPCS[k] || RPCS[
    k.includes("base") ? "base" : k.includes("eth") ? "ethereum" : k.includes("poly") ? "polygon" : ""
  ];
}

export async function pollEvmStatus(chain: ChainKey, txHash?: string): Promise<EvmStatus> {
  if (!txHash) return "unknown";
  const rpc = rpcFor(chain);
  if (!rpc) return "unknown";
  try {
    const body = { jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] };
    const res = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    const r = j?.result;
    if (!r) return "pending"; // aún sin receipt
    if (r.status === "0x1") return "confirmed";
    if (r.status === "0x0") return "failed";
    return "unknown";
  } catch {
    return "unknown";
  }
}


