// src/components/token/ScopeChips.tsx
// Componente de chips de scope sticky para token details

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SegmentedPills, { type PillItem } from "@/ui/SegmentedPills";
import type { TokenScope } from "@/hooks/useTokenDetails";

interface ScopeChipsProps {
  value: TokenScope;
  onChange: (scope: TokenScope) => void;
  hasMultipleWallets?: boolean;
  testID?: string;
}

const SCOPE_HINTS: Record<string, string> = {
  "wallet-network": "Showing this wallet and network",
  "wallet-all": "Showing this wallet across all networks",
  "all-wallets": "Balances merged across your wallets",
};

const SCOPE_PILLS: PillItem[] = [
  { id: "wallet-network", label: "My Wallet" },
  { id: "wallet-all", label: "My Wallet" },
  { id: "all-wallets", label: "All Accounts" },
];

export default function ScopeChips({ value, onChange, hasMultipleWallets = true, testID }: ScopeChipsProps) {
  const insets = useSafeAreaInsets();
  
  // Si solo hay una wallet, ocultar completamente
  if (!hasMultipleWallets) {
    return null;
  }

  // Filtrar pills: si solo hay una wallet, mostrar solo "My Wallet" y "All Accounts"
  const availablePills = hasMultipleWallets 
    ? SCOPE_PILLS 
    : SCOPE_PILLS.filter(p => p.id !== "wallet-all");
  
  const activeIndex = availablePills.findIndex((p) => p.id === value.kind);
  const activeHint = SCOPE_HINTS[value.kind] || "";

  const handlePress = (index: number, item: PillItem) => {
    const newScope: TokenScope = {
      kind: item.id as TokenScope["kind"],
      network: item.id === "wallet-network" ? value.network || "base" : undefined,
    };
    onChange(newScope);
  };

  return (
    <View style={[styles.sticky, { top: insets.top + 44 }]} testID={testID}>
      <View style={styles.container}>
        <SegmentedPills
          items={availablePills}
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onPress={handlePress}
          wrapBackground="rgba(255,255,255,0.08)"
          height={36}
          pillMinWidth={80}
          pillHPad={12}
          wrapHPad={8}
        />
        {activeHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{activeHint}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(6,14,20,0.95)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    gap: 6,
  },
  hintContainer: {
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});

