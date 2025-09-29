// app/onboarding/security.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  ImageBackground, Modal, TextInput, Pressable,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { encryptSeed } from '@/lib/crypto-simple';

// --- CONFIG RÁPIDA (o impórtalo de '@/config/app')
const USE_MPC = true;




const BG = require('@assets/wallet-setup/wallet-setup-security.png');

const CARD_BG    = '#0B3442';
const TEXT_LIGHT = '#CFE3EC';
const YELLOW     = '#FFB703';

const SEED_STORE_KEY = 'hihodl::seed_v1.enc';
const DEMO_SEED = 'sail bomb wire adjust empty include slam nice picnic swarm spirit dove';

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 0 -> biometría, 1 -> backup (solo se mostrará si !USE_MPC)
  const [step, setStep] = useState<0 | 1>(0);

  // anim 1→2 (knob por la línea)
  const knobY = useRef(new Animated.Value(0)).current;
  const animateToStep2 = () => {
    Animated.timing(knobY, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  // modal contraseña (solo NO-MPC)
  const [pwVisible, setPwVisible] = useState(false);
  const [password, setPassword]   = useState('');
  const openPassword  = () => { if (!USE_MPC) { setPassword(''); setPwVisible(true); } };
  const closePassword = () => setPwVisible(false);

  // STEP 1: Biometría
  const onStartSetup = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return afterBiometrics(); // si no hay hardware continuamos
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric security',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) afterBiometrics();
    } catch {
      // si algo falla, no bloqueamos el flujo
      afterBiometrics();
    }
  };

  function afterBiometrics() {
    if (USE_MPC) {
      // En MPC/social NO pedimos password – salto directo
      router.replace('/onboarding/principalaccount');
      return;
    }
    // En flujo clásico: mostrar paso de backup local con password
    setStep(1);
    animateToStep2();
  }

  // STEP 2: Backup local cifrado (solo NO-MPC)
  const handleBackupNow = () => openPassword();

  async function confirmBackup() {
    if (!password || password.length < 4) return;
    try {
      const encB64 = encryptSeed(DEMO_SEED, password);
      await SecureStore.setItemAsync(SEED_STORE_KEY, encB64);
      closePassword();
      router.replace('/onboarding/principalaccount');
    } catch (e) {
      console.log('Local backup failed', e);
      closePassword();
      router.replace('/onboarding/backup/confirmation');
    }
  }

  // Altura útil de la línea (coincide con styles.line.height)
  const LINE_H = 160;
  const knobTranslate = knobY.interpolate({ inputRange: [0, 1], outputRange: [0, LINE_H] });

  // Copy dinámico para el segundo bullet según MPC
  const backupTitle = USE_MPC ? 'Account recovery (social)' : 'Set up recovery backup';
  const backupText  = USE_MPC
    ? 'Your wallet is protected by your sign-in (Google/Apple). You can add extra recovery later in Settings.'
    : 'Create a password-protected backup stored securely on your device';

  return (
    <View style={{ flex: 1 }}>
      {/* Fondo full-bleed detrás de notch/home-indicator */}
      <ImageBackground
        source={BG}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { top: -insets.top, bottom: -insets.bottom }]}
      />

      {/* Card a todo el ancho → sin “cortes” laterales */}
      <View style={[styles.card, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Secure your account</Text>

        {/* Contenido: columna de progreso + bullets alineados */}
        <View style={styles.contentRow}>
          <View style={styles.progressCol}>
            <View style={styles.dot} />
            {/* Si USE_MPC, solo hay 1 paso visible; si no, mostramos 2 */}
            {!USE_MPC && <View style={[styles.line, { height: LINE_H }]} />}
            {!USE_MPC && <View style={styles.dot} />}
            {!USE_MPC && (
              <Animated.View style={[styles.knob, { transform: [{ translateY: knobTranslate }] }]} />
            )}
          </View>

          <View style={styles.bullets}>
            <Text style={styles.bulletTitle}>Enable biometric security</Text>
            <Text style={styles.bulletText}>
              Use Face ID or Touch ID to secure your account and approve transactions
            </Text>

            <View style={{ height: 24 }} />

            <Text style={styles.bulletTitle}>{backupTitle}</Text>
            <Text style={styles.bulletText}>{backupText}</Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={[styles.bottom, { paddingBottom: 24 }]}>
          {/* En MPC: botón único para biometría/continuar */}
          {USE_MPC ? (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onStartSetup}>
              <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>Continue</Text>
            </TouchableOpacity>
          ) : step === 0 ? (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onStartSetup}>
              <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>Start setup</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleBackupNow}>
                <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>Back up now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnDisabled, { marginTop: 10 }]}
                onPress={() => router.replace('/onboarding/backup/confirmation')}
              >
                <Text style={[styles.btnTxt, { color: '#fff' }]}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Modal contraseña (solo si NO-MPC) */}
      {!USE_MPC && (
        <Modal visible={pwVisible} transparent animationType="fade" onRequestClose={closePassword}>
          <Pressable style={styles.modalBackdrop} onPress={closePassword} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backup password</Text>
            <Text style={styles.modalHint}>You’ll need this password to restore your wallet.</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.modalInput}
            />
            <TouchableOpacity
              onPress={confirmBackup}
              disabled={!password || password.length < 4}
              style={[styles.btn, (!password || password.length < 4) ? styles.btnDisabled : styles.btnPrimary]}
            >
              <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // card ocupa todo el ancho → adiós bordes “cortados”
  card: {
    flex: 1,
    marginTop: 64,
    marginHorizontal: 0,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  title: { color: '#fff', fontWeight: '900', fontSize: 26, marginBottom: 16 },

  // fila con barra + textos
  contentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },

  progressCol: { width: 32, alignItems: 'center', paddingTop: 6 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#7CC2D1' },
  line: { width: 2, backgroundColor: '#B7DDE7', marginVertical: 6 },
  knob: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#3AA6BF', left: 4, top: -4 },

  bullets: { flex: 1, paddingLeft: 12, paddingRight: 8 },
  bulletTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  bulletText: { color: TEXT_LIGHT, fontSize: 13 },

  bottom: { position: 'absolute', left: 20, right: 20, bottom: 0 },
  btn: { height: 56, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: YELLOW },
  btnDisabled: { backgroundColor: '#374151' },
  btnTxt: { fontWeight: '800', fontSize: 16 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { margin: 24, padding: 16, backgroundColor: '#0F172A', borderRadius: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalHint: { color: '#CFE3EC', fontSize: 13, marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: '#1F2937', backgroundColor: '#111827', color: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
});