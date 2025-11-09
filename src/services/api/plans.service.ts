// src/services/api/plans.service.ts
// Plans & Limits API service
import { apiClient } from '@/lib/apiClient';
import type {
  PlansResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  ActivatePlanRequest,
  ActivatePlanResponse,
  LimitsResponse,
} from '@/types/api';

/**
 * List available plans
 */
export async function listPlans(): Promise<PlansResponse> {
  return apiClient.get<PlansResponse>('/plans');
}

/**
 * Create subscription (required before activating plan)
 */
export async function createSubscription(
  params: CreateSubscriptionRequest
): Promise<CreateSubscriptionResponse> {
  return apiClient.post<CreateSubscriptionResponse>('/subscriptions/create', params);
}

/**
 * Activate plan for user
 */
export async function activatePlan(params: ActivatePlanRequest): Promise<ActivatePlanResponse> {
  return apiClient.post<ActivatePlanResponse>('/plans/activate', params);
}

/**
 * Get user limits (based on plan)
 */
export async function getLimits(): Promise<LimitsResponse> {
  return apiClient.get<LimitsResponse>('/limits');
}

