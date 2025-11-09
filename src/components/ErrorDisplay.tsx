/**
 * ErrorDisplay - Enhanced visual error display component
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/theme/colors';
import { getAuthErrorMessage, normalizeAuthError } from '@/utils/auth-errors';
import { createSlideAnimation } from '@/utils/animations';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  error: Error | unknown;
  title?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({
  error,
  title,
  severity = 'error',
  onRetry,
  onDismiss,
  showDetails = false,
}: ErrorDisplayProps) {
  const normalized = normalizeAuthError(error);
  const message = getAuthErrorMessage(error);
  const { translateY, slideIn } = createSlideAnimation(-20);

  useEffect(() => {
    slideIn(300).start();
  }, []);

  const config = {
    error: { icon: 'alert-circle', color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
    warning: { icon: 'warning', color: '#FFB703', bg: 'rgba(255, 183, 3, 0.1)' },
    info: { icon: 'information-circle', color: '#4ECDC4', bg: 'rgba(78, 205, 196, 0.1)' },
  }[severity];

  return (
    <Animated.View style={[styles.container, { backgroundColor: config.bg, transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <Ionicons name={config.icon as any} size={24} color={config.color} style={styles.icon} />
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, { color: config.color }]}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
          {showDetails && normalized.message && (
            <Text style={styles.details}>{normalized.message}</Text>
          )}
        </View>
      </View>
      {(onRetry || onDismiss) && (
        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={onRetry}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={[styles.button, styles.dismissButton]} onPress={onDismiss}>
              <Text style={[styles.buttonText, { color: colors.textDim }]}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  details: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  dismissButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
});

