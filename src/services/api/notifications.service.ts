// src/services/api/notifications.service.ts
// Push Notifications API service
import { apiClient } from '@/lib/apiClient';
import type {
  SubscribePushRequest,
  SubscribePushResponse,
} from '@/types/api';

/**
 * Subscribe to push notifications
 */
export async function subscribePushNotifications(
  params: SubscribePushRequest
): Promise<SubscribePushResponse> {
  return apiClient.post<SubscribePushResponse>('/push/subscribe', params);
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribePushNotifications(deviceTokenId: string): Promise<void> {
  return apiClient.delete<void>(`/push/unsubscribe/${deviceTokenId}`);
}




