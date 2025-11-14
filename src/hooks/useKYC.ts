// src/hooks/useKYC.ts
// Hook to manage KYC verification status
import { useState, useEffect, useCallback } from 'react';
import { checkUserKYCStatus, type KYCStatus } from '@/services/api/kyc.service';

export function useKYC() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [status, setStatus] = useState<KYCStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await checkUserKYCStatus();
      setIsVerified(response.isVerified);
      setStatus(response.status);
    } catch (err: any) {
      console.error('Failed to check KYC status:', err);
      setError(err.message || 'Failed to check verification status');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isVerified,
    status,
    loading,
    error,
    refresh: checkStatus,
  };
}



