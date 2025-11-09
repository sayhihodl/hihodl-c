// app/(drawer)/(internal)/tokens/index.tsx
// Pantalla de todos los tokens - mejorada con componentes @ui

import React, { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import colors from "@/theme/colors";
import { usePortfolioStore, type ChainId, type CurrencyId, type Position } from "@/store/portfolio.store";
import { formatFiatAmount } from "@/utils/dashboard/currencyHelpers";
import { CURRENCY_SYMBOL, CURRENCY_LABEL } from "@/utils/dashboard/tokenHelpers";
import { pickRecommendedChain } from "@/utils/dashboard/tokenHelpers";
import type { Fiat } from "@/utils/dashboard/currencyHelpers";

// Componentes UI
import GlassHeader from "@/ui/GlassHeader";
import ScreenBg from "@/ui/ScreenBg";
import SearchField from "@/ui/SearchField";
import { GlassCard } from "@/ui/Glass";
import TokenIcon from "@app/(drawer)/(tabs)/(home)/components/TokenIcon";
import { styles } from "@app/(drawer)/(tabs)/(home)/_lib/_dashboardShared";

const TEXT_DIM = "#9FB7C2";
const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const href = <P extends Record<string, string>>(pathname: `/${string}`, params?: P) =>
  ({ pathname: pathname as any, params } as unknown as Href);

/* ====== Agrupación por token (igual filosofía que dashboard) ====== */
type TokenRow = {
  id: string;
  name: string;
  subtitle: string;
  valueUSD: number;
  nativeAmt: number;
  currencyId: CurrencyId;
  chains: ChainId[];
  accountId?: string;
  _fiatSort?: number;
};

function groupByCurrency(positions: Position[]) {
  const map: Record<string, Position[]> = {};
  for (const p of positions) {
    const key = String(p.currencyId);
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

function buildAggregatedRows(positions: Position[]): TokenRow[] {
  const byCurrency = groupByCurrency(positions);
  const rows: TokenRow[] = Object.entries(byCurrency).map(([currencyId, list]) => {
    const totalUSD = list.reduce((acc, x) => acc + (x.fiatValue ?? 0), 0);
    const totalNative = list.reduce((acc, x) => acc + (x.balance ?? 0), 0);
    // Obtener todas las chains únicas de las posiciones de este token
    const chainsArr = Array.from(new Set(list.map((x) => x.chainId))) as ChainId[];
    const subtitle = `${totalNative.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[currencyId as CurrencyId]}`;

    return {
      id: currencyId,
      name: CURRENCY_LABEL[currencyId as CurrencyId] ?? currencyId,
      subtitle,
      valueUSD: totalUSD,
      nativeAmt: totalNative,
      currencyId: currencyId as CurrencyId,
      chains: chainsArr, // Array de chains para mostrar badge multichain
      accountId: String(list[0]?.accountId ?? ""),
      _fiatSort: totalUSD,
    };
  });
  rows.sort((a, b) => (b._fiatSort ?? 0) - (a._fiatSort ?? 0));
  return rows;
}

/* ====== Filtro por cuenta ====== */
const ACCOUNT_IDS: Record<"daily" | "savings" | "social", string> = {
  daily: "daily",
  savings: "savings",
  social: "social",
};

/* =========================  SCREEN  ========================= */
export default function AllTokensScreen() {
  const { account = "daily" } = useLocalSearchParams<{ account?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Usar USD como default (igual que en el dashboard inicial)
  const validFiat: Fiat = "USD";

  // estado de búsqueda
  const [q, setQ] = useState("");

  // posiciones desde la store
  const allPositions = usePortfolioStore((s) => s.positions);

  // filtrar por cuenta
  const positions = useMemo(() => {
    const accId = (ACCOUNT_IDS[account as keyof typeof ACCOUNT_IDS] ?? account).toLowerCase();
    return allPositions.filter((p: any) => String(p?.accountId ?? "").toLowerCase() === accId);
  }, [allPositions, account]);

  // construir filas agregadas por token
  const rowsBase = useMemo(() => buildAggregatedRows(positions), [positions]);

  // búsqueda simple por nombre/símbolo
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rowsBase;
    return rowsBase.filter((r) => {
      const name = (r.name ?? "").toLowerCase();
      const sym = (CURRENCY_SYMBOL[r.currencyId] ?? "").toLowerCase();
      return name.includes(t) || sym.includes(t);
    });
  }, [q, rowsBase]);

  // Formateador de fiat
  const formatFiat = useCallback((usdAmount: number) => {
    return formatFiatAmount(usdAmount, "en", validFiat);
  }, [validFiat]);

  // navegar a details (elige red recomendada si solo hay una o no hay posiciones multi-chain)
  const openDetails = useCallback(
    async (r: TokenRow) => {
      await Haptics.selectionAsync();
      // Usar la nueva ruta de token details
      router.push({
        pathname: "/(drawer)/(internal)/token/[symbol]",
        params: { symbol: r.currencyId },
      });
    },
    [router]
  );

  /* ---- render item ---- */
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TokenRow>) => {
      const sym = CURRENCY_SYMBOL[item.currencyId];
      const symFiat = validFiat === "EUR" ? "€" : "$";
      const formattedValue = formatFiat(item.valueUSD).replace(symFiat, "").trim();
      
      return (
        <GlassCard style={localStyles.tokenCard}>
          <Pressable
            onPress={() => openDetails(item)}
            hitSlop={HIT}
            style={({ pressed }) => [styles.tokenRow, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <View style={styles.tokenLeft}>
              <TokenIcon currencyId={item.currencyId} chains={item.chains} />
              <View style={{ maxWidth: "72%" }}>
                <Text style={styles.tokenName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.tokenSub} numberOfLines={1}>{item.subtitle || sym}</Text>
              </View>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.tokenVal}>
                {formattedValue}
                {symFiat}
              </Text>
            </View>
          </Pressable>
        </GlassCard>
      );
    },
    [openDetails, formatFiat, validFiat]
  );

  return (
    <View style={localStyles.container}>
      <ScreenBg account={account === "daily" ? "Daily" : account === "savings" ? "Savings" : "Social"} />

      <GlassHeader
        leftSlot={
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={localStyles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        }
        centerSlot={<Text style={localStyles.headerTitle}>All Tokens</Text>}
        rightSlot={<View style={{ width: 40 }} />}
      />

      {/* Search */}
      <View style={[localStyles.searchContainer, { paddingTop: insets.top + 60 }]}>
        <SearchField
          value={q}
          onChangeText={setQ}
          placeholder="Search tokens..."
          onClear={() => setQ("")}
          containerStyle={localStyles.searchField}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={localStyles.sep} />}
        contentContainerStyle={[localStyles.listContent, { paddingBottom: insets.bottom + 24 }]}
        initialNumToRender={12}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={localStyles.emptyState}>
            <Text style={localStyles.emptyText}>No tokens to show.</Text>
          </View>
        }
      />
    </View>
  );
}

/* ========================= styles ========================= */
const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navBg },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchField: {
    marginHorizontal: 0,
  },

  listContent: {
    padding: 16,
  },

  tokenCard: {
    marginBottom: 0,
  },

  sep: { height: 12 },

  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: TEXT_DIM,
    fontSize: 14,
  },
});
