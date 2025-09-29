// app/onboarding/principalaccount.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ImageBackground, Pressable,
  TextInput, Animated, Easing, KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import * as W from '@/lib/walletsetup';
const { renameDailyLabel, setPrincipalByLabel } = W as {
  renameDailyLabel: (label: string) => Promise<void>;
  setPrincipalByLabel: (label: string) => Promise<void>;
};

const BG = require('@assets/wallet-setup/wallet-setup-principal-account.png');

const OPTIONS = ['Daily', 'Savings', 'Social', 'Other'] as const;
type Opt = typeof OPTIONS[number];

async function ensureWallets() {
  try {
    if (typeof (W as any).ensureDefaultWallets === 'function') {
      await (W as any).ensureDefaultWallets(); return;
    }
    if (typeof (W as any).initDefaultWallets === 'function') {
      await (W as any).initDefaultWallets(); return;
    }
    if (typeof (W as any).getWalletsMeta === 'function') {
      const meta = await (W as any).getWalletsMeta();
      const labels: string[] = Array.isArray(meta?.labels) ? meta.labels : [];
      const needDaily = !labels.includes('Daily');
      const needSavings = !labels.includes('Savings');
      const needSocial = !labels.includes('Social');
      if ((needDaily || needSavings || needSocial) && typeof (W as any).createDefaultWallets === 'function') {
        await (W as any).createDefaultWallets();
      }
    }
  } catch {}
}

export default function PrincipalAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

      // preparar wallets (best-effort)
      await ensureWallets();

      // aplicar principal
      if (effective === 'Other') {
        const newLabel = customName.trim();
        try { await renameDailyLabel(newLabel); } catch (e) { console.log('renameDailyLabel err', e); }
        try { await setPrincipalByLabel(newLabel); } catch (e) { console.log('setPrincipalByLabel err', e); }
      } else {
        try { await setPrincipalByLabel(effective); } catch (e) { console.log('setPrincipalByLabel err', e); }
      }

      // navega a success sí o sí
      router.replace('/onboarding/success');
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
      <View style={[styles.grid, { paddingTop: 160 + insets.top }]}>
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
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tileTxt, active && styles.tileTxtActive]}>{opt}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* CTA */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={continueFlow}
          disabled={submitting}
          style={[styles.btn, submitting ? styles.btnDisabled : styles.btnPrimary]}
        >
          <Text style={[styles.btnText, { color: '#0A1A24' }]}>{submitting ? 'Continuing…' : 'Continue'}</Text>
        </TouchableOpacity>
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
          />
          <TouchableOpacity
            onPress={() => hasCustom && setSheetOpen(false)}
            style={[styles.sheetBtn, hasCustom ? styles.btnPrimary : styles.btnDisabled]}
            disabled={!hasCustom}
          >
            <Text style={[styles.btnText, { color: '#0A1A24' }]}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const TILE_H = 110;

const styles = StyleSheet.create({
  close: { position: 'absolute', right: 18, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeTxt: { color: '#CFE3EC', fontSize: 24, fontWeight: '700', lineHeight: 24 },

  grid: {
    position: 'absolute', left: 24, right: 24,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16,
  },
  tile: { height: TILE_H, borderRadius: 20, backgroundColor: '#2D2F36', alignItems: 'center', justifyContent: 'center' },
  tileActive: { backgroundColor: '#FFB703' },
  tileTxt: { color: '#E5E7EB', fontWeight: '800', fontSize: 18 },
  tileTxtActive: { color: '#0A1A24' },

  bottom: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  btn: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#FFB703' },
  btnDisabled: { backgroundColor: '#374151' },
  btnText: { fontWeight: '800', fontSize: 18 },

  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B2E3B', padding: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  handle: { width: 64, height: 5, borderRadius: 3, backgroundColor: '#CFE3EC' },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CFE3EC', color: '#fff', borderRadius: 12, padding: 12, backgroundColor: 'transparent' },
  sheetBtn: { marginTop: 12, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});