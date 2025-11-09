// src/services/api/payments.service.ts
// Payments API service
import { apiClient } from '@/lib/apiClient';
import type {
  PaymentSendRequest,
  PaymentSendResponse,
  PaymentRequestCreateRequest,
  PaymentRequestCreateResponse,
  PIXSendRequest,
  PIXSendResponse,
  PIXConvertRequest,
  PIXConvertResponse,
  MercadoPagoSendRequest,
  MercadoPagoSendResponse,
  MercadoPagoConvertRequest,
  MercadoPagoConvertResponse,
} from '@/types/api';

/**
 * Send payment (simplified alias of /transfers/submit)
 */
export async function sendPayment(
  params: PaymentSendRequest,
  idempotencyKey?: string
): Promise<PaymentSendResponse> {
  return apiClient.post<PaymentSendResponse>('/payments/send', params, {
    idempotencyKey: idempotencyKey || true,
  });
}

/**
 * Create payment request (request payment from someone)
 */
export async function createPaymentRequest(
  params: PaymentRequestCreateRequest
): Promise<PaymentRequestCreateResponse> {
  return apiClient.post<PaymentRequestCreateResponse>('/payments/request', params);
}

/**
 * Send PIX payment (Brazil)
 */
export async function sendPIXPayment(
  params: PIXSendRequest
): Promise<PIXSendResponse> {
  return apiClient.post<PIXSendResponse>('/payments/pix/send', params);
}

/**
 * Convert crypto to BRL for PIX
 */
export async function convertToBRL(
  params: PIXConvertRequest
): Promise<PIXConvertResponse> {
  return apiClient.post<PIXConvertResponse>('/payments/pix/convert', params);
}

/**
 * Send Mercado Pago payment
 */
export async function sendMercadoPagoPayment(
  params: MercadoPagoSendRequest
): Promise<MercadoPagoSendResponse> {
  return apiClient.post<MercadoPagoSendResponse>('/payments/mercado-pago/send', params);
}

/**
 * Convert currency for Mercado Pago
 */
export async function convertMercadoPagoCurrency(
  params: MercadoPagoConvertRequest
): Promise<MercadoPagoConvertResponse> {
  return apiClient.post<MercadoPagoConvertResponse>('/payments/mercado-pago/convert', params);
}

