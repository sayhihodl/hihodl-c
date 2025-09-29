// arriba del archivo
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable,
  ImageBackground, Platform,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native'; // 👈 añade esto
import { router } from 'expo-router';


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

  const handleContinue = () => {
    if (step === 'create') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      setMismatch(false);
      return;
    }
    // confirm
    if (pin === firstPin && pin.length >= min) {
      // TODO: guarda el PIN de forma segura si hace falta (SecureStore)
      router.replace('/onboarding/security');
    } else {
      setMismatch(true);
    }
  };

  // Auto-focus al montar y al cambiar de paso
  useEffect(() => {
    const tid = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(tid);
  }, [step]);

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
          // ✅ Oculto con bullets (•). Así el user ve longitud sin revelar el PIN
          secureTextEntry
          style={styles.input}
        />

        {/* Contador o error */}
        <View style={{ height: 24, marginTop: 6 }}>
          {mismatch ? (
            <Text style={styles.error}>The PINs don’t match</Text>
          ) : showCounter ? (
            <Text style={styles.counter}>{pin.length}/{max}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          disabled={!ok}
          onPress={handleContinue}
          style={[styles.btn, ok ? styles.btnPrimary : styles.btnDisabled]}
        >
          <Text style={[styles.btnTxt, { color: ok ? '#0A1A24' : '#9CA3AF' }]}>
            {step === 'create' ? 'Continue' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 18, right: 18, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#CFE3EC', fontSize: 24, lineHeight: 24, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  input: {
    width: '100%', maxWidth: 560,
    borderWidth: 1, borderColor: '#CFE3EC',
    color: '#fff', borderRadius: 12, padding: 14, textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', letterSpacing: 4,
  },
  counter: { textAlign: 'center', color: '#CFE3EC', fontWeight: '700' },
  error: { textAlign: 'center', color: '#F59E0B', fontWeight: '800' },

  bottom: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  btn: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#FFB703' },
  btnDisabled: { backgroundColor: '#374151' },
  btnTxt: { fontWeight: '800', fontSize: 18 },
});