// app/(tabs)/tokens/index.tsx
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  Image,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import colors, { alpha } from "@/theme/colors";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import {
  usePortfolioStore,
  type ChainId,
  type CurrencyId,
  type Position,
} from "@/store/portfolio.store";

/* ===== Badges (mismos que dashboard) ===== */
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";

/* ===== Helpers compartidos con el dashboard ===== */
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

const PREFERRED_ORDER: ChainId[] = ["solana:mainnet", "eip155:1", "eip155:8453", "eip155:137"];
function orderChainsForBadge(list: ChainId[], max = 3): ChainId[] {
  const seen = new Set<ChainId>();
  const out: ChainId[] = [];
  for (const id of PREFERRED_ORDER) if (list.includes(id) && !seen.has(id)) { seen.add(id); out.push(id); }
  for (const id of list) if (!seen.has(id)) { seen.add(id); out.push(id); }
  return out.slice(0, max);
}

const ACCOUNT_NAME: Record<string, string> = { daily: "daily", savings: "savings", social: "social" };

/* ====== Iconos de token con mini-badges de redes (igual que en dashboard) ====== */
const MINI_BADGE_SIZE = 18;
const MINI_BADGE_RADIUS = MINI_BADGE_SIZE / 2;

const ChainCountMini = memo(function ChainCountMini({ count, size = MINI_BADGE_SIZE }: { count: number; size?: number }) {
  return (
    <View style={{ width: 14, height: 12, borderRadius: MINI_BADGE_RADIUS, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <ExtraBadge width={size} height={size} />
      <Text style={{ position: "absolute", color: "#000", fontSize: size * 0.55, fontWeight: "800" }}>{count}</Text>
    </View>
  );
});

const ChainMini = memo(function ChainMini({ chainId, size = MINI_BADGE_SIZE }: { chainId: ChainId; size?: number }) {
  const meta = CHAIN_BADGE[chainId];
  if (!meta) return null;
  const { Icon } = meta;
  const inner = Math.max(8, size - 4);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <Icon width={inner} height={inner} />
    </View>
  );
});

const TokenIcon = memo(function TokenIcon({ currencyId, chains = [] as ChainId[] }: { currencyId: CurrencyId; chains?: ChainId[] }) {
  const def = TOKEN_ICONS[currencyId] ?? DEFAULT_TOKEN_ICON;

  const ordered = orderChainsForBadge(chains, 99);
  const primary = ordered[0];
  const extraCount = Math.max(0, ordered.length - (primary ? 1 : 0));

  const BADGE_SIZE = MINI_BADGE_SIZE;
  const BADGE_BOTTOM = -8;
  const COUNTER_BOTTOM = -8;
  const WRAP_W = 36;
  const COUNTER_SHIFT = 1;

  const RIGHT = WRAP_W - BADGE_SIZE + 4;
  const CENTER = (WRAP_W - BADGE_SIZE) / 2 + COUNTER_SHIFT;

  return (
    <View style={styles.tokenIconWrap}>
      {(def as any)?.kind === "svg" ? (
        // @ts-ignore
        <def.Comp width={36} height={36} />
      ) : (
        <Image source={(def as any).src} style={styles.tokenIconImg} resizeMode="contain" />
      )}

      {(primary || extraCount > 0) && (
        <View style={styles.chainBadges}>
          {extraCount > 0 && (
            <View style={[styles.chainBadgeItem, { left: CENTER, bottom: COUNTER_BOTTOM, width: MINI_BADGE_SIZE, height: MINI_BADGE_SIZE, zIndex: 1 }]}>
              <ChainCountMini count={extraCount} size={MINI_BADGE_SIZE} />
            </View>
          )}
          {primary && (
            <View style={[styles.chainBadgeItem, { left: RIGHT, bottom: BADGE_BOTTOM, width: MINI_BADGE_SIZE + 4, height: MINI_BADGE_SIZE, zIndex: 2 }]}>
              <ChainMini chainId={primary} size={MINI_BADGE_SIZE} />
            </View>
          )}
        </View>
      )}
    </View>
  );
});

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
    const chainsArr = Array.from(new Set(list.map((x) => x.chainId))) as ChainId[];
    const subtitle = `${totalNative.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[currencyId as CurrencyId]}`;

    return {
      id: currencyId,
      name: CURRENCY_LABEL[currencyId as CurrencyId] ?? currencyId,
      subtitle,
      valueUSD: totalUSD,
      nativeAmt: totalNative,
      currencyId: currencyId as CurrencyId,
      chains: chainsArr,
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

  // navegar a details (elige red recomendada si solo hay una o no hay posiciones multi-chain)
  const openDetails = useCallback(
    async (r: TokenRow) => {
      await Haptics.selectionAsync();
      const chains = r.chains ?? [];
      const chosen = pickRecommendedChain(chains.length ? chains : (["eip155:1"] as ChainId[]));
      router.push(
        href("/(tabs)/token/[id]", {
          id: String(r.currencyId),
          chainId: String(chosen),
          accountId: String(r.accountId ?? ""),
        })
      );
    },
    [router]
  );

  /* ---- render item ---- */
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TokenRow>) => {
      const sym = CURRENCY_SYMBOL[item.currencyId];
      return (
        <Pressable
          onPress={() => openDetails(item)}
          hitSlop={HIT}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <View style={styles.left}>
            <TokenIcon currencyId={item.currencyId} chains={item.chains} />
            <View style={{ maxWidth: "72%" }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.sub} numberOfLines={1}>{item.subtitle || sym}</Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.value}>${(item.valueUSD ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
          </View>
        </Pressable>
      );
    },
    [openDetails]
  );

  return (
    <View style={styles.container}>
      {/* Fondo + leve gradiente para coherencia con dashboard */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
      <LinearGradient
        colors={["rgba(255,255,255,0.03)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header simple */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>All Tokens — {ACCOUNT_NAME[String(account).toLowerCase()] ?? "daily"}</Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <View style={styles.searchWrap}>
          <BlurView style={StyleSheet.absoluteFill} intensity={30} tint="dark" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search tokens..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        initialNumToRender={12}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: TEXT_DIM }}>No tokens to show.</Text>
          </View>
        }
      />
    </View>
  );
}

/* ========================= styles ========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: { paddingHorizontal: 16, paddingBottom: 6 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: 0.2 },

  searchWrap: {
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: alpha("#FFFFFF", 0.08),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  searchInput: { flex: 1, paddingHorizontal: 12, color: "#fff" },

  row: {
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
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sub: { color: TEXT_DIM, fontSize: 12, marginTop: 2 },
  value: { color: "#fff", fontWeight: "700" },

  sep: { height: 12 },

  tokenIconWrap: { width: 36, height: 36, position: "relative", overflow: "visible" },
  tokenIconImg: { width: 36, height: 36 },
  chainBadges: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, overflow: "visible" },
  chainBadgeItem: { position: "absolute", alignItems: "center", justifyContent: "center" },
});