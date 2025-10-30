export type TxStatus = "processed" | "confirmed" | "finalized" | "failed" | "unknown";

const RPC = process.env.EXPO_PUBLIC_SOLANA_RPC!;
const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL;
const RELAY_KEY = process.env.EXPO_PUBLIC_RELAY_API_KEY;

export async function pollSolanaStatus(signature: string): Promise<TxStatus> {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getSignatureStatuses",
    params: [[signature], { searchTransactionHistory: true }],
  };
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  const v = j?.result?.value?.[0];
  if (!v) return "unknown";
  if (v.err) return "failed";
  return (v.confirmationStatus ?? "processed") as TxStatus;
}

function fakeSig() {
  const bytes = Array.from({ length: 64 }, () => Math.floor(Math.random() * 256));
  return Buffer.from(new Uint8Array(bytes)).toString("base64"); // Solana signatures son base58/base64; para mock vale
}

export async function sendSolanaPayment(p: {
  to: string;
  amount: string;        // humano: "12.34"
  tokenMint: string;     // USDC mint
  memo?: string;
  fromAlias?: string;
}): Promise<{ signature: string; mocked: boolean }> {
  if (RELAY_URL) {
    const r = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...(RELAY_KEY ? { authorization: `Bearer ${RELAY_KEY}` } : {}) },
      body: JSON.stringify(p),
    });
    if (!r.ok) throw new Error(await r.text());
    const json = await r.json(); // { signature }
    return { signature: json.signature, mocked: false };
  }
  // MOCK: para diseñar sin backend
  return { signature: fakeSig(), mocked: true };
}

/**
 * Espera hasta que la transacción alcance un estado estable (confirmed/finalized/failed)
 * Haciendo polling al RPC con backoff incremental.
 */
export async function waitForFinalStatus(signature: string, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<TxStatus> {
  const startedAt = Date.now();
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  let delay = Math.max(750, opts?.intervalMs ?? 1000);

  while (true) {
    const s = await pollSolanaStatus(signature);
    if (s === "confirmed" || s === "finalized" || s === "failed") return s;
    if (Date.now() - startedAt > timeoutMs) return s;
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(3000, Math.floor(delay * 1.2));
  }
}