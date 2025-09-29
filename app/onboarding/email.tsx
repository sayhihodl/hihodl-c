// app/onboarding/email.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Email() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: 'signup' | 'signin' }>();
  const isSignup = mode === 'signup';

  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');

  const canContinue = email.includes('@') && pass.length >= 8;
  const title = useMemo(() => (isSignup ? 'Sign up with email' : 'Sign in with email'), [isSignup]);

  const onContinue = () => {
    // 👉 Siempre vamos a USERNAME tras autenticarnos
    router.replace('/onboarding/username');
  };

  return (
    <View style={styles.root}>
      <Pressable onPress={() => router.back()} style={[styles.close, { top: insets.top + 12 }]}>
        <Text style={styles.closeTxt}>×</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
      <TextInput
        value={pass}
        onChangeText={setPass}
        placeholder={isSignup ? 'Create password (min 8)' : 'Password'}
        secureTextEntry
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.btn, canContinue ? styles.btnPrimary : styles.btnDisabled]}
        disabled={!canContinue}
        onPress={onContinue}
      >
        <Text style={[styles.btnText, { color: canContinue ? '#0A1A24' : '#9CA3AF' }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F1A', padding: 24, gap: 12, justifyContent: 'center' },
  close: { position: 'absolute', right: 18, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#CFE3EC', fontSize: 24, lineHeight: 24, fontWeight: '700' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#1F2937', backgroundColor: '#111827', color: '#fff', borderRadius: 12, padding: 14 },
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: '#FFB703' },
  btnDisabled: { backgroundColor: '#374151' },
  btnText: { fontWeight: '800', fontSize: 16 },
});