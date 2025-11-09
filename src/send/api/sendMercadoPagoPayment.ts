// src/send/api/sendMercadoPagoPayment.ts
// Updated to use new API client
import { sendMercadoPagoPayment as sendMercadoPagoPaymentService, convertMercadoPagoCurrency } from '@/services/api/payments.service';
import { API_URL } from "@/config/runtime";

export type SendMercadoPagoParams = {
  mercadoPagoId: string; // ID del punto de venta o usuario de Mercado Pago
  amount: string; // Monto como string
  currency?: string; // Código de moneda (ARS, BRL, etc.) - default ARS
  description?: string; // Descripción opcional
  merchantName?: string; // Nombre del comerciante
  account: "daily" | "savings" | "social"; // Cuenta desde la que se envía
  reference?: string; // ID de referencia externo
};

export type SendMercadoPagoResult = {
  paymentId: string; // ID de la transacción de Mercado Pago
  status: "pending" | "confirmed" | "failed";
  ts: number;
  fee?: number;
  qrCode?: string; // QR code para confirmación (si aplica)
  deepLink?: string; // Deep link para abrir en app de Mercado Pago
  transactionId?: string; // ID de transacción de Mercado Pago
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Envía un pago vía Mercado Pago (Argentina, Brasil, otros países)
 * El backend deberá convertir crypto a la moneda local y procesar el pago
 */
export async function sendMercadoPagoPayment(
  p: SendMercadoPagoParams
): Promise<SendMercadoPagoResult> {
  // Mock automático si no hay API_URL todavía
  if (!API_URL) {
    await sleep(900); // Mercado Pago puede tardar un poco más
    return {
      paymentId: `mp_${Date.now()}`,
      status: "pending" as const,
      ts: Date.now(),
      fee: 1.50, // Fee típico de Mercado Pago (varía por país)
      transactionId: `TXN${Date.now()}`,
    };
  }

  try {
    // Use new API service
    const response = await sendMercadoPagoPaymentService({
      amount: p.amount,
      currency: p.currency,
      account: p.account,
    });

    // Convert fee from string to number if present
    return {
      paymentId: response.paymentId,
      status: response.status,
      ts: response.ts,
      fee: response.fee ? parseFloat(response.fee) : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Mercado Pago payment failed: ${String(error)}`);
  }
}

/**
 * Convierte monto en crypto a moneda local (ARS, BRL, etc.)
 */
export async function convertToLocalCurrency(
  amount: string,
  tokenId: string,
  currency: string = "ARS"
): Promise<{ localAmount: string; rate: number }> {
  if (!API_URL) {
    // Mock: usar tasa fija aproximada
    const usdAmount = parseFloat(amount);
    const mockRates: Record<string, number> = {
      ARS: 980, // ARS por USD (mock)
      BRL: 5.2, // BRL por USD (mock)
      CLP: 920, // CLP por USD (mock)
      MXN: 17.5, // MXN por USD (mock)
    };
    const rate = mockRates[currency] || 1;
    return {
      localAmount: String(usdAmount * rate),
      rate,
    };
  }

  try {
    // Use new API service
    const response = await convertMercadoPagoCurrency({
      amount,
      fromCurrency: tokenId,
      toCurrency: currency,
    });

    return {
      localAmount: response.convertedAmount,
      rate: response.rate,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Conversion failed: ${String(error)}`);
  }
}

