// app/(tabs)/(home)/index.tsx
import BottomSheet from "@/components/BottomSheet/BottomSheet";
import TransactionDetailsSheet, { type TxDetails } from "@/components/tx/TransactionDetailsSheet";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import {
  usePortfolioStore,
  type ChainId,
  type CurrencyId,
  type Position,
} from "@/store/portfolio.store";
import colors from "@/theme/colors";
import BaseBadge from "@assets/chains/Base-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import SolBadge from "@assets/chains/Solana-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useScrollToTop, useNavigation, DrawerActions  } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, usePathname, type Href } from "expo-router";
import { useProfileStore } from "@/store/profile";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { displayAmount } from "@/utils/money";
import SegmentedPills from "@/ui/SegmentedPills";
import 'react-native-get-random-values';
import 'react-native-webcrypto'; // expone globalThis.crypto con subtle, getRandomValues, etc.
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ColorValue,
  type ViewStyle,
} from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/* ====== colores base + styles PRIMERO ====== */
const BG = colors.navBg;
const YELLOW = colors.primary;
const TEXT = "#CFE3EC";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bodyPad: { paddingHorizontal: 14 },
  header: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#7CC2D1" },
  handle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  headerRight: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },

  miniAction: { width: 68, alignItems: "center" },
  miniIconWrap: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
    backgroundColor: YELLOW, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  miniLabel: { color: "#fff", fontSize: 12, marginTop: 6, fontWeight: "600" },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 58 },
  addTokenBtn: { marginTop: 8, alignItems: "center", paddingVertical: 10 },
  addTokenTxt: { color: TEXT, fontWeight: "600" },

  tabsRow: { flexDirection: "row", gap: 8, marginTop: 6, justifyContent: "center" },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)" },
  tabBtnActive: { backgroundColor: "#fff" },
  tabTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  tabTxtActive: { color: "#0A1A24" },

  balanceWrap: { alignItems: "center", justifyContent: "center", marginTop: 8 },
  balance: { color: "#fff", fontSize: 42, fontWeight: "500", letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  eqRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  eqBadge: { backgroundColor: YELLOW, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, alignItems: "center" },
  eqText: { color: "#0A1A24", fontWeight: "700", fontSize: 12, letterSpacing: 0.2 },
  gain: { color: "#20d690", fontWeight: "700", fontSize: 12 },
  fiatToggle: { marginLeft: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  fiatToggleTxt: { color: "#fff", fontWeight: "600", fontSize: 11 },

  actionsSwipeArea: { marginTop: 16 },
  actionsRowFixed: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  tokenRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  tokenLeft: { flexDirection: "row", alignItems: "center", gap: 12, overflow: "visible" },
  tokenName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  tokenSub: { color: "#fff", fontSize: 12, opacity: 0.8, marginTop: 2 },
  tokenVal: { color: "#fff", fontSize: 14, fontWeight: "500" },
  tokenValSecondary: { color: TEXT, fontSize: 12, marginTop: 2 },
  tokenDelta: { fontSize: 12, fontWeight: "500" },
  deltaUp: { color: "#20d690" },
  deltaDown: { color: "#ff6b6b" },

  tokenIconWrap: { width: 36, height: 36, position: "relative", overflow: "visible" },
  tokenIconImg: { width: 36, height: 36 },
  chainBadges: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, overflow: "visible" },
  chainBadgeItem: { position: "absolute", alignItems: "center", justifyContent: "center" },

  activityRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityTitle: { color: "#fff", fontSize: 14, fontWeight: "500" },
  activityWhen: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  activityAmt: { color: "#fff", fontSize: 14, fontWeight: "500" },

  paymentsAvatarWrap: { width: 30, height: 30, borderRadius: 8, overflow: "visible" },
  paymentsAvatar: { width: 30, height: 30, borderRadius: 6 },
  paymentsAvatarInitial: { color: "#081217", fontWeight: "900", textAlign: "center", lineHeight: 30 },
  paymentsBadge: {
    position: "absolute", right: -6, bottom: -6, width: 18, height: 18, borderRadius: 7,
    backgroundColor: YELLOW, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.25)",
  },

  viewAll: { color: TEXT, fontWeight: "600" },

  // Banners
  bannerCard: {
    backgroundColor: "rgba(27,45,54,0.85)", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start",
    minHeight: 60, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)",
  },
  bannerTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  bannerBody: { color: "#FFFFFF", fontSize: 13 },
  bannerUntil: { color: "#9eb4bd", fontSize: 12 },
  bannerCtaTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)", marginHorizontal: 3 },
  bannerDotOn: { backgroundColor: "#fff" },
});

/* -------------------- helpers / consts -------------------- */
const normalizeChainId = (id: ChainId): ChainId => {
  if ((id as unknown as string) === "base:mainnet") return "eip155:8453" as ChainId;
  return id;
};

const href = <P extends Record<string, string>>(pathname: `/${string}`, params?: P) =>
  ({ pathname: pathname as any, params } as unknown as Href);

type Account = "Daily" | "Savings" | "Social";
const ACCOUNTS_ORDER: Account[] = ["Daily", "Savings", "Social"];
const ACCOUNT_IDS: Record<Account, string> = { Daily: "daily", Savings: "savings", Social: "social" };
const ID_TO_ACCOUNT: Record<string, Account> = { daily: "Daily", savings: "Savings", social: "Social" };

type Fiat = "USD" | "EUR";
const FX = { EUR: 0.92 as const };
const makeFiatFormatter = (fiat: Fiat) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: fiat, maximumFractionDigits: 2 });

/** ====== Dust / mínimos visibles ====== **/
const DUST_USD = 1;
const DUST_NATIVE = 0;
const keepRow = (showDust: boolean, valueUSD: number, nativeAmt: number) =>
  showDust || valueUSD >= DUST_USD || nativeAmt >= DUST_NATIVE;

const PREFERRED_ORDER: ChainId[] = ["solana:mainnet", "eip155:1", "eip155:8453", "eip155:137"];
function orderChainsForBadge(list: ChainId[], max = 3): ChainId[] {
  const seen = new Set<ChainId>();
  const out: ChainId[] = [];
  for (const id of PREFERRED_ORDER) if (list.includes(id) && !seen.has(id)) { seen.add(id); out.push(id); }
  for (const id of list) if (!seen.has(id)) { seen.add(id); out.push(id); }
  return out.slice(0, max);
}
const TABS_PREFIX = "/(drawer)/(tabs)";
const CURRENCY_NATIVE_CHAIN: Partial<Record<CurrencyId, ChainId>> = {
  "ETH.native": "eip155:1",
  "SOL.native": "solana:mainnet",
  "POL.native": "eip155:137",
};

