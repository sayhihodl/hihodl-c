// src/components/ChainBadges.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MAX = 3;

// Mapa simple para los chips (como en tu screen del dashboard)
const DOT: Record<string, { label: string; bg: string }> = {
  "solana:mainnet": { label: "S", bg: "#14F195" },
  "eip155:1":       { label: "Ξ", bg: "#627EEA" },
  "eip155:8453":    { label: "B", bg: "#0052FF" },
  "eip155:137":     { label: "P", bg: "#8247E5" },
};

export default function ChainBadges({ chains = [] as string[] }) {
  if (!chains.length) return null;

  const unique = Array.from(new Set(chains));
  const first = unique.slice(0, MAX);
  const extra = unique.length - first.length;

  return (
    <View style={styles.row}>
      {first.map((id) => {
        const meta = DOT[id] ?? { label: "", bg: "rgba(255,255,255,0.25)" };
        return (
          <View key={id} style={[styles.dot, { backgroundColor: meta.bg }]}>
            <Text style={styles.dotLabel}>{meta.label}</Text>
          </View>
        );
      })}
      {extra > 0 && (
        <View style={[styles.dot, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.dotLabel}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  dotLabel: { color: "#081217", fontSize: 9, fontWeight: "900" },
});