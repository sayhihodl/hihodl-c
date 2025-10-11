// app/(tabs)/account/[accountId]/all.tsx
import React, { useMemo, useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Image, Platform } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors, { alpha } from "@/theme/colors";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import { usePortfolioStore, type ChainId, type CurrencyId, type Position } from "@/store/portfolio.store";

/* badges */
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";

/* ===== helpers compartidos con el dashboard ===== */
const BG = colors.navBg;
const TEXT_DIM = "#9FB7C2";
const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const href = <P extends Record<string, string>>(pathname: `/${string}`, params?: P) =>
  ({ pathname: pathname as any, params } as unknown as Href);

const CHAIN_BADGE: Record<ChainId, { Icon: React.ComponentType<any> }> = {
  "eip155:1": { Icon: EthBadge },
  "solana:mainnet": { Icon: SolBadge },
  "eip155:8453": { Icon: BaseBadge },
  "eip155:137": { Icon: PolyBadge },
};
const CHAIN_LABEL: Record<ChainId, string> = {
  "eip155:1": "Ethereum",
  "solana:mainnet": "Solana",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
};

const CURRENCY_LABEL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "USDT.tether": "USDT",
  "ETH.native": "Ethereum",
  "SOL.native": "Solana",
  "POL.native": "Polygon",
  "BTC.native": "Bitcoin",
  "DAI.maker": "DAI",
};
const CURRENCY_SYMBOL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "USDT.tether": "USDT",
  "ETH.native": "ETH",
  "SOL.native": "SOL",
  "POL.native": "POL",
  "BTC.native": "BTC",
  "DAI.maker": "DAI",
};

const RECOMMENDED_ORDER: ChainId[] = ["solana:mainnet", "eip155:8453", "eip155:137", "eip155:1"];
const pickRecommendedChain = (chains: ChainId[]) =>
  (RECOMMENDED_ORDER.find((c) => chains.includes(c)) ?? chains[0] ?? "eip155:1") as ChainId;

const normalizeChainId = (id: ChainId | string): ChainId =>
  id === "base:mainnet" ? ("eip155:8453" as ChainId) : (id as ChainId);

const MINI = 18;

/* --- UI minis --- */
const ChainMini = ({ chainId, size = MINI }: { chainId: ChainId; size?: number }) => {
  const meta = CHAIN_BADGE[chainId];
  if (!meta) return null;
  const { Icon } = meta;
  const inner = Math.max(8, size - 4);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <Icon width={inner} height={inner} />
    </View>
  );
};

const ChainCountMini = ({ count, size = MINI }: { count: number; size?: number }) => (
  <View style={{ width: 14, height: 12, borderRadius: size / 2, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    <ExtraBadge width={size} height={size} />
    <Text style={{ position: "absolute", color: "#000", fontSize: size * 0.55, fontWeight: "800", includeFontPadding: false }}>{count}</Text>
  </View>
);

const TokenIcon = ({ currencyId, chains = [] as ChainId[] }: { currencyId: CurrencyId; chains?: ChainId[] }) => {
  const def = TOKEN_ICONS[currencyId] ?? DEFAULT_TOKEN_ICON;
  const WRAP = 36;
  const BADGE = MINI;
  const primary = chains[0];
  const extra = Math.max(0, chains.length - (primary ? 1 : 0));
  return (
    <View style={{ width: WRAP, height: WRAP, position: "relative" }}>
      {(def as any)?.kind === "svg" ? (
        // @ts-ignore
        <def.Comp width={WRAP} height={WRAP} />
      ) : (
        <Image source={(def as any).src} style={{ width: WRAP, height: WRAP }} resizeMode="contain" />
      )}
      {primary && (
        <View style={{ position: "absolute", right: -2, bottom: -6 }}>
          <ChainMini chainId={primary} size={BADGE} />
        </View>
      )}
      {extra > 0 && (
        <View style={{ position: "absolute", left: 6, bottom: -6 }}>
          <ChainCountMini count={extra} size={BADGE} />
        </View>
      )}
    </View>
  );
};

/* --- datos --- */
type TokenRow = {
  id: string;
  name: string;
  subtitle: string;
  valueUSD: number;
  nativeAmt: number;
  currencyId: CurrencyId;
  chains: ChainId[];
  delta24hUSD?: number;
  delta24hPct?: number;
};

const groupByCurrency = (positions: Position[]) => {
  const map: Record<string, Position[]> = {};
  for (const p of positions) {
    const key = String(p.currencyId);
    (map[key] ??= []).push(p);
  }
  return map;
};

const pickDeltaUSD = (p: Position) => {
  const dx = (p as any)?.change24hUSD;
  if (typeof dx === "number") return dx;
  const pct = (p as any)?.pctChange24h;
  if (typeof pct === "number") return (p.fiatValue * pct) / 100;
  return 0;
};

const pickDeltaPctWeighted = (list: Position[], totalUSD: number): number | undefined => {
  if (totalUSD <= 0) return undefined;
  let acc = 0, withData = 0;
  for (const p of list) {
    const pct = (p as any)?.pctChange24h;
    if (typeof pct === "number" && isFinite(pct)) {
      acc += (p.fiatValue / totalUSD) * pct;
      withData++;
    }
  }
  return withData ? acc : undefined;
};

/* --- screen --- */
export default function AllTokensByAccount() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const positions = usePortfolioStore((s) => s.positions);

  const positionsForAccount = useMemo(() => {
    const target = String(accountId ?? "").toLowerCase();
    return positions.filter((p: any) => String(p?.accountId ?? "").toLowerCase() === target);
  }, [positions, accountId]);

  const rows: TokenRow[] = useMemo(() => {
    const byCurrency = groupByCurrency(positionsForAccount);
    const list: TokenRow[] = Object.entries(byCurrency).map(([currencyId, list]) => {
      const totalUSD = list.reduce((a, x) => a + (x.fiatValue ?? 0), 0);
      const totalNative = list.reduce((a, x) => a + (x.balance ?? 0), 0);
      const chains = Array.from(new Set(list.map((x) => normalizeChainId(x.chainId))));
      return {
        id: currencyId,
        name: CURRENCY_LABEL[currencyId as CurrencyId] ?? currencyId,
        subtitle: `${totalNative.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[currencyId as CurrencyId]}`,
        valueUSD: totalUSD,
        nativeAmt: totalNative,
        currencyId: currencyId as CurrencyId,
        chains,
        delta24hUSD: list.reduce((a, p) => a + pickDeltaUSD(p), 0),
        delta24hPct: pickDeltaPctWeighted(list, totalUSD),
      };
    });
    list.sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));
    return list;
  }, [positionsForAccount]);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const sym = CURRENCY_SYMBOL[r.currencyId]?.toLowerCase() ?? "";
      return r.name.toLowerCase().includes(q) || sym.includes(q);
    });
  }, [rows, query]);

  const openToken = useCallback(
    async (row: TokenRow) => {
      await Haptics.selectionAsync();
      const chainId = pickRecommendedChain(row.chains);
      router.push(
        href("/(tabs)/token/[id]", {
          id: String(row.currencyId),
          chainId: String(chainId),
          accountId: String(accountId ?? ""),
        })
      );
    },
    [router, accountId]
  );

  const titleAcc = String(accountId ?? "").toLowerCase();

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.h1}>All Tokens — {titleAcc}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tokens..."
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.search}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const up = (item.delta24hUSD ?? 0) >= 0;
          const delta =
            typeof item.delta24hPct === "number"
              ? `${up ? "+" : ""}${(item.delta24hPct ?? 0).toFixed(2)}%`
              : undefined;
          const chainSubtitle =
            item.chains.length > 1 ? "Multi-chain" : CHAIN_LABEL[item.chains[0] as ChainId];

          return (
            <Pressable onPress={() => openToken(item)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} hitSlop={HIT}>
              <View style={styles.left}>
                <TokenIcon currencyId={item.currencyId} chains={item.chains} />
                <View style={{ maxWidth: "70%" }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {CURRENCY_SYMBOL[item.currencyId]} · {item.name}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {chainSubtitle}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.usd}>${(item.valueUSD ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                {delta ? (
                  <Text style={[styles.delta, up ? styles.deltaUp : styles.deltaDown]}>{delta}</Text>
                ) : (
                  <Text style={styles.native}>
                    {item.nativeAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {CURRENCY_SYMBOL[item.currencyId]}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Text style={{ color: TEXT_DIM }}>No tokens on this account.</Text>
          </View>
        }
      />
    </View>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  h1: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 0.2 },

  search: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: alpha("#FFFFFF", 0.08),
    color: "#fff",
  },

  card: {
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(2, 48, 71, 0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...(Platform.OS === "android" ? { elevation: 3 } : null),
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { color: "#fff", fontWeight: "700" },
  sub: { color: TEXT_DIM, marginTop: 2, fontSize: 12 },
  usd: { color: "#fff", fontWeight: "700" },
  native: { color: TEXT_DIM, marginTop: 2, fontSize: 12 },
  delta: { marginTop: 2, fontSize: 12, fontWeight: "700" },
  deltaUp: { color: "#20d690" },
  deltaDown: { color: "#ff6b6b" },
});