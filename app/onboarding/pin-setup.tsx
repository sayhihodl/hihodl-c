// app/onboarding/pin-setup.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { CTAButton } from '@/ui/CTAButton';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { setPin, enableLock } from '@/lib/lock';
import { hasPin as hasPinSecure } from '@/lib/pin';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const PIN_KEY = 'hihodl_pin_v1'; // ✅ sin caracteres inválidos

export default function PinSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProgress } = useOnboardingProgress();

  // Verificar si ya existe un PIN al montar el componente
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pinExists = await hasPinSecure();
        if (pinExists && mounted) {
          // Si ya hay un PIN, guardar progreso y saltar al dashboard
          await saveProgress('pin-setup');
          router.replace('/(drawer)/(tabs)/(home)');
        }
      } catch (error) {
        console.error('[pin-setup] Error checking existing PIN:', error);
        // Si hay error, continuar con el flujo normal
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, saveProgress]);

  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // PINs comunes y débiles
  const WEAK_PINS = [
    '123456', '1234567', '12345678',
    '000000', '0000000', '00000000',
    '111111', '1111111', '11111111',
    '222222', '2222222', '22222222',
    '123123', '123321', '654321',
    '012345', '0123456', '01234567',
    '098765', '0987654', '09876543',
    '112233', '223344', '334455',
  ];

  // Solo números y longitud 6–8
  const isOnlyDigits = /^\d+$/.test(pin || '');
  const canContinue = useMemo(
    () => isOnlyDigits && pin.length >= 6 && pin.length <= 8,
    [pin, isOnlyDigits]
  );

  // Validación de PIN débil
  const checkWeakPin = (pinValue: string): string | null => {
    if (pinValue.length < 6) return null;
    
    // Verificar PINs comunes
    if (WEAK_PINS.includes(pinValue)) {
      return 'This PIN is too common. Please choose a stronger PIN.';
    }
    
    // Verificar secuencias
    if (/^(\d)\1{5,7}$/.test(pinValue)) {
      return 'PINs with repeated digits are not secure.';
    }
    
    // Verificar secuencias ascendentes/descendentes
    let isSequence = true;
    for (let i = 1; i < pinValue.length; i++) {
      const diff = parseInt(pinValue[i]) - parseInt(pinValue[i - 1]);
      if (diff !== 1 && diff !== -1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence && pinValue.length >= 4) {
      return 'Sequential PINs are easy to guess. Try a random combination.';
    }
    
    return null;
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
        setError(`Too many failed attempts. Please wait ${remaining} seconds.`);
      } else {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        setError(null);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const bubbleAnimations = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Animación cuando se llena un dígito
    if (pin.length > 0 && pin.length <= 8) {
      const idx = pin.length - 1;
      Animated.sequence([
        Animated.timing(bubbleAnimations[idx], {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleAnimations[idx], {
          toValue: 1,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [pin]);

  const handleDigit = (d: string) => {
    setError(null);
    setWarning(null);
    // Solo aceptamos 0–9 y máximo 8
    if (!/^\d$/.test(d)) return;
    setPin(prev => {
      const next = prev.length < 8 ? prev + d : prev;
      // Validar PIN débil solo cuando está completo
      if (next.length >= 6 && step === 'create') {
        const weakWarning = checkWeakPin(next);
        setWarning(weakWarning);
      }
      return next;
    });
  };
  const handleBackspace = () => { 
    setError(null); 
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin(prev => prev.slice(0, -1)); 
  };
  const handleClear = () => { 
    setError(null); 
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPin(''); 
  };

  const onContinue = async () => {
    if (submitting) return;

    // Validación común
    if (!/^\d{6,8}$/.test(pin)) {
      setError('PIN must be 6–8 digits and numbers only.');
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
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          const lockoutDuration = Math.min(newAttempts * 10, 60) * 1000; // 10s, 20s, 30s... hasta 60s
          setLockoutUntil(Date.now() + lockoutDuration);
          setError(`PINs don't match. Too many failed attempts. Please wait ${lockoutDuration / 1000} seconds.`);
        } else {
          setError(`PINs don't match. ${3 - newAttempts} attempts remaining.`);
        }
        
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setFirstPin('');
          setPin('');
          setStep('create');
          setSubmitting(false);
        }, 300);
        return;
      }
      
      // Reset intentos en éxito
      setFailedAttempts(0);
      setLockoutUntil(null);

      // Guardado seguro del PIN y habilitar lock
      try {
        await setPin(pin); // Usa la función segura de lock.ts que hace hash del PIN
        await enableLock(); // Habilita el lock para que se muestre en próximos inicios
      } catch (e) {
        console.log('[pin-setup] PIN setup failed (continuing anyway)', e);
      }

      // Guardar progreso del onboarding
      await saveProgress('pin-setup');

      // Animación de éxito antes de navegar
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Navega al siguiente paso del onboarding (principalaccount o dashboard)
      setTimeout(() => {
        router.replace('/(drawer)/(tabs)/(home)');
      }, 300);
    } finally {
      setSubmitting(false);
    }
  };

  const digits = Array.from({ length: 10 }, (_, i) => String((i + 1) % 10)); // 1..9,0

  return (
    <AppBackground>
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <OnboardingProgressBar currentStep="pin-setup" />
        
        <View style={styles.top}>
          <T kind="h1" style={styles.title}>
            {step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
          </T>
          <T kind="body" style={styles.subtitle}>
            {step === 'create'
              ? 'Add a 6–8 digit PIN as a fallback in case Face/Touch ID is unavailable.'
              : 'Re-enter the same PIN to confirm.'}
          </T>

        {/* bubbles */}
        <View 
          style={styles.bubbles}
          accessibilityRole="progressbar"
          accessibilityLabel={`PIN entry progress: ${pin.length} of 8 digits entered`}
          accessibilityValue={{ min: 0, max: 8, now: pin.length, text: `${pin.length} digits` }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const isFilled = i < pin.length;
            const isFaint = i >= 6;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  isFaint && styles.dotFaint,
                  {
                    transform: [{ scale: bubbleAnimations[i] }],
                  },
                ]}
              />
            );
          })}
        </View>

        {warning && step === 'create' ? (
          <View style={styles.warningContainer}>
            <T kind="body" style={styles.warning}>{warning}</T>
          </View>
        ) : null}
        {error ? <T kind="body" style={styles.error}>{error}</T> : null}
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

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <CTAButton
            title={step === 'create' ? 'Continue' : (submitting ? 'Saving…' : 'Confirm')}
            onPress={onContinue}
            disabled={!canContinue || submitting || lockoutRemaining > 0}
            variant="primary"
            fullWidth={true}
          />
        </View>
      </View>
    </AppBackground>
  );
}

function Key({ label, onPress, small = false }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable 
      onPress={onPress} 
      style={[styles.key, small && styles.keySmall]}
      accessibilityRole="button"
      accessibilityLabel={label === '⌫' ? 'Backspace' : label === 'Clear' ? 'Clear all digits' : `Digit ${label}`}
      accessibilityHint={label === '⌫' ? 'Deletes the last entered digit' : label === 'Clear' ? 'Clears all entered digits' : `Enters digit ${label}`}
    >
      <Text style={[styles.keyText, small && styles.keyTextSmall]}>{label}</Text>
    </Pressable>
  );
}

const YELLOW = colors.cta;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, gap: 20, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: 40, paddingHorizontal: 8 },
  title: { 
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: { 
    textAlign: 'center', 
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  bubbles: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 8 },
  dot: { 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dotFilled: { 
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  dotFaint: { opacity: 0.4 },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 8,
  },
  warning: {
    color: '#F59E0B',
    textAlign: 'center',
  },
  error: { 
    color: '#EF4444', 
    marginTop: 16, 
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  bottom: {
    paddingHorizontal: 0,
    gap: 12,
  },
  pad: { alignItems: 'center', gap: 12, marginVertical: 20 },
  row: { flexDirection: 'row', gap: 16 },
  key: {
    width: 80, 
    height: 64, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keySmall: { width: 80 },
  keyText: { 
    fontSize: 32, 
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
    fontVariant: ['tabular-nums'] as any,
  },
  keyTextSmall: { 
    fontSize: 18, 
    opacity: 0.9, 
    fontWeight: '700',
    color: '#FFFFFF',
  },
});