const CHAIN_BADGE: Record<ChainId, { Icon: React.ComponentType<any> }> = {
  "eip155:1": { Icon: EthBadge },
  "solana:mainnet": { Icon: SolBadge },
  "eip155:8453": { Icon: BaseBadge },
  "eip155:137": { Icon: PolyBadge },
};

let ICON_USDC: any, ICON_USDT: any, ICON_BTC: any;
try { ICON_USDC = require("@assets/tokens/usdc.png"); } catch {}
try { ICON_USDT = require("@assets/tokens/usdt.png"); } catch {}
try { ICON_BTC = require("@assets/tokens/btc.png"); } catch {}

const RECOMMENDED_ORDER: ChainId[] = ["solana:mainnet", "eip155:8453", "eip155:137", "eip155:1"];
const pickRecommendedChain = (chains: ChainId[]) =>
  (RECOMMENDED_ORDER.find(c => chains.includes(c)) ?? chains[0] ?? "eip155:1") as ChainId;

const TOKEN_ICON_OVERRIDES: Partial<Record<CurrencyId | "BTC.native" | "DAI.maker", { kind: "png"; src: any }>> = {
  "USDC.circle": ICON_USDC ? { kind: "png", src: ICON_USDC } : undefined,
  "USDT.tether": ICON_USDT ? { kind: "png", src: ICON_USDT } : undefined,
  "BTC.native": ICON_BTC ? { kind: "png", src: ICON_BTC } : undefined,
};

const CURRENCY_LABEL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "SOL.native": "Solana",
  "ETH.native": "Ethereum",
  "POL.native": "Polygon",
  "USDT.tether": "USDT",
  "BTC.native": "Bitcoin",
  "DAI.maker": "DAI",
};
const CURRENCY_SYMBOL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "SOL.native": "SOL",
  "ETH.native": "ETH",
  "POL.native": "POL",
  "USDT.tether": "USDT",
  "BTC.native": "BTC",
  "DAI.maker": "DAI",
};

const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const PAGE_GAP_LEFT = 18;
const PAGE_GAP_RIGHT = 18;
const HERO_HEIGHT = 330;
const HERO_HPAD = 16;
const SEAM_HEIGHT = 38;
const CONTENT_TOP_OFFSET = 68; // ajusta a gusto: 16 / 24 / 32…

const MINI_BADGE_SIZE = 18;
const MINI_BADGE_RADIUS = MINI_BADGE_SIZE / 2;

const ACCOUNT_GRADS: Record<Account, readonly [ColorValue, ColorValue]> = {
  Daily: ["rgba(0,194,255,0.45)", "rgba(54,224,255,0.00)"],
  Savings: ["rgba(84,242,165,0.35)", "rgba(84,242,165,0.00)"],
  Social: ["rgba(111,91,255,0.40)", "rgba(255,115,179,0.00)"],
} as const;

const STABLES: CurrencyId[] = ["USDC.circle", "USDT.tether"];
const SUPPORTED_CHAINS: ChainId[] = ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"];

/* ================= helpers FUERA del componente ================= */
export type TokenParams = { id: CurrencyId; chainId?: ChainId; accountId: string };
export const buildTokenTargetKey = (p: TokenParams) =>
  `${p.id}::${p.chainId ?? ""}::${p.accountId}`;

/* ----------------- placeholders stables ----------------- */
function withStablecoinPlaceholders(base: Position[], account: Account): Position[] {
  const out = [...base];
  const have = new Set(base.map((p) => `${p.currencyId}::${p.chainId}`));
  for (const cur of STABLES) {
    for (const ch of SUPPORTED_CHAINS) {
      const key = `${cur}::${ch}`;
      if (!have.has(key)) {
        out.push({
          // @ts-ignore UI only
          accountId: ACCOUNT_IDS[account],
          currencyId: cur,
          chainId: ch,
          balance: 0,
          fiatValue: 0,
        } as unknown as Position);
      }
    }
  }
  return out;
}

/* ----------------- componentes memo ----------------- */
const ChainCountMini = memo(function ChainCountMini({ count, size = MINI_BADGE_SIZE }: { count: number; size?: number }) {
  return (
    <View style={{ width: 14, height: 12, borderRadius: MINI_BADGE_RADIUS, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <ExtraBadge width={size} height={size} />
      <Text style={{ position: "absolute", color: "#000", fontSize: size * 0.55, fontWeight: "800" }}>
        {count}
      </Text>
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

const TokenIcon = memo(function TokenIcon({ currencyId, chains = [] as ChainId[] }: { currencyId: CurrencyId | "BTC.native" | "DAI.maker"; chains?: ChainId[] }) {
  const def = TOKEN_ICON_OVERRIDES?.[currencyId] ?? TOKEN_ICONS[currencyId as CurrencyId] ?? DEFAULT_TOKEN_ICON;
  const isNative = !!CURRENCY_NATIVE_CHAIN[currencyId as CurrencyId] || currencyId === "BTC.native";
  const baseChains: ChainId[] = isNative ? [] : Array.isArray(chains) ? chains : [];

  const ordered = orderChainsForBadge(baseChains, 99);
  const primary = ordered[0];
  const extraCount = Math.max(0, ordered.length - (primary ? 1 : 0));

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
            <View style={[styles.chainBadgeItem, { left: 10, bottom: -8, width: MINI_BADGE_SIZE, height: MINI_BADGE_SIZE, zIndex: 1 }]}>
              <ChainCountMini count={extraCount} size={MINI_BADGE_SIZE} />
            </View>
          )}

          {primary && (
            <View style={[styles.chainBadgeItem, { left: 22, bottom: -8, width: MINI_BADGE_SIZE + 4, height: MINI_BADGE_SIZE, zIndex: 2 }]}>
              <ChainMini chainId={primary} size={MINI_BADGE_SIZE} />
            </View>
          )}
        </View>
      )}
    </View>
  );
});




/* -------------------- data helpers -------------------- */
type TokenRow = {
  id: string; name: string; subtitle: string; valueUSD: number; nativeAmt: number;
  currencyId: CurrencyId; chainId?: ChainId; chains?: ChainId[];
  delta24hUSD?: number; delta24hPct?: number; _fiatSort?: number;
};

type ExtendedCurrency = CurrencyId | "BTC.native" | "DAI.maker";

/* ====== payments avatar & actions ====== */

