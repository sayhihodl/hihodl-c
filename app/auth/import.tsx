// app/auth/import.tsx
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { usePrivy, useLoginWithSiwe, useLoginWithSiws } from '@privy-io/expo';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBg from '@/ui/ScreenBg';
import HeaderBar from '@/ui/HeaderBar';
import { CTAButton } from '@/ui/CTAButton';
import MetaMaskIcon from '@assets/icons/metamask.svg';
import PhantomIcon from '@assets/icons/phantom.svg';
import { isExpoGo } from '@/lib/runtime';

const METAMASK_COLOR = '#F6851B'; // MetaMask orange
const PHANTOM_COLOR = '#AB9FF2'; // Phantom purple
const LEDGER_COLOR = '#023047'; // Dark teal
const SEED_COLOR = '#FFB703'; // HIHODL yellow

// Helper para obtener dominio y URI
const getDomainAndUri = () => {
  // En producción, usar el dominio real de tu app
  const domain = __DEV__ ? 'localhost' : 'hihodl.xyz';
  const uri = __DEV__ ? 'http://localhost:8081' : 'https://hihodl.xyz';
  return { domain, uri };
};

export default function ImportWallet() {
  const { isReady: privyReady, authenticated: privyAuthenticated, user } = usePrivy();
  const { generateSiweMessage, loginWithSiwe, state: siweState } = useLoginWithSiwe({
    onSuccess: (user) => {
      console.log('✅ SIWE login successful:', user);
      router.replace('/(drawer)/(tabs)/(home)');
    },
    onError: (error) => {
      console.error('❌ SIWE login error:', error);
      Alert.alert('Error', 'Failed to connect MetaMask wallet');
      setLoading(null);
    },
  });
  const { generateMessage: generateSiwsMessage, login: loginWithSiws, state: siwsState } = useLoginWithSiws();
  const [loading, setLoading] = useState<'metamask' | 'phantom' | null>(null);
  const insets = useSafeAreaInsets();

  // Debug: Log estado de Privy
  useEffect(() => {
    console.log('🔍 Privy Status:', {
      ready: privyReady,
      authenticated: privyAuthenticated,
      hasUser: !!user,
      siweStatus: siweState?.status,
      siwsStatus: siwsState?.status,
    });
  }, [privyReady, privyAuthenticated, user, siweState, siwsState]);

  // Redirigir al dashboard cuando se autentique
  useEffect(() => {
    if (privyAuthenticated && user) {
      console.log('✅ Wallet conectado, redirigiendo...');
      router.replace('/(drawer)/(tabs)/(home)');
    }
  }, [privyAuthenticated, user]);

  const handleMetaMask = async () => {
    if (loading) return;
    
    console.log('🔵 Intentando conectar MetaMask...');
    
    setLoading('metamask');
    
    // Verificar si estamos en Expo Go
    if (isExpoGo) {
      Alert.alert(
        '⚠️ Development Build Required',
        'Las wallets externas (MetaMask, Phantom) requieren un development build o build de producción.\n\n' +
        'En Expo Go no es posible conectar wallets porque necesitan deep linking y comunicación con apps nativas.\n\n' +
        'Para probar:\n' +
        '1. Crea un development build: `eas build --profile development --platform ios`\n' +
        '2. O ejecuta localmente: `npx expo run:ios`',
        [{ text: 'OK', onPress: () => setLoading(null) }]
      );
      return;
    }
    
    try {
      // TODO: Implementar detección de MetaMask y flujo SIWE completo
      // Por ahora, mostramos un mensaje informativo
      Alert.alert(
        'MetaMask Connection',
        'La conexión de MetaMask se activará cuando implementemos el flujo completo de SIWE (Sign-In With Ethereum).\n\n' +
        'Esto requiere:\n' +
        '1. Detectar si MetaMask está instalada\n' +
        '2. Generar mensaje SIWE\n' +
        '3. Solicitar firma al usuario\n' +
        '4. Enviar firma a Privy',
        [{ text: 'OK', onPress: () => setLoading(null) }]
      );
    } catch (error) {
      console.error('❌ Error connecting MetaMask:', error);
      Alert.alert('Error', 'Failed to connect MetaMask');
      setLoading(null);
    }
  };

  const handlePhantom = async () => {
    if (loading) return;
    
    console.log('🟣 Intentando conectar Phantom...');
    
    setLoading('phantom');
    
    // Verificar si estamos en Expo Go
    if (isExpoGo) {
      Alert.alert(
        '⚠️ Development Build Required',
        'Las wallets externas (MetaMask, Phantom) requieren un development build o build de producción.\n\n' +
        'En Expo Go no es posible conectar wallets porque necesitan deep linking y comunicación con apps nativas.\n\n' +
        'Para probar:\n' +
        '1. Crea un development build: `eas build --profile development --platform ios`\n' +
        '2. O ejecuta localmente: `npx expo run:ios`',
        [{ text: 'OK', onPress: () => setLoading(null) }]
      );
      return;
    }
    
    try {
      // TODO: Implementar detección de Phantom y flujo SIWS completo
      // Por ahora, mostramos un mensaje informativo
      Alert.alert(
        'Phantom Connection',
        'La conexión de Phantom se activará cuando implementemos el flujo completo de SIWS (Sign-In With Solana).\n\n' +
        'Esto requiere:\n' +
        '1. Detectar si Phantom está instalada\n' +
        '2. Generar mensaje SIWS\n' +
        '3. Solicitar firma al usuario\n' +
        '4. Enviar firma a Privy',
        [{ text: 'OK', onPress: () => setLoading(null) }]
      );
    } catch (error) {
      console.error('❌ Error connecting Phantom:', error);
      Alert.alert('Error', 'Failed to connect Phantom');
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenBg account="Daily" height={120} />
      
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <HeaderBar
          title="Import wallet"
          onLeftPress={() => router.back()}
          leftIcon="close"
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Debug info (solo en desarrollo) */}
          {__DEV__ && !privyReady && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                ⚠️ Privy inicializando... Los botones pueden tardar unos segundos
              </Text>
            </View>
          )}

          {/* MetaMask */}
          <CTAButton
            title={loading === 'metamask' ? 'Connecting...' : 'MetaMask'}
            onPress={handleMetaMask}
            disabled={!!loading}
            color={METAMASK_COLOR}
            leftIcon={<MetaMaskIcon width={20} height={20} />}
            labelColor="#FFFFFF"
            style={styles.button}
            accessibilityLabel="Connect MetaMask wallet"
            accessibilityHint="Opens MetaMask to connect your wallet"
          />

          {/* Phantom */}
          <CTAButton
            title={loading === 'phantom' ? 'Connecting...' : 'Phantom'}
            onPress={handlePhantom}
            disabled={!!loading}
            color={PHANTOM_COLOR}
            leftIcon={<PhantomIcon width={20} height={20} />}
            labelColor="#FFFFFF"
            style={styles.button}
            accessibilityLabel="Connect Phantom wallet"
            accessibilityHint="Opens Phantom to connect your wallet"
          />

          {/* Ledger */}
          <CTAButton
            title="Ledger"
            onPress={() => router.push('/auth/import/ledger')}
            disabled={!!loading}
            color={LEDGER_COLOR}
            labelColor="#FFFFFF"
            style={styles.button}
            accessibilityLabel="Import Ledger wallet"
            accessibilityHint="Connect your Ledger hardware wallet"
          />

          {/* Seed phrase */}
          <CTAButton
            title="Seed phrase"
            onPress={() => router.push('/auth/import/seed')}
            disabled={!!loading}
            color={SEED_COLOR}
            labelColor="#0B0B0B"
            style={styles.button}
            accessibilityLabel="Import wallet with seed phrase"
            accessibilityHint="Restore wallet using your recovery seed phrase"
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
  },
  button: {
    marginBottom: 16,
  },
  debugInfo: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.3)',
  },
  debugText: {
    color: '#FFB703',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});