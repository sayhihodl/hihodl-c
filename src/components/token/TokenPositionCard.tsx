// src/components/token/TokenPositionCard.tsx
// Card de posición estilo Phantom

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassCard } from "@/ui/Glass";
import { formatToken, formatFiat } from "@/lib/format";
import type { BalanceBreakdown, TokenMeta } from "@/hooks/useTokenDetails";
import { useSettingsStore } from "@/store/settings";
import { tokens } from "@/lib/layout";
import type { ChainId } from "@/store/portfolio.store";
import BaseBadge from "@assets/chains/Base-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import SolBadge from "@assets/chains/Solana-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";

interface TokenPositionCardProps {
  meta: TokenMeta;
  balance: BalanceBreakdown;
  price24h?: number | null;
  return24h?: number | null;
  chains?: ChainId[];
  testID?: string;
}

export default function TokenPositionCard({
  meta,
  balance,
  price24h = null,
  return24h = null,
  chains = [],
  testID,
}: TokenPositionCardProps) {
  const { showBalances } = useSettingsStore();
  const isPositiveReturn = return24h !== null && return24h >= 0;

  // Renderizar badge de chain
  const renderChainBadge = (chainId: ChainId, size: number = 16) => {
    const ChainIcon = 
      chainId === "solana:mainnet" ? SolBadge :
      chainId === "eip155:1" ? EthBadge :
      chainId === "eip155:8453" ? BaseBadge :
      chainId === "eip155:137" ? PolyBadge :
      null;
    
    if (!ChainIcon) return null;
    
    return (
      <View style={[styles.chainBadge, { width: size, height: size }]}>
        <ChainIcon width={size} height={size} />
      </View>
    );
  };

  // Mostrar hasta 3 badges principales + contador si hay más
  const visibleChains = chains.slice(0, 3);
  const extraCount = Math.max(0, chains.length - 3);

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Text style={styles.sectionTitle}>Your Position</Text>
      
      {/* Token con badges de networks */}
      {chains.length > 0 && (
        <View style={styles.tokenNetworksRow}>
          <Text style={styles.tokenNetworksLabel}>{meta.symbol} available on</Text>
          <View style={styles.networksBadges}>
            {visibleChains.map((chainId) => (
              <View key={chainId}>
                {renderChainBadge(chainId, 18)}
              </View>
            ))}
            {extraCount > 0 && (
              <View style={styles.chainCountBadge}>
                <ExtraBadge width={18} height={18} />
                <Text style={styles.chainCountText}>{extraCount}</Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.cardsRow}>
        {/* Balance Card */}
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>Balance</Text>
          <Text 
            style={styles.miniCardValue} 
            numberOfLines={1}
            ellipsizeMode="tail"
            testID={`${testID}-balance`}
          >
            {showBalances
              ? `${formatToken(balance.totalToken, meta.decimals)}`
              : "••••••"}
          </Text>
        </View>

        {/* Value Card */}
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>Value</Text>
          <Text 
            style={styles.miniCardValue} 
            numberOfLines={1}
            ellipsizeMode="tail"
            testID={`${testID}-value`}
          >
            {showBalances
              ? formatFiat(balance.totalUsd, { locale: "en-US" })
              : "••••"}
          </Text>
        </View>
      </View>

      {/* 24h Return */}
      {return24h !== null && (
        <View style={styles.returnRow}>
          <Text style={styles.returnLabel}>24h Return</Text>
          <Text
            style={[
              styles.returnValue,
              { color: isPositiveReturn ? "#20d690" : "#ff6b6b" },
            ]}
            testID={`${testID}-return-24h`}
          >
            {isPositiveReturn ? "+" : ""}
            {formatFiat(return24h, { locale: "en-US" })}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space[16],
    paddingVertical: tokens.space[20],
    paddingHorizontal: tokens.space[12],
    borderRadius: tokens.radius["2xl"],
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    marginBottom: tokens.space[20],
  },
  cardsRow: {
    flexDirection: "row",
    gap: tokens.space[12],
    marginBottom: tokens.space[16],
  },
  miniCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: tokens.radius.xl,
    padding: tokens.space[16],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.divider,
    minWidth: 0, // Permite que se comprima
  },
  miniCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
    marginBottom: tokens.space[6],
  },
  miniCardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
  },
  returnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: tokens.space[16],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.divider,
  },
  returnLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
  },
  returnValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  tokenNetworksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space[20],
    paddingBottom: tokens.space[12],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.divider,
  },
  tokenNetworksLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: tokens.colors.textSecondary,
    flex: 1,
    minWidth: 0,
    marginRight: tokens.space[8],
  },
  networksBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chainBadge: {
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chainCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chainCountText: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "800",
    color: "#000",
  },
});

