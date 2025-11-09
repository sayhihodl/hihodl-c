// src/services/api/analytics.service.ts
// Analytics & Diagnostics API service
import { apiClient } from '@/lib/apiClient';
import type {
  PaymentDiagnosticsResponse,
  AnalyticsEventRequest,
  AnalyticsEventResponse,
} from '@/types/api';

/**
 * Get payment diagnostics (check if user can send payment, issues, alternatives)
 */
export async function getPaymentDiagnostics(): Promise<PaymentDiagnosticsResponse> {
  return apiClient.get<PaymentDiagnosticsResponse>('/diagnostics/payment');
}

/**
 * Track analytics event
 */
export async function trackEvent(
  params: AnalyticsEventRequest
): Promise<AnalyticsEventResponse> {
  return apiClient.post<AnalyticsEventResponse>('/analytics/event', params);
}