const Avatar = memo(function Avatar({ title, type, photo }: { title: string; type: "in" | "out" | "refund"; photo?: any }) {
  const ch = (title || "").replace(/^@/, "").trim().charAt(0).toUpperCase() || "?";
  return (
    <View style={styles.paymentsAvatarWrap}>
      {photo ? <Image source={photo} style={styles.paymentsAvatar} /> : (
        <View style={[styles.paymentsAvatar, { backgroundColor: "#7CC2D1" }]}>
          <Text style={styles.paymentsAvatarInitial}>{ch}</Text>
        </View>
      )}
      <View style={styles.paymentsBadge}>
        {type === "in" && <Ionicons name="arrow-back" size={12} color="#081217" />}
        {type === "out" && <Ionicons name="arrow-forward" size={12} color="#081217" />}
        {type === "refund" && <Ionicons name="arrow-undo" size={12} color="#081217" />}
      </View>
    </View>
  );
});

const MiniAction = memo(function MiniAction({
  icon, label, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const handlePress = useCallback(() => { void Haptics.selectionAsync(); onPress(); }, [onPress]);
  return (
    <Pressable style={styles.miniAction} onPress={handlePress} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.miniIconWrap}><Ionicons name={icon} size={20} /></View>
      <Text style={styles.miniLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
});

/* -------------------- grouping helpers -------------------- */
function groupByCurrency(positions: Position[]) {
  const map: Record<string, Position[]> = {};
  for (const p of positions) {
    const key = String(p.currencyId);
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}


function pickDeltaUSD(p: Position): number {
  const dx = (p as any)?.change24hUSD;
  if (typeof dx === "number") return dx;
  const pct = (p as any)?.pctChange24h;
  if (typeof pct === "number") return (p.fiatValue * pct) / 100;
  return 0;
}
function pickDeltaPctWeighted(list: Position[], _totalUSD: number): number | undefined {
  let acc = 0;
  let weightSum = 0;
  for (const p of list) {
    const pct = (p as any)?.pctChange24h;
    if (typeof pct === "number" && isFinite(pct)) {
      acc += (p.fiatValue ?? 0) * pct;
      weightSum += (p.fiatValue ?? 0);
    }
  }
  return weightSum > 0 ? acc / weightSum : undefined;
}

/* =========================  Catálogo Add Token ========================= */
export type CatalogItem = {
  currencyId: CurrencyId | "BTC.native" | "DAI.maker";
  chains?: ChainId[];
};

export const TOKENS_CATALOG: CatalogItem[] = [
  { currencyId: "ETH.native" },
  { currencyId: "SOL.native" },
  { currencyId: "USDC.circle", chains: ["eip155:1", "eip155:8453", "eip155:137", "solana:mainnet"] },
  { currencyId: "USDT.tether", chains: ["eip155:1", "eip155:8453", "eip155:137", "solana:mainnet"] },
  { currencyId: "POL.native" },
];

export function buildAggregatedRows(positions: Position[]) {
  const byCurrency = groupByCurrency(positions);
  const rows: TokenRow[] = Object.entries(byCurrency).map(([currencyId, list]) => {
    const totalUSD = list.reduce((acc, x) => acc + x.fiatValue, 0);
    const totalNative = list.reduce((acc, x) => acc + x.balance, 0);
    const chainsArr = Array.from(new Set(list.map((x) => normalizeChainId(x.chainId))));
    const subtitle = `${totalNative.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[currencyId as CurrencyId]}`;
    const delta24hUSD = list.reduce((a, p) => a + pickDeltaUSD(p), 0);
    const delta24hPct = pickDeltaPctWeighted(list, totalUSD);
    return {
      id: currencyId,
      name: CURRENCY_LABEL[currencyId as CurrencyId] ?? currencyId,
      subtitle,
      valueUSD: totalUSD,
      nativeAmt: totalNative,
      currencyId: currencyId as CurrencyId,
      chains: chainsArr,
      delta24hUSD,
      delta24hPct,
      _fiatSort: totalUSD,
    };
  });
  rows.sort((a, b) => (b._fiatSort ?? 0) - (a._fiatSort ?? 0));
  return { rows, byCurrency };
}

// Tipos del Drawer que usa Expo Router
export type RootDrawerParamList = {
  "(tabs)": undefined;   // pantalla principal con tabs
  menu: undefined;       // tu pantalla/lado de menú
};

export function buildSplitRows(positions: Position[]) {
  const rows: TokenRow[] = positions.map((p) => ({
    id: `${p.currencyId}:${p.chainId}`,
    name: CURRENCY_LABEL[p.currencyId],
    subtitle: `${p.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[p.currencyId]}`,
    valueUSD: p.fiatValue,
    nativeAmt: p.balance,
    currencyId: p.currencyId,
    chainId: p.chainId,
    chains: [p.chainId],
    delta24hUSD: pickDeltaUSD(p),
    delta24hPct: (p as any)?.pctChange24h,
    _fiatSort: p.fiatValue,
  }));
  rows.sort((a, b) => (b._fiatSort ?? 0) - (a._fiatSort ?? 0));
  return { rows, byCurrency: groupByCurrency(positions) };
}

/* =========================  Mock de payments ========================= */
export type PaymentKind = "in" | "out" | "refund";
export type PaymentItem = { id: string; title: string; when: string; amount: string; type: PaymentKind };

export const PAYMENTS_MOCK: Record<"Daily" | "Savings" | "Social", PaymentItem[]> = {
  Daily: [
    { id: "a1", title: "@satoshi", when: "Yesterday, 22:27", amount: "+ USDT 19.00", type: "in" },
    { id: "a2", title: "Apple inc.", when: "27 May, 09:05", amount: "- USDC 124.24", type: "out" },
    { id: "a3", title: "@helloalex", when: "Yesterday, 21:17", amount: "- USDT 15.00", type: "out" },
    { id: "a4", title: "@gerard", when: "Yesterday, 20:02", amount: "- USDT 49.00", type: "refund" },
    { id: "a5", title: "@maria", when: "Today, 11:14", amount: "+ USDC 35.80", type: "in" },
    { id: "a6", title: "Netflix", when: "Today, 08:40", amount: "- USDC 12.99", type: "out" },
  ],
  Savings: [
    { id: "s1", title: "@satoshi", when: "Yesterday, 22:27", amount: "+ USDT 19.00", type: "in" },
    { id: "s2", title: "Apple inc.", when: "27 May, 09:05", amount: "- USDC 124.24", type: "out" },
    { id: "s3", title: "@helloalex", when: "Yesterday, 21:17", amount: "- USDT 15.00", type: "out" },
    { id: "s4", title: "@gerard", when: "Yesterday, 20:02", amount: "- USDT 49.00", type: "refund" },
  ],
  Social: [
    { id: "p1", title: "@friend1", when: "Yesterday, 18:22", amount: "+ USDT 7.00", type: "in" },
    { id: "p2", title: "@friend2", when: "Yesterday, 16:03", amount: "- USDT 4.20", type: "out" },
  ],
};

/* =========================  Banners / UI ========================= */
type BannerItem = {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; href?: Href };
  until?: string;
  tint?: string;
};

const BANNERS_SEED: BannerItem[] = [
  { id: "invite-60", title: "Invite friends, earn €60", body: "Earn €60 for each friend you invite by 9 September.", until: "T&Cs apply", tint: "#7CC2D1" },
  { id: "keys-safety", title: "Take care of your private keys", body: "Never share them. We will never ask for them.", tint: "#FFB703" },
  { id: "Always private", title: "Remember, not your keys not your money", body: "Stay safe always with HIHODL.", tint: "#A68CFF" },
];

function GlassCard({ children, style, radius = 16 }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; radius?: number }) {
  const rounded = { borderRadius: radius };

  if (Platform.OS === "ios") {
    return (
      <View style={[{ marginTop: 14 }, style]}>
        <View style={[{ overflow: "hidden", ...rounded }]}>
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, rounded]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, rounded, { backgroundColor: "rgba(3, 12, 16, 0.35)" }]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, rounded, { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)" }]} />
          <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          marginTop: 14,
          backgroundColor: "rgba(2, 48, 71, 0.78)",
          borderRadius: radius,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.12)",
          elevation: 7,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const PEEK = 12;
const GAP = PEEK;
const BODY_PAD = 14;
const CLOSE_COLOR = "#365A66";

const BannerCarousel = memo(function BannerCarousel({
  data,
  onDismiss,
  onPressCta,
  width,
}: {
  data: BannerItem[];
  onDismiss: (id: string) => void;
  onPressCta?: (b: BannerItem) => void;
  width: number;
}) {
  const CARD_W = width - BODY_PAD * 2 - PEEK;

  const [index, setIndex] = useState(0);
  const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 20 }).current;
  const onViewChanged = useRef(
    (params: { viewableItems: { index?: number | null }[] }) => {
      const i = params.viewableItems?.[0]?.index;
      if (i != null) setIndex(i);
    }
  ).current;

  return (
    <View style={{ marginTop: 10 }}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: BODY_PAD, paddingRight: BODY_PAD - PEEK }}
        onViewableItemsChanged={onViewChanged}
        viewabilityConfig={viewCfg as any}
        renderItem={({ item, index: i }) => (
          <View style={{ width: CARD_W, marginRight: i === data.length - 1 ? 0 : GAP }}>
            <View style={styles.bannerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bannerBody} numberOfLines={3}>{item.body}</Text>
                {!!item.until && <Text style={styles.bannerUntil}>{item.until}</Text>}
                {!!item.cta && (
                  <Pressable style={{ marginTop: 6, backgroundColor: "#0A1A24", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" }} onPress={() => onPressCta?.(item)} hitSlop={6}>
                    <Text style={styles.bannerCtaTxt}>{item.cta.label}</Text>
                  </Pressable>
                )}
              </View>

              <Pressable onPress={() => onDismiss(item.id)} style={{ marginLeft: 8, marginTop: 2, alignSelf: "flex-start" }} hitSlop={10} accessibilityLabel="Dismiss">
                <Ionicons name="close" size={13} color={CLOSE_COLOR} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {data.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
          {data.map((_, i) => (
            <View key={i} style={[styles.bannerDot, i === index && styles.bannerDotOn]} />
          ))}
        </View>
      )}
    </View>
  );
});

