// app/(drawer)/(tabs)/referral/index.tsx
import React from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable, Modal, Share, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

import ScreenBg from "@/ui/ScreenBg";
import colors, { legacy } from "@/theme/colors";
import { TOP_CAP } from "@/theme/gradients";

const { SUB } = legacy;

const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const YELLOW = "#FFB703";
const HERO_H = 300;
const SCREEN_W = Dimensions.get("window").width;

export default function ReferralIndex() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("referral");
  const [showTcs, setShowTcs] = React.useState(false);

  const steps = t("steps", { returnObjects: true }) as Array<{ title: string; sub: string }>;

  const onInvite = async () => {
    try {
      await Share.share({
        message: t("shareMessage", {
          link: "https://hihodl.app/invite/your-code",
        }),
      });
      void Haptics.selectionAsync();
    } catch {}
  };

  const openPast = () => router.push("/(drawer)/(tabs)/referral/past" as Href);

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      <ScreenBg account="Daily" height={HERO_H} topCap={TOP_CAP} />

      <View style={s.hero}>
        <Text style={s.ends}>{t("endsSoon")}</Text>
        <Text style={s.title}>{t("heroTitle", { amount: "$50" })}</Text>
      </View>

      <View style={s.leadWrap}>
        <Text style={s.lead}>{t("lead")}</Text>
      </View>

      <View style={s.card}>
        {steps.map((st, i) => (
          <View key={`${st.title}-${i}`}>
            <View style={s.stepRow}>
              {/* iconos “decorativos”: mantenemos los mismos */}
              <Ionicons name={["link-outline","card-outline","cart-outline","wallet-outline"][i] as any} size={18} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{st.title}</Text>
                <Text style={s.stepSub}>{st.sub}</Text>
              </View>
            </View>
            {i < steps.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Pressable onPress={openPast} style={s.rowBtn} android_ripple={{ color: "transparent" }}>
          <Text style={s.rowBtnTxt}>{t("pastInvites")}</Text>
          <Ionicons name="chevron-forward" size={16} color={SUB} />
        </Pressable>
      </View>

      <Text style={s.footerNote}>
        {t("promoNote.text")} <Text style={s.link} onPress={() => setShowTcs(true)}>{t("promoNote.link")}</Text> {t("promoNote.tail")}
      </Text>

      <View style={{ height: insets.bottom + 104 }} />
      <Pressable style={[s.cta, { marginBottom: insets.bottom + 20 }]} onPress={onInvite} accessibilityLabel={t("ctaInvite")}>
        <Text style={s.ctaTxt}>{t("ctaInvite")}</Text>
      </Pressable>

      <Modal visible={showTcs} transparent animationType="fade" onRequestClose={() => setShowTcs(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t("tcsTitle")}</Text>
              <Pressable onPress={() => setShowTcs(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
            {steps.map((x, i) => (
              <View key={`tcs-${i}`} style={s.modalRow}>
                <Ionicons name="ellipse-outline" size={14} color="#fff" />
                <Text style={s.modalTxt}>{`${i + 1}. ${x.title}`}</Text>
              </View>
            ))}
            <Text style={s.modalNote}>{t("tcsBody")}</Text>
            <Pressable style={s.secondaryBtn} onPress={() => setShowTcs(false)}>
              <Text style={s.secondaryTxt}>{t("close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== styles (tus mismos estilos) ===== */
const s = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, marginTop: 92 },
  ends: { color: "#fff", opacity: 0.9, fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 },
  leadWrap: { paddingHorizontal: 16, marginTop: 22, marginBottom: 4 },
  lead: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: {
    marginHorizontal: 16, marginTop: 56, borderRadius: 18,
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER, overflow: "hidden",
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
    position: "absolute", left: 16, right: 16, bottom: 55, height: 52,
    borderRadius: 16, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center",
  },
  ctaTxt: { color: "#0A1A24", fontSize: 16, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 14 },
  modalCard: {
    width: SCREEN_W - 40, borderRadius: 16, backgroundColor: colors.navBg, padding: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  modalTxt: { color: "#fff", fontSize: 12, fontWeight: "600", flex: 1 },
  modalNote: { color: SUB, fontSize: 11, marginTop: 8 },
  secondaryBtn: { height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginTop: 12 },
  secondaryTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
});