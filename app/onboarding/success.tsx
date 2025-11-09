// app/onboarding/success.tsx
import React, { useEffect, useRef } from 'react';
import { ImageBackground, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/app.store';
import { CTAButton } from '@/ui/CTAButton';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import colors from '@/theme/colors';
import { analytics } from '@/utils/analytics';

const ONBOARDING_START_KEY = 'hihodl_onboarding_start_time';

const BG = require('@assets/wallet-setup/wallet-setup-username-B.png');
const YELLOW = colors.cta;
const DARK = colors.bg;

const DASHBOARD_PATH = '/' as const;
const go = (to: string) => router.replace(to as unknown as Href);

export default function Success() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = React.useState(true);

  useEffect(() => {
    (async () => {
      try {
        useAppStore.getState().setOnboardingDone(true); // flag en zustand
        await AsyncStorage.setItem('onboarding.done', '1'); // por compatibilidad
        
        // Limpiar progreso guardado
        await AsyncStorage.removeItem('hihodl_onboarding_progress');
        
        // Calcular tiempo de onboarding
        const startTimeStr = await AsyncStorage.getItem(ONBOARDING_START_KEY);
        if (startTimeStr) {
          const startTime = parseInt(startTimeStr, 10);
          const durationSeconds = (Date.now() - startTime) / 1000;
          
          // Trackear tiempo de onboarding
          analytics.trackOnboardingTime(durationSeconds);
          
          // Limpiar timestamp
          await AsyncStorage.removeItem(ONBOARDING_START_KEY);
        }
        
        // Trackear onboarding completado
        analytics.trackEvent({
          name: "onboarding_completed",
          parameters: { timestamp: Date.now() },
        });
        
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      } finally {
        // Delay optimizado - mostrar animación brevemente
        timer.current = setTimeout(() => {
          setShowSuccessAnimation(false);
          setTimeout(() => go(DASHBOARD_PATH), 150);
        }, 600); // Reducido de 800ms a 600ms para transición más rápida
      }
    })();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View 
        style={styles.wrapper}
        accessibilityRole="region"
        accessibilityLabel="Onboarding completed successfully"
      >
        {showSuccessAnimation ? (
          <SuccessAnimation 
            size={180} 
            color={YELLOW}
            onAnimationEnd={() => {
              // La animación ya terminó, mantenemos el delay
            }}
          />
        ) : (
          <Ionicons 
            name="checkmark-circle" 
            size={180} 
            color={YELLOW} 
            style={{ marginBottom: -8 }}
            accessibilityLabel="Success checkmark"
          />
        )}
        <Text style={styles.title} accessibilityRole="header">Success!</Text>

        <View style={styles.textBlock}>
          <Text style={styles.p}>You have successfully protected your wallet.</Text>
          <Text style={styles.p}>Remember to keep your seed phrase safe, it{"'"}s your responsibility!</Text>
          <Text style={[styles.p, { marginTop: 18 }]}>
            HIHODL cannot recover your wallet if you lose it. You can find your seed phrase in{' '}
            <Text style={styles.bold}>Settings &gt; Security &amp; Privacy</Text>.
          </Text>
        </View>

        <CTAButton
          title="Go to Dashboard"
          onPress={() => go(DASHBOARD_PATH)}
          variant="primary"
          fullWidth={true}
          style={{ maxWidth: 340, alignSelf: 'center' }}
          accessibilityLabel="Go to dashboard"
          accessibilityHint="Navigates to the main app dashboard"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: DARK },
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 4 },
  title: { color: YELLOW, fontSize: 40, fontWeight: '900', marginTop: 40, marginBottom: 80, letterSpacing: -0.8 },
  textBlock: { maxWidth: 340, marginBottom: 32 },
  p: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  bold: { fontWeight: '800', color: colors.text },
});