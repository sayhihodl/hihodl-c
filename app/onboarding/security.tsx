// app/onboarding/security.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Modal, TextInput, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { encryptSeed } from '@/lib/crypto-simple';
import { isPasskeySupported } from '@/auth/passkeys';
import { CTAButton } from '@/ui/CTAButton';
import { BiometricPrompt } from '@/components/BiometricPrompt';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { GlassCard } from '@/ui/Glass';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';
import * as Haptics from 'expo-haptics';

// --- CONFIG RÁPIDA (o impórtalo de '@/config/app')
const USE_MPC = true;




const TEXT_LIGHT = colors.textMuted;
const YELLOW     = colors.cta;

const SEED_STORE_KEY = 'hihodl::seed_v1.enc';
const DEMO_SEED = 'sail bomb wire adjust empty include slam nice picnic swarm spirit dove';

export default function SecurityScreen() {
  const router = useRouter();
  const { saveProgress } = useOnboardingProgress();
  const insets = useSafeAreaInsets();

  // 0 -> biometría, 1 -> backup (solo se mostrará si !USE_MPC), 2 -> passkey
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [biometricTriggered, setBiometricTriggered] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // anim 1→2 (knob por la línea)
  const knobY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  
  const animateToStep2 = () => {
    Animated.parallel([
      Animated.timing(knobY, { 
        toValue: 1, 
        duration: 400, // Más rápido: 400ms en lugar de 500ms
        easing: Easing.out(Easing.cubic), 
        useNativeDriver: true 
      }),
      Animated.timing(cardOpacity, {
        toValue: 0.6,
        duration: 250, // Más rápido: 250ms en lugar de 300ms
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 0.98,
        friction: 7, // Más rápido
        tension: 50, // Más rápido
        useNativeDriver: true,
      }),
    ]).start();
  };

  // modal contraseña (solo NO-MPC)
  const [pwVisible, setPwVisible] = useState(false);
  const [password, setPassword]   = useState('');
  const openPassword  = () => { 
    if (!USE_MPC) { 
      setPassword(''); 
      setPwVisible(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } 
  };
  const closePassword = () => {
    setPwVisible(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Animación del icono al montar
  React.useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.spring(iconScale, {
        toValue: 1.05,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // STEP 1: Biometría mejorada
  const onStartSetup = async () => {
    setBiometricTriggered(true);
    setBiometricError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animación al presionar
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBiometricSuccess = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    afterBiometrics();
  };

  const handleBiometricError = (error: string) => {
    setBiometricError(error);
    setBiometricTriggered(false);
  };

  // Fallback si no hay hardware biométrico
  const handleSkipBiometric = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    afterBiometrics();
  };

  async function afterBiometrics() {
    // Check if passkeys are supported and user wants to use them
    const { isPasskeySupported, registerPasskey } = await import('@/auth/passkeys');
    const passkeySupported = await isPasskeySupported();
    
    if (USE_MPC) {
      // En MPC/social: ofrecer passkey si está disponible
      if (passkeySupported) {
        // Show passkey option
        setStep(2); // Passkey step
        return;
      }
      // Si no hay passkey, ir a configurar PIN
      await saveProgress('security');
      router.replace('/onboarding/pin-setup');
      return;
    }
    // En flujo clásico: mostrar paso de backup local con password
    setStep(1);
    animateToStep2();
  }
  
  const handlePasskeySetup = async () => {
    try {
      const { useAuth } = await import('@/store/auth');
      const { user } = useAuth();
      if (!user?.email) {
        setBiometricError('Email required for passkey setup');
        return;
      }

      const { registerPasskey } = await import('@/auth/passkeys');
      const result = await registerPasskey({ email: user.email });
      
      if (result.error) {
        setBiometricError(result.error.message);
        return;
      }

      // Success - ir a configurar PIN
      await saveProgress('security');
      router.replace('/onboarding/pin-setup');
    } catch (error) {
      setBiometricError(error instanceof Error ? error.message : 'Failed to setup passkey');
    }
  };

  // STEP 2: Backup local cifrado (solo NO-MPC)
  const handleBackupNow = () => openPassword();

  async function confirmBackup() {
    if (!password || password.length < 4) return;
    try {
      const encB64 = encryptSeed(DEMO_SEED, password);
      await SecureStore.setItemAsync(SEED_STORE_KEY, encB64);
      closePassword();
      await saveProgress('security');
      router.replace('/(drawer)/(tabs)');
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
    <AppBackground>
      <View style={{ flex: 1 }}>
        {/* Card Glass moderno con gradiente */}
        <View 
          style={[styles.card, { paddingTop: insets.top + 24 }]}
          accessibilityLabel="Security setup"
        >
        <OnboardingProgressBar currentStep="security" />
        
        {/* Título */}
        <View style={styles.titleContainer}>
          <T kind="h1" style={styles.title} accessibilityRole="header">Secure your account</T>
          <T kind="body" style={styles.subtitle}>Protect your wallet with biometric authentication</T>
        </View>

        {/* Contenido principal mejorado */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {step === 0 && (
            <View style={styles.stepContent}>
              {/* Icono central mejorado con gradiente */}
              <View style={styles.iconContainer}>
                <Animated.View
                  style={[
                    styles.glowEffect,
                    {
                      opacity: glowOpacity,
                    },
                  ]}
                />
                <Animated.View
                  style={{
                    transform: [{ scale: iconScale }],
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255, 183, 3, 0.25)', 'rgba(255, 183, 3, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons name="shield-checkmark" size={52} color={YELLOW} />
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Card de información - solo se muestra si no está autenticando */}
              {!biometricTriggered && (
                <View style={styles.infoCard}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.infoContent}>
                    <Ionicons name="finger-print" size={24} color={YELLOW} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                      <T kind="bodyStrong" style={styles.infoTitle}>Quick & Secure</T>
                      <T kind="caption" style={styles.infoText}>
                        Tap "Continue" to enable biometric authentication
                      </T>
                    </View>
                  </View>
                </View>
              )}

              {/* Biometric Prompt */}
              {biometricTriggered && (
                <View style={styles.biometricContainer}>
                  <BiometricPrompt
                    promptMessage="Enable biometric security"
                    onSuccess={handleBiometricSuccess}
                    onError={handleBiometricError}
                    autoTrigger={true}
                  />
                </View>
              )}
                  
              {/* Error handling mejorado */}
              {biometricError && (
                <View 
                  style={styles.errorContainer}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                >
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <View style={styles.errorTextContainer}>
                    <T kind="body" style={styles.errorText}>{biometricError}</T>
                    <TouchableOpacity 
                      onPress={handleSkipBiometric}
                      style={styles.skipButton}
                      accessibilityRole="button"
                      accessibilityLabel="Continue without biometric authentication"
                    >
                      <T kind="bodyStrong" style={styles.skipButtonText}>Continue without biometrics</T>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={{ height: 24 }} />
              <T kind="h3" style={styles.bulletTitle}>{backupTitle}</T>
              <T kind="body" style={styles.bulletText}>{backupText}</T>
            </View>
          )}
        </Animated.View>

        {/* CTAs */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          {/* En MPC: botón único para biometría/continuar */}
          {USE_MPC ? (
            !biometricTriggered && (
              <CTAButton
                title="Continue"
                onPress={onStartSetup}
                variant="primary"
                fullWidth={true}
              />
            )
          ) : step === 0 ? (
            !biometricTriggered && (
              <CTAButton
                title="Start setup"
                onPress={onStartSetup}
                variant="primary"
                fullWidth={true}
              />
            )
          ) : (
            <>
              <CTAButton
                title="Back up now"
                onPress={handleBackupNow}
                variant="primary"
                fullWidth={true}
                style={{ marginBottom: 12 }}
              />
              <CTAButton
                title="Skip for now"
                onPress={async () => {
                  await saveProgress('security');
                  router.replace('/onboarding/pin-setup');
                }}
                variant="secondary"
                tone="dark"
                fullWidth={true}
              />
            </>
          )}
        </View>
      </View>

      {/* Modal contraseña (solo si NO-MPC) */}
      {!USE_MPC && (
        <Modal visible={pwVisible} transparent animationType="fade" onRequestClose={closePassword}>
          <Pressable style={styles.modalBackdrop} onPress={closePassword} />
          <View style={styles.modalCard}>
            <T kind="h2" style={styles.modalTitle}>Backup password</T>
            <T kind="body" style={styles.modalHint}>You'll need this password to restore your wallet.</T>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.modalInput}
            />
            <CTAButton
              title="Confirm"
              onPress={confirmBackup}
              disabled={!password || password.length < 4}
              variant="primary"
              fullWidth={true}
            />
          </View>
        </Modal>
      )}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  // Card principal mejorado
  card: {
    flex: 1,
    marginTop: 64,
    marginHorizontal: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
  },
  
  // Título mejorado
  titleContainer: {
    marginBottom: 32,
    marginTop: 8,
  },
  title: { 
    color: colors.text, 
    fontWeight: '900', 
    fontSize: 34, 
    marginBottom: 8, 
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    opacity: 0.8,
  },

  // Contenedor de contenido mejorado
  contentContainer: { 
    flex: 1,
    paddingTop: 8,
  },
  stepContent: {
    flex: 1,
  },

  // Icono central mejorado
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
    position: 'relative',
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 183, 3, 0.3)',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.2)',
  },
  glowEffect: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    opacity: 0.6,
  },
  glowAnimation: {
    // Se animará con useRef
  },

  // Card de información mejorado
  infoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  // Biometric container
  biometricContainer: {
    marginTop: 16,
  },

  // Error container mejorado
  errorContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  // Bullets (para step 1)
  bulletTitle: { 
    color: colors.text, 
    fontWeight: '800', 
    fontSize: 20, 
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bulletText: { 
    color: TEXT_LIGHT, 
    fontSize: 15, 
    lineHeight: 22,
    opacity: 0.9,
  },

  bottom: { 
    position: 'absolute', 
    left: 24, 
    right: 24, 
    bottom: 0,
  },
  modalBackdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: colors.overlay,
  },
  modalCard: { 
    margin: 24, 
    padding: 24, 
    backgroundColor: colors.sheetBgSolid, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: colors.dividerOnDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: { 
    color: colors.text, 
    fontSize: 22, 
    fontWeight: '900', 
    marginBottom: 8, 
    letterSpacing: -0.4,
  },
  modalHint: { 
    color: colors.textMuted, 
    fontSize: 15, 
    marginBottom: 20, 
    lineHeight: 22,
  },
  modalInput: { 
    borderWidth: 1, 
    borderColor: colors.dividerOnDark, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    color: colors.text, 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});