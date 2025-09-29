import React from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable, Modal, Share, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import colors, { legacy } from "@/theme/colors";
import { TOP_CAP } from "@/theme/gradients";

const { SUB } = legacy;

/* ===== UI ===== */
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const YELLOW = "#FFB703";
const HERO_H = 300;
const SCREEN_W = Dimensions.get("window").width;

/* ===== Copy ===== */
const ENDS_COPY = "Ends soon";
const TITLE_COPY = "Earn $50 per friend";
const UNTIL_COPY = "Your friends have 7 days to";

/* ===== Steps (única tarjeta) ===== */
const STEPS = [
  { id: "s1", icon: "link-outline" as const, title: "Sign up with your link", sub: "And verify their identity" },
  { id: "s2", icon: "card-outline" as const, title: "Add money to their account", sub: "Via debit card or bank transfer" },
  { id: "s3", icon: "cart-outline" as const, title: "Make 3 purchases of $10+ each", sub: "‘Cash-like’ transactions don’t count" },
  { id: "s4", icon: "wallet-outline" as const, title: "Order a physical card", sub: "Add to Apple/Google Pay and go contactless" },
];

export default function ReferralIndex() {
  const insets = useSafeAreaInsets();
  const [showTcs, setShowTcs] = React.useState(false);

  const onInvite = async () => {
    try {
      await Share.share({
        message: "Join HiHODL with my link and earn rewards: https://hihodl.app/invite/your-code",
      });
      void Haptics.selectionAsync();
    } catch {}
  };

  const openPast = () => router.push("/(drawer)/(tabs)/referral/past" as Href);

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      {/* === Background unificado (mismo sistema que dashboard/menú) === */}
      <ScreenBg account="Daily" height={HERO_H} topCap={TOP_CAP} />

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.ends}>{ENDS_COPY}</Text>
        <Text style={s.title}>{TITLE_COPY}</Text>
      </View>

      {/* Lead */}
      <View style={s.leadWrap}>
        <Text style={s.lead}>{UNTIL_COPY}</Text>
      </View>

      {/* Tarjeta única con 4 requisitos */}
      <View style={s.card}>
        {STEPS.map((st, i) => (
          <View key={st.id}>
            <View style={s.stepRow}>
              <Ionicons name={st.icon} size={18} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{st.title}</Text>
                <Text style={s.stepSub}>{st.sub}</Text>
              </View>
            </View>
            {i < STEPS.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </View>

      {/* Past invites (botón único) */}
      <View style={s.card}>
        <Pressable onPress={openPast} style={s.rowBtn} android_ripple={{ color: "transparent" }}>
          <Text style={s.rowBtnTxt}>Past invites</Text>
          <Ionicons name="chevron-forward" size={16} color={SUB} />
        </Pressable>
      </View>

      {/* Nota + T&Cs (modal corto) */}
      <Text style={s.footerNote}>
        The promo is time-limited. <Text style={s.link} onPress={() => setShowTcs(true)}>T&Cs</Text> apply
      </Text>

      {/* CTA centrado abajo (como en el mock) */}
      <View style={{ height: insets.bottom + 104 }} />
      <Pressable style={[s.cta, { marginBottom: insets.bottom + 20 }]} onPress={onInvite} accessibilityLabel="Invite friends">
        <Text style={s.ctaTxt}>Invite friends</Text>
      </Pressable>

      {/* Modal T&Cs compacto */}
      <Modal visible={showTcs} transparent animationType="fade" onRequestClose={() => setShowTcs(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Conditions</Text>
              <Pressable onPress={() => setShowTcs(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
            {STEPS.map((x, i) => (
              <View key={x.id} style={s.modalRow}>
                <Ionicons name="ellipse-outline" size={14} color="#fff" />
                <Text style={s.modalTxt}>{`${i + 1}. ${x.title}`}</Text>
              </View>
            ))}
            <Text style={s.modalNote}>
              Each friend has 7 days from signup to finish the steps. When it ends we’ll send you a push notification. It doesn’t reset.
            </Text>
            <Pressable style={s.secondaryBtn} onPress={() => setShowTcs(false)}>
              <Text style={s.secondaryTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const s = StyleSheet.create({
  container: { flex: 1 }, // BG lo pinta ScreenBg
  hero: { paddingHorizontal: 16, marginTop: 92 },
  ends: { color: "#fff", opacity: 0.9, fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 },

  leadWrap: { paddingHorizontal: 16, marginTop: 22, marginBottom: 4 },
  lead: { color: "#fff", fontSize: 16, fontWeight: "700" },

  card: {
    marginHorizontal: 16,
    marginTop: 56,
    borderRadius: 18,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    overflow: "hidden",
  },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  stepTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stepSub: { color: SUB, fontSize: 12, fontWeight: "400", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 48 },

  rowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 18 },
  rowBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },

  footerNote: { color: SUB, fontSize: 12, textAlign: "center", marginTop: 28 },
  link: { color: "#9ecbff", textDecorationLine: "underline" },

  cta: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 55,
    height: 52,
    borderRadius: 16,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTxt: { color: "#0A1A24", fontSize: 16, fontWeight: "900" },

  /* modal */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 14 },
  modalCard: {
    width: SCREEN_W - 40,
    borderRadius: 16,
    backgroundColor: colors.navBg,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  modalTxt: { color: "#fff", fontSize: 12, fontWeight: "600", flex: 1 },
  modalNote: { color: SUB, fontSize: 11, marginTop: 8 },

  secondaryBtn: {
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
});