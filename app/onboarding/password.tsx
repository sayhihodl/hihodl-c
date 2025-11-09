// arriba del archivo
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable,
  ImageBackground, Platform,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { router } from 'expo-router';
import { CTAButton } from '@/ui/CTAButton';
import colors from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';


// ✅ Fondo correcto para pantalla de PIN (ajusta si tu nombre de archivo es otro)
const BG = require('../../assets/wallet-setup/wallet-setup-password-1.png');

export default function Password() {
  const min = 6;
  const max = 8;

  // 'create' -> introducir PIN; 'confirm' -> confirmar PIN
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const inputRef = useRef<TextInputType>(null);

  const sanitize = (t: string) => t.replace(/\D/g, '').slice(0, max);

  const onChange = (t: string) => {
    setMismatch(false);
    setPin(sanitize(t));
  };

  const ok = pin.length >= min;
  const showCounter = pin.length > 0;

  const title = step === 'create' ? 'Set your PIN code' : 'Confirm your PIN code';
  const placeholder = step === 'create' ? `min. ${min} digits` : 'repeat your PIN';

  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    if (step === 'create') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      setMismatch(false);
      return;
    }
    // confirm
    if (pin === firstPin && pin.length >= min) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFailedAttempts(0);
      setLockoutUntil(null);
      // TODO: guarda el PIN de forma segura si hace falta (SecureStore)
      
      // Pequeño delay para feedback visual
      setTimeout(() => {
        router.replace('/onboarding/security');
      }, 200);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockoutDuration = Math.min(newAttempts * 10, 60) * 1000;
        setLockoutUntil(Date.now() + lockoutDuration);
      }
      
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMismatch(true);
    }
  };

  // Verificar bloqueo temporal con actualización en tiempo real
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < lockoutUntil) {
        const remaining = Math.ceil((lockoutUntil - now) / 1000);
        setLockoutRemaining(remaining);
        setMismatch(true);
      } else {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        setMismatch(false);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Auto-focus al montar y al cambiar de paso
  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) return; // No auto-focus si está bloqueado
    const tid = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(tid);
  }, [step, lockoutUntil]);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* X para volver */}
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeTxt}>×</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>

        <TextInput
          ref={inputRef}
          value={pin}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#CFE3EC"
          keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
          secureTextEntry
          style={styles.input}
          accessibilityLabel={step === 'create' ? 'Create PIN code' : 'Confirm PIN code'}
          accessibilityHint={step === 'create' 
            ? 'Enter a 6 to 8 digit PIN code' 
            : 'Re-enter the same PIN code to confirm'}
          accessibilityState={{ 
            invalid: mismatch || (lockoutRemaining > 0),
          }}
        />

        {/* Contador o error */}
        <View 
          style={{ minHeight: 32, marginTop: 6 }}
          accessibilityRole="status"
          accessibilityLiveRegion={mismatch ? "polite" : undefined}
        >
          {mismatch ? (
            <Text 
              style={styles.error}
              accessibilityLabel={
                lockoutRemaining > 0
                  ? `Too many failed attempts. Please wait ${lockoutRemaining} seconds.`
                  : `The PINs don't match. ${Math.max(0, 3 - failedAttempts)} attempts remaining.`
              }
            >
              {lockoutRemaining > 0
                ? `Too many failed attempts. Please wait ${lockoutRemaining} seconds.`
                : `The PINs don't match. ${Math.max(0, 3 - failedAttempts)} attempts remaining.`}
            </Text>
          ) : showCounter ? (
            <Text 
              style={styles.counter}
              accessibilityLabel={`${pin.length} of ${max} digits entered`}
            >
              {pin.length}/{max}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <CTAButton
          title={step === 'create' ? 'Continue' : 'Confirm'}
          onPress={handleContinue}
          disabled={!ok || lockoutRemaining > 0}
          variant="primary"
          fullWidth={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { 
    position: 'absolute', 
    top: 18, 
    left: 18, 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  closeTxt: { color: colors.textMuted, fontSize: 26, lineHeight: 26, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  title: { 
    color: colors.text, 
    fontSize: 28, 
    fontWeight: '900', 
    marginBottom: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  input: {
    width: '100%', 
    maxWidth: 400,
    borderWidth: StyleSheet.hairlineWidth, 
    borderColor: colors.dividerOnDark,
    color: colors.text, 
    borderRadius: 16, 
    padding: 18, 
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', 
    letterSpacing: 6,
    fontSize: 20,
    fontWeight: '600',
  },
  counter: { textAlign: 'center', color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  error: { 
    textAlign: 'center', 
    color: '#EF4444', 
    fontWeight: '800',
    fontSize: 14,
  },

  bottom: { position: 'absolute', left: 24, right: 24 },
});