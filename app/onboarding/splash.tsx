// app/onboarding/splash.tsx
import React, { useEffect, useRef } from 'react';
import { View, Image, ImageBackground, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ⚙️ Toggle temporal (muévelo luego a '@/config/experiments' o env)
const USE_MPC = true;

// ✅ alias @assets (modo A)
const BG     = require('@assets/onboarding/onboarding-background-0.png');
const LOGO   = require('@assets/logos/HIHODL-white.png');
const SLOGAN = require('@assets/logos/dont-save-hodl.png');

const { height, width } = Dimensions.get('window');

export default function Splash() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const navigated = useRef(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;

    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // 🔀 Decide siguiente pantalla según el modo
      const next = USE_MPC ? '/onboarding/entry' : '/onboarding/welcome';

      // pequeño retraso para que se vea el fade
      t = setTimeout(() => {
        if (navigated.current) return;
        navigated.current = true;
        router.replace(next);
      }, 500);
    });

    return () => { if (t) clearTimeout(t); };
  }, [opacity]);

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

      {/* Contenido centrado */}
      <View style={styles.center}>
        <Animated.View style={{ opacity, alignItems: 'center' }}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Image source={SLOGAN} style={styles.slogan} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo:   { width: Math.min(width * 0.78, 420), height: height * 0.18, marginBottom: -30 },
  slogan: { width: Math.min(width * 0.65, 420), height: height * 0.06,  marginBottom: 180 },
});