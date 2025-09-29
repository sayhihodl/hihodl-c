// src/components/NetworkSelector.tsx
import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { CHAIN_NAME, type ChainId } from "@/lib/networks";
// Si ya tienes mini-badges svg:
import SolBadge from "@assets/chains/Solana-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";

const BADGE: Record<ChainId, React.ComponentType<any>> = {
  "solana:mainnet": SolBadge,
  "eip155:8453": BaseBadge,
  "eip155:137": PolyBadge,
  "eip155:1": EthBadge,
};

export default function NetworkSelector({
  value,
  options,
  onChange,
}: {
  value: ChainId;
  options: ChainId[];
  onChange: (next: ChainId) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((cid) => {
        const active = cid === value;
        const Icon = BADGE[cid];
        return (
          <Pressable
            key={cid}
            onPress={() => onChange(cid)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon width={16} height={16} />
            <Text style={[styles.txt, active && styles.txtActive]}>{CHAIN_NAME[cid]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chipActive: { backgroundColor: "#FFB703" },
  txt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  txtActive: { color: "#0A1A24" },
});