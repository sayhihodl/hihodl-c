// app/onboarding/principalaccount.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ImageBackground, Pressable,
  TextInput, Animated, Easing, KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CTAButton } from '@/ui/CTAButton';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import colors from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRINCIPAL_KEY } from '@/lib/walletsetup';

const BG = require('@assets/wallet-setup/wallet-setup-principal-account.png');

const OPTIONS = ['Daily', 'Savings', 'Social', 'Other'] as const;
type Opt = typeof OPTIONS[number];

export default function PrincipalAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProgress } = useOnboardingProgress();

  const [selected, setSelected] = useState<Opt | null>(null);
  const [customName, setCustomName] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 👈 guard

  const scales = useMemo(
    () => Object.fromEntries(OPTIONS.map(k => [k, new Animated.Value(1)])) as Record<Opt, Animated.Value>,
    []
  );

  const onPressIn = (k: Opt) => Animated.spring(scales[k], { toValue: 0.97, useNativeDriver: true, speed: 16 }).start();
  const onPressOut = (k: Opt) => Animated.spring(scales[k], { toValue: 1, useNativeDriver: true, speed: 16 }).start();

  const pick = (k: Opt) => {
    setSelected(k);
    if (k === 'Other') setTimeout(() => setSheetOpen(true), 100);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetOpen) { setSheetOpen(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [sheetOpen]);

  const sheetY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sheetY, {
      toValue: sheetOpen ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetOpen, sheetY]);

  const translateY = sheetY.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  const hasCustom = customName.trim().length >= 2;

  const continueFlow = async () => {
    if (submitting) return; // 👈 evita doble tap
    setSubmitting(true);

    try {
      // default a Daily si nada elegido
      let effective = selected ?? 'Daily';
      if (!selected) setSelected('Daily');

      // si Other sin nombre → abre sheet y no sigas
      if (effective === 'Other' && !hasCustom) {
        setSheetOpen(true);
        return;
      }

      // NO crear wallets aquí - se crearán cuando el usuario presione "Create Account" en el dashboard
      // Las wallets se crean solo cuando el usuario explícitamente lo solicita
      
      // Guardar solo la preferencia del usuario para cuando cree las cuentas
      // Esto se usará cuando el usuario presione "Create Account" en el dashboard
      const principalPreference = effective === 'Other' ? customName.trim() : effective;
      try {
        await AsyncStorage.setItem(PRINCIPAL_KEY, principalPreference);
        if (effective === 'Other') {
          // Guardar también el nombre personalizado para usar cuando se creen las wallets
          await AsyncStorage.setItem('HIHODL_CUSTOM_PRINCIPAL_NAME', customName.trim());
        }
      } catch (e) {
        console.log('Error saving principal preference:', e);
      }

      // Animación de éxito
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Guardar progreso
      await saveProgress('principalaccount');
      
      // navega a success sí o sí con delay para feedback
      setTimeout(() => {
        router.replace('/onboarding/success');
      }, 400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover" />

      {/* Cerrar */}
      <Pressable
        style={[styles.close, { top: 18 + insets.top }]}
        onPress={() => {
          try { (router as any)?.back(); } catch { router.replace('/auth/login'); }
        }}
        accessibilityLabel="Close"
      >
        <Text style={styles.closeTxt}>×</Text>
      </Pressable>

      {/* GRID */}
      <View style={[styles.grid, { paddingTop: 140 + insets.top }]}>
        <OnboardingProgressBar currentStep="principalaccount" />
        {OPTIONS.map(opt => {
          const active = selected === opt;
          return (
            <Animated.View key={opt} style={{ transform: [{ scale: scales[opt] }], width: '48%' }}>
              <Pressable
                onPressIn={() => onPressIn(opt)}
                onPressOut={() => onPressOut(opt)}
                onPress={() => pick(opt)}
                style={[styles.tile, active && styles.tileActive]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${opt} as principal account`}
                accessibilityHint="Choose this wallet as your main account"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tileTxt, active && styles.tileTxtActive]}>{opt}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* CTA */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <CTAButton
          title={submitting ? 'Continuing…' : 'Continue'}
          onPress={continueFlow}
          disabled={submitting}
          variant="primary"
          fullWidth={true}
        />
      </View>

      {/* SHEET Other */}
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: sheetOpen ? 1 : 0 }]}
          onPress={() => setSheetOpen(false)}
          pointerEvents={sheetOpen ? 'auto' : 'none'}
        />
        <Animated.View style={[styles.sheet, { paddingBottom: (insets.bottom || 12) + 16, transform: [{ translateY }] }]}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.sheetTitle}>Name your wallet</Text>
          <TextInput
            placeholder="Write here"
            placeholderTextColor="#CFE3EC"
            value={customName}
            onChangeText={setCustomName}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => hasCustom && setSheetOpen(false)}
            accessibilityLabel="Custom wallet name"
            accessibilityHint="Enter a custom name for your principal wallet"
          />
          <CTAButton
            title="Save"
            onPress={() => hasCustom && setSheetOpen(false)}
            disabled={!hasCustom}
            variant="primary"
            fullWidth={true}
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const TILE_H = 110;

const styles = StyleSheet.create({
  close: { position: 'absolute', left: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  closeTxt: { color: colors.textMuted, fontSize: 26, fontWeight: '800', lineHeight: 26 },

  grid: {
    position: 'absolute', left: 24, right: 24,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16,
  },
  tile: { 
    height: TILE_H, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tileActive: { backgroundColor: colors.cta, borderColor: colors.cta },
  tileTxt: { color: colors.textMuted, fontWeight: '800', fontSize: 18 },
  tileTxtActive: { color: colors.ctaTextOn },

  bottom: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.sheetBgSolid, padding: 20,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dividerOnDark,
  },
  handle: { width: 64, height: 5, borderRadius: 3, backgroundColor: colors.sheetHandle, marginBottom: 16 },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
  input: { 
    borderWidth: StyleSheet.hairlineWidth, 
    borderColor: colors.dividerOnDark, 
    color: colors.text, 
    borderRadius: 16, 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontSize: 16,
  },
});