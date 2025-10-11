// app/(tabs)/referral/past.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { preloadNamespaces } from "@/i18n/i18n";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard, Divider as GlassDivider } from "@/ui/Glass";
import Row from "@/ui/Row";
import InviteDetailSheet from "@/Referral/InviteDetailSheet";
import { legacy } from "@/theme/colors";
import { TOP_CAP } from "@/theme/gradients";

const { BG, SUB, SEPARATOR } = legacy;

/* ===== Mock / types ===== */
export type Invite = {
  id: string;
  name: string;
  stepsDone: number; // 0..4
  status: "unlocked" | "expired" | "in_progress";
  invitedAt?: string;
};

const MOCK: Invite[] = [
  { id: "1", name: "Alex Johnson", stepsDone: 2, status: "in_progress", invitedAt: new Date().toISOString() },
  { id: "2", name: "Blake Lee", stepsDone: 4, status: "unlocked", invitedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "3", name: "Casey Kim", stepsDone: 0, status: "expired", invitedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

/* ===== Utils ===== */
const initials = (full: string) =>
  full
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ===== Screen ===== */
export default function PastInvites() {
  const { t, i18n } = useTranslation(["referral"]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Invite | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await preloadNamespaces(["referral"]);
      if (alive) setReady(true);
    })();
    return () => { alive = false; setReady(false); };
  }, [i18n.language]);

  const goBack = () => router.back();

  const statusCopy = (inv: Invite) => {
    if (inv.status === "unlocked") return t("referral:status.unlocked", "Reward unlocked");
    if (inv.status === "expired")  return t("referral:status.expired", "Offer ended");
    return t("referral:status.steps", "{{done}}/4 steps", { done: inv.stepsDone });
  };

  if (!ready) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Fondo HiHODL unificado */}
      <ScreenBg account="Daily" height={160} topCap={TOP_CAP} />

      {/* Header vítreo */}
      <GlassHeader
        scrolly={new (require("react-native").Animated.Value)(0)}
        height={44}
        innerTopPad={10}
        blurTint="dark"
        overlayColor="rgba(2,48,71,0.28)"
        leftSlot={
          <Pressable onPress={goBack} style={styles.headerBtn} hitSlop={10} accessibilityLabel={t("referral:a11y.back", "Go back")}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
        }
        centerSlot={<Text style={styles.hTitle}>{t("referral:pastInvites.title", "Past invites")}</Text>}
        rightSlot={<View style={{ width: 28 }} />}
        showBottomHairline={false}
        contentStyle={{ paddingHorizontal: 16 }}
      />

      {/* Card con filas glass */}
      <View style={{ paddingHorizontal: 16, marginTop: 90 }}>
        <GlassCard tone="glass">
          {MOCK.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: SUB }}>{t("referral:pastInvites.empty", "No invites yet")}</Text>
            </View>
          ) : (
            MOCK.map((item, idx) => (
              <View key={item.id}>
                <Row
                  icon={null}
                  leftSlot={
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTxt}>{initials(item.name)}</Text>
                    </View>
                  }
                  label={item.name}
                  // 👇 ‘value’ como string (para que Row lo pinte con glass.rowSub)
                  value={statusCopy(item)}
                  onPress={() => setSelected(item)}
                  rightIcon="chevron-forward"
                  // sin arrays en estilos para respetar tu tipado actual
                  titleStyle={{}} 
                  containerStyle={{ paddingVertical: 14 }}
                />
                {idx < MOCK.length - 1 && <GlassDivider />}
              </View>
            ))
          )}
        </GlassCard>
      </View>

      {/* Bottom Sheet detalle */}
      <InviteDetailSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        invite={selected ?? { name: "", stepsDone: 0, status: "in_progress" }}
      />
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  hTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  avatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: SEPARATOR, alignItems: "center", justifyContent: "center",
  },
  avatarTxt: { color: "#0A1A24", fontWeight: "900" },
});