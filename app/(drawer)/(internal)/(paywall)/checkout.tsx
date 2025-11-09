// app/(drawer)/(internal)/(paywall)/checkout.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CTAButton } from '@/ui/CTAButton';
import { GlassCard } from '@/ui/Glass';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';
import { PLANS, PERKS, type Plan } from './plans';
import { createSubscription, activatePlan } from '@/services/api/plans.service';
import { useUser } from '@/hooks/useUser';

type KYCData = {
  fullName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  idDocument?: string; // Opcional, según regulaciones
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { user, refresh: refetchUser } = useUser();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // KYC Data
  const [kycData, setKycData] = useState<KYCData>({
    fullName: user?.profile?.fullName || '',
    address: '',
    city: '',
    country: user?.profile?.country || '',
    postalCode: '',
    idDocument: '',
  });

  // Load plan data
  useEffect(() => {
    if (planId) {
      const foundPlan = PLANS.find(p => p.id === planId);
      if (foundPlan) {
        setPlan(foundPlan);
      } else {
        Alert.alert('Error', 'Plan not found');
        router.back();
      }
    }
  }, [planId]);

  const isPaidPlan = plan && plan.priceMonthlyEUR > 0;
  const requiresKYC = isPaidPlan; // KYC required for paid plans

  const isKYCComplete = requiresKYC
    ? kycData.fullName.trim().length > 0 &&
      kycData.address.trim().length > 0 &&
      kycData.city.trim().length > 0 &&
      kycData.country.trim().length > 0 &&
      kycData.postalCode.trim().length > 0
    : true;

  const handleSubmit = async () => {
    if (!plan) return;
    
    if (requiresKYC && !isKYCComplete) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // First, create the subscription
      const subscription = await createSubscription({
        planId: plan.id,
        kycData: requiresKYC ? {
          fullName: kycData.fullName,
          address: kycData.address,
          city: kycData.city,
          country: kycData.country,
          postalCode: kycData.postalCode,
          idDocument: kycData.idDocument || undefined,
        } : undefined,
      });

      // Then activate the plan
      await activatePlan({ planId: plan.id });
      
      // Refetch user to get updated plan
      refetchUser();
      
      // Show success
      Alert.alert(
        'Subscription Activated',
        `You've successfully subscribed to ${plan.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(drawer)/(tabs)/(home)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      if (error.status === 402) {
        // Payment Required - redirect to payment screen or show payment info
        Alert.alert(
          'Payment Required',
          'Please complete payment to activate your subscription. Our team will contact you shortly.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to activate subscription. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!plan) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cta} />
            <T kind="body" style={styles.loadingText}>Loading plan details...</T>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const theme = plan.id === 'premium'
    ? { gradient: ['#E6EEF5', '#9FB3BF', '#4B5A67'] }
    : plan.id === 'plus'
    ? { gradient: ['rgba(34,193,195,1)', 'rgba(253,187,45,1)'] }
    : { solid: 'rgba(27,45,54,0.85)' };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Handle Bar for Bottom Sheet Modal */}
        <View style={[styles.handleBarContainer, { paddingTop: insets.top + 8 }]}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <T kind="h2" style={styles.title}>Subscription Summary</T>
          {/* Plan Summary Card */}
          <GlassCard tone="panel" style={styles.planCard}>
            {theme.gradient ? (
              <LinearGradient
                colors={theme.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planHeader}
              >
                <T kind="h1" style={styles.planName}>{plan.name}</T>
                <T kind="h3" style={styles.planPrice}>
                  {plan.priceMonthlyEUR === 0
                    ? 'Free'
                    : `€${plan.priceMonthlyEUR.toFixed(2)}/month`}
                </T>
              </LinearGradient>
            ) : (
              <View style={[styles.planHeader, { backgroundColor: theme.solid }]}>
                <T kind="h1" style={styles.planName}>{plan.name}</T>
                <T kind="h3" style={styles.planPrice}>Free</T>
              </View>
            )}

            <View style={styles.planFeatures}>
              <T kind="bodyStrong" style={styles.featuresTitle}>What's included:</T>
              {plan.perks.slice(0, 5).map((perkKey) => {
                const perk = PERKS[perkKey];
                if (!perk) return null;
                return (
                  <View key={perk.key} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.cta} />
                    <T kind="body" style={styles.featureText}>
                      {perk.label}
                      {perk.note && (
                        <T kind="caption" style={styles.featureNote}>
                          {' '}({perk.note})
                        </T>
                      )}
                    </T>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* KYC Form (only for paid plans) */}
          {requiresKYC && (
            <View style={styles.kycCard}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.35)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kycCardGradient}
              >
                <View style={styles.sectionHeader}>
                  <T kind="h3" style={styles.sectionTitle}>Verification Required</T>
                  <T kind="caption" style={styles.sectionSubtitle}>
                    For paid subscriptions, we need to verify your identity to comply with regulations.
                  </T>
                </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <T kind="caption" style={styles.label}>Full Name *</T>
                  <TextInput
                    value={kycData.fullName}
                    onChangeText={(text) => setKycData({ ...kycData, fullName: text })}
                    placeholder="John Doe"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <T kind="caption" style={styles.label}>Address *</T>
                  <TextInput
                    value={kycData.address}
                    onChangeText={(text) => setKycData({ ...kycData, address: text })}
                    placeholder="Street address"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <T kind="caption" style={styles.label}>City *</T>
                    <TextInput
                      value={kycData.city}
                      onChangeText={(text) => setKycData({ ...kycData, city: text })}
                      placeholder="City"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <T kind="caption" style={styles.label}>Postal Code *</T>
                    <TextInput
                      value={kycData.postalCode}
                      onChangeText={(text) => setKycData({ ...kycData, postalCode: text })}
                      placeholder="12345"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      keyboardType="default"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <T kind="caption" style={styles.label}>Country *</T>
                  <TextInput
                    value={kycData.country}
                    onChangeText={(text) => setKycData({ ...kycData, country: text })}
                    placeholder="Country"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <T kind="caption" style={styles.label}>
                    ID Document (Optional)
                  </T>
                  <TextInput
                    value={kycData.idDocument}
                    onChangeText={(text) => setKycData({ ...kycData, idDocument: text })}
                    placeholder="Passport, ID number, etc."
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                  <T kind="caption" style={styles.hint}>
                    May be required for certain jurisdictions
                  </T>
                </View>
              </View>
              </LinearGradient>
            </View>
          )}

          {/* Payment Information */}
          {isPaidPlan && (
            <View style={styles.paymentCard}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.35)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.paymentCardGradient}
              >
                <T kind="h3" style={styles.paymentSectionTitle}>Payment Information</T>
                <T kind="body" style={styles.paymentText}>
                  Since we handle payments internally, our team will contact you shortly after
                  subscription activation to complete the payment process.
                </T>
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentRow}>
                    <T kind="body" style={styles.paymentLabel}>Plan:</T>
                    <T kind="bodyStrong" style={styles.paymentValue}>{plan.name}</T>
                  </View>
                  <View style={styles.paymentRow}>
                    <T kind="body" style={styles.paymentLabel}>Price:</T>
                    <T kind="bodyStrong" style={styles.paymentValue}>
                      €{plan.priceMonthlyEUR.toFixed(2)}/month
                    </T>
                  </View>
                  <View style={styles.paymentRow}>
                    <T kind="body" style={styles.paymentLabel}>Billing:</T>
                    <T kind="bodyStrong" style={styles.paymentValue}>Monthly</T>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <T kind="caption" style={styles.termsText}>
              By confirming, you agree to our Terms of Service and Privacy Policy.
              Your subscription will be activated immediately upon confirmation.
            </T>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <CTAButton
            title={submitting ? 'Processing...' : `Confirm ${plan.name} Subscription`}
            onPress={handleSubmit}
            disabled={!isKYCComplete || submitting}
            variant="primary"
            fullWidth={true}
            style={styles.confirmButton}
          />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  handleBarContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  planCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  planHeader: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    color: '#0A1420',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  planPrice: {
    color: '#0A1420',
    fontSize: 18,
    fontWeight: '800',
    opacity: 0.9,
  },
  planFeatures: {
    padding: 28,
  },
  featuresTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featureText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  featureNote: {
    color: colors.textMuted,
    fontSize: 12,
  },
  kycCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  kycCardGradient: {
    padding: 32,
  },
  sectionHeader: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dividerOnDark,
    backgroundColor: 'rgba(3, 12, 16, 0.35)',
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
  },
  paymentCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  paymentCardGradient: {
    padding: 28,
  },
  paymentSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  paymentText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  paymentDetails: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  paymentValue: {
    color: colors.text,
    fontSize: 14,
  },
  termsContainer: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  termsText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: 'rgba(13, 24, 32, 0.95)',
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmButton: {
    height: 52,
    borderRadius: 16,
  },
});

