// app/onboarding/pin-setup.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const PIN_KEY = 'hihodl_pin_v1'; // ✅ sin caracteres inválidos

export default function PinSetup() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Solo números y longitud 6–8
  const isOnlyDigits = /^\d+$/.test(pin || '');
  const canContinue = useMemo(
    () => isOnlyDigits && pin.length >= 6 && pin.length <= 8,
    [pin, isOnlyDigits]
  );

  const handleDigit = (d: string) => {
    setError(null);
    // Solo aceptamos 0–9 y máximo 8
    if (!/^\d$/.test(d)) return;
    setPin(prev => (prev.length < 8 ? prev + d : prev));
  };
  const handleBackspace = () => { setError(null); setPin(prev => prev.slice(0, -1)); };
  const handleClear = () => { setError(null); setPin(''); };

  const onContinue = async () => {
    if (submitting) return;

    // Validación común
    if (!/^\d{6,8}$/.test(pin)) {
      setError('El PIN debe tener 6–8 dígitos y solo números.');
      return;
    }

    setSubmitting(true);
    try {
      if (step === 'create') {
        setFirstPin(pin);
        setPin('');
        setStep('confirm');
        return;
      }

      // confirm
      if (pin !== firstPin) {
        setError("Los PIN no coinciden. Vuelve a intentarlo.");
        setTimeout(() => {
          setFirstPin('');
          setPin('');
          setStep('create');
          setSubmitting(false);
        }, 300);
        return;
      }

      // Guardado seguro (best-effort)
      try {
        await SecureStore.setItemAsync(PIN_KEY, pin, {
          keychainService: 'hihodl_pin',
        });
        // Opcional: también puedes usar requireAuthentication si quieres Face/TouchID en lectura
      } catch (e) {
        console.log('[pin-setup] PIN store failed (continuing anyway)', e);
      }

      // Navega a la cuenta principal
      router.replace('/onboarding/principalaccount');
    } finally {
      setSubmitting(false);
    }
  };

  const digits = Array.from({ length: 10 }, (_, i) => String((i + 1) % 10)); // 1..9,0

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>{step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}</Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Add a 6–8 digit PIN as a fallback in case Face/Touch ID is unavailable.'
            : 'Re-enter the same PIN to confirm.'}
        </Text>

        {/* bubbles */}
        <View style={styles.bubbles}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                i >= 6 && styles.dotFaint,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {/* keypad */}
      <View style={styles.pad}>
        {[0,1,2].map(r => (
          <View key={r} style={styles.row}>
            {digits.slice(r * 3, r * 3 + 3).map(n => (
              <Key key={n} label={n} onPress={() => handleDigit(n)} />
            ))}
          </View>
        ))}

        <View style={styles.row}>
          <Key label="⌫" onPress={handleBackspace} small />
          <Key label="0" onPress={() => handleDigit('0')} />
          <Key label="Clear" onPress={handleClear} small />
        </View>
      </View>

      <Pressable
        style={[
          styles.cta,
          canContinue && !submitting ? styles.ctaEnabled : styles.ctaDisabled
        ]}
        disabled={!canContinue || submitting}
        onPress={onContinue}
      >
        <Text style={[
          styles.ctaText,
          canContinue && !submitting ? styles.ctaTextDark : styles.ctaTextDisabled
        ]}>
          {step === 'create' ? 'Continue' : (submitting ? 'Saving…' : 'Confirm')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Key({ label, onPress, small = false }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.key, small && styles.keySmall]}>
      <Text style={[styles.keyText, small && styles.keyTextSmall]}>{label}</Text>
    </Pressable>
  );
}

const YELLOW = '#FFB703';
const BG = '#023047';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 20, gap: 16, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: 80, paddingHorizontal: 8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  subtitle: { color: '#CFE3EC', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  bubbles: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotFilled: { backgroundColor: '#fff' },
  dotFaint: { opacity: 0.5 },
  error: { color: '#FF6B6B', marginTop: 10, fontWeight: '700' },

  pad: { alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 14 },
  key: {
    width: 78, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  keySmall: { width: 78 },
  keyText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  keyTextSmall: { fontSize: 18, opacity: 0.9 },

  cta: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaEnabled: { backgroundColor: YELLOW },
  ctaDisabled: { backgroundColor: '#0F0F1A' },
  ctaText: { fontSize: 16, fontWeight: '900' },
  ctaTextDark: { color: '#0A1A24' },
  ctaTextDisabled: { color: '#7E93A3' },
});