/* =========================  MAIN SCREEN  ========================= */
export default function Dashboard() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { account: accountParam } = useLocalSearchParams<{ account?: string }>();

  // ---- contenedor horizontal: Menú (página 0) | Dashboard (página 1)
 const hPagerRef = useRef<ScrollView | null>(null); 
 const pathname = usePathname();

const openTokenDetails = useCallback((
  arg: string | { id: string; chainId?: string | null; account: string }
) => {
  const tokenKey =
    typeof arg === "string"
      ? arg
      : `${arg.id}::${arg.chainId ?? ""}::${arg.account}`;

  const href: Href = {
    pathname: "/(drawer)/(tabs)/token/[tokenId]" as const,
    params: { tokenId: tokenKey },
  };
   // 👉 si ya estamos en un token, NO apilamos otro: reemplazamos
  if (pathname?.startsWith("/(drawer)/(tabs)/token/")) {
    router.replace(href);
  } else {
    router.push(href);
  }
}, [pathname]);

 const edgeSwipeLockRef = useRef(false);
 const inToken = pathname?.startsWith("/(tabs)/token/");
  // Arrancar directamente en el dashboard (derecha)
  useEffect(() => {
    hPagerRef.current?.scrollTo({ x: width, animated: false });
  }, [width]);

  // ---- Deriva cuenta inicial del parámetro para el pager vertical de cuentas
  const initialAccountFromParam = useMemo<Account>(() => {
    const parsed = ID_TO_ACCOUNT[String(accountParam ?? "").toLowerCase()];
    return parsed ?? "Daily";
  }, [accountParam]);

  // ---- Cuenta actual (derivada del parámetro)  ✅ MOVER ARRIBA
const account: Account = useMemo(() => {
  return ID_TO_ACCOUNT[String(accountParam ?? "").toLowerCase()] ?? "Daily";
}, [accountParam]);

// ---- Refs Pager <-> URL
const pagerRef = useRef<PagerView>(null);
const ignoreNextOnPageRef = useRef(false);
const initialPageRef = useRef<number>(
  Math.max(0, ACCOUNTS_ORDER.indexOf(initialAccountFromParam))
);

// Índice activo de la cuenta para las pills
const accountIndex = useMemo(
  () => Math.max(0, ACCOUNTS_ORDER.indexOf(account)),
  [account]
);

// Progreso animado para SegmentedPills (position + offset del PagerView)
const pagerProg = useRef(new Animated.Value(accountIndex)).current;
useEffect(() => { pagerProg.setValue(accountIndex); }, [accountIndex]);

