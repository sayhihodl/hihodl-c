// simple stub; cámbialo luego por tu fetch real
export type CreatePaymentRequestArgs = {
  from: string;  // handle sin @
  tokenId: string;
  chain: string;
  amount: string;
  account: "daily" | "savings" | "social";
};

export type CreatePaymentRequestRes = {
  requestId: string;
  status: "requested";
  ts: number;
};

export async function createPaymentRequest(
  args: CreatePaymentRequestArgs
): Promise<CreatePaymentRequestRes> {
  await new Promise(r => setTimeout(r, 350));
  return { requestId: `req_${Date.now()}`, status: "requested", ts: Date.now() };
}