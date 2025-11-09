// app/menu/about.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { router } from "expo-router";

const BG   = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const appName = Constants.expoConfig?.name ?? "HIHODL";
  const version = Constants.expoConfig?.version ?? Constants.manifest2?.version ?? "1.0.0";

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}
      edges={["top","bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={22} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>About HIHODL</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.h2}>{appName}</Text>
          <Text style={styles.p}>Version {version}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Company</Text>
          <Text style={styles.p}>HIHODL Labs</Text>
          <Text style={styles.p}>All rights reserved.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Legal & Docs</Text>
          <Pressable onPress={() => router.push("/(drawer)/(internal)/menu/legal")} style={styles.rowBtn}>
            <Ionicons name="document-text-outline" size={18} color={TEXT} />
            <Text style={styles.rowText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={16} color={SUB} style={{ marginLeft: "auto" }} />
          </Pressable>
          <Pressable onPress={() => Linking.openURL("https://hihodl.xyz")} style={styles.rowBtn}>
            <Ionicons name="globe-outline" size={18} color={TEXT} />
            <Text style={styles.rowText}>Website</Text>
            <Ionicons name="open-outline" size={16} color={SUB} style={{ marginLeft: "auto" }} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800" },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: "rgba(3,12,16,0.35)",
    padding: 16,
    marginBottom: 12,
  },
  h2: { color: TEXT, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  p: { color: SUB, fontSize: 14, lineHeight: 20 },
  rowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  rowText: { color: TEXT, fontSize: 14, fontWeight: "600" },
});