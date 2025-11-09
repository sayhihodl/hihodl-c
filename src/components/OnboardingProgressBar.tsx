// src/components/OnboardingProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/theme/colors';

const ONBOARDING_STEPS = [
  'entry',
  'email',
  'username',
  'notifications',
  'security',
  'principalaccount',
] as const;

type Step = typeof ONBOARDING_STEPS[number];

const STEP_NAMES: Record<Step, string> = {
  entry: 'Account Setup',
  email: 'Email',
  username: 'Username',
  notifications: 'Notifications',
  security: 'Security',
  principalaccount: 'Wallet',
};

export function OnboardingProgressBar({ currentStep }: { currentStep: string }) {
  const currentIndex = ONBOARDING_STEPS.findIndex((step) => step === currentStep);
  
  // Si no está en la lista, no mostrar progreso
  if (currentIndex === -1) return null;
  
  const current = currentIndex + 1;
  const total = ONBOARDING_STEPS.length;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Step {current} of {total}
      </Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(current / total) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.cta,
    borderRadius: 2,
  },
});

