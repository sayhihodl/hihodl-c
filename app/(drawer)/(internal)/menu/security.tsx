// app/menu/security.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider } from "@/ui/Glass";
import RowButton from "@/ui/Row"; // ✅ default import (antes { Row as RowButton })

const BG  = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";

export default function SecurityScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [autoLock, setAutoLock] = useState<"30s"|"1m"|"5m"|"10m">("1m");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <Stack.Screen options={{ title: "Security", headerLargeTitle: false }} />

      {/* App Lock */}
      <Text style={styles.sectionTitle}>App lock</Text>
      <GlassCard>
        <RowButton
          icon="keypad-outline"
          label="Passcode"
          value={passcode ? "Enabled" : "Disabled"}
          onPress={() => {
            // TODO: navegar al flow real si lo tienes
            setPasscode(!passcode);
          }}
        />
        <Divider />
        <RowButton
          icon="finger-print-outline"
          label="Face/Touch ID"
          value={biometrics ? "On" : "Off"}
          onPress={() => setBiometrics(!biometrics)}
        />
        <Divider />
        <RowButton
          icon="timer-outline"
          label="Auto-lock"
          value={autoLock}
          onPress={() => {
            const next =
              autoLock === "30s" ? "1m" :
              autoLock === "1m"  ? "5m" :
              autoLock === "5m"  ? "10m" : "30s";
            setAutoLock(next);
          }}
        />
      </GlassCard>

      {/* Sessions */}
      <Text style={styles.sectionTitle}>Sessions</Text>
      <GlassCard>
        <RowButton
          icon="desktop-outline"
          label="Active sessions"
          value="View devices"
          onPress={() => router.push("/menu/sessions")} // placeholder si la creas
        />
        <Divider />
        <RowButton
          icon="log-out-outline"
          label="Sign out from all devices"
          value=""
          onPress={() =>
            Alert.alert("Sign out all", "This will revoke all sessions.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => {/* TODO: revoke */} },
            ])
          }
        />
      </GlassCard>

      {/* Recovery */}
      <Text style={styles.sectionTitle}>Recovery</Text>
      <GlassCard>
        <RowButton
          icon="shield-checkmark-outline"
          label="Recovery phrase"
          value="Backed up • Verify"
          onPress={() => router.push("/onboardingflow/confirm-seed")}
        />
      </GlassCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  sectionTitle: { color: SUB, fontSize: 13, marginHorizontal: 16, marginTop: 16, marginBottom: 8, fontWeight: "600" },
});