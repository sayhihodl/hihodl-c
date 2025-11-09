import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { CTAButton } from '@/ui/CTAButton';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'error';

// Ya no usamos imágenes de fondo, usamos AppBackground

const RESERVED = [
  'admin','administrator','root','support','help','test','tester',
  'hihodl','wallet','security','service','contact','info','helloalex',
  'alexlopez','alex','alexl','alexlopezhihodl','alexlopezhihodlapp',
  'solana','alexlopezhihodlappdev','bitcoin','ethereum','crypto',
  'cryptocurrency','blockchain','web3','nfts','defi','dapps','cz','vitalik',
  'satoshi','elonmusk','dogecoin','shiba','memecoins','usdt','usdc','tether',
  'stablecoins','hodl','hodler','hodlers','hodling','hodled','wallets',
  'walletapp','ada','xrp','bnb','sol','avax','matic','dot','chainlink',
  'litecoin','bitcoincash','stellar','uniswap','aave','compound','yearn',
  'curve','sushiswap','pancakeswap','1inch','balancer','synthetix','maker',
  'dai','busd','paxos','trueusd','tusd','neutrino','husd','claudia','gerard','isa','toni',
] as const;

export default function Username() {
  const { saveProgress } = useOnboardingProgress();
  const [u, setU] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 👇 altura del teclado animada (para elevar el CTA exactamente esa altura)
  const kbHeight = useRef(new Animated.Value(0)).current;

  // 👇 listeners de teclado (iOS usa *Will*, Android usa *Did*)
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      const h = e.endCoordinates?.height ?? 0;
      Animated.timing(kbHeight, {
        toValue: h,
        duration: Platform.OS === 'ios' ? e.duration ?? 180 : 180,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvt, (e) => {
      Animated.timing(kbHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration ?? 160 : 160,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [kbHeight]);

  const checkAvailability = useCallback(async (candidate: string) => {
    try {
      // Simular timeout de red (en producción sería un fetch real)
      await Promise.race([
        new Promise<void>((resolve) => setTimeout(() => resolve(), 450)),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 5000)
        ),
      ]);
      
      const taken =
        RESERVED.includes(candidate.toLowerCase() as (typeof RESERVED)[number]) ||
        ['admin','test','hihodl'].includes(candidate.toLowerCase());
      setStatus(taken ? 'taken' : 'available');
    } catch (error) {
      // Manejo de errores de red
      setStatus('error');
      // Auto-reintentar después de 2 segundos
      setTimeout(() => {
        if (candidate.trim().length >= 3 && /^[a-z0-9_.-]{3,}$/i.test(candidate)) {
          setStatus('checking');
          checkAvailability(candidate);
        }
      }, 2000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const onChange = (t: string) => {
    const v = t.trim();
    setU(v);
    
    // Cancelar verificación anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Si el texto no es válido, resetear estado
    const ok = /^[a-z0-9_.-]{3,}$/i.test(v);
    if (!ok) { 
      setStatus('idle'); 
      return; 
    }
    
    // No poner 'checking' inmediatamente - solo después del debounce
    // Esto permite que el usuario siga escribiendo sin interrupciones
    timerRef.current = setTimeout(() => {
      setStatus('checking');
      checkAvailability(v);
    }, 800); // Aumentado de 500ms a 800ms para dar más tiempo de escritura
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Contenido */}
        <View style={styles.content}>
          <OnboardingProgressBar currentStep="username" />
          <T kind="h1" style={styles.title} accessibilityRole="header">Set your username</T>
        <TextInput
          value={u}
          onChangeText={onChange}
          placeholder="Write here"
          placeholderTextColor="#CFE3EC"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="done"
          editable={true} // Siempre permitir edición
          accessibilityLabel="Username"
          accessibilityHint="Enter your desired username. It will be checked for availability."
          accessibilityState={{ invalid: status === 'taken' }}
        />

        {/* Mensaje de estado */}
        {status !== 'idle' && (
          <View 
            style={styles.statusRow}
            accessibilityRole="status"
            accessibilityLiveRegion="polite"
          >
            {status === 'checking' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#9CA3AF" />
                <T 
                  kind="body"
                  style={[styles.statusText, { color: '#9CA3AF' }]}
                  accessibilityLabel="Checking username availability"
                >
                  Checking…
                </T>
              </View>
            )}
            {status === 'available' && (
              <T 
                kind="body"
                style={[styles.statusText, { color: '#22C55E' }]}
                accessibilityLabel="Username is available"
              >
                Username is available ✓
              </T>
            )}
            {status === 'taken' && (
              <T 
                kind="body"
                style={[styles.statusText, { color: '#FB8500' }]}
                accessibilityLabel="Username is not available"
              >
                Username is not available ⚠︎
              </T>
            )}
            {status === 'error' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T 
                  kind="body"
                  style={[styles.statusText, { color: '#EF4444' }]}
                  accessibilityLabel="Connection error, retrying"
                >
                  Connection error. Retrying...
                </T>
              </View>
            )}
          </View>
        )}

        {/* CTA fijo que sube EXACTAMENTE la altura del teclado */}
        <Animated.View
          style={[
            styles.ctaWrap,
            { paddingBottom: Animated.add(kbHeight, new Animated.Value(24)) }, // 👈 magia
          ]}
        >
          <CTAButton
            title="Continue"
            onPress={async () => {
              await saveProgress('username');
              router.push('/onboarding/notifications');
            }}
            disabled={status !== 'available'}
            variant="primary"
            fullWidth={true}
            accessibilityLabel="Continue to next step"
            accessibilityHint={status === 'available' 
              ? 'Username is available, proceed to notifications setup'
              : 'Username must be available to continue'}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  close: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeTxt: { color: '#CFE3EC', fontSize: 26, lineHeight: 26, fontWeight: '800' },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.select({
      ios: 180,
      android: 170,
      default: 120,
    }) as number,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 24,
    fontSize: Platform.select({ ios: 28, android: 28, default: 40 }) as number,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dividerOnDark,
    paddingHorizontal: 16,
    color: colors.text,
    backgroundColor: 'rgba(3, 12, 16, 0.35)', // Glass background
    marginTop: 60,
    fontSize: 16,
    borderStyle: 'solid',
  },

  statusRow: { marginTop: 16 },
  statusText: { fontSize: 15, fontWeight: '700' },

  // Footer/CTA que se pega abajo y sube con el teclado
  ctaWrap: {
    marginTop: 'auto',         // empuja al fondo
    paddingHorizontal: 0,
  },
});