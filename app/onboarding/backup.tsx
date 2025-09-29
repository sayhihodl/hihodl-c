// app/onboarding/backup.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const SECURE_KEY = 'hihodl::mnemonic';
const DRAFT_KEY  = 'hihodl::mnemonic::draft'; // si ya la generaste y la dejaste en AsyncStorage

export default function Backup() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const obtainSeed = async (): Promise<string> => {
    // 1) si ya tienes una mnemonic en AsyncStorage (draft), úsala
    const existing = await AsyncStorage.getItem(DRAFT_KEY);
    if (existing) return existing;

    // 2) si no, crea un secreto temporal (placeholder) para poder continuar
    //    (luego lo cambias por BIP39 real)
    const bytes = Crypto.getRandomBytes(32); // 256-bit
    // convertir a base64
    const b64 = Buffer.from(bytes).toString('base64'); // si Buffer no existe, haz tu base64 helper
    return b64;
  };

  const doBackup = async () => {
    try {
      setBusy(true);
      const secret = await obtainSeed();

      // Guardamos en SecureStore con requerimiento de autenticación
      await SecureStore.setItemAsync(SECURE_KEY, secret, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // iOS
        requireAuthentication: true,                                     // iOS & Android biometría/PIN
        authenticationPrompt: 'Authenticate to store your recovery securely',
      } as any);

      // Opcional: borra el draft plano si existía
      await AsyncStorage.removeItem(DRAFT_KEY);

      setDone(true);
      // Aquí es buen lugar para disparar la CREACIÓN de las 3 wallets (Daily/Savings/Social)
      // usando ese secret (lo veremos contigo en la siguiente iteración).
    } catch (e: any) {
      Alert.alert('Backup failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    // Tras el backup, vamos a elegir la cuenta principal (labels)
    router.replace('/onboarding/principalaccount');
  };

  return (
    <View style={styles.root}>
      <Pressable onPress={() => router.replace('/onboarding/security')} style={[styles.close, { top: insets.top + 18 }]}>
        <Text style={styles.closeTxt}>×</Text>
      </Pressable>

      <View style={[styles.card, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Back up your recovery phrase</Text>
        <Text style={styles.desc}>
          We’ll store your recovery securely on this device so you can restore your wallet if you
          lose or change your phone.
        </Text>

        <View style={{ flex: 1 }} />

        {!done ? (
          <TouchableOpacity disabled={busy} onPress={doBackup} style={[styles.btn, styles.btnPrimary]}>
            <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>{busy ? 'Saving…' : 'Back up now'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={goNext} style={[styles.btn, styles.btnPrimary]}>
            <Text style={[styles.btnTxt, { color: '#0A1A24' }]}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const CARD_BG = '#0B3442';
const TEXT_LIGHT = '#CFE3EC';
const YELLOW = '#FFB703';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#062B39' },
  close: { position: 'absolute', right: 18, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeTxt: { color: TEXT_LIGHT, fontSize: 24, lineHeight: 24, fontWeight: '700' },

  card: {
    flex: 1,
    marginTop: 64,
    marginHorizontal: 12,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: { color: '#fff', fontWeight: '900', fontSize: 26, marginBottom: 12 },
  desc: { color: TEXT_LIGHT, fontSize: 14 },

  btn: { height: 56, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 12 },
  btnPrimary: { backgroundColor: YELLOW },
  btnTxt: { fontWeight: '800', fontSize: 16 },
});