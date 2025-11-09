// src/send/api/sendPIXPayment.ts
// Updated to use new API client
import { sendPIXPayment as sendPIXPaymentService, convertToBRL as convertToBRLService } from '@/services/api/payments.service';
import { API_URL } from "@/config/runtime";

export type SendPIXParams = {
  pixKey: string; // Chave PIX (CPF, email, telefone, chave aleatória, etc.)
  amount: string; // Monto en BRL como string
  description?: string; // Descripción opcional
  merchantName?: string; // Nombre del comerciante
  account: "daily" | "savings" | "social"; // Cuenta desde la que se envía
  reference?: string; // ID de referencia externo
};

export type SendPIXResult = {
  pixId: string; // ID de la transacción PIX
  status: "pending" | "confirmed" | "failed";
  ts: number;
  fee?: number;
  endToEndId?: string; // End-to-end ID del PIX
  qrCode?: string; // QR code para confirmación (si aplica)
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Envía un pago PIX (Brasil)
 * El backend deberá convertir crypto (USDC/USDT) a BRL y enviar vía PIX
 */
export async function sendPIXPayment(p: SendPIXParams): Promise<SendPIXResult> {
  // Mock automático si no hay API_URL todavía
  if (!API_URL) {
    await sleep(800); // PIX puede tardar un poco más
    return {
      pixId: `pix_${Date.now()}`,
      status: "pending" as const,
      ts: Date.now(),
      fee: 0.50, // Fee típico de PIX (puede ser 0 en algunos casos)
      endToEndId: `E${Date.now()}`,
    };
  }

  try {
    // Use new API service
    const response = await sendPIXPaymentService({
      pixKey: p.pixKey,
      amount: p.amount,
      description: p.description,
      merchantName: p.merchantName,
      account: p.account,
      reference: p.reference,
    });

    // Convert fee from string to number if present
    return {
      pixId: response.pixId,
      status: response.status,
      ts: response.ts,
      fee: response.fee ? parseFloat(response.fee) : undefined,
      endToEndId: response.endToEndId,
      qrCode: response.qrCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`PIX payment failed: ${String(error)}`);
  }
}

/**
 * Convierte monto en crypto a BRL usando tasa de cambio actual
 */
export async function convertToBRL(
  amount: string,
  tokenId: string
): Promise<{ brlAmount: string; rate: number }> {
  if (!API_URL) {
    // Mock: usar tasa fija aproximada
    const usdAmount = parseFloat(amount);
    const mockRate = 5.2; // BRL por USD (mock)
    return {
      brlAmount: String(usdAmount * mockRate),
      rate: mockRate,
    };
  }

  try {
    // Use new API service
    return await convertToBRLService({ amount, tokenId });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Conversion failed: ${String(error)}`);
  }
}

