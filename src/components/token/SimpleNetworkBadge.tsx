// src/components/token/SimpleNetworkBadge.tsx
// Badge simple que muestra solo el nombre de la network

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NetworkKey } from "@/hooks/useTokenDetails";
import { tokens } from "@/lib/layout";

interface SimpleNetworkBadgeProps {
  network: NetworkKey;
}

const networkLabel: Record<NetworkKey, string> = {
  solana: "SOLANA",
  base: "BASE",
  ethereum: "ETHEREUM",
  polygon: "POLYGON",
};

export default function SimpleNetworkBadge({ network }: SimpleNetworkBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{networkLabel[network]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.space[8],
    paddingVertical: tokens.space[4],
    borderRadius: tokens.radius.xl,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
});


