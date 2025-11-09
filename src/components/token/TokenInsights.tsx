// src/components/token/TokenInsights.tsx
// Componente de insights/precio - Refactorizado según especificaciones

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassCard } from "@/ui/Glass";
import type { PriceInfo, TokenMeta } from "@/hooks/useTokenDetails";
import { formatFiat } from "@/lib/format";
import { tokens } from "@/lib/layout";

interface TokenInsightsProps {
  meta: TokenMeta;
  price: PriceInfo;
  testID?: string;
}

export default function TokenInsights({ meta, price, testID }: TokenInsightsProps) {
  const change24h = price.change24hPct;
  const isPositive = change24h !== null && change24h >= 0;
  const changeColor = isPositive ? "#20d690" : "#ff6b6b";

  // Para stablecoins: solo mostrar si hay desviación >= 0.3%
  const shouldShowChange = !meta.isStablecoin || (change24h !== null && Math.abs(change24h) >= 0.3);

  // Sparkline solo para non-stablecoins
  const Sparkline = () => {
    if (meta.isStablecoin) {
      return null; // No mostrar para stablecoins
    }

    if (!price.sparkline7d || price.sparkline7d.length === 0) {
      return (
        <View style={styles.sparklineContainer}>
          <View style={styles.sparklinePlaceholder} />
        </View>
      );
    }

    // Simple sparkline visualization
    const max = Math.max(...price.sparkline7d);
    const min = Math.min(...price.sparkline7d);
    const range = max - min || 1;
    const sparklineHeight = 48;

    return (
      <View style={styles.sparklineContainer}>
        <View style={[styles.sparkline, { height: sparklineHeight }]}>
          {price.sparkline7d.map((value, index) => {
            const height = ((value - min) / range) * sparklineHeight;
            return (
              <View
                key={index}
                style={[
                  styles.sparklineBar,
                  {
                    height: Math.max(2, height),
                    backgroundColor: isPositive ? "#20d690" : "#ff6b6b",
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  // Si es stablecoin y no hay cambio significativo, no mostrar insights
  if (meta.isStablecoin && !shouldShowChange) {
    return null;
  }

  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.content}>
        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceValue} testID={`${testID}-price`}>
            {price.usd !== null ? formatFiat(price.usd, { locale: "en-US" }) : "$—"}
          </Text>
          {shouldShowChange && change24h !== null && (
            <View style={styles.changeContainer} testID={`${testID}-change`}>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: isPositive ? "#177a49" : "rgba(255,107,107,0.2)" },
                ]}
              >
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {isPositive ? "+" : ""}
                  {change24h.toFixed(2)}%
                </Text>
              </View>
              <Text style={styles.changeLabel}>24h</Text>
            </View>
          )}
        </View>

        {/* Sparkline */}
        {!meta.isStablecoin && <Sparkline />}
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
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    flex: 1,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  changeLabel: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
  },
  sparklineContainer: {
    alignItems: "center",
    marginTop: tokens.space[8],
  },
  sparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    width: "100%",
    justifyContent: "space-between",
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  sparklinePlaceholder: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
  },
});
