// app/onboarding/email.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CTAButton } from '@/ui/CTAButton';
import { OnboardingProgressBar } from '@/components/OnboardingProgressBar';
import AppBackground from '@/ui/AppBackground';
import T from '@/ui/T';
import colors from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAppStore } from '@/store/app.store';
import { isLockEnabled } from '@/lib/lock';

export default function Email() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: 'signup' | 'signin' }>();
  const isSignup = mode === 'signup';
  const { saveProgress } = useOnboardingProgress();
  const { onboardingDone } = useAppStore();

  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passStrength, setPassStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [previousPassword, setPreviousPassword] = useState<string | null>(null);
  const [passwordDuplicateError, setPasswordDuplicateError] = useState(false);

  // Cargar último email guardado
  useEffect(() => {
    const loadLastEmail = async () => {
      try {
        const lastEmail = await AsyncStorage.getItem('hihodl_last_email');
        if (lastEmail && isSignup) {
          setEmail(lastEmail);
        }
      } catch (e) {
        // Ignorar errores
      }
    };
    loadLastEmail();
  }, [isSignup]);

  // Cargar contraseña anterior (si existe) para verificar duplicados
  useEffect(() => {
    const loadPreviousPassword = async () => {
      if (isSignup) {
        try {
          const prev = await AsyncStorage.getItem('hihodl_previous_password_hash');
          setPreviousPassword(prev);
        } catch (e) {
          // Ignorar errores
        }
      }
    };
    loadPreviousPassword();
  }, [isSignup]);

  // Validación mejorada de email
  const isValidEmail = useMemo(() => {
    if (!email) return true; // No mostrar error hasta que empiece a escribir
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Cálculo de fortaleza de password
  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' | null => {
    if (password.length === 0) return null;
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  React.useEffect(() => {
    if (isSignup && pass.length > 0) {
      setPassStrength(calculatePasswordStrength(pass));
      
      // Verificar si es la misma contraseña que antes
      if (previousPassword && pass.length >= 8) {
        // Hash simple para comparar (en producción usaría crypto más robusto)
        const simpleHash = pass.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString();
        if (simpleHash === previousPassword) {
          setPasswordDuplicateError(true);
        } else {
          setPasswordDuplicateError(false);
        }
      } else {
        setPasswordDuplicateError(false);
      }
    } else {
      setPassStrength(null);
      setPasswordDuplicateError(false);
    }
  }, [pass, isSignup, previousPassword]);

  React.useEffect(() => {
    if (email && !isValidEmail) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }, [email, isValidEmail]);

  const canContinue = isValidEmail && email.includes('@') && pass.length >= 8;
  const title = useMemo(() => (isSignup ? 'Sign up with email' : 'Sign in with email'), [isSignup]);

  const onContinue = async () => {
    if (!canContinue) return;

    try {
      // Import auth functions
      const { signUpWithEmail, signInWithEmail } = await import('@/auth/email');
      
      if (isSignup) {
        // Sign up with Supabase
        const result = await signUpWithEmail(email, pass, {
          email,
        });

        if (result.error) {
          setEmailError(result.error.message || 'Failed to create account');
          return;
        }

        // Guardar email para recordarlo
        try {
          await AsyncStorage.setItem('hihodl_last_email', email);
        } catch (e) {
          // Ignorar errores
        }

        // Guardar hash de contraseña para verificar duplicados
        if (pass.length >= 8) {
          try {
            const simpleHash = pass.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString();
            await AsyncStorage.setItem('hihodl_previous_password_hash', simpleHash);
          } catch (e) {
            // Ignorar errores
          }
        }
      } else {
        // Sign in with Supabase
        const result = await signInWithEmail(email, pass);

        if (result.error) {
          setEmailError(result.error.message || 'Failed to sign in');
          return;
        }

        // Después de login exitoso, verificar estado del onboarding y lock
        if (onboardingDone) {
          // Si el onboarding está completo, verificar lock
          const lockEnabled = await isLockEnabled();
          if (lockEnabled) {
            router.replace('/auth/lock');
          } else {
            router.replace('/(drawer)/(tabs)/(home)');
          }
        } else {
          // Si el onboarding no está completo, ir al splash del onboarding
          router.replace('/onboarding/splash');
        }
        return;
      }

      // Guardar progreso
      await saveProgress('email');
      
      // 👉 Siempre vamos a USERNAME tras registrarnos
      router.replace('/onboarding/username');
    } catch (error) {
      console.error('Auth error:', error);
      setEmailError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <AppBackground>
      <View style={styles.root}>
        <Pressable onPress={() => router.back()} style={[styles.close, { top: insets.top + 12 }]}>
          <T style={styles.closeTxt}>×</T>
        </Pressable>

        <OnboardingProgressBar currentStep="email" />
        <T kind="h1" style={styles.title}>{title}</T>

      <View style={styles.inputContainer}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#94A3B8"
          style={[styles.input, emailError && styles.inputError]}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus={false}
          accessibilityLabel="Email address"
          accessibilityHint={emailError || "Enter your email address"}
        />
        {emailError ? (
          <T kind="body" style={styles.errorText}>{emailError}</T>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            value={pass}
            onChangeText={setPass}
            placeholder={isSignup ? 'Create password (min 8)' : 'Password'}
            secureTextEntry={!showPassword}
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.passwordInput]}
            autoComplete={isSignup ? 'password-new' : 'password'}
            textContentType={isSignup ? 'newPassword' : 'password'}
            accessibilityLabel={isSignup ? 'Create password' : 'Password'}
            accessibilityHint={isSignup ? 'Enter a password with at least 8 characters' : 'Enter your password'}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityHint="Toggles password visibility"
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        
        {isSignup && passStrength && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: passStrength === 'weak' ? '33%' : passStrength === 'medium' ? '66%' : '100%',
                    backgroundColor:
                      passStrength === 'weak' ? '#EF4444' : passStrength === 'medium' ? '#F59E0B' : '#10B981',
                  },
                ]}
              />
            </View>
            <T kind="caption" style={[styles.strengthText, { color: passStrength === 'weak' ? '#EF4444' : passStrength === 'medium' ? '#F59E0B' : '#10B981' }]}>
              {passStrength === 'weak' ? 'Weak' : passStrength === 'medium' ? 'Medium' : 'Strong'}
            </T>
          </View>
        )}
        
        {isSignup && pass.length > 0 && pass.length < 8 && (
          <T kind="caption" style={styles.hintText}>Password must be at least 8 characters</T>
        )}
        
        {passwordDuplicateError && (
          <View style={styles.duplicateWarning}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <T kind="caption" style={styles.duplicateText}>
              You're using the same password as before. Consider using a different one for better security.
            </T>
          </View>
        )}
      </View>

      <CTAButton
        title="Continue"
        onPress={onContinue}
        disabled={!canContinue}
        variant="primary"
        fullWidth={true}
        style={{ marginTop: 8 }}
      />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  close: { position: 'absolute', left: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  closeTxt: { color: colors.textMuted, fontSize: 26, lineHeight: 26, fontWeight: '800' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 32, textAlign: 'center', letterSpacing: -0.5 },
  inputContainer: {
    marginBottom: 16,
  },
  input: { 
    borderWidth: StyleSheet.hairlineWidth, 
    borderColor: colors.dividerOnDark, 
    backgroundColor: 'rgba(3, 12, 16, 0.35)', // Glass background
    color: colors.text, 
    borderRadius: 16, 
    padding: 16,
    fontSize: 16,
    borderStyle: 'solid',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 50,
  },
  duplicateWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 8,
  },
  duplicateText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});