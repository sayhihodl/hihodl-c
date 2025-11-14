// app/(drawer)/(tabs)/swap/index.tsx
import React from "react";
import {
  Alert, Pressable, StyleSheet, Text, TextInput, View,
  Animated,
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
import { GlassCard } from "@/ui/Glass";
import { TOP_CAP } from "@/theme/gradients";

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

const YELLOW = "#FFB703";
const HERO_HEIGHT = 330;
const HEADER_HEIGHT = 50;
const HEADER_TOPPAD = 14;
const ICON_SZ = 32;


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

  // Usar la cuenta activa del store o la del parámetro, o "Daily" por defecto
  const activeAccount: Account =
    (params.account?.toLowerCase() === "savings" && "Savings") ||
    (params.account?.toLowerCase() === "social" && "Social") ||
    (params.account?.toLowerCase() === "daily" && "Daily") ||
    storeActive || "Daily";
  
  const activeAccountId = ACCOUNT_IDS[activeAccount];

  const [amount, setAmount] = React.useState("");
  const [txState, setTxState] = React.useState<"idle" | "approving" | "submitting" | "mined">("idle");

  const doFlip = () => { swapSides(); void Haptics.selectionAsync(); };

  const openSelectToken = (side: "pay" | "receive") =>
    router.push({ pathname: "/(drawer)/(tabs)/swap/select-token", params: { side, account: activeAccountId } } as Href);

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


  /* ---------- Header ---------- */
  const headerCenter = (
    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
      {t("swap:title", "Swap")}
    </Text>
  );

  const rightSlot = (
    <Pressable onPress={openSettings} style={styles.iconBtnHeader} hitSlop={8} accessibilityLabel={t("swap:a11y.openSettings", "Open swap settings")}>
      <Ionicons name="options-outline" size={18} color="#fff" />
    </Pressable>
  );

  const HEADER_H = insets.top + HEADER_TOPPAD + HEADER_HEIGHT;

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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScreenBg account={activeAccount} height={HERO_HEIGHT} topCap={TOP_CAP} />

      <GlassHeader
        scrolly={scrolly}
        height={HEADER_HEIGHT}
        innerTopPad={HEADER_TOPPAD}
        blurTint="dark"
        centerSlot={headerCenter}
        rightSlot={rightSlot}
        overlayColor="rgba(2,48,71,0.28)"
        showBottomHairline={false}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_H + 12, paddingBottom: insets.bottom + 48 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: false })}
        showsVerticalScrollIndicator={false}
      >
      <GlassCard style={[styles.card, { paddingTop: 22 }]}>
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t("swap:youPay", "You Pay")}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { textAlign: "center" }]}
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

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t("swap:youReceive", "You Receive")}</Text>
        <View style={styles.inputRow}>
          {quote.loading ? (
            <View style={[styles.input, { justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }]}>
              <Text style={{ color: "#9eb4bd", fontWeight: "800", fontSize: 16, textAlign: "center" }}>{t("swap:loadingQuote", "Getting best route…")}</Text>
            </View>
          ) : (
            <View style={[styles.input, { justifyContent: "center" }]}>
              <Text style={{ color: "#9eb4bd", textAlign: "center", fontSize: 18, fontWeight: "800" }}>
                {quote.data ? `${Number(quote.data.outAmount.toFixed(6))}` : "0"}
              </Text>
            </View>
          )}
          <Pressable onPress={() => openSelectToken("receive")} style={styles.pill} accessibilityLabel={t("swap:a11y.selectReceiveToken", "Select receive token")}>
            <Text style={styles.pillTxt}>{receiveToken?.symbol ?? "—"}</Text>
          </Pressable>
        </View>

        {/* Quote errors and router info */}
        {!!quote.error && (
          <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: "rgba(255,80,80,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,80,80,0.25)" }}>
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
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: "#86d1ff", fontSize: 11, fontWeight: "800" }}>
              {quote.data.router === "fallback"
                ? t("swap:router.fallback", "Using fallback route")
                : t("swap:router.primary", "Best route")}
            </Text>
          </View>
        )}

        {/* Cost breakdown */}
        <View style={{ marginTop: 16, gap: 10 }}>
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
      </GlassCard>
      </Animated.ScrollView>

      {/* ✅ Bottom Sheet de settings */}
      <SwapSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

/* ============================ Utils & Styles ============================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  iconBtnHeader: { width: ICON_SZ, height: ICON_SZ, borderRadius: ICON_SZ / 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  card: { marginHorizontal: 16, paddingHorizontal: 18, paddingBottom: 18, borderRadius: 18 },
  sectionTitle: { color: TEXT, fontSize: 12, letterSpacing: 0.3, marginBottom: 10, fontWeight: "800" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  input: { flex: 1, height: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, color: "#fff", fontSize: 18, fontWeight: "800" },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  pillTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  swapIconWrap: { alignItems: "center", marginVertical: 12 },
  swapIcon: { color: "#cdbdff", fontSize: 18, fontWeight: "900" },
  primaryBtn: { marginTop: 20, height: 46, borderRadius: 12, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center" },
  primaryTxt: { color: "#0A1A24", fontSize: 15, fontWeight: "800" },
});