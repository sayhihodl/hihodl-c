/**
 * LoadingState - Component for informative loading states
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/theme/colors';
import { createCombinedAnimation } from '@/utils/animations';

export type LoadingStateType = 'auth' | 'passkey' | 'vault' | 'recovery' | 'default';

interface LoadingStateProps {
  type?: LoadingStateType;
  message?: string;
  submessage?: string;
}

const LOADING_MESSAGES: Record<LoadingStateType, { message: string; submessage?: string; icon?: string }> = {
  auth: {
    message: 'Authenticating...',
    submessage: 'Please wait while we verify your credentials',
    icon: 'lock-closed',
  },
  passkey: {
    message: 'Using Passkey...',
    submessage: 'Complete authentication on your device',
    icon: 'finger-print',
  },
  vault: {
    message: 'Unlocking vault...',
    submessage: 'Securely decrypting your keys',
    icon: 'shield-checkmark',
  },
  recovery: {
    message: 'Processing recovery...',
    submessage: 'Verifying your recovery request',
    icon: 'mail',
  },
  default: {
    message: 'Loading...',
  },
};

export function LoadingState({ type = 'default', message, submessage }: LoadingStateProps) {
  const config = LOADING_MESSAGES[type];
  const displayMessage = message || config.message;
  const displaySubmessage = submessage || config.submessage;
  const { opacity, scale, animateIn } = createCombinedAnimation();

  useEffect(() => {
    animateIn().start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
      {config.icon && (
        <Ionicons name={config.icon as any} size={48} color={colors.primary} style={styles.icon} />
      )}
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <Text style={styles.message}>{displayMessage}</Text>
      {displaySubmessage && <Text style={styles.submessage}>{displaySubmessage}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.navBg,
  },
  icon: {
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    maxWidth: 300,
  },
});

