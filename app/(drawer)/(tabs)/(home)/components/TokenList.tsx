// app/(drawer)/(tabs)/(home)/components/TokenList.tsx
// Lista de tokens del Dashboard

import React, { memo, useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import type { TokenRow } from "@/utils/dashboard/tokenHelpers";
import type { ChainId, CurrencyId, Position } from "@/store/portfolio.store";
import type { Account } from "@/hooks/useAccount";
import { accountToId } from "@/hooks/useAccount";
import { buildTokenTargetKey } from "../_lib/_dashboardShared";
import { CURRENCY_SYMBOL } from "@/utils/dashboard/tokenHelpers";
import { CURRENCY_SYMBOLS } from "@/utils/dashboard/currencyHelpers";
import type { Fiat } from "@/utils/dashboard/currencyHelpers";
import { pickRecommendedChain } from "@/utils/dashboard/tokenHelpers";
import { styles } from "../_lib/_dashboardShared";
import TokenIcon from "../components/TokenIcon";

interface TokenListProps {
  topRows: TokenRow[];
  fiat: Fiat;
  formatFiat: (usdAmount: number) => string;
  account: Account;
  positions: Position[];
  onTokenPress: (tokenKey: string) => void;
  showViewAll: boolean;
  onViewAll: () => void;
  onAddToken: () => void;
  tt: (key: string, defaultValue?: string) => string;
  t: any;
}

/**
 * Lista de tokens del dashboard
 */
const TokenList = memo(function TokenList({
  topRows,
  fiat,
  formatFiat,
  account,
  positions,
  onTokenPress,
  showViewAll,
  onViewAll,
  onAddToken,
  tt,
  t,
}: TokenListProps) {
  const renderTokenItem = useCallback(
    ({ item }: { item: TokenRow }) => {
      const dx = item.delta24hUSD ?? 0;
      const dxPct = item.delta24hPct;
      const symFiat = CURRENCY_SYMBOLS[fiat];
      // Para negativos: mostrar con signo menos y color blanco
      // Para positivos: mostrar con signo más y color verde
      const deltaTxt =
        typeof dxPct === "number"
          ? `${dx >= 0 ? "+" : "-"}${Math.abs(dx).toLocaleString(undefined, { maximumFractionDigits: 2 })}${symFiat}  ${dxPct >= 0 ? "+" : "-"}${Math.abs(dxPct).toFixed(2)}%`
          : dx !== 0
          ? `${dx >= 0 ? "+" : "-"}${Math.abs(dx).toLocaleString(undefined, { maximumFractionDigits: 2 })}${symFiat}`
          : undefined;
      const up = (dxPct ?? dx) >= 0;
      const sym = CURRENCY_SYMBOL[item.currencyId];

      return (
        <Pressable
          onPress={() => {
            const positionsForCurrency = positions.filter((p) => p.currencyId === item.currencyId);
            let chosen: ChainId | undefined;
            if (positionsForCurrency.length === 1) chosen = positionsForCurrency[0].chainId as ChainId;
            else if ((item.chains?.length ?? 0) > 0) chosen = pickRecommendedChain(item.chains as ChainId[]);

            const tokenKey = buildTokenTargetKey({
              id: item.currencyId,
              chainId: chosen ?? ("eip155:1" as ChainId),
              accountId: accountToId(account),
            });
            onTokenPress(tokenKey);
          }}
          style={({ pressed }) => [styles.tokenRow, pressed && { opacity: 0.85 }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t("dashboard:a11y.openAsset", { defaultValue: "Open {{name}}", name: item.name })}
        >
          <View style={styles.tokenLeft}>
            <TokenIcon currencyId={item.currencyId} chains={item.chains} />
            <View style={{ maxWidth: "72%" }}>
              <Text style={styles.tokenName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.tokenSub} numberOfLines={1}>
                {item.nativeAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {sym}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.tokenVal}>
              {formatFiat(item.valueUSD).replace("$", "")}
              {symFiat}
            </Text>

            {deltaTxt ? (
              <Text style={[styles.tokenDelta, up ? styles.deltaUp : styles.deltaDown]} numberOfLines={1}>
                {deltaTxt}
              </Text>
            ) : (
              <Text style={styles.tokenValSecondary}>
                {item.nativeAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {sym}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [fiat, formatFiat, account, positions, onTokenPress, t]
  );

  const keyToken = useCallback((i: TokenRow) => i.id, []);
  const getTokenItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: 70, offset: 70 * index, index }),
    []
  );

  return (
    <FlatList
      data={topRows}
      keyExtractor={keyToken}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={renderTokenItem}
      getItemLayout={getTokenItemLayout}
      ListFooterComponent={
        showViewAll ? (
          <Pressable style={styles.addTokenBtn} onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>{tt("assets.viewAll", "View all")}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.addTokenBtn} onPress={onAddToken} hitSlop={8}>
            <Text style={styles.addTokenTxt}>{tt("assets.addToken", "Add Token")}</Text>
          </Pressable>
        )
      }
    />
  );
});

export default TokenList;

