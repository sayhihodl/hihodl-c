// src/services/api/kyc.service.ts
// KYC Verification Service using Stripe Identity
import { apiClient } from '@/lib/apiClient';

export type KYCStatus = 'pending' | 'verified' | 'failed' | 'expired' | 'not_started';

export type CreateKYCVerificationRequest = {
  returnUrl?: string; // URL to return after verification (for web)
  type?: 'document' | 'id_number' | 'address'; // Type of verification needed
};

export type CreateKYCVerificationResponse = {
  verificationSessionId: string;
  clientSecret: string; // Stripe client secret for frontend
  url: string; // URL to open in WebView for verification
  expiresAt: number; // Unix timestamp
};

export type KYCVerificationStatusResponse = {
  status: KYCStatus;
  verifiedAt?: number;
  expiresAt?: number;
  error?: string;
  verifiedData?: {
    // Only basic info, actual documents stored by Stripe
    fullName?: string;
    country?: string;
    documentType?: string;
  };
};

/**
 * Create a new KYC verification session
 * Backend will create a Stripe Identity VerificationSession
 */
export async function createKYCVerification(
  params?: CreateKYCVerificationRequest
): Promise<CreateKYCVerificationResponse> {
  return apiClient.post<CreateKYCVerificationResponse>('/kyc/create-verification', params || {});
}

/**
 * Get the status of a KYC verification session
 */
export async function getKYCStatus(
  verificationSessionId: string
): Promise<KYCVerificationStatusResponse> {
  return apiClient.get<KYCVerificationStatusResponse>(`/kyc/status/${verificationSessionId}`);
}

/**
 * Check if current user has completed KYC
 */
export async function checkUserKYCStatus(): Promise<{
  isVerified: boolean;
  status: KYCStatus;
  verifiedAt?: number;
}> {
  return apiClient.get<{
    isVerified: boolean;
    status: KYCStatus;
    verifiedAt?: number;
  }>('/kyc/user-status');
}



