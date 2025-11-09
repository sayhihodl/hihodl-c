// app/onboarding/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Asset } from 'expo-asset';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import colors from '@/theme/colors';

const IMAGES = [
  require('@assets/onboarding/onboarding-background-0.png'),
  require('@assets/onboarding/onboarding-1-adv.png'),
  require('@assets/onboarding/onboarding-2-adv.png'),
  require('@assets/onboarding/onboarding-3-adv.png'),
];

export default function OnboardingLayout() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    (async () => {
      try {
        const total = IMAGES.length;
        let loaded = 0;
        
        await Promise.all(
          IMAGES.map(async (m) => {
            await Asset.fromModule(m).downloadAsync();
            loaded++;
            setProgress(loaded / total);
          })
        );
      } finally {
        setReady(true);
      }
    })();
  }, []);
  
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <ActivityIndicator size="large" color={colors.cta} />
        <LoadingSkeleton width={200} height={4} borderRadius={2} />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: '#0F0F1A' }, 
        animation: 'fade',
        animationDuration: 150, // Más rápido: 150ms en lugar de 200ms
      }} 
    />
  );
}