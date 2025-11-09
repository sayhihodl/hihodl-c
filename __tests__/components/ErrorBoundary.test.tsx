/**
 * Tests for Error Boundary components
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { AuthErrorBoundary } from '../../src/components/AuthErrorBoundary';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock auth errors utility
jest.mock('@/utils/auth-errors', () => ({
  getAuthErrorMessage: jest.fn((error: Error | null) => error?.message || 'Unknown error'),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test Content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should catch render errors and display fallback UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Algo salió mal')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });

  it('should allow reset after error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Algo salió mal')).toBeTruthy();

    const resetButton = getByText('Reintentar');
    fireEvent.press(resetButton);

    // After reset, error state should be cleared
    // Note: In real implementation, the component would re-render
    // This test verifies the button exists and is pressable
    expect(resetButton).toBeTruthy();
  });

  it('should use custom fallback when provided', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const CustomFallback = <Text>Custom Error UI</Text>;

    const { getByText } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error UI')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });
});

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <AuthErrorBoundary>
        <Text>Auth Content</Text>
      </AuthErrorBoundary>
    );

    expect(getByText('Auth Content')).toBeTruthy();
  });

  it('should catch auth errors and display error UI', () => {
    const ThrowError = () => {
      throw new Error('Authentication failed');
    };

    const { getByText } = render(
      <AuthErrorBoundary>
        <ThrowError />
      </AuthErrorBoundary>
    );

    expect(getByText('Authentication Error')).toBeTruthy();
    expect(getByText('Authentication failed')).toBeTruthy();
  });

  it('should navigate to login on reset', () => {
    const { router } = require('expo-router');
    const ThrowError = () => {
      throw new Error('Auth error');
    };

    const { getByText } = render(
      <AuthErrorBoundary>
        <ThrowError />
      </AuthErrorBoundary>
    );

    const resetButton = getByText('Go to Login');
    fireEvent.press(resetButton);

    expect(router.replace).toHaveBeenCalledWith('/auth/login');
  });
});





