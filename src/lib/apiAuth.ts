// src/lib/apiAuth.ts
// API authentication helpers using Supabase
import { useAuth } from '@/store/auth';
import { useSessionStore } from '@/store/session';

/**
 * Get authentication headers for API requests
 * Uses Supabase session token (preferred) or legacy session
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Try Supabase session first (new system)
  try {
    const { session } = useAuth();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    // useAuth might not be available in non-React context
  }

  // Fallback to legacy session store
  const legacySession = useSessionStore.getState().getSessionUnsafe();
  if (legacySession?.idToken) {
    headers['Authorization'] = `Bearer ${legacySession.idToken}`;
  }

  return headers;
}

/**
 * Get auth headers asynchronously (for use outside React components)
 */
export async function getAuthHeadersAsync(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    // Try Supabase session first
    const { useAuthStore } = await import('@/store/auth');
    const { session } = useAuthStore.getState();
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    // Fall through to legacy
  }

  // Fallback to legacy session
  const legacySession = useSessionStore.getState().getSessionUnsafe();
  if (legacySession?.idToken) {
    headers['Authorization'] = `Bearer ${legacySession.idToken}`;
  }

  return headers;
}