const onPageScroll = useCallback((e: any) => {
  const { position = 0, offset = 0 } = e?.nativeEvent ?? {};
  pagerProg.setValue(position + offset);
}, [pagerProg]);

  /* ---------- STATE ---------- */
  const [fiat, setFiat] = useState<Fiat>("USD");
  const [showDust, setShowDust] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [txSheetOpen, setTxSheetOpen] = useState(false);
  const [txPayment, setTxPayment] = useState<TxDetails | null>(null);
  

 const profileAvatar = useProfileStore((s) => s.avatar);
 const profileUsername = useProfileStore((s) => s.username); 


  /* ---------- Stores ---------- */
  const positions = usePortfolioStore((s) => s.positions);
  const mode = usePortfolioStore((s) => s.mode);

  /* ---------- Sincroniza pager al parámetro ---------- */
  useEffect(() => {
    const idx = ACCOUNTS_ORDER.indexOf(account);
    if (idx >= 0) {
      ignoreNextOnPageRef.current = true;
      pagerRef.current?.setPageWithoutAnimation?.(idx);
    }
  }, [account]);

  /* ---------- Pull to refresh ---------- */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 900));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ----- Add Token Sheet open/close -----
  const [addTokenSheetOpen, setAddTokenSheetOpen] = useState(false);
  const openAddTokenSheet = useCallback(() => setAddTokenSheetOpen(true), []);
  const closeAddTokenSheet = useCallback(() => setAddTokenSheetOpen(false), []);

  /* ---------- Tx details ---------- */
  const parseAmount = (raw: string) => {
    const m = raw.match(/^([+-])\s*([A-Z]+)\s+([\d.,]+)/);
    if (!m) return { dir: "in" as const, sym: undefined, amt: undefined };
    const sign = m[1] === "-" ? -1 : 1;
    const sym = m[2];
    const amt = sign * parseFloat(m[3].replace(",", ""));
    return { dir: sign >= 0 ? ("in" as const) : ("out" as const), sym, amt };
  };

  const openTxDetails = useCallback((p: PaymentItem) => {
    const { dir, sym, amt } = parseAmount(p.amount);
    setTxPayment({
      id: p.id,
      dir,
      when: p.when,
      peer: p.title,
      status: "Succeeded",
      tokenSymbol: sym,
      tokenAmount: amt,
    });
    setTxSheetOpen(true);
  }, []);

  const closeTxDetails = useCallback(() => {
    setTxSheetOpen(false);
    setTxPayment(null);
  }, []);

  /* ---------- Navegación ---------- */
 const push = useCallback((p: Href) => router.navigate(p), []);

// Acciones desde el sheet de transacción
const onTxReceive = useCallback(() => {
  closeTxDetails();
  router.navigate(href("/(drawer)/(tabs)/receive", { account: ACCOUNT_IDS[account] }));
}, [closeTxDetails, account]);

const onTxSend = useCallback(() => {
  closeTxDetails();
  router.navigate(href("/(drawer)/(tabs)/send", { account: ACCOUNT_IDS[account] }));
}, [closeTxDetails, account]);

const onTxSwap = useCallback(() => {
  closeTxDetails();
  router.navigate(`/(drawer)/(tabs)/swap?account=${ACCOUNT_IDS[account]}`);
}, [closeTxDetails, account]);

// Accesos directos (hero actions / etc.)
const goReceive = useCallback(
  () => push(href("/(drawer)/(tabs)/receive", { account: ACCOUNT_IDS[account] })),
  [push, account]
);

const goSend = useCallback(
  () => push(href("/(drawer)/(tabs)/send", { account: ACCOUNT_IDS[account] })),
  [push, account]
);

const goSwap = useCallback(
  () => router.navigate(`/(drawer)/(tabs)/swap?account=${ACCOUNT_IDS[account]}`),
  [account]
);

const goCards = useCallback(() => {
  router.navigate({
    pathname: "/(drawer)/(tabs)/cards/[id]",
    params: { id: "general", account: ACCOUNT_IDS[account] },
  });
}, [account]);

const goPaymentsFor = useCallback(
  (acc: Account) => router.navigate(href("/(drawer)/(tabs)/payments", { account: ACCOUNT_IDS[acc] })),
  []
);

const goAllTokens = useCallback(
  () => { router.navigate(`/(drawer)/(tabs)/account/${ACCOUNT_IDS[account]}/all?section=tokens`); },
  [account]
);

const openScanner = useCallback(() => {
  void Haptics.selectionAsync();
  router.push("/(drawer)/(tabs)/receive/scanner" as Href);
}, []);



  /* ---------- Datos por cuenta ---------- */
  const paymentsForAccount = useMemo<PaymentItem[]>(() => PAYMENTS_MOCK[account] ?? [], [account]);
  const paymentsTop = useMemo(() => paymentsForAccount.slice(0, 4), [paymentsForAccount]);
  const showPaymentsViewAll = paymentsForAccount.length > 4;

  const [addTokenQuery, setAddTokenQuery] = useState("");
  const [banners, setBanners] = useState<BannerItem[]>(BANNERS_SEED);
  const dismissBanner = useCallback((_id: string) => setBanners([]), []);
  const pressBannerCta = useCallback((b: BannerItem) => {
    if (b.cta?.href) router.navigate(b.cta.href as Href);
    void Haptics.selectionAsync();
  }, []);

  const positionsForAccount = useMemo(() => {
    const target = (ACCOUNT_IDS[account] ?? account).toLowerCase();
    const filtered = positions.filter((p: any) => String(p?.accountId ?? "").toLowerCase() === target);
    return withStablecoinPlaceholders(filtered, account);
  }, [positions, account]);

  // --------- Candados para navegación de Token Details
  const navBusyRef = useRef(false);
  const tokenNavLockRef = useRef(false);
  const lastTokenTargetRef = useRef<string | null>(null);

  useEffect(() => {
  const isToken = pathname?.startsWith("/(tabs)/token/");
  if (!isToken) {
    tokenNavLockRef.current = false;
    lastTokenTargetRef.current = null;
  }
}, [pathname]);

  const guardNav = useCallback((fn: () => void) => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    setTimeout(() => (navBusyRef.current = false), 500);
    fn();
  }, []);

  /* ---------- seed + rows ---------- */
  const positionsSeeded = useMemo(() => {
    const dev = [...positionsForAccount];
    const present = new Set(dev.map(p => `${p.currencyId}::${p.chainId}`));
    const mk = (currencyId: CurrencyId, chainId: ChainId, usd: number, bal: number): Position =>
      ({ accountId: ACCOUNT_IDS[account], currencyId, chainId, fiatValue: usd, balance: bal } as unknown as Position);
    const addIfMissing = (currencyId: CurrencyId, chainId: ChainId, usd: number, bal: number) => {
      const key = `${currencyId}::${chainId}`;
      if (present.has(key)) return;
      dev.push(mk(currencyId, chainId, usd, bal));
      present.add(key);
    };
    if (account === "Savings") {
      addIfMissing("USDC.circle", "eip155:1", 120.25, 120.25);
      addIfMissing("USDT.tether", "eip155:8453", 48.3, 48.3);
      addIfMissing("SOL.native", "solana:mainnet", 27.8, 0.45);
      addIfMissing("ETH.native", "eip155:1", 250.0, 0.08);
      addIfMissing("POL.native", "eip155:137", 12.2, 30);
    }
    if (account === "Social") {
      return dev.filter((p) => p.currencyId === "USDC.circle" || p.currencyId === "USDT.tether");
    }
    return dev;
  }, [positionsForAccount, account]);

  const { rows } = useMemo(
    () => (mode === "aggregated" ? buildAggregatedRows(positionsSeeded) : buildSplitRows(positionsSeeded)),
    [positionsSeeded, mode]
  );

  const visibleRows = useMemo(
    () => rows.filter(r => keepRow(showDust, r.valueUSD ?? 0, r.nativeAmt ?? 0)),
    [rows, showDust]
  );
  const topRows = useMemo(() => visibleRows.slice(0, 4), [visibleRows]);
  const showViewAll = useMemo(() => visibleRows.length > 4, [visibleRows]);

  const totalUSD = useMemo(
    () => positionsSeeded.reduce((a, x) => a + x.fiatValue, 0),
    [positionsSeeded]
  );

  const formatFiat = useMemo(() => {
    const f = makeFiatFormatter(fiat);
    return (usdAmount: number) => f.format(fiat === "USD" ? usdAmount : usdAmount * FX.EUR);
  }, [fiat]);



  /* ---------- Scroll / fondo ---------- */
 
