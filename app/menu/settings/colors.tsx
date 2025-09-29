import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider } from "@/ui/Glass";
import { Row as RowButton } from "@/ui/Row";
import {
  SCREEN_GRADS,
  ACCOUNT_GRADS,
  type ScreenGrad,
  type Account,
  type Grad,
  type Grad2,
} from "@/theme/gradients";

const BG  = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map(c=>c+c).join("") : clean, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function overlayFrom(baseHex: string): Grad2 {
  return [hexToRgba(baseHex, 0.45), hexToRgba(baseHex, 0.0)] as const;
}

export default function ColorsScreen() {
  const insets = useSafeAreaInsets();

  const [globalMenuGrad, setGlobalMenuGrad] = useState<ScreenGrad>("dashboard");
  const [screenOverrides, setScreenOverrides] = useState<Partial<Record<ScreenGrad, ScreenGrad>>>({});
  const [accountOverrides, setAccountOverrides] = useState<Partial<Record<Account, keyof typeof ACCOUNT_GRADS | "peach" | "premium">>>({});

  const headerOverlay = useMemo<Grad2>(() => {
    const base = SCREEN_GRADS[globalMenuGrad][0];
    return overlayFrom(base);
  }, [globalMenuGrad]);

  const updateScreenOverride = (screen: ScreenGrad, value: ScreenGrad) =>
    setScreenOverrides((s) => ({ ...s, [screen]: value }));

  const updateAccountOverride = (acc: Account, value: "Daily" | "Savings" | "Social" | "peach" | "premium") =>
    setAccountOverrides((s) => ({ ...s, [acc]: value }));

  const GLOBAL_OPTIONS: ScreenGrad[] = ["dashboard", "premium"];
  const SCREEN_KEYS: ScreenGrad[] = ["dashboard", "financial", "social"];
  const ACCOUNT_KEYS: Account[] = ["Daily", "Savings", "Social"];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <LinearGradient colors={headerOverlay} start={{ x:0, y:0 }} end={{ x:0, y:1 }} style={styles.topGrad} pointerEvents="none" />
      <Stack.Screen options={{ title: "Colors & Gradients", headerLargeTitle: false }} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }} bounces showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>Global menu gradient</Text>
        <GlassCard>
          {GLOBAL_OPTIONS.map((opt, idx) => (
            <View key={opt}>
              {!!idx && <Divider />}
              <RowSelect
                icon={idx === 0 ? "sparkles-outline" : "ellipse-outline"}
                label={idx === 0 ? "Default for all subscreens" : " "}
                value={opt}
                selected={globalMenuGrad === opt}
                onPress={() => setGlobalMenuGrad(opt)}
                preview={SCREEN_GRADS[opt]}
              />
            </View>
          ))}
        </GlassCard>

        <Text style={styles.sectionTitle}>Per-screen overrides (optional)</Text>
        <GlassCard>
          {SCREEN_KEYS.map((scr, i) => {
            const current: ScreenGrad = screenOverrides[scr] ?? globalMenuGrad;
            return (
              <View key={scr}>
                {!!i && <Divider />}
                <RowCycle<ScreenGrad>
                  icon="layers-outline"
                  label={scr.charAt(0).toUpperCase() + scr.slice(1)}
                  value={current}
                  options={GLOBAL_OPTIONS}
                  onChange={(v) => updateScreenOverride(scr, v)}
                  preview={SCREEN_GRADS[current]}
                />
              </View>
            );
          })}
        </GlassCard>

        <Text style={styles.sectionTitle}>Per-account overlay (optional)</Text>
        <GlassCard>
          {ACCOUNT_KEYS.map((acc, i) => {
            const ov = accountOverrides[acc] ?? acc;
            const preview: Grad =
              ov === "peach"    ? overlayFrom(SCREEN_GRADS.dashboard[0]) :
              ov === "premium"  ? overlayFrom(SCREEN_GRADS.premium[0])   :
                                  ACCOUNT_GRADS[ov as Account];

            return (
              <View key={acc}>
                {!!i && <Divider />}
                <RowCycle<"Daily" | "Savings" | "Social" | "peach" | "premium">
                  icon="person-circle-outline"
                  label={`${acc} overlay`}
                  value={ov as any}
                  options={["Daily", "Savings", "Social", "peach", "premium"] as const}
                  onChange={(v) => updateAccountOverride(acc, v)}
                  preview={preview}
                />
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function RowSelect({
  icon, label, value, selected, onPress, preview,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
  preview: Grad;
}) {
  return (
    <RowButton
      icon={icon}
      label={label}
      value={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <GradChip colors={preview} />
          <Text style={{ color: "#fff" }}>{value}</Text>
        </View>
      }
      onPress={onPress}
      rightSlot={<Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={18} color={selected ? "#fff" : SUB} />}
    />
  );
}

function RowCycle<T extends string>({ icon, label, value, options, onChange, preview }:{
  icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: T; options: readonly T[]; onChange:(v:T)=>void; preview: Grad;
}) {
  const idx = Math.max(0, options.indexOf(value));
  const next = () => onChange(options[(idx + 1) % options.length]);
  return (
    <RowButton
      icon={icon}
      label={label}
      value={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <GradChip colors={preview} />
          <Text style={{ color: "#fff" }}>{value}</Text>
        </View>
      }
      onPress={next}
      rightSlot={<Ionicons name="chevron-forward" size={18} color={SUB} />}
    />
  );
}

function GradChip({ colors }: { colors: Grad }) {
  return <LinearGradient colors={colors} start={{ x:0, y:1 }} end={{ x:1, y:0 }} style={{ width: 56, height: 16, borderRadius: 8 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 220, zIndex: 0 },
  sectionTitle: { color: SUB, fontSize: 13, marginTop: 16, marginBottom: 8, fontWeight: "600" },
});