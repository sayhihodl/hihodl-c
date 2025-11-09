// src/services/api/health.service.ts
// Health & Metrics API service
import { apiClient } from '@/lib/apiClient';
import type {
  HealthResponse,
  HealthFullResponse,
} from '@/types/api';

/**
 * Basic health check
 */
export async function checkHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health', { skipAuth: true });
}

/**
 * Full health check with detailed system status
 */
export async function checkHealthFull(): Promise<HealthFullResponse> {
  return apiClient.get<HealthFullResponse>('/health/full', { skipAuth: true });
}

/**
 * Get metrics (optional endpoint, may not be available)
 */
export async function getMetrics(): Promise<Record<string, unknown>> {
  return apiClient.get<Record<string, unknown>>('/metrics', { skipAuth: true });
}




