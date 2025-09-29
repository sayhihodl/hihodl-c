// app/onboarding/success.tsx
import React, { useEffect, useRef } from 'react';
import { ImageBackground, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/app.store';

const BG = require('@assets/wallet-setup/wallet-setup-username-B.png');
const YELLOW = '#FFB703';
const DARK = '#0A0F18';

const DASHBOARD_PATH = '/' as const;
const go = (to: string) => router.replace(to as unknown as Href);

export default function Success() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        useAppStore.getState().setOnboardingDone(true); // flag en zustand
        await AsyncStorage.setItem('onboarding.done', '1'); // por compatibilidad
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      } finally {
        timer.current = setTimeout(() => go(DASHBOARD_PATH), 200);
      }
    })();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.wrapper}>
        <Ionicons name="checkmark-circle" size={180} color={YELLOW} style={{ marginBottom: -8 }} />
        <Text style={styles.title}>Success!</Text>

        <View style={styles.textBlock}>
          <Text style={styles.p}>You have successfully protected your wallet.</Text>
          <Text style={styles.p}>Remember to keep your seed phrase safe, it{"'"}s your responsibility!</Text>
          <Text style={[styles.p, { marginTop: 18 }]}>
            HIHODL cannot recover your wallet if you lose it. You can find your seed phrase in{' '}
            <Text style={styles.bold}>Settings &gt; Security &amp; Privacy</Text>.
          </Text>
        </View>

        <Pressable style={styles.cta} onPress={() => go(DASHBOARD_PATH)}>
          <Text style={styles.ctaTxt}>Go to Dashboard</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: DARK },
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 2 },
  title: { color: YELLOW, fontSize: 36, fontWeight: '900', marginTop: 50, marginBottom: 86 },
  textBlock: { maxWidth: 320, marginBottom: 24 },
  p: { color: '#E5EEF3', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bold: { fontWeight: '800' },
  cta: { marginTop: 80, backgroundColor: YELLOW, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 80, alignSelf: 'stretch', maxWidth: 340 },
  ctaTxt: { color: '#0A1A24', fontSize: 16, fontWeight: '900', textAlign: 'center' },
});