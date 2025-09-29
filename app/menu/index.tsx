// app/menu/index.tsx
import { useMemo } from "react";
import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { useProfileStore } from "@/store/profile";
import T from "@/ui/T";

/* ===== theme ===== */
const BG = colors.navBg ?? legacyColors.BG ?? "#0D1820";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const TITLE = "#fff";
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const DIVIDER = "rgba(255,255,255,0.08)";
const ACCOUNT_GRADS: readonly [string, string] = [
  "rgba(0,194,255,0.45)",
  "rgba(54,224,255,0.00)",
];
const TOP_CAP = 23;
const MENU_GRAD_H = 260;

/* ===== styles ===== */
const styles = StyleSheet.create({
  titleSpacer: { color: TITLE }, // se mantiene el spacer del layout
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 2, marginBottom: 10 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 34 },
  tileGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  tile: { flex: 1, height: 128, borderRadius: 18, backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER, padding: 14, overflow: "hidden" },
  tileIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileChevron: { position: "absolute", right: 12, top: 12 },
  footerNote: { textAlign: "center", marginTop: 18 },
});

const glass = StyleSheet.create({
  card: { borderRadius: 18, backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginLeft: 46 },
});

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const username = useProfileStore((s) => s.username) ?? "@username";
  const avatar = useProfileStore((s) => s.avatar) ?? "🚀";

  const TopCapOverlay = useMemo(
    () => (
      <LinearGradient
        colors={ACCOUNT_GRADS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + TOP_CAP, zIndex: 2 }}
        pointerEvents="none"
      />
    ),
    [insets.top]
  );

  const MenuBackdrop = useMemo(
    () => (
      <LinearGradient
        colors={ACCOUNT_GRADS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + MENU_GRAD_H, zIndex: 0 }}
        pointerEvents="none"
      />
    ),
    [insets.top]
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {MenuBackdrop}
      {TopCapOverlay}

      <SafeAreaView style={{ flex: 1 }} edges={["left", "top", "right", "bottom"]}>
        <View style={{ flex: 1, paddingTop: TOP_CAP - 25 }}>
          {/* Spacer del layout */}
          <T kind="h2" style={styles.titleSpacer} />
        </View>

        <View style={{ position: "absolute", top: insets.top + 16, left: 20, zIndex: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          bounces
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Pressable onPress={() => router.push("/menu/profile")} style={styles.heroRow} accessibilityRole="button">
            <View style={styles.avatarCircle}><T kind="h1" style={{ fontSize: 34 }}>{avatar}</T></View>
            <View style={{ flex: 1 }}>
              {/* 18 / 800 como tenías */}
              <T kind="h3" numberOfLines={1}>{username}</T>
            </View>
          </Pressable>

          {/* Tiles */}
          <View style={styles.tileGrid}>
            <Tile icon="card-outline" title="Standard" sub="Your plan" onPress={() => router.push("/(paywall)/plans")} />
            <Tile icon="person-add-outline" title="Invite friends" sub="Earn rewards together" onPress={() => router.push("/referral")}/>
          </View>

          {/* Bloques principales */}
          <GlassCard>
            <MenuRow icon="wallet-outline" label="Payment methods" sub="Cards" onPress={() => router.push("/menu/payment-methods")} />
            <Divider />
            <MenuRow icon="settings-outline" label="Settings" sub="Notifications, currency & more" onPress={() => router.push("/menu/settings")} />
            <Divider />
            <MenuRow icon="shield-checkmark-outline" label="Security" sub="Passcode, biometrics, sessions" onPress={() => router.push("/menu/security")} />
          </GlassCard>

          <GlassCard style={{ marginTop: 16 }}>
            <MenuRow icon="help-circle-outline" label="Help & Support" sub="FAQs and contact" onPress={() => router.push("/menu/help")} />
            <Divider />
            <MenuRow icon="document-text-outline" label="About HIHODL" sub="Terms & privacy" onPress={() => router.push("/menu/legal")} />
          </GlassCard>

          {/* 12 / 400, gris sutil */}
          <T kind="caption" style={[{ color: SUB }, styles.footerNote]}>
            Need something else? We’re here to help.
          </T>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GlassCard({ children, style }: React.PropsWithChildren<{ style?: any }>) {
  return <View style={[glass.card, style]}>{children}</View>;
}
function Divider() { return <View style={glass.divider} />; }

function MenuRow({ icon, label, sub, onPress }:{
  icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; sub?: string; onPress:()=>void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [glass.row, pressed && { backgroundColor: "rgba(255,255,255,0.03)" }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color="#fff" style={{ marginTop: sub ? 2 : 0 }} />
      <View style={{ flex: 1 }}>
        {/* 14 “fuerte” como rowTitle */}
        <T kind="bodyStrong">{label}</T>
        {/* 12 / 400 como rowSub */}
        {sub ? <T kind="caption" style={{ color: SUB, marginTop: 2 }}>{sub}</T> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={SUB} />
    </Pressable>
  );
}

function Tile({ icon, title, sub, onPress }:{
  icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; sub: string; onPress:()=>void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tile} android_ripple={{ color: "transparent" }}>
      <View style={styles.tileIconBg}><Ionicons name={icon} size={18} color="#fff" /></View>
      {/* 14 / 800 como tileTitle */}
      <T kind="title">{title}</T>
      {/* 12 / 400 como tileSub */}
      <T kind="caption" style={{ color: SUB, marginTop: 4, lineHeight: 18 }}>{sub}</T>
      <Ionicons name="chevron-forward" size={16} color={SUB} style={styles.tileChevron} />
    </Pressable>
  );
}