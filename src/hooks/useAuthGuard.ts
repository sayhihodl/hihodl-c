// src/hooks/useAuthGuard.ts
// Hook to protect routes and handle authentication state
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/store/auth';

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function useAuthGuard() {
  const { isAuthenticated, ready } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth' || segments[0] === 'onboarding';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      // Redirect to login if not authenticated and not in auth/onboarding
      router.replace('/auth/login');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Redirect to dashboard if authenticated but in auth pages
      router.replace('/(drawer)/(tabs)/(home)');
    }
  }, [isAuthenticated, ready, segments]);
}

/**
 * Hook to check if user needs to complete onboarding
 */
export function useOnboardingGuard() {
  const { isAuthenticated, user, ready } = useAuth();

  useEffect(() => {
    if (!ready || !isAuthenticated || !user) return;

    // Check if user has completed onboarding
    // You can add metadata check here
    const hasCompletedOnboarding = user.user_metadata?.onboarding_completed;

    if (!hasCompletedOnboarding) {
      router.replace('/onboarding/entry');
    }
  }, [isAuthenticated, user, ready]);
}

