// src/components/KYCVerification.tsx
// KYC Verification Component using Stripe Identity
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import T from '@/ui/T';
import colors from '@/theme/colors';
import { createKYCVerification, getKYCStatus, type KYCStatus } from '@/services/api/kyc.service';

type KYCVerificationProps = {
  visible: boolean;
  onClose: () => void;
  onComplete: (status: KYCStatus) => void;
  requiredFor?: 'pix' | 'mercado_pago' | 'subscription';
};

export function KYCVerification({
  visible,
  onClose,
  onComplete,
  requiredFor = 'pix',
}: KYCVerificationProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<KYCStatus>('not_started');

  // Get payment method name
  const paymentMethodName =
    requiredFor === 'pix' ? 'PIX' : requiredFor === 'mercado_pago' ? 'Mercado Pago' : 'subscriptions';

  // Initialize verification session
  useEffect(() => {
    if (visible && !verificationUrl) {
      initializeVerification();
    }
  }, [visible]);

  const initializeVerification = async () => {
    try {
      setLoading(true);
      const response = await createKYCVerification({
        type: 'document', // Verify identity document
      });

      setVerificationSessionId(response.verificationSessionId);
      setVerificationUrl(response.url);
      setStatus('pending');
    } catch (error: any) {
      console.error('Failed to create KYC verification:', error);
      Alert.alert(
        'Verification Error',
        error.message || 'Failed to start identity verification. Please try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!verificationSessionId) return;

    try {
      const statusResponse = await getKYCStatus(verificationSessionId);
      setStatus(statusResponse.status);

      if (statusResponse.status === 'verified') {
        Alert.alert(
          'Verification Complete',
          'Your identity has been successfully verified. You can now use ' + paymentMethodName + ' payments.',
          [
            {
              text: 'OK',
              onPress: () => {
                onComplete('verified');
                onClose();
              },
            },
          ]
        );
      } else if (statusResponse.status === 'failed') {
        Alert.alert(
          'Verification Failed',
          statusResponse.error || 'Identity verification failed. Please try again.',
          [{ text: 'OK', onPress: onClose }]
        );
        onComplete('failed');
      }
    } catch (error: any) {
      console.error('Failed to check verification status:', error);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    // Check if user completed verification (Stripe redirects to return URL)
    if (navState.url.includes('verification_complete') || navState.url.includes('success')) {
      // Poll for status update
      setTimeout(() => {
        checkVerificationStatus();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (status === 'pending') {
      Alert.alert(
        'Verification In Progress',
        'Are you sure you want to close? Your verification will be saved and you can complete it later.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close',
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.35)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <T kind="h3" style={styles.title}>Identity Verification</T>
              <T kind="caption" style={styles.subtitle}>
                Required for {paymentMethodName} payments
              </T>
            </View>
          </View>
        </LinearGradient>

        {/* WebView or Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cta} />
            <T kind="body" style={styles.loadingText}>
              Preparing verification...
            </T>
          </View>
        ) : verificationUrl ? (
          <WebView
            source={{ uri: verificationUrl }}
            style={styles.webview}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.cta} />
              </View>
            )}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <T kind="h3" style={styles.errorTitle}>Failed to Load</T>
            <T kind="body" style={styles.errorText}>
              Unable to start verification. Please try again.
            </T>
          </View>
        )}

        {/* Info Footer */}
        <View style={styles.footer}>
          <T kind="caption" style={styles.footerText}>
            🔒 Your data is securely processed by Stripe. We don't store your documents.
          </T>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dividerOnDark,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  errorText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dividerOnDark,
    backgroundColor: 'rgba(13, 24, 32, 0.5)',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});



