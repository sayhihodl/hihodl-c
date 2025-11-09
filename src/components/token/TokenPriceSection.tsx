// src/components/token/TokenPriceSection.tsx
// Sección de precio estilo Phantom

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassCard } from "@/ui/Glass";
import { formatFiat } from "@/lib/format";
import type { PriceInfo, TokenMeta } from "@/hooks/useTokenDetails";
import { tokens } from "@/lib/layout";

interface TokenPriceSectionProps {
  meta: TokenMeta;
  price: PriceInfo;
  testID?: string;
}

export default function TokenPriceSection({ meta, price, testID }: TokenPriceSectionProps) {
  const change24h = price.change24hPct;
  const isPositive = change24h !== null && change24h >= 0;
  const changeColor = isPositive ? "#20d690" : "#ff6b6b";

  // Sparkline simple para non-stablecoins
  const Sparkline = () => {
    if (meta.isStablecoin || !price.sparkline7d || price.sparkline7d.length === 0) {
      return null;
    }

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

  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.content}>
        {/* Price */}
        <Text style={styles.price} testID={`${testID}-price`}>
          {price.usd !== null ? formatFiat(price.usd, { locale: "en-US" }) : "$—"}
        </Text>

        {/* 24h Change */}
        {change24h !== null && (
          <View style={styles.changeRow}>
            <Text style={[styles.changeAmount, { color: changeColor }]}>
              {isPositive ? "+" : ""}
              {change24h.toFixed(2)}%
            </Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? "#177a49" : "rgba(255,107,107,0.2)" }]}>
              <Text style={[styles.changeText, { color: changeColor }]}>
                {isPositive ? "+" : ""}
                {change24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        {/* Sparkline */}
        <Sparkline />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space[16],
    paddingVertical: tokens.space[20],
    paddingHorizontal: tokens.space[12],
    borderRadius: tokens.radius["2xl"],
    marginHorizontal: 0, // Sin margin horizontal, el padding viene del container padre
  },
  content: {
    gap: tokens.space[12],
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: tokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[8],
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: "600",
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
  sparklineContainer: {
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
});

