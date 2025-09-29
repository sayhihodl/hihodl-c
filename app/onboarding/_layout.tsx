// app/onboarding/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Asset } from 'expo-asset';

const IMAGES = [
  require('@assets/onboarding/onboarding-background-0.png'),
  require('@assets/onboarding/onboarding-1-adv.png'),
  require('@assets/onboarding/onboarding-2-adv.png'),
  require('@assets/onboarding/onboarding-3-adv.png'),
];

export default function OnboardingLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      try { await Promise.all(IMAGES.map((m) => Asset.fromModule(m).downloadAsync())); }
      finally { setReady(true); }
    })();
  }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#0F0F1A' }} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F1A' }, animation: 'fade' }} />
  );
}