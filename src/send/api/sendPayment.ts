import { API_URL } from "@/config/runtime";
import type { ChainKey } from "@/config/sendMatrix";

export type SendParams = {
  to: string;
  tokenId: string;
  chain: ChainKey;
  amount: string; // como string para no perder precisión
  account: "daily" | "savings" | "social";
};

export type SendResult = {
  txId: string;
  status: "pending" | "confirmed" | "failed";
  ts: number;
  fee?: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendPayment(p: SendParams): Promise<SendResult> {
  // Mock automático si no hay API_URL todavía
  if (!API_URL) {
    await sleep(600);
    return {
      txId: "mock_" + Date.now(),
      status: "confirmed",
      ts: Date.now(),
      fee: 0,
    };
  }

  const res = await fetch(`${API_URL}/payments/send`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(p),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Send failed (${res.status}) ${txt}`.trim());
  }

  const json = (await res.json()) as SendResult;
  // Validación mínima
  if (!json?.txId) throw new Error("Send failed: missing txId");
  return json;
}