import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSwapStore } from "@/store/swap.store";
import { legacy } from "@/theme/colors";

const { BG, TEXT } = legacy;

const Pill = ({
  active, children, onPress,
}: { active?: boolean; children: React.ReactNode; onPress?: () => void }) => (
  <Pressable
    onPress={onPress}
    style={[styles.pill, active && styles.pillOn]}
    hitSlop={8}
  >
    <Text style={[styles.pillTxt, active && styles.pillTxtOn]}>{children}</Text>
  </Pressable>
);

export default function SwapSettingsScreen() {
  const router = useRouter();
  const settings = useSwapStore((s) => s.settings);
  const setSettings = useSwapStore((s) => s.setSettings);

  const setSlippage = (mode: "auto" | "fixed", fixedPct?: number) =>
    setSettings({ slippage: { ...settings.slippage, mode, ...(fixedPct!=null ? { fixedPct } : {}) } });

  const setPriority = (mode: "auto" | "custom", customSol?: number) =>
    setSettings({ priority: { ...settings.priority, mode, ...(customSol!=null ? { customSol } : {}) } });

  const setTip = (mode: "auto" | "custom", pct?: number) =>
    setSettings({ tip: { ...settings.tip, mode, ...(pct!=null ? { pct } : {}) } });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => { router.back(); void Haptics.selectionAsync(); }}
          style={styles.iconBtn}
        >
          <Ionicons name="close" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Slippage */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Slippage</Text>
        <View style={styles.rowWrap}>
          <Pill active={settings.slippage.mode === "auto"} onPress={() => setSlippage("auto")}>Auto</Pill>
          {[0.5, 1, 2, 3].map(v => (
            <Pill
              key={v}
              active={settings.slippage.mode === "fixed" && settings.slippage.fixedPct === v}
              onPress={() => setSlippage("fixed", v)}
            >
              {v}%
            </Pill>
          ))}
        </View>
      </View>

      {/* Priority fee */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Priority Fee</Text>
        <View style={styles.rowWrap}>
          <Pill active={settings.priority.mode === "auto"} onPress={() => setPriority("auto")}>Auto</Pill>
          {[0, 0.01, 0.02, 0.05].map(v => (
            <Pill
              key={v}
              active={settings.priority.mode === "custom" && settings.priority.customSol === v}
              onPress={() => setPriority("custom", v)}
            >
              Custom {v} SOL
            </Pill>
          ))}
        </View>
      </View>

      {/* Tip */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Tip</Text>
        <View style={styles.rowWrap}>
          <Pill active={settings.tip.mode === "auto"} onPress={() => setTip("auto")}>Auto (0.05%)</Pill>
          {[0.05, 0.1, 0.2, 0.5].map(v => (
            <Pill
              key={v}
              active={settings.tip.mode === "custom" && settings.tip.pct === v}
              onPress={() => setTip("custom", v)}
            >
              {v}%
            </Pill>
          ))}
        </View>
      </View>

      <Pressable style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneTxt}>Done</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16 },
  headerRow: {
    marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  title: { color: TEXT, fontWeight: "900", fontSize: 20 },
  group: { marginTop: 16 },
  groupLabel: { color: TEXT, fontWeight: "800", fontSize: 14, marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 6 : 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pillOn: { backgroundColor: "#fff" },
  pillTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  pillTxtOn: { color: "#0A1A24" },
  doneBtn: {
    marginTop: 18, height: 46, borderRadius: 12, backgroundColor: "#FFB703",
    alignItems: "center", justifyContent: "center",
  },
  doneTxt: { color: "#0A1A24", fontSize: 15, fontWeight: "800" },
});