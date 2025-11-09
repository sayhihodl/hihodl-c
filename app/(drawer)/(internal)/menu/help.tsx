// app/menu/help.tsx
import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { router } from "expo-router";

/** ===== theme ===== */
const BG   = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/** ===== header dials (mismo patrón que currency.tsx) ===== */
const TITLE_H = 44;
const HEADER_INNER_TOP = 10;
const HEADER_CONTENT_H = TITLE_H + 12; // solo título; ajusta si añades buscador

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  const closeScreen = () =>
    (router as any)?.canGoBack?.() ? router.back() : router.replace("/menu");

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
      {/* Fondo NO lleva children */}
      <ScreenBg account="Daily" height={HEADER_TOTAL + 220} />

      {/* Header de cristal: requiere scrolly + slots */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 16 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <View style={styles.topRow}>
            <Pressable onPress={closeScreen} hitSlop={10} style={styles.headerIconBtnClear}>
              <Ionicons name="close" size={22} color={TEXT} />
            </Pressable>
            <Text style={styles.title}>Help & Support</Text>
            <View style={{ width: 36 }} />
          </View>
        }
      />

      {/* Contenido scrollable que alimenta scrolly */}
      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: HEADER_TOTAL,
          paddingBottom: insets.bottom + 40,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.card}>
          <Text style={styles.h2}>Need help?</Text>
          <Text style={styles.p}>
            Check our FAQ or contact support directly.{"\n"}
            Email: support@hihodl.xyz{"\n"}
            Telegram: @hihodl_support
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={() => Linking.openURL("mailto:support@hihodl.xyz")}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Email us</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL("https://t.me/hihodl_support")}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Open Telegram</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Common topics</Text>
          <Text style={styles.li}>• Backup & Recovery</Text>
          <Text style={styles.li}>• Gasless & fees</Text>
          <Text style={styles.li}>• Aliases & address rotation</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/** ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerIconBtnClear: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800", textAlign: "center" },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: "rgba(3,12,16,0.35)",
    padding: 16,
    marginBottom: 12,
  },
  h2: { color: TEXT, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  p: { color: SUB, fontSize: 14, lineHeight: 20 },
  li: { color: SUB, fontSize: 14, lineHeight: 22 },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ctaText: { color: TEXT, fontSize: 13, fontWeight: "700" },
});