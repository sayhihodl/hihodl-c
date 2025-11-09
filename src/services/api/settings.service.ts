// src/services/api/settings.service.ts
// Settings API service
import { apiClient } from '@/lib/apiClient';
import type {
  Settings,
  SettingsLimitsResponse,
} from '@/types/api';

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  return apiClient.get<Settings>('/settings');
}

/**
 * Update user settings
 */
export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  return apiClient.patch<Settings>('/settings', settings);
}

/**
 * Get limits and fees according to plan
 */
export async function getSettingsLimits(): Promise<SettingsLimitsResponse> {
  return apiClient.get<SettingsLimitsResponse>('/settings/limits');
}

