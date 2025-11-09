// app/(drawer)/(tabs)/(home)/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CTAButton } from '@/ui/CTAButton';
import { GlassCard } from '@/ui/Glass';
import colors from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { ACCOUNTS_ORDER } from '@/hooks/useAccount';

interface EmptyStateProps {
  onCreateAccount: () => void;
}

export default function EmptyState({ onCreateAccount }: EmptyStateProps) {
  const insets = useSafeAreaInsets();

  const handleCreateAccount = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCreateAccount();
  };

  const accountIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Daily: 'wallet-outline',
    Savings: 'trending-up-outline',
    Social: 'people-outline',
  };

  const accountDescriptions: Record<string, string> = {
    Daily: 'For everyday transactions and quick payments',
    Savings: 'Long-term holdings and savings goals',
    Social: 'Send and receive with friends',
  };

  const accountColors: Record<string, string> = {
    Daily: 'rgba(255, 183, 3, 0.15)',
    Savings: 'rgba(33, 150, 243, 0.15)',
    Social: 'rgba(156, 39, 176, 0.15)',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.iconWrapper}>
          <Ionicons name="wallet-outline" size={64} color={colors.cta} />
        </View>
        <Text style={styles.title}>Ready to get started?</Text>
        <Text style={styles.subtitle}>
          Create your accounts to start managing your crypto. You can choose Daily, Savings, or Social accounts.
        </Text>
      </View>

      {/* Preview Cards */}
      <View style={styles.previewContainer}>
        {ACCOUNTS_ORDER.map((account) => (
          <GlassCard key={account} tone="glass" style={styles.previewCard}>
            <View style={[styles.previewIconWrapper, { backgroundColor: accountColors[account] }]}>
              <Ionicons 
                name={accountIcons[account]} 
                size={24} 
                color={colors.cta} 
              />
            </View>
            <Text style={styles.previewTitle}>{account}</Text>
            <Text style={styles.previewDescription}>{accountDescriptions[account]}</Text>
          </GlassCard>
        ))}
      </View>

      {/* CTA Button */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 24 }]}>
        <CTAButton
          title="Create your first account"
          onPress={handleCreateAccount}
          variant="primary"
          fullWidth={true}
          leftIcon={<Ionicons name="add-circle-outline" size={20} color={colors.ctaTextOn} />}
          accessibilityLabel="Create your first account"
          accessibilityHint="Opens account creation screen"
        />
        <Pressable
          onPress={() => router.push('/(drawer)/(internal)/menu')}
          style={styles.skipButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.bg,
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },
  previewContainer: {
    gap: 16,
    marginBottom: 32,
  },
  previewCard: {
    padding: 20,
    marginBottom: 0,
  },
  previewIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaContainer: {
    marginTop: 'auto',
    gap: 16,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});

