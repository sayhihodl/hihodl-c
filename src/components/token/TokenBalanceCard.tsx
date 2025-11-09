// src/components/token/TokenBalanceCard.tsx
// Tarjeta de balance - Refactorizado según especificaciones

import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/ui/Glass";
import type { BalanceBreakdown, TokenMeta } from "@/hooks/useTokenDetails";
import { formatToken, formatFiat } from "@/lib/format";
import { getPegStatus } from "@/lib/peg";
import { useSettingsStore } from "@/store/settings";
import { tokens } from "@/lib/layout";
import { getExplorerUrl, type NetworkKey as FormatNetworkKey } from "@/lib/format";

interface TokenBalanceCardProps {
  meta: TokenMeta;
  balance: BalanceBreakdown;
  price?: number | null;
  onPillPress?: (subWallet: string) => void;
  testID?: string;
}

export default function TokenBalanceCard({
  meta,
  balance,
  price = null,
  onPillPress,
  testID,
}: TokenBalanceCardProps) {
  const { showBalances } = useSettingsStore();

  const subWalletLabels: Record<string, string> = {
    daily: "Daily",
    savings: "Savings",
    social: "Social",
  };

  // Peg status para stablecoins
  const pegStatus = meta.isStablecoin && price !== null ? getPegStatus(price, 1.0) : null;

  const handlePillPress = (key: string) => {
    if (onPillPress) {
      Haptics.selectionAsync();
      onPillPress(key);
    }
  };

  const handleViewExplorer = () => {
    // Intentar encontrar una red con contrato
    const networkKeys: FormatNetworkKey[] = ["solana", "base", "ethereum", "polygon"];
    for (const network of networkKeys) {
      const contract = meta.contracts[network];
      if (contract) {
        const url = getExplorerUrl(network, contract);
        if (url) {
          Linking.openURL(url);
        }
        break;
      }
    }
  };

  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.content}>
        {/* Primary Balance - Token Amount */}
        <Text style={styles.tokenAmount} numberOfLines={1} testID={`${testID}-amount`}>
          {showBalances
            ? `${formatToken(balance.totalToken, meta.decimals)} ${meta.symbol}`
            : "••••••"}
        </Text>

        {/* Secondary Fiat Value */}
        <Text style={styles.fiatValue} testID={`${testID}-fiat`}>
          ≈ {showBalances ? formatFiat(balance.totalUsd, { locale: "en-US" }) : "••••"}
        </Text>

        {/* Sub-wallet Breakdown - Pills en fila con wrap */}
        {Object.keys(balance.bySubWallet).length > 0 && (
          <View style={styles.subWallets}>
            {Object.entries(balance.bySubWallet)
              .filter(([_, value]) => parseFloat(value.token) > 0) // Ocultar vacías
              .map(([key, value]) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.subWalletPill,
                    pressed && styles.subWalletPillPressed,
                  ]}
                  onPress={() => handlePillPress(key)}
                  disabled={!onPillPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${subWalletLabels[key] || key} wallet: ${showBalances ? formatToken(value.token, meta.decimals) : "•••"} ${meta.symbol}`}
                >
                  <Text style={styles.subWalletLabel}>
                    {subWalletLabels[key] || key}
                  </Text>
                  <Text style={styles.subWalletAmount}>
                    {showBalances
                      ? `${formatToken(value.token, meta.decimals)} ${meta.symbol}`
                      : "•••"}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Stablecoin Peg Indicator - Inline */}
        {meta.isStablecoin && pegStatus && (
          <View style={styles.pegRow} testID={`${testID}-peg-status`}>
            {pegStatus.status === "ok" ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#20d690" />
                <Text style={styles.pegText}>
                  Peg: 1 {meta.symbol} ≈ 1 USD
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="warning" size={16} color="#ffb703" />
                <Text style={[styles.pegText, styles.pegTextWarn]}>
                  Peg deviation {pegStatus.deviationPct.toFixed(2)}%
                </Text>
              </>
            )}
          </View>
        )}

        {/* View on Explorer - Link discreto */}
        {Object.values(meta.contracts).some((c) => c) && (
          <Pressable
            onPress={handleViewExplorer}
            style={styles.explorerLink}
            accessibilityRole="link"
            accessibilityLabel="View on Explorer"
          >
            <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.explorerText}>View on Explorer</Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space[16],
    padding: tokens.space[20],
    borderRadius: tokens.radius["2xl"],
  },
  content: {
    gap: tokens.space[16],
  },
  tokenAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  fiatValue: {
    fontSize: 18,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
  },
  subWallets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[8],
  },
  subWalletPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.space[12],
    paddingVertical: tokens.space[6],
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  subWalletPillPressed: {
    opacity: 0.7,
  },
  subWalletLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
  },
  subWalletAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
  },
  pegRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: tokens.space[8],
    paddingTop: tokens.space[12],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.divider,
  },
  pegText: {
    fontSize: 13,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
  },
  pegTextWarn: {
    color: "#ffb703",
  },
  explorerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: tokens.space[8],
    alignSelf: "flex-start",
  },
  explorerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
});
