// app/auth/lock.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { isLockEnabled, tryBiometricAuth, verifyPin } from "@/lib/lock";

const BG = "#0E1722";
const CARD = "#08232E";
const YELLOW = "#FFB703";
const TEXT = "#CFE3EC";

export default function LockScreen() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [biometryTried, setBiometryTried] = useState(false);

  // ✅ navega al root del grupo de tabs
  const goDashboard = useCallback(() => router.replace("/(tabs)"), []);

  useEffect(() => {
    (async () => {
      const enabled = await isLockEnabled();
      if (!enabled) goDashboard();
    })();
  }, [goDashboard]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const ok = await tryBiometricAuth();
      setBusy(false);
      setBiometryTried(true);
      if (ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goDashboard();
      }
    })();
  }, [goDashboard]);

  const onSubmitPin = async () => {
    if (!pin) return;
    setBusy(true);
    const ok = await verifyPin(pin);
    setBusy(false);
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goDashboard();
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Incorrect PIN", "Try again.");
      setPin("");
    }
  };

  const onRetryBiometry = async () => {
    setBusy(true);
    const ok = await tryBiometricAuth();
    setBusy(false);
    if (ok) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      goDashboard();
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
      <View style={styles.card}>
        <Ionicons name="lock-closed" size={52} color={YELLOW} style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Unlock</Text>
        <Text style={styles.subtitle}>Use Face ID / biometrics or your PIN</Text>

        <View style={{ width: "100%", marginTop: 18 }}>
          <Text style={styles.label}>PIN</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="••••"
            placeholderTextColor="#7aa6b4"
            editable={!busy}
            style={styles.input}
            onSubmitEditing={onSubmitPin}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            disabled={busy || !pin}
            onPress={onSubmitPin}
            style={({ pressed }) => [styles.btn, (pressed || busy) && { opacity: 0.8 }]}
          >
            <Text style={styles.btnTxt}>{busy ? "Checking…" : "Unlock with PIN"}</Text>
          </Pressable>
        </View>

        <Pressable
          disabled={busy}
          onPress={onRetryBiometry}
          style={({ pressed }) => [styles.linkBtn, (pressed || busy) && { opacity: 0.7 }]}
        >
          <Ionicons name="finger-print-outline" size={18} color={YELLOW} />
          <Text style={styles.linkTxt}>
            {biometryTried ? "Try Face ID / biometrics again" : "Use Face ID / biometrics"}
          </Text>
        </Pressable>

        {__DEV__ && (
          <Pressable onPress={goDashboard} style={{ marginTop: 10 }}>
            <Text style={{ color: "#7aa6b4", fontWeight: "700" }}>Skip (dev)</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 18 },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  title: { color: "#fff", fontWeight: "900", fontSize: 24 },
  subtitle: { color: TEXT, marginTop: 6, textAlign: "center" },
  label: { color: TEXT, fontWeight: "800", marginBottom: 6 },
  input: {
    backgroundColor: "#0f2a37",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    fontWeight: "800",
  },
  btn: {
    backgroundColor: YELLOW,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnTxt: { color: "#0A1A24", fontWeight: "900" },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  linkTxt: { color: YELLOW, fontWeight: "800" },
});