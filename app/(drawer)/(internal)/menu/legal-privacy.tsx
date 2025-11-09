import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { preloadNamespaces } from "@/i18n/i18n";

const BG   = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

const PRIVACY_URL = "https://hihodl.xyz/privacy";

async function openPrivacyURL() {
  try {
    const canOpen = await Linking.canOpenURL(PRIVACY_URL);
    if (canOpen) {
      await Linking.openURL(PRIVACY_URL);
    } else {
      // Si no se puede abrir, mostrar mensaje de error
      alert("No se pudo abrir el enlace. Por favor, visita hihodl.xyz/privacy");
    }
  } catch (error) {
    // Manejar error al abrir URL
    console.error("Error opening privacy URL:", error);
    alert("Error al abrir el enlace. Por favor, intenta más tarde.");
  }
}

export default function LegalPrivacy() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation(["menu"]);
  useEffect(() => { preloadNamespaces(["menu"]); }, [i18n.language]);
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}
      edges={["top","bottom"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={22} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>{t("menu:legal.privacyTitle")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.p}>{t("menu:legal.privacyBlurb")}</Text>
          <Pressable onPress={openPrivacyURL}
            style={styles.rowBtn}
          >
            <Ionicons name="open-outline" size={18} color={TEXT} />
            <Text style={styles.rowText}>{t("menu:legal.openPrivacy")}</Text>
            <Ionicons name="chevron-forward" size={16} color={SUB} style={{ marginLeft: "auto" }} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: TEXT, fontSize: 18, fontWeight: "800" },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: "rgba(3,12,16,0.35)",
    padding: 16,
  },
  p: { color: SUB, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  rowBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  rowText: { color: TEXT, fontSize: 14, fontWeight: "600" },
});


