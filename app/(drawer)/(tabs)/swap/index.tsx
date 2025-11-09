// app/(drawer)/(tabs)/swap/index.tsx
import React from "react";
import {
  Alert, Pressable, StyleSheet, Text, TextInput, View,
  UIManager, findNodeHandle, Modal, Dimensions, Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { preloadNamespaces } from "@/i18n/i18n";

import SwapSettingsSheet from "@/swap/SwapSettingsSheet";
import { legacy } from "@/theme/colors";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import SegmentedPills from "@/ui/SegmentedPills";
import { GlassCard } from "@/ui/Glass";
import { TOP_CAP } from "@/theme/gradients";
import SegmentedPager from "@/ui/SegmentedPager";

import {
  usePortfolioStore, type CurrencyId,
} from "@/store/portfolio.store";
import { useSwapStore } from "@/store/swap.store";
import { useTokenCatalog } from "@/config/tokensCatalog";
import { useSwapQuote } from "@/swap/useSwapQuote";

/* ============================ Theme / layout ============================ */
const { TEXT } = legacy;

type Account = "Daily" | "Savings" | "Social";
const ACCOUNT_IDS: Record<Account, string> = { Daily: "daily", Savings: "savings", Social: "social" };
const ACCOUNTS: Account[] = ["Daily", "Savings", "Social"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const YELLOW = "#FFB703";
const HERO_HEIGHT = 330;
const HEADER_HEIGHT = 70;
const HEADER_TOPPAD = 14;
const HEADER_TITLE_GAP = 10;
const PILL_H = 44;
const ICON_SZ = 32;

/* ============================ Tipos i18n/filtros ============================ */
type ChainFilterId = "all" | "solana" | "ethereum" | "base" | "polygon" | "bitcoin";
type TimeframeId = "1h" | "24h" | "7d" | "30d";
type RankById = "rank" | "volume" | "price" | "priceChange" | "marketCap";

/* ============================ Mock market ============================ */
type MarketRow = {
  id: string; symbol: string; name: string;
  chain: Exclude<ChainFilterId, "all">; mc_usd: number; vol_usd: number; change_pct: number; price?: number;
};
const MARKET_MOCK: MarketRow[] = [
  { id: "solnav", symbol: "SOLNAV", name: "SOLNAV", chain: "solana", mc_usd: 291_000, vol_usd: 16_000, change_pct: 1112.84, price: 0.0018 },
  { id: "pandu",  symbol: "PANDU",  name: "PANDU",  chain: "solana", mc_usd: 3_400_000, vol_usd: 87_000,  change_pct: 11.08,   price: 0.00000319 },
  { id: "nunu",   symbol: "NUNU",   name: "nunu",   chain: "solana", mc_usd: 4_300_000, vol_usd: 233_000, change_pct: -4.99,   price: 0.00436 },
  { id: "stream", symbol: "STRM",   name: "STREAMER", chain: "base", mc_usd: 25_000_000, vol_usd: 390_000, change_pct: 146.85, price: 0.0263 },
  { id: "xvm",    symbol: "XVM",    name: "XVM",    chain: "polygon", mc_usd: 18_000_000, vol_usd: 68_000, change_pct: 19.66,  price: 0.0176 },
];

/* ============================ Popover genérico ============================ */
type Anchor = { x: number; y: number; w: number; h: number };
type MenuState = { open: boolean; anchor: Anchor | null };
type ElemRef<T> = React.RefObject<T> | React.MutableRefObject<T | null>;

function PopoverMenu<T extends string>({
  visible, onClose, anchor, items, value, onSelect, maxWidth = 260,
}: {
  visible: boolean; onClose: () => void; anchor: Anchor | null;
  items: { id: T; label: string }[]; value?: T; onSelect: (v: T) => void; maxWidth?: number;
}) {
  if (!visible || !anchor) return null;
  const screenW = Dimensions.get("window").width;
  const width = Math.min(maxWidth, screenW - 24);
  const centerX = anchor.x + anchor.w / 2;
  const left = Math.max(12, Math.min(centerX - width / 2, screenW - width - 12));
  const top = anchor.y + anchor.h + 6;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.popoverBackdrop} onPress={onClose} />
      <View style={[styles.popover, { top, left, width }]}>
        {items.map((it, idx) => {
          const active = value === it.id;
          return (
            <Pressable
              key={it.id}
              onPress={() => { onSelect(it.id); onClose(); }}
              style={[
                styles.popoverItem,
                idx === 0 && styles.popoverItemFirst,
                idx === items.length - 1 && styles.popoverItemLast,
                active && styles.popoverItemActive,
              ]}
            >
              <Text style={[styles.popoverText, active && styles.popoverTextActive]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

/* ============================ Screen ============================ */
export default function SwapScreen() {
  const { t, i18n } = useTranslation(["swap", "common"]);
  React.useEffect(() => { preloadNamespaces(["swap"]); }, [i18n.language]);
  
  // Trackear vista de pantalla Swap
  React.useEffect(() => {
    const { analytics } = require("@/utils/analytics");
    analytics.trackScreenView({ screen_name: "Swap", screen_class: "SwapScreen" });
  }, []);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scrolly = React.useRef(new Animated.Value(0)).current;
  const hScrollX = React.useRef(new Animated.Value(0)).current;
  const [index, setIndex] = React.useState(0);
  const [settingsOpen, setSettingsOpen] = React.useState(false); // ✅ estado del sheet

  const params = useLocalSearchParams<{ account?: string; currencyId?: string }>();

  const storeActive = usePortfolioStore((s: any) => s.activeAccount as Account | undefined);
  const payId = useSwapStore((s) => s.pay);
  const receiveId = useSwapStore((s) => s.receive);
  const setSwapToken = useSwapStore((s) => s.setToken);
  const swapSides = useSwapStore((s) => s.swapSides);
  const settings = useSwapStore((s) => s.settings);

  const catalog = useTokenCatalog();
  const findToken = (id?: string) => catalog.find((t) => t.id === id);

  const payToken =
    findToken(payId) ??
    findToken(params.currencyId as CurrencyId) ??
    catalog.find((t) => t.symbol === "ETH") ??
    catalog[0];

  const receiveToken =
    findToken(receiveId) ??
    catalog.find((t) => t.symbol === "USDC") ??
    catalog[0];

  React.useEffect(() => {
    if (!payId && payToken) setSwapToken("pay", payToken.id);
    if (!receiveId && receiveToken) setSwapToken("receive", receiveToken.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialAccount: Account =
    (params.account?.toLowerCase() === "savings" && "Savings") ||
    (params.account?.toLowerCase() === "social" && "Social") ||
    (params.account?.toLowerCase() === "daily" && "Daily") ||
    storeActive || "Daily";

  React.useEffect(() => {
    const i = Math.max(0, ACCOUNTS.indexOf(initialAccount));
    setIndex(i);
  }, [initialAccount]);

  // Estado de filtros
  const [rankBy, setRankBy] = React.useState<RankById>("rank");
  const [chain, setChain]   = React.useState<ChainFilterId>("all");
  const [tf, setTf]         = React.useState<TimeframeId>("24h");

  const [amount, setAmount] = React.useState("");
  const [txState, setTxState] = React.useState<"idle" | "approving" | "submitting" | "mined">("idle");

  const doFlip = () => { swapSides(); void Haptics.selectionAsync(); };

  const openSelectToken = (side: "pay" | "receive") =>
    router.push({ pathname: "/(drawer)/(tabs)/swap/select-token", params: { side, account: ACCOUNT_IDS[ACCOUNTS[index]] } } as Href);

  const openSettings = () => { setSettingsOpen(true); void Haptics.selectionAsync(); }; // ✅ sheet, no navegación

  // Quote hook (debounced + retry). While backend is not wired, it is mocked inside the hook
  const effectiveSlippage = settings.slippage.mode === "fixed" ? settings.slippage.fixedPct : 0.5;
  const quote = useSwapQuote({
    payTokenId: payToken?.id,
    receiveTokenId: receiveToken?.id,
    amountStr: amount,
    slippagePct: effectiveSlippage,
  });

  // ===== Balances for Max button (mocked from portfolio store) =====
  const positions = usePortfolioStore((s: any) => (s as any).positions as Array<{ accountId: string; currencyId: string; balance: number }>);
  const activeAccountId = React.useMemo(() => ACCOUNT_IDS[ACCOUNTS[index]], [index]);
  const payBalance = React.useMemo(() => {
    if (!payToken) return 0;
    return positions
      .filter((p) => p.accountId === activeAccountId && p.currencyId === payToken.id)
      .reduce((acc, p) => acc + (p.balance || 0), 0);
  }, [positions, payToken, activeAccountId]);

  function getReserveForGas(symbol?: string): number {
    switch (symbol) {
      case "ETH":
        return 0.005; // ~ small gas cushion on ETH/Base
      case "SOL":
        return 0.02; // ~ small rent-exempt + tx cushion
      case "POL":
        return 2; // extremely cheap, reserve a bit
      default:
        return 0; // ERC20/stables: gas paid in native, no reserve here
    }
  }

  const onPressMax = () => {
    const reserve = getReserveForGas(payToken?.symbol);
    const usable = Math.max(0, (payBalance || 0) - (payToken?.isNative ? reserve : 0));
    if (usable <= 0) return setAmount("");
    const str = usable >= 1 ? usable.toFixed(4) : usable.toPrecision(6);
    setAmount(String(Number(str)));
  };

  // Lista mock filtrada
  const filtered = React.useMemo(() => {
    return MARKET_MOCK
      .filter((r) => chain === "all" || r.chain === chain)
      .sort((a, b) => {
        switch (rankBy) {
          case "volume":     return b.vol_usd - a.vol_usd;
          case "price":      return (b.price ?? 0) - (a.price ?? 0);
          case "priceChange":return b.change_pct - a.change_pct;
          case "marketCap":  return b.mc_usd - a.mc_usd;
          default:           return 0;
        }
      });
  }, [chain, rankBy]);

  /* ---------- Popovers ---------- */
  const rankBtnRef = React.useRef<View>(null);
  const netBtnRef  = React.useRef<View>(null);
  const timeBtnRef = React.useRef<View>(null);

  const [rankMenu, setRankMenu] = React.useState<MenuState>({ open: false, anchor: null });
  const [netMenu,  setNetMenu]  = React.useState<MenuState>({ open: false, anchor: null });
  const [timeMenu, setTimeMenu] = React.useState<MenuState>({ open: false, anchor: null });

  const openMenuFor = (ref: ElemRef<View>, set: React.Dispatch<React.SetStateAction<MenuState>>) => {
    const node = findNodeHandle((ref as any).current);
    if (!node) return;
    // @ts-ignore
    UIManager.measureInWindow(node, (x: number, y: number, w: number, h: number) => { set({ open: true, anchor: { x, y, w, h } }); });
  };

  /* ---------- Etiquetas i18n ---------- */
  const { t: _t } = useTranslation(); // (ya tenemos t, pero por claridad)
  const RANK_ITEMS: { id: RankById; label: string }[] = [
    { id: "rank",        label: t("swap:filters.rankBy.rank", "Rank") },
    { id: "volume",      label: t("swap:filters.rankBy.volume", "Volume") },
    { id: "price",       label: t("swap:filters.rankBy.price", "Price") },
    { id: "priceChange", label: t("swap:filters.rankBy.priceChange", "Price Change") },
    { id: "marketCap",   label: t("swap:filters.rankBy.marketCap", "Market Cap") },
  ];
  const CHAIN_ITEMS: { id: ChainFilterId; label: string }[] = [
    { id: "all",      label: t("swap:filters.network.all", "All") },
    { id: "solana",   label: t("swap:filters.network.solana", "Solana") },
    { id: "ethereum", label: t("swap:filters.network.ethereum", "Ethereum") },
    { id: "base",     label: t("swap:filters.network.base", "Base") },
    { id: "polygon",  label: t("swap:filters.network.polygon", "Polygon") },
    { id: "bitcoin",  label: t("swap:filters.network.bitcoin", "Bitcoin") },
  ];
  const TF_ITEMS: { id: TimeframeId; label: string }[] = [
    { id: "1h",  label: t("swap:filters.timeframe.1h",  "1h") },
    { id: "24h", label: t("swap:filters.timeframe.24h", "24h") },
    { id: "7d",  label: t("swap:filters.timeframe.7d",  "7d") },
    { id: "30d", label: t("swap:filters.timeframe.30d", "30d") },
  ];

  /* ---------- Header ---------- */
  const headerCenter = (
    <View style={{ width: "100%", paddingHorizontal: 4 }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: HEADER_TITLE_GAP }}>
        {t("swap:title", "Swap")}
      </Text>
      <SegmentedPills
        items={ACCOUNTS.map((a) => ({ id: ACCOUNT_IDS[a], label: t(`swap:accounts.${ACCOUNT_IDS[a]}`, a) }))}
        activeIndex={index}
        onPress={(i) => { if (i !== index) { setIndex(i); void Haptics.selectionAsync(); } }}
        progress={Animated.divide(hScrollX, SCREEN_WIDTH)}
        height={PILL_H}
        pillMinWidth={68}
        pillHPad={16}
        wrapHPad={8}
        style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18 }}
        indicatorStyle={{ backgroundColor: "rgba(0,0,0,0.45)", top: 4, bottom: 4, borderRadius: 14 }}
        textStyle={{ color: "#9FB3BF", fontWeight: "800", fontSize: 14 }}
        activeTextStyle={{ color: "#FFFFFF" }}
      />
    </View>
  );

  const rightSlotAbsolute = (
    <View pointerEvents="box-none" style={{ position: "absolute", right: 16, top: HEADER_TITLE_GAP + (PILL_H - ICON_SZ) / 2 - 21 }}>
      <Pressable onPress={openSettings} style={styles.iconBtnHeader} hitSlop={8} accessibilityLabel={t("swap:a11y.openSettings", "Open swap settings")}>
        <Ionicons name="options-outline" size={18} color="#fff" />
      </Pressable>
    </View>
  );

  const HEADER_H = insets.top + HEADER_TOPPAD + HEADER_HEIGHT;

  const slipLabel = settings.slippage.mode === "auto" ? t("swap:settings.auto", "Auto") : `${settings.slippage.fixedPct}%`;
  const prioLabel = settings.priority.mode === "auto" ? t("swap:settings.auto", "Auto") : `${settings.priority.customSol} SOL`;
  const tipLabel  = settings.tip.mode === "auto" ? t("swap:settings.autoTip", "Auto (0.05%)") : `${settings.tip.pct}%`;

  const SettingsSummary = () => (
    <Pressable onPress={openSettings} style={{ marginTop: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="options-outline" size={16} color="#cfd9de" />
        <Text style={{ color: "#cfd9de", fontSize: 12, fontWeight: "700" }}>
          {t("swap:settings.summary", "Settings")}: {t("swap:slippage", "Slippage")} {slipLabel} · {t("swap:priority", "Priority")} {prioLabel} · {t("swap:tip", "Tip")} {tipLabel}
        </Text>
      </View>
    </Pressable>
  );

  // ===== Mock tx flow to block inputs and show mini timeline =====
  const [timeline, setTimeline] = React.useState<Array<{ id: string; label: string; done: boolean }>>([]);
  const startMockTx = () => {
    setTxState("approving");
    setTimeline([
      { id: "q", label: t("swap:timeline.quoting", "Quoting"), done: true },
      { id: "a", label: t("swap:timeline.approval", "Approval"), done: false },
      { id: "s", label: t("swap:timeline.submission", "Submission"), done: false },
      { id: "m", label: t("swap:timeline.mined", "Mined"), done: false },
    ]);
    setTimeout(() => {
      setTimeline((tl) => tl.map((x) => (x.id === "a" ? { ...x, done: true } : x)));
      setTxState("submitting");
      setTimeout(() => {
        setTimeline((tl) => tl.map((x) => (x.id === "s" ? { ...x, done: true } : x)));
        setTimeout(() => {
          setTimeline((tl) => tl.map((x) => (x.id === "m" ? { ...x, done: true } : x)));
          setTxState("mined");
          
          // Trackear swap completado
          const { analytics } = require("@/utils/analytics");
          const amountNum = parseFloat(amount || "0");
          analytics.trackTokenSwapped({
            from: payToken?.symbol || "unknown",
            to: receiveToken?.symbol || "unknown",
            amount: amountNum,
          });
          
          // simulate balances sync
          setTimeout(() => {
            setTxState("idle");
            setTimeline([]);
          }, 1200);
        }, 900);
      }, 900);
    }, 900);
  };

  const Page = ({ acct }: { acct: Account }) => (
    <Animated.ScrollView
      contentContainerStyle={{ paddingTop: HEADER_H + 12, paddingBottom: insets.bottom + 48 }}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: false })}
      showsVerticalScrollIndicator={false}
    >
      <GlassCard style={[styles.card, { paddingTop: 22 }]}>
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>{t("swap:youPay", "You Pay")}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#7aa6b4"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable onPress={onPressMax} style={[styles.pill, { backgroundColor: "rgba(255,255,255,0.12)" }]} accessibilityLabel={t("swap:a11y.max", "Use maximum available")}>
            <Text style={[styles.pillTxt, { fontWeight: "900" }]}>{t("swap:max", "Max")}</Text>
          </Pressable>
          <Pressable onPress={() => openSelectToken("pay")} style={styles.pill} accessibilityLabel={t("swap:a11y.selectPayToken", "Select pay token")}>
            <Text style={styles.pillTxt}>{payToken?.symbol ?? "—"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={doFlip} style={styles.swapIconWrap} hitSlop={8} accessibilityLabel={t("swap:a11y.flip", "Flip tokens")}>
          <Text style={styles.swapIcon}>⇅</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>{t("swap:youReceive", "You Receive")}</Text>
        <View style={styles.inputRow}>
          {quote.loading ? (
            <View style={[styles.input, { justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }]}>
              <Text style={{ color: "#9eb4bd", fontWeight: "800", fontSize: 16 }}>{t("swap:loadingQuote", "Getting best route…")}</Text>
            </View>
          ) : (
            <Text style={[styles.input, { color: "#9eb4bd" }]}>
              {quote.data ? `${Number(quote.data.outAmount.toFixed(6))}` : "0"}
            </Text>
          )}
          <Pressable onPress={() => openSelectToken("receive")} style={styles.pill} accessibilityLabel={t("swap:a11y.selectReceiveToken", "Select receive token")}>
            <Text style={styles.pillTxt}>{receiveToken?.symbol ?? "—"}</Text>
          </Pressable>
        </View>

        {/* Quote errors and router info */}
        {!!quote.error && (
          <View style={{ marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: "rgba(255,80,80,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,80,80,0.25)" }}>
            <Text style={{ color: "#ff9c9c", fontSize: 12, fontWeight: "800" }}>
              {quote.errorCode === "no_liquidity"
                ? t("swap:error.noLiquidity", "No route found for this pair.")
                : quote.errorCode === "network"
                ? t("swap:error.network", "Network error. Please retry.")
                : t("swap:error.degraded", "Routing temporarily degraded. Try again.")}
            </Text>
          </View>
        )}
        {!!quote.data && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ color: "#86d1ff", fontSize: 11, fontWeight: "800" }}>
              {quote.data.router === "fallback"
                ? t("swap:router.fallback", "Using fallback route")
                : t("swap:router.primary", "Best route")}
            </Text>
          </View>
        )}

        {/* Cost breakdown */}
        <View style={{ marginTop: 6, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#9eb4bd", fontSize: 12, fontWeight: "700" }}>{t("swap:price", "Price")}</Text>
            <Text style={{ color: "#cfd9de", fontSize: 12, fontWeight: "800" }}>
              {quote.loading ? "—" : quote.data ? `${quote.data.price.toFixed(4)} ${receiveToken?.symbol}/${payToken?.symbol}` : "—"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#9eb4bd", fontSize: 12, fontWeight: "700" }}>{t("swap:impact", "Price impact")}</Text>
            <Text style={{ color: "#cfd9de", fontSize: 12, fontWeight: "800" }}>
              {quote.loading ? "—" : quote.data ? `${quote.data.impactPct.toFixed(2)}%` : "—"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#9eb4bd", fontSize: 12, fontWeight: "700" }}>{t("swap:fees", "Fees")}</Text>
            <Text style={{ color: "#cfd9de", fontSize: 12, fontWeight: "800" }}>
              {quote.loading ? "—" : quote.data ? `$${(quote.data.routerFeeUsd + quote.data.gasUsd).toFixed(2)}` : "—"}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryBtn}
          disabled={txState !== "idle" || !amount || !payToken || !receiveToken}
          onPress={() => {
            const fixedSlip = settings.slippage.mode === "fixed" ? settings.slippage.fixedPct : 0.5;
            if (fixedSlip > 5) {
              Alert.alert(
                t("swap:confirm.highSlippage.title", "High slippage"),
                t("swap:confirm.highSlippage.body", "You set slippage to {{pct}}%. This may result in a poor price.", { pct: fixedSlip }),
                [
                  { text: t("common:cancel", "Cancel"), style: "cancel" },
                  {
                    text: t("common:continue", "Continue"),
                    style: "destructive",
                    onPress: () => startMockTx(),
                  },
                ]
              );
              return;
            }
            startMockTx();
          }}
        >
          <Text style={styles.primaryTxt}>
            {txState === "idle" && t("swap:cta.swap", "Swap")}
            {txState === "approving" && t("swap:cta.approving", "Approving…")}
            {txState === "submitting" && t("swap:cta.submitting", "Submitting…")}
            {txState === "mined" && t("swap:cta.completed", "Completed")}
          </Text>
        </Pressable>

        {/* ✅ resumen rápido que abre el sheet */}
        <SettingsSummary />
      </GlassCard>

      <View style={{ height: 14 }} />

      <GlassCard style={[styles.card, { paddingTop: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 2, marginBottom: 8 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{t("swap:trending", "Trending")}</Text>
        </View>

        <View style={styles.filtersBar}>
          <View ref={rankBtnRef}>
            <Pressable onPress={() => openMenuFor(rankBtnRef, setRankMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{RANK_ITEMS.find(i => i.id === rankBy)?.label}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </Pressable>
          </View>

          <View ref={netBtnRef}>
            <Pressable onPress={() => openMenuFor(netBtnRef, setNetMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{CHAIN_ITEMS.find(i => i.id === chain)?.label}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </Pressable>
          </View>

          <View ref={timeBtnRef}>
            <Pressable onPress={() => openMenuFor(timeBtnRef, setTimeMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{TF_ITEMS.find(i => i.id === tf)?.label}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View>
          {filtered.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() =>
                Alert.alert(
                  t("swap:tokenSheet.title", "Token"),
                  `${item.name} • ${CHAIN_ITEMS.find(c => c.id === item.chain)?.label}\n${t("swap:metrics.mc", "MC")} $${fmt(item.mc_usd)} • ${t("swap:metrics.vol", "Vol")} $${fmt(item.vol_usd)}\n${item.change_pct.toFixed(2)}%`
                )
              }
              style={styles.row}
            >
              <View style={{ width: 22, alignItems: "center" }}>
                <Text style={styles.rank}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>${fmt(item.mc_usd)} {t("swap:metrics.mc", "MC")}   ·   ${fmt(item.vol_usd)} {t("swap:metrics.vol", "Vol")}</Text>
              </View>
              <Text style={[styles.rowPrice, { color: item.change_pct >= 0 ? "#20d690" : "#ff6b6b" }]}>
                {item.change_pct >= 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <View style={{ height: 8 }} />
    </Animated.ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScreenBg account={ACCOUNTS[index]} height={HERO_HEIGHT} topCap={TOP_CAP} />

      <GlassHeader
        scrolly={scrolly}
        height={HEADER_HEIGHT}
        innerTopPad={HEADER_TOPPAD}
        blurTint="dark"
        centerSlot={headerCenter}
        rightSlot={rightSlotAbsolute}
        overlayColor="rgba(2,48,71,0.28)"
        showBottomHairline={false}
      />

      <SegmentedPager<Account>
        items={ACCOUNTS}
        index={index}
        onIndexChange={setIndex}
        scrollX={hScrollX}
        width={SCREEN_WIDTH}
        renderPage={(acct) => <Page acct={acct} />}
        style={{ flexGrow: 0 }}
      />

      {/* ✅ Bottom Sheet de settings */}
      <SwapSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Menús */}
      <PopoverMenu
        visible={rankMenu.open}
        anchor={rankMenu.anchor}
        onClose={() => setRankMenu({ open: false, anchor: null })}
        items={RANK_ITEMS}
        value={rankBy}
        onSelect={setRankBy}
      />
      <PopoverMenu
        visible={netMenu.open}
        anchor={netMenu.anchor}
        onClose={() => setNetMenu({ open: false, anchor: null })}
        items={CHAIN_ITEMS}
        value={chain}
        onSelect={setChain}
      />
      <PopoverMenu
        visible={timeMenu.open}
        anchor={timeMenu.anchor}
        onClose={() => setTimeMenu({ open: false, anchor: null })}
        items={TF_ITEMS}
        value={tf}
        onSelect={setTf}
      />
    </SafeAreaView>
  );
}

/* ============================ Utils & Styles ============================ */
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n.toFixed(0)}`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconBtnHeader: { width: ICON_SZ, height: ICON_SZ, borderRadius: ICON_SZ / 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  card: { marginHorizontal: 16, paddingHorizontal: 18, paddingBottom: 18, borderRadius: 18 },
  sectionTitle: { color: TEXT, fontSize: 12, letterSpacing: 0.3, marginBottom: 10, fontWeight: "800" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  input: { flex: 1, height: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, color: "#fff", fontSize: 18, fontWeight: "800" },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  pillTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  swapIconWrap: { alignItems: "center", marginVertical: 6 },
  swapIcon: { color: "#cdbdff", fontSize: 18, fontWeight: "900" },
  primaryBtn: { marginTop: 14, height: 46, borderRadius: 12, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center" },
  primaryTxt: { color: "#0A1A24", fontSize: 15, fontWeight: "800" },
  filtersBar: { flexDirection: "row", gap: 8, marginBottom: 10 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.10)" },
  filterBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rank: { color: "#9eb4bd", fontWeight: "800", fontSize: 12 },
  rowName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rowSub: { color: "#9eb4bd", fontSize: 12, marginTop: 2 },
  rowPrice: { fontWeight: "800", fontSize: 13 },
  popoverBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  popover: { position: "absolute", backgroundColor: "rgba(20,27,33,0.98)", borderRadius: 14, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)", minWidth: 180, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, elevation: 10 },
  popoverItem: { paddingHorizontal: 14, paddingVertical: 10 },
  popoverItemFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  popoverItemLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  popoverItemActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  popoverText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  popoverTextActive: { color: "#fff" },
});