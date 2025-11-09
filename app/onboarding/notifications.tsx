// app/onboarding/notifications.tsx
import { View, Image, StyleSheet, TouchableOpacity, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CTAButton } from '@/ui/CTAButton';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import { GlassCard } from '@/ui/Glass';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';

// ✅ Usa el alias correcto (@assets) y asegúrate de que el archivo exista en: src/assets/wallet-setup/wallet-setup-popup.png
const CARD = require('@assets/wallet-setup/wallet-setup-popup.png');


export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { saveProgress } = useOnboardingProgress();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // Más rápido: 300ms en lugar de 400ms
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7, // Más rápido
        tension: 50, // Más rápido
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goNext = async (skip = false) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!skip) {
      // Aquí podrías solicitar permisos de notificaciones
      // await Notifications.requestPermissionsAsync();
    }
    await saveProgress('notifications');
    router.replace('/onboarding/security');
  };

  return (
    <AppBackground>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Close and go back"
        >
          <T style={styles.closeTxt}>×</T>
        </Pressable>

        <OnboardingProgressBar currentStep="notifications" />
        <T kind="h1" style={styles.title}>Stay Updated</T>
        <T kind="body" style={styles.subtitle}>
          Turn on notifications to stay on top of your wallet. Get instant updates when you send, receive, or when prices move big.
        </T>

      <Animated.View 
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <GlassCard tone="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <Image source={CARD} style={styles.card} resizeMode="contain" />
        </GlassCard>
      </Animated.View>

      <View style={[styles.footerBtns, { paddingBottom: insets.bottom + 24 }]}>
        <CTAButton
          title="Turn on Notifications"
          onPress={() => goNext(false)}
          variant="primary"
          fullWidth={true}
          style={{ marginBottom: 12 }}
        />

        <CTAButton
          title="Skip"
          onPress={() => goNext(true)}
          variant="secondary"
          tone="dark"
          backdrop="glass"
          fullWidth={true}
        />
      </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  close: { 
    position: 'absolute', 
    left: 18, 
    top: 12, 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  closeTxt: { color: colors.textMuted, fontSize: 26, lineHeight: 26, fontWeight: '800' },
  title: { 
    color: colors.text, 
    fontSize: 28, 
    fontWeight: '900', 
    marginTop: 64,
    letterSpacing: -0.5,
  },
  subtitle: { 
    color: colors.textMuted, 
    fontSize: 16, 
    marginTop: 32,
    lineHeight: 24,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  card: { 
    width: '100%', 
    height: 240, 
    borderRadius: 20,
    maxWidth: 400,
  },
  footerBtns: { 
    position: 'absolute', 
    left: 24, 
    right: 24, 
    bottom: 24,
  },
});