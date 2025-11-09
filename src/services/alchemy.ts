// src/services/alchemy.ts
// Enriquecimiento ERC-20 via Alchemy (ETH, BASE, POLYGON)
import { logger } from "@/utils/logger";
import { TIMEOUTS } from "@/constants/config";

export type EvmChain = "ethereum" | "base" | "polygon";

const KEY: Record<EvmChain, string> = {
  ethereum: process.env.EXPO_PUBLIC_ALCHEMY_KEY_ETH ?? "",
  base:     process.env.EXPO_PUBLIC_ALCHEMY_KEY_BASE ?? "",
  polygon:  process.env.EXPO_PUBLIC_ALCHEMY_KEY_POLYGON ?? "",
};

const RPC: Record<EvmChain, string> = {
  ethereum: "https://eth-mainnet.g.alchemy.com/v2/",
  base:     "https://base-mainnet.g.alchemy.com/v2/",
  polygon:  "https://polygon-mainnet.g.alchemy.com/v2/",
};

function assertKey(chain: EvmChain) {
  if (!KEY[chain]) {
    logger.warn(`[alchemy] Missing key for ${chain}. Check EXPO_PUBLIC_ALCHEMY_KEY_*`);
  }
}

// Tipo para el body de RPC request
type RpcRequestBody = {
  method: string;
  params?: unknown[];
  [key: string]: unknown;
};

// Tipo para respuesta RPC
type RpcResponse<T> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

async function rpc<T>(chain: EvmChain, body: RpcRequestBody, signal?: AbortSignal): Promise<T> {
  assertKey(chain);
  const url = RPC[chain] + KEY[chain];
  
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...body }),
    signal,
  });

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("timeout")), TIMEOUTS.HTTP_REQUEST)
  );

  const res = await Promise.race<Response | never>([fetchPromise, timeoutPromise]);

  if (!res.ok) {
    let responseText = "";
    try {
      responseText = await res.text();
    } catch {
      // Ignore text extraction errors
    }
    throw new Error(`[alchemy] ${chain} HTTP ${res.status} ${responseText}`);
  }
  
  const json = (await res.json()) as RpcResponse<T>;
  if (json.error) {
    throw new Error(`[alchemy] ${chain} ${json.error.message || "rpc error"}`);
  }
  
  if (json.result === undefined) {
    throw new Error(`[alchemy] ${chain} missing result`);
  }
  
  return json.result;
}

/** ERC-20 metadata (name/symbol/decimals/logo) */
export async function fetchErc20Meta(chain: EvmChain, address: string, signal?: AbortSignal) {
  // Alchemy espera checksum/0x… en minúsculas está ok
  const result = await rpc<{
    name: string | null; symbol: string | null; decimals: number | null; logo: string | null;
  }>(chain, {
    method: "alchemy_getTokenMetadata",
    params: [address],
  }, signal);

  return {
    name: result.name ?? undefined,
    symbol: result.symbol ?? undefined,
    decimals: typeof result.decimals === "number" ? result.decimals : undefined,
    iconUrl: result.logo ?? undefined,
  };
}

/** Enriquecer un lote de direcciones por chain */
export async function enrichEvmTokens(items: Array<{ chain: EvmChain; address: string }>) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const tasks = items.map(async (it) => {
    try {
      const meta = await fetchErc20Meta(it.chain, it.address, ctrl?.signal);
      return { ...it, ...meta };
    } catch (e) {
      logger.debug("[alchemy] fail", it.chain, it.address, String(e));
      return { ...it, /* sin meta: UI mostrará 'needs_meta' */ };
    }
  });
  return Promise.all(tasks);
}