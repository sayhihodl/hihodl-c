// src/components/BiometricPrompt.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import colors from '@/theme/colors';

type BiometricPromptProps = {
  promptMessage?: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  autoTrigger?: boolean;
  biometricType?: 'face' | 'fingerprint' | 'auto';
};

export function BiometricPrompt({
  promptMessage = 'Enable biometric security',
  onSuccess,
  onError,
  autoTrigger = true,
  biometricType = 'auto',
}: BiometricPromptProps) {
  const [status, setStatus] = React.useState<'idle' | 'checking' | 'authenticating' | 'success' | 'error'>('idle');
  const [biometricTypeDetected, setBiometricTypeDetected] = React.useState<'face' | 'fingerprint' | 'none'>('none');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;

  const checkBiometricAvailability = React.useCallback(async () => {
    setStatus('checking');
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setBiometricTypeDetected('none');
        setStatus('error');
        onError?.('Biometric authentication not available on this device');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setBiometricTypeDetected('none');
        setStatus('error');
        onError?.('No biometrics enrolled. Please set up Face ID or Touch ID in your device settings.');
        return;
      }

      // Detectar tipo
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricTypeDetected('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricTypeDetected('fingerprint');
      } else {
        setBiometricTypeDetected('none');
      }
      
      setStatus('idle');
    } catch (error) {
      setBiometricTypeDetected('none');
      setStatus('error');
      onError?.('Failed to check biometric availability');
    }
  }, [onError]);

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  useEffect(() => {
    if (autoTrigger && status === 'idle' && biometricTypeDetected !== 'none') {
      const timer = setTimeout(() => {
        triggerAuthentication();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, status, biometricTypeDetected, triggerAuthentication]);

  const startPulseAnimation = React.useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, scaleAnim]);

  const stopAnimations = React.useCallback(() => {
    pulseAnim.stopAnimation();
    scaleAnim.stopAnimation();
    
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de éxito
    Animated.sequence([
      Animated.timing(iconOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseAnim, scaleAnim, iconOpacity]);

  const triggerAuthentication = React.useCallback(async () => {
    if (biometricTypeDetected === 'none') {
      setStatus('error');
      onError?.('Biometric authentication not available');
      return;
    }

    setStatus('authenticating');
    startPulseAnimation();

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        setStatus('success');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        stopAnimations();
        
        // Pequeño delay para mostrar éxito
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else {
        setStatus('error');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        stopAnimations();
        
        // Si el usuario cancela, no es realmente un error
        if (result.error === 'user_cancel') {
          onError?.('Authentication cancelled');
        } else {
          onError?.('Authentication failed. Please try again.');
        }
        
        // Reset después de un momento para permitir reintentar
        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      stopAnimations();
      onError?.('Authentication error occurred. Please try again.');
      
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  }, [biometricTypeDetected, promptMessage, onSuccess, onError, startPulseAnimation, stopAnimations]);

  const getIconName = () => {
    if (biometricType === 'auto') {
      return biometricTypeDetected === 'face' ? 'scan-outline' : 'finger-print-outline';
    }
    return biometricType === 'face' ? 'scan-outline' : 'finger-print-outline';
  };

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const iconColor = status === 'success' 
    ? colors.cta 
    : status === 'error' 
    ? '#EF4444' 
    : colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: iconOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
          <Ionicons 
            name={status === 'success' ? 'checkmark-circle' : getIconName()} 
            size={64} 
            color={iconColor}
          />
        </Animated.View>
      </View>

      {status === 'authenticating' && (
        <Text style={styles.statusText}>
          {biometricTypeDetected === 'face' 
            ? 'Looking for Face ID...' 
            : 'Touch the sensor...'}
        </Text>
      )}
      
      {status === 'success' && (
        <Text style={[styles.statusText, { color: colors.cta }]}>
          ✓ Authentication successful
        </Text>
      )}
      
      {status === 'error' && (
        <>
          <Text style={[styles.statusText, { color: '#EF4444' }]}>
            Authentication failed. Please try again.
          </Text>
          <Pressable
            onPress={triggerAuthentication}
            style={styles.retryButton}
          >
            <Ionicons name="refresh" size={18} color={colors.cta} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cta,
    opacity: 0.3,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 191, 0, 0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 191, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: colors.cta,
    fontSize: 15,
    fontWeight: '700',
  },
});

