import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ImageBackground,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Keyboard,                // 👈 nuevo
  KeyboardAvoidingView,    // 👈 nuevo
  Animated,                // 👈 nuevo
} from 'react-native';
import { router } from 'expo-router';

type Status = 'idle' | 'checking' | 'available' | 'taken';

// Usa las 3 imágenes de panel (sin textos superpuestos)
const BGs = {
  idle:       require('../../assets/wallet-setup/wallet-setup-username-B.png'),
  checking:   require('../../assets/wallet-setup/wallet-setup-username-B.png'),
  available:  require('../../assets/wallet-setup/wallet-setup-username-B.png'),
  taken:      require('../../assets/wallet-setup/wallet-setup-username-B.png'),
} as const;

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
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 450));
    const taken =
      RESERVED.includes(candidate.toLowerCase() as (typeof RESERVED)[number]) ||
      ['admin','test','hihodl'].includes(candidate.toLowerCase());
    setStatus(taken ? 'taken' : 'available');
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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const ok = /^[a-z0-9_.-]{3,}$/i.test(v);
    if (!ok) { setStatus('idle'); return; }
    setStatus('checking');
    timerRef.current = setTimeout(() => checkAvailability(v), 500);
  };

  const bg = BGs[status];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 👈 evita solapes extra en iOS
    >
      {/* Fondo que no intercepta toques */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <ImageBackground source={bg} style={styles.bg} resizeMode="cover" />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.title}>Set your username</Text>
        <TextInput
          value={u}
          onChangeText={onChange}
          placeholder="Write here"
          placeholderTextColor="#CFE3EC"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="done"
        />

        {/* Mensaje de estado */}
        {status !== 'idle' && (
          <View style={styles.statusRow}>
            {status === 'checking' && (
              <Text style={[styles.statusText, { color: '#9CA3AF' }]}>Checking…</Text>
            )}
            {status === 'available' && (
              <Text style={[styles.statusText, { color: '#22C55E' }]}>
                Username is available ✓
              </Text>
            )}
            {status === 'taken' && (
              <Text style={[styles.statusText, { color: '#FB8500' }]}>
                Username is not available ⚠︎
              </Text>
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
          <TouchableOpacity
            onPress={() => status === 'available' && router.push('/onboarding/notifications')}
            disabled={status !== 'available'}
            style={[styles.cta, status !== 'available' && styles.ctaDisabled]}
          >
            <Text style={styles.ctaTxt}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg:   { width: '100%', height: '100%' },

  close: {
    position: 'absolute',
    top: 18,
    right: 14,
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
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
    fontSize: Platform.select({ ios: 22, android: 22, default: 40 }) as number,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE3EC',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 60,
  },

  statusRow: { marginTop: 20 },
  statusText: { fontSize: 16, fontWeight: '800' },

  // Footer/CTA que se pega abajo y sube con el teclado
  ctaWrap: {
    marginTop: 'auto',         // empuja al fondo
    paddingHorizontal: 24,
  },
  cta: {
    height: 48,
    borderRadius: 80,
    backgroundColor: '#FFB703',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.55 },
  ctaTxt: { color: '#0A1A24', fontSize: 18, fontWeight: '800' },
});