const scrollRef = useRef<ScrollView | null>(null);
  useScrollToTop(scrollRef);
  
 const TOP_CAP = 23; // píxeles extra por debajo del notch
 const MENU_GRAD_H = 260;
 
 const TopCapOverlay = useMemo(() => (
  <LinearGradient
    key={`cap-${account}`}
    colors={ACCOUNT_GRADS[account]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_CAP,
      zIndex: 999,
    }}
    pointerEvents="none"
  />
), [account, insets.top]);
  const HeroBackdrop = useMemo(() => (
  <LinearGradient
    key={account}
    colors={ACCOUNT_GRADS[account]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={{
      position: "absolute",
      top: 0,            // <-- antes: insets.top
      left: 0,
      right: 0,
      height: HERO_HEIGHT + insets.top + 5, // cubrimos el notch también
      zIndex: 0,
    }}
    pointerEvents="none"
  />
), [account, insets.top]);


const MenuBackdrop = useMemo(() => (
  <LinearGradient
    key={`menu-${account}`}
    colors={ACCOUNT_GRADS[account]}      // mismo set por cuenta
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}                 // se desvanece hacia abajo
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + MENU_GRAD_H,  // cubre notch + bloque alto tipo Referral
      zIndex: 0,
    }}
    pointerEvents="none"
  />
), [account, insets.top]);

// 1) ANIMACIÓN DE SCROLL + CONSTANTES DEL HEADER
const scrolly = useRef(new Animated.Value(0)).current;

const HEADER_H = 44;
const HEADER_PAD = 8;
const FIXED_H = insets.top + HEADER_H + HEADER_PAD;

// Blur: de 0 a 1 al empezar a bajar
const headerBlurOpacity = scrolly.interpolate({
  inputRange: [0, 12, 60],
  outputRange: [0, 0.6, 1],
  extrapolate: "clamp",
});

// Sólido: aparece más tarde (si quieres un “glass → sólido” suave)
const headerSolidOpacity = scrolly.interpolate({
  inputRange: [0, 80, 140],
  outputRange: [0, 0, 0.45], // <-- nunca llega a 1, queda semi-transparente
  extrapolate: "clamp",
});

// 2) HEADER FIJO (defínelo DENTRO del componente para que vea openScanner)
const FixedHeader = () => (
  <View
    pointerEvents="box-none"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: FIXED_H,
      zIndex: 20,
    }}
  >
    {/* 1) Capa de vidrio/blur: invisible en y=0, aparece al bajar */}
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { opacity: headerBlurOpacity }]}
    >
      <BlurView
        intensity={60}
        tint="dark"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: FIXED_H }}
      />
      {/* Tin­te para “ilegible por debajo” */}
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: FIXED_H,
          backgroundColor: "rgba(6,14,20,0.35)",
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      />
    </Animated.View>

    {/* 2) Capa sólida: entra más tarde que el blur */}
    <Animated.View
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(7,16,22,0.86)",
        opacity: headerSolidOpacity,
      }}
    />

    {/* 3) Contenido del header */}
<SafeAreaView edges={["top", "left", "right"]} style={{ paddingTop: 0 }}>
  <View style={{ paddingHorizontal: HERO_HPAD, paddingTop: HEADER_PAD }}>
    <View style={styles.header}>
      {/* Avatar + username -> abre menú */}
      <Pressable
        style={styles.headerLeft}
        onPress={() => router.push("/menu")}
        hitSlop={HIT}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        {/* Avatar circular con emoji */}
        <View style={styles.avatar}>
          <Text style={{ fontSize: 18, textAlign: "center" }}>{profileAvatar}</Text>
        </View>
        <Text style={styles.handle}>{profileUsername ?? "@username"}</Text>
      </Pressable>

      <View style={styles.headerRight}>
        <Pressable
          style={styles.iconBtn}
          onPress={openScanner}
          hitSlop={HIT}
          accessibilityRole="button"
          accessibilityLabel="Open scanner"
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
        </Pressable>

          {/* Cards */}
      <Pressable
    style={styles.iconBtn}
    onPress={goCards}
    hitSlop={HIT}
    accessibilityRole="button"
    accessibilityLabel="Open cards"
  >
    <Ionicons name="card-outline" size={20} color="#fff" />
    </Pressable>
      </View>
    </View>
  </View>
</SafeAreaView>
  </View>
);


  /* ---------- Pager handlers ---------- */
  const onPageSelected = useCallback((e: any) => {
    const idx = e?.nativeEvent?.position ?? 0;
    if (ignoreNextOnPageRef.current) {
      ignoreNextOnPageRef.current = false;
      return;
    }
    const next = ACCOUNTS_ORDER[idx] ?? "Daily";
    if (next !== account) {
      router.setParams?.({ account: ACCOUNT_IDS[next] } as any);
      void Haptics.selectionAsync();
    }
  }, [account]);

  /* -------------------- renderers -------------------- */
  const renderTokenItem = useCallback(
    ({ item }: { item: TokenRow }) => {
      const dx = item.delta24hUSD ?? 0;
      const dxPct = item.delta24hPct;
      const CURR_SYMBOL: Record<Fiat, string> = { USD: "$", EUR: "€" };
      const symFiat = CURR_SYMBOL[fiat];
      const deltaTxt =
        typeof dxPct === "number"
          ? `${dx >= 0 ? "+" : "-"}${Math.abs(dx).toLocaleString(undefined, { maximumFractionDigits: 2 })}${symFiat}  ${dxPct >= 0 ? "+" : ""}${dxPct.toFixed(2)}%`
          : dx !== 0
          ? `${dx >= 0 ? "+" : ""}${Math.abs(dx).toLocaleString(undefined, { maximumFractionDigits: 2 })}${symFiat}`
          : undefined;
      const up = dx >= 0;
      const sym = CURRENCY_SYMBOL[item.currencyId];

      return (
        <Pressable
          onPress={() => {
            guardNav(() => {
              const positionsForCurrency = positions.filter((p) => p.currencyId === item.currencyId);
              let chosen: ChainId | undefined;
              if (positionsForCurrency.length === 1) chosen = positionsForCurrency[0].chainId as ChainId;
              else if ((item.chains?.length ?? 0) > 0) chosen = pickRecommendedChain(item.chains as ChainId[]);

              const tokenKey = buildTokenTargetKey({
              id: item.currencyId,
              chainId: chosen,
              accountId: ACCOUNT_IDS[account],
            });
            openTokenDetails(tokenKey);
            });
          }}
          style={({ pressed }) => [styles.tokenRow, pressed && { opacity: 0.85 }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <View style={styles.tokenLeft}>
            <TokenIcon currencyId={item.currencyId} chains={item.chains} />
            <View style={{ maxWidth: "72%" }}>
              <Text style={styles.tokenName} numberOfLines={1}>{item.name}</Text>
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
    [positions, fiat, formatFiat, account, guardNav, pathname]
  );

  const keyToken = useCallback((i: TokenRow) => i.id, []);
  const getTokenItemLayout = useCallback((_: unknown, index: number) => ({ length: 70, offset: 70 * index, index }), []);

  // ====== HeroPage ======
  function HeroPage({ acc, topPad }: { acc: Account; topPad: number }) {
    return (
      <View style={{ flex: 1, paddingTop: Math.max(6, topPad), paddingHorizontal: HERO_HPAD }}>
        {/* Tabs */}
        <View style={{ marginTop: 6, alignItems: "center" }}>
  <SegmentedPills
    items={ACCOUNTS_ORDER.map((a) => ({ id: ACCOUNT_IDS[a], label: a }))}
    activeIndex={accountIndex}
    onPress={(i) => {
  if (i === accountIndex) return;
  void Haptics.selectionAsync();

  ignoreNextOnPageRef.current = true;
  // salto instantáneo del pager
  pagerRef.current?.setPageWithoutAnimation?.(i);

  // anima SOLO el indicador (200–240ms está nice)
  Animated.timing(pagerProg, {
    toValue: i,
    duration: 220,
    // opcional: Easing
    // easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start(() => {
    const nextAcc = ACCOUNTS_ORDER[i] ?? "Daily";
    router.setParams?.({ account: ACCOUNT_IDS[nextAcc] } as any);
  });
}}
    progress={pagerProg}             // 👈 sincroniza con swipe del pager
    height={36}
    pillMinWidth={72}
    pillHPad={14}
    wrapHPad={8}
    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    indicatorStyle={{ backgroundColor: "#fff", top: 4, bottom: 4, borderRadius: 14 }}
    textStyle={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
    activeTextStyle={{ color: "#0A1A24" }}
  />
</View>

        {/* Balance + chip */}
        <View style={styles.balanceWrap}>
          <Text style={styles.balance}>{formatFiat(totalUSD)}</Text>
          <View style={styles.eqRow}>
            <View style={[styles.eqBadge, { paddingHorizontal: 10, paddingVertical: 5 }]}>
              <MaterialCommunityIcons name="bitcoin" size={14} color="#0A1A24" />
              <Text style={styles.eqText}>0.0498 BTC</Text>
            </View>
            <Text style={styles.gain}>{"+2%"}</Text>
            <Pressable
              onPress={() => { void Haptics.selectionAsync(); setFiat(f => (f === "USD" ? "EUR" : "USD")); }}
              onLongPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowDust(v => !v); }}
              delayLongPress={280}
              hitSlop={HIT}
              style={[styles.fiatToggle, { marginLeft: 4 }]}
              accessibilityRole="button"
              accessibilityLabel="Tap to switch currency, long press to toggle small balances"
            >
              <Text style={styles.fiatToggleTxt}>{fiat}</Text>
            </Pressable>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsSwipeArea}>
          <View style={styles.actionsRowFixed}>
            <MiniAction icon="qr-code-outline" label="Receive" onPress={goReceive} />
            <MiniAction icon="paper-plane-outline" label="Send" onPress={goSend} />
            <MiniAction icon="swap-horizontal" label="Swap" onPress={goSwap} />
              <MiniAction icon="card-outline" label="Cards" onPress={goCards} />
          </View>
        </View>
      </View>
    );
  }

  /* -------------------- catálogo Add Token -------------------- */
  const ownedKeys = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of positions) {
      const ch = normalizeChainId(p.chainId);
      const key = `${p.currencyId}::${ch}`;
      map.set(key, (map.get(key) ?? 0) + (p.fiatValue ?? 0));
    }
    return map;
  }, [positions]);

  const filteredCatalog = useMemo(() => {
    const q = addTokenQuery.trim().toLowerCase();
    const base = TOKENS_CATALOG as CatalogItem[];

    const textFiltered = q
      ? base.filter((i) => {
          const cid = i.currencyId as ExtendedCurrency;
          const name = (CURRENCY_LABEL[cid] ?? "").toLowerCase();
          const sym = (CURRENCY_SYMBOL[cid] ?? "").toLowerCase();
          return name.includes(q) || sym.includes(q);
        })
      : base;

    return textFiltered.filter((i) => {
      const chains = (i.chains ?? []) as ChainId[];
      if (chains.length === 0) return true;
      const hasFree = chains.some((raw) => {
        const ch = normalizeChainId(raw);
        const key = `${i.currencyId}::${ch}`;
        const usd = ownedKeys.get(key) ?? 0;
        return usd <= 0;
      });
      return hasFree;
    });
  }, [addTokenQuery, ownedKeys]);


/* ===================== RENDER ===================== */

return (
  <SafeAreaView style={styles.container} edges={["bottom"]}>
    {/* Fondo base */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />

    {/* Gradiente grande del Hero (hasta arriba) */}
    {HeroBackdrop}

     {/* Overlay superior para cubrir notch si hace falta */}
     {TopCapOverlay}
    
     {/* Backdrop para la zona del menú (Drawer) */}
     {MenuBackdrop}

    {/* Header fijo con transición */}
    <FixedHeader />

    {/* Spinner fijo (cuando isRefreshing=true) */}
    {isRefreshing && (
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: insets.top + 14, alignSelf: "center", zIndex: 30 }}
      >
        <ActivityIndicator size="large" />
      </View>
    )}

    {/* Contenido desplazable vertical */}
    <Animated.ScrollView
      nestedScrollEnabled
      ref={scrollRef as any}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{
        paddingTop: CONTENT_TOP_OFFSET,
        paddingBottom: insets.bottom + 90,
        minHeight: HERO_HEIGHT + 200, // que exista “algo” que estirar para pull-to-refresh
      }}
      style={{ backgroundColor: "transparent", zIndex: 0 }}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrolly } } }],
        { useNativeDriver: true }
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#fff"       // iOS spinner
          colors={["#ffffff"]}   // Android spinner
          progressViewOffset={10}
        />
      }
    >
      {/* Hero dentro del scroll */}
      <View style={{ height: HERO_HEIGHT, overflow: "visible" }}>
        <PagerView
  ref={pagerRef}
  style={{
    flex: 1,
    width: width + PAGE_GAP_LEFT + PAGE_GAP_RIGHT,
    alignSelf: "center",
    overflow: "visible",
  }}
  initialPage={initialPageRef.current}
  overScrollMode="never"
  scrollEnabled
  offscreenPageLimit={2}
  onPageSelected={onPageSelected}
  onPageScroll={onPageScroll}   // 👈 importante para el progreso de las pills
>
          {ACCOUNTS_ORDER.map((acc) => (
            <View
              key={acc}
              collapsable={false}
              style={{ flex: 1, paddingLeft: PAGE_GAP_LEFT, paddingRight: PAGE_GAP_RIGHT }}
            >
              <HeroPage acc={acc} topPad={insets.top} />
            </View>
          ))}
        </PagerView>
      </View>

      {/* Difuminado unión */}
      <View style={{ height: SEAM_HEIGHT, marginTop: -SEAM_HEIGHT }}>
        <LinearGradient
          colors={[
            "rgba(13,24,32,0)",
            "rgba(13,24,32,0.28)",
            "rgba(13,24,32,0.08)",
            "rgba(13,24,32,0)",
          ]}
          locations={[0, 0.55, 0.85, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Cuerpo */}
      <View style={styles.bodyPad}>
        {/* ===== BANNERS ===== */}
        {banners.length > 0 && (
          <BannerCarousel
            data={banners}
            onDismiss={dismissBanner}
            onPressCta={pressBannerCta}
            width={width}
          />
        )}

        {/* Assets */}
        <GlassCard>
          <FlatList
            data={topRows}
            keyExtractor={keyToken}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={renderTokenItem}
            getItemLayout={getTokenItemLayout}
            ListFooterComponent={() =>
              showViewAll ? (
                <Pressable style={styles.addTokenBtn} onPress={goAllTokens} hitSlop={8}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.addTokenBtn} onPress={openAddTokenSheet} hitSlop={8}>
                  <Text style={styles.addTokenTxt}>Add Token</Text>
                </Pressable>
              )
            }
          />
        </GlassCard>

        {/* Payments */}
        <GlassCard>
          <FlatList
            data={paymentsTop}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openTxDetails(item)}
                style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.85 }]}
                hitSlop={HIT}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title} transaction`}
              >
                <View style={styles.activityLeft}>
                  <Avatar title={item.title} type={item.type} />
                  <View>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityWhen}>{item.when}</Text>
                  </View>
                </View>
                <Text style={styles.activityAmt}>{item.amount}</Text>
              </Pressable>
            )}
            ListFooterComponent={
              showPaymentsViewAll ? (
                <Pressable
                  onPress={() => goPaymentsFor(account)}
                  style={{ paddingVertical: 14, alignItems: "center" }}
                  hitSlop={8}
                >
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              ) : null
            }
          />
        </GlassCard>
      </View>
    </Animated.ScrollView>

    {/* ===== Transaction Details – BottomSheet ===== */}
    <BottomSheet
      visible={txSheetOpen}
      onClose={closeTxDetails}
      maxHeightPct={0.9}
      backgroundColor={colors.sheetBgSolid}
      showHandle
      backdropOpacity={0.5}
    >
      {txPayment && (
        <TransactionDetailsSheet
          tx={txPayment}
          onClose={closeTxDetails}
          onReceive={onTxReceive}
          onSend={onTxSend}
          onSwap={onTxSwap}
        />
      )}
    </BottomSheet>

    {/* ===== Add Token – BottomSheet ===== */}
    <BottomSheet
      visible={addTokenSheetOpen}
      onClose={closeAddTokenSheet}
      maxHeightPct={0.8}
      backgroundColor={colors.sheetBgSolid}
      showHandle
      avoidKeyboard={false}
      backdropOpacity={0.5}
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ alignItems: "center", marginTop: 6, marginBottom: 8 }}>
          <Text style={{ color: colors.sheetText, fontWeight: "800", fontSize: 18 }}>Add token</Text>
        </View>

        <View style={{ marginBottom: 10 }}>
          <TextInput
            value={addTokenQuery}
            onChangeText={setAddTokenQuery}
            placeholder="Search tokens (ETH, SOL, USDC...)"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={{
              height: 40,
              borderRadius: 10,
              paddingHorizontal: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              color: colors.sheetText,
            }}
          />
        </View>

        <FlatList
          data={filteredCatalog}
          keyExtractor={(i) => String(i.currencyId)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.sheetDivider,
                marginLeft: 58,
              }}
            />
          )}
          renderItem={({ item }) => {
            const cid = item.currencyId as ExtendedCurrency;
            const label = CURRENCY_LABEL[cid];
            const sym = CURRENCY_SYMBOL[cid];
            const chains = (item.chains ?? []) as ChainId[];

            return (
              <Pressable
                onPress={() => {
                setAddTokenSheetOpen(false);
                guardNav(() => {
                  const chosen =
                    chains.length <= 1
                      ? ((chains[0] as ChainId) ?? ("eip155:1" as ChainId))
                      : pickRecommendedChain(chains);

                  const tokenKey = buildTokenTargetKey({
                    id: item.currencyId as CurrencyId,
                    chainId: chosen,
                    accountId: ACCOUNT_IDS[account],
                  });

                  openTokenDetails(tokenKey);
                });
              }}
                style={({ pressed }) => [styles.tokenRow, pressed && { opacity: 0.9 }]}
                hitSlop={6}
              >
                <View style={styles.tokenLeft}>
                  <TokenIcon currencyId={item.currencyId} chains={chains} />
                  <View style={{ maxWidth: "72%" }}>
                    <Text style={{ color: colors.sheetText, fontWeight: "600", fontSize: 14 }} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={{ color: colors.sheetTextDim, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {sym}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.sheetTextDim, fontSize: 12 }}>
                    {chains.length > 1 ? "Recommended network" : "Tap to add"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </BottomSheet>
  </SafeAreaView>  
);
}
