/**
 * Tests for authentication guard hooks
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuthGuard, useOnboardingGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/store/auth';
import { router, useSegments } from 'expo-router';

// Mock dependencies
jest.mock('@/store/auth');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
  useSegments: jest.fn(() => ['home']),
}));

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      ready: true,
    });

    renderHook(() => useAuthGuard());

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('should redirect to home when authenticated but in auth pages', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      ready: true,
    });
    (useSegments as jest.Mock).mockReturnValue(['auth']);

    renderHook(() => useAuthGuard());

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/home');
    });
  });

  it('should not redirect when in onboarding', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      ready: true,
    });
    (useSegments as jest.Mock).mockReturnValue(['onboarding']);

    renderHook(() => useAuthGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when auth is not ready', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      ready: false,
    });

    renderHook(() => useAuthGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when authenticated and in protected routes', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      ready: true,
    });
    (useSegments as jest.Mock).mockReturnValue(['home']);

    renderHook(() => useAuthGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('useOnboardingGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to onboarding when not completed', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      ready: true,
      user: {
        id: 'user-123',
        user_metadata: { onboarding_completed: false },
      },
    });

    renderHook(() => useOnboardingGuard());

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/onboarding/entry');
    });
  });

  it('should not redirect when onboarding is completed', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      ready: true,
      user: {
        id: 'user-123',
        user_metadata: { onboarding_completed: true },
      },
    });

    renderHook(() => useOnboardingGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      ready: true,
      user: null,
    });

    renderHook(() => useOnboardingGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when auth is not ready', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      ready: false,
      user: null,
    });

    renderHook(() => useOnboardingGuard());

    expect(router.replace).not.toHaveBeenCalled();
  });
});






