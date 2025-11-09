// app/onboarding/splash.tsx
import React, { useEffect, useRef } from 'react';
import { View, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { analytics } from '@/utils/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚙️ Toggle temporal (muévelo luego a '@/config/experiments' o env)
const USE_MPC = true;

const ONBOARDING_START_KEY = 'hihodl_onboarding_start_time';

// ✅ alias @assets (modo A)
const BG = require('@assets/onboarding/onboarding-background-0.png');

export default function Splash() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const navigated = useRef(false);
  const { currentStep, isLoading } = useOnboardingProgress();

  useEffect(() => {
    if (isLoading) return; // Esperar a que cargue el progreso
    
    // Trackear inicio de onboarding si es la primera vez
    (async () => {
      const startTime = await AsyncStorage.getItem(ONBOARDING_START_KEY);
      if (!startTime) {
        await AsyncStorage.setItem(ONBOARDING_START_KEY, Date.now().toString());
        analytics.trackOnboardingStarted();
      }
    })();
    
    let t: ReturnType<typeof setTimeout> | null = null;

    Animated.timing(opacity, {
      toValue: 1,
      duration: 500, // Más rápido: 500ms en lugar de 800ms
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // 🔀 Decide siguiente pantalla según el modo y progreso guardado
      let next = USE_MPC ? '/onboarding/entry' : '/onboarding/welcome';
      
      // Si hay progreso guardado (y no es success), restaurar
      if (currentStep && currentStep !== 'splash' && currentStep !== 'success') {
        const stepMap: Record<string, string> = {
          'entry': '/onboarding/entry',
          'carousel': '/onboarding/carousel',
          'email': '/onboarding/email',
          'username': '/onboarding/username',
          'notifications': '/onboarding/notifications',
          'security': '/onboarding/security',
          'pin-setup': '/onboarding/pin-setup',
          // principalaccount ya no es parte del flujo - redirigir al dashboard si estaba guardado
          'principalaccount': '/(drawer)/(tabs)/(home)',
        };
        if (stepMap[currentStep]) {
          next = stepMap[currentStep];
        }
      }

      // Retraso mínimo optimizado - más rápido
      t = setTimeout(() => {
        if (navigated.current) return;
        navigated.current = true;
        router.replace(next as any);
      }, 150); // Reducido de 300ms a 150ms para transición más rápida
    });

    return () => { if (t) clearTimeout(t); };
  }, [opacity, isLoading, currentStep]);

  return (
    <View style={{ flex: 1 }}>
      {/* Translucent, sin backgroundColor → sin warnings */}
      <StatusBar style="light" translucent />

      {/* Fondo full-bleed */}
      <ImageBackground
        source={BG}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { top: -insets.top, bottom: -insets.bottom }]}
      />
    </View>
  );
}