// app/(drawer)/(tabs)/(home)/optimized.tsx
// Optimized Home prototype: does not modify original index.tsx
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import colors from "@/theme/colors";
import { useTranslation } from "react-i18next";
import SegmentedPills from "@/ui/SegmentedPills";
import { useProfileStore } from "@/store/profile";
import { usePortfolioStore, type ChainId, type CurrencyId, type Position } from "@/store/portfolio.store";

// Lazy heavy deps (initialized after first paint)
const PagerView = lazy(() => import("react-native-pager-view"));
const BottomSheet = lazy(() => import("@/components/BottomSheet/BottomKeyboardModal"));
const SendFlowModal = lazy(() => import("@/send/SendFlowModal"));
const TransactionDetailsSheet = lazy(() => import("@/components/tx/TransactionDetailsSheet"));

// Local helpers (duplicated minimal set to avoid touching original)
type Account = "Daily" | "Savings" | "Social";
const ACCOUNTS_ORDER: Account[] = ["Daily", "Savings", "Social"];
const ACCOUNT_IDS: Record<Account, string> = { Daily: "daily", Savings: "savings", Social: "social" };
const ID_TO_ACCOUNT: Record<string, Account> = { daily: "Daily", savings: "Savings", social: "Social" };

type Fiat = "USD" | "EUR";
const FX = { EUR: 0.92 as const };

const BG = colors.navBg;
const YELLOW = colors.primary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bodyPad: { paddingHorizontal: 14 },
  header: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#7CC2D1", alignItems: "center", justifyContent: "center" },
  handle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  balanceWrap: { alignItems: "center", justifyContent: "center", marginTop: 8 },
  balance: { color: "#fff", fontSize: 42, fontWeight: "500", letterSpacing: -0.5 },
  eqRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  eqBadge: { backgroundColor: YELLOW, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, alignItems: "center" },
  eqText: { color: "#0A1A24", fontWeight: "700", fontSize: 12 },
  actionsRowFixed: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniAction: { width: 68, alignItems: "center" },
  miniIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: YELLOW },
  miniLabel: { color: "#fff", fontSize: 12, marginTop: 6, fontWeight: "600" },
});

const ACCOUNT_GRADS: Record<Account, readonly [string, string]> = {
  Daily: ["rgba(0,194,255,0.45)", "rgba(54,224,255,0.00)"],
  Savings: ["rgba(84,242,165,0.35)", "rgba(84,242,165,0.00)"],
  Social: ["rgba(111,91,255,0.40)", "rgba(255,115,179,0.00)"],
} as const;

const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const HERO_HEIGHT = 280;
const HERO_HPAD = 16;
const CONTENT_TOP_OFFSET = 60;

function href<P extends Record<string, string>>(pathname: `/${string}`, params?: P) {
  return { pathname: pathname as any, params } as unknown as Href;
}

function MiniAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const handlePress = useCallback(() => { void Haptics.selectionAsync(); onPress(); }, [onPress]);
  return (
    <Pressable style={styles.miniAction} onPress={handlePress} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.miniIconWrap}><Ionicons name={icon} size={20} /></View>
      <Text style={styles.miniLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardOptimized() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Basic state
  const [fiat, setFiat] = useState<Fiat>("USD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ready, setReady] = useState(false);

  // Stores
  const positions = usePortfolioStore((s) => s.positions);
  const mode = usePortfolioStore((s) => s.mode);
  const profileAvatar = useProfileStore((s) => s.avatar);
  const profileUsername = useProfileStore((s) => s.username);

  // Minimal i18n preload defer (simulating original behavior without imports)
  useEffect(() => {
    let alive = true;
    (async () => {
      // Defer to next frame to unblock first paint
      requestAnimationFrame(() => { if (alive) setReady(true); });
    })();
    return () => { alive = false; };
  }, [i18n.language]);

  const account: Account = useMemo(() => {
    return ID_TO_ACCOUNT[String((router as any)?.params?.account ?? "").toLowerCase()] ?? "Daily";
  }, []);

  const totalUSD = useMemo(() => positions.reduce((a, x) => a + (x.fiatValue ?? 0), 0), [positions]);

  const formatFiat = useMemo(() => {
    const nf = new Intl.NumberFormat(i18n.language, { style: "currency", currency: fiat, maximumFractionDigits: 2 });
    return (usdAmount: number) => nf.format(fiat === "USD" ? usdAmount : usdAmount * FX.EUR);
  }, [i18n.language, fiat]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise<void>((r) => setTimeout(r, 600));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Header scroll effects
  const scrolly = useRef(new Animated.Value(0)).current;
  const headerBlurOpacity = scrolly.interpolate({ inputRange: [0, 12, 60], outputRange: [0, 0.6, 1], extrapolate: "clamp" });
  const headerSolidOpacity = scrolly.interpolate({ inputRange: [0, 80, 140], outputRange: [0, 0, 0.45], extrapolate: "clamp" });
  const FIXED_H = insets.top + 44 + 8;

  const goReceive = useCallback(() => router.navigate(href("/(drawer)/(internal)/receive", { account: ACCOUNT_IDS[account] })), [account]);
  const goSend = useCallback(() => router.navigate({ pathname: "/(drawer)/(internal)/send", params: { account: ACCOUNT_IDS[account], startAt: "search", mode: "send" } }), [account]);
  const goSwap = useCallback(() => router.navigate(`/(drawer)/(tabs)/swap?account=${ACCOUNT_IDS[account]}`), [account]);
  const goCards = useCallback(() => router.navigate({ pathname: "/(drawer)/(internal)/cards/[id]", params: { id: "general", account: ACCOUNT_IDS[account] } }), [account]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Backgrounds */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
      <LinearGradient
        colors={ACCOUNT_GRADS[account]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: HERO_HEIGHT + insets.top + 5 }}
        pointerEvents="none"
      />

      {/* Fixed header with transitions */}
      <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: FIXED_H, zIndex: 20 }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: headerBlurOpacity }]}>
          <LinearGradient colors={["rgba(6,14,20,0.35)", "rgba(6,14,20,0.35)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: FIXED_H }} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,16,22,0.86)", opacity: headerSolidOpacity }} />
        <SafeAreaView edges={["top", "left", "right"]} style={{ paddingTop: 0 }}>
          <View style={{ paddingHorizontal: HERO_HPAD, paddingTop: 8 }}>
            <View style={styles.header}>
              <Pressable style={styles.headerLeft} onPress={() => router.push("/menu")} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={t("dashboard:a11y.openMenu", "Abrir menú")}>
                <View style={styles.avatar}><Text style={{ fontSize: 18, textAlign: "center" }}>{profileAvatar}</Text></View>
                <Text style={styles.handle}>{profileUsername ?? "@username"}</Text>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={styles.iconBtn} onPress={() => router.push("/(drawer)/(internal)/receive/scanner" as Href)} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={t("dashboard:a11y.openScanner", "Abrir escáner")}>
                  <Ionicons name="scan-outline" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={goCards} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={t("dashboard:a11y.openCards", "Abrir tarjetas")}>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Scroll content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: CONTENT_TOP_OFFSET, paddingBottom: insets.bottom + 90, minHeight: HERO_HEIGHT + 200 }}
        style={{ backgroundColor: "transparent", zIndex: 0 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#fff" colors={["#ffffff"]} progressViewOffset={10} />}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT, overflow: "visible", paddingHorizontal: HERO_HPAD }}>
          <View style={{ marginTop: 6, alignItems: "center" }}>
            <SegmentedPills
              items={ACCOUNTS_ORDER.map((a) => ({ id: ACCOUNT_IDS[a], label: a }))}
              activeIndex={Math.max(0, ACCOUNTS_ORDER.indexOf(account))}
              onPress={() => {}}
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

          <View style={styles.balanceWrap}>
            <Text style={styles.balance}>{formatFiat(totalUSD)}</Text>
            <View style={styles.eqRow}>
              <View style={styles.eqBadge}>
                <MaterialCommunityIcons name="bitcoin" size={14} color="#0A1A24" />
                <Text style={styles.eqText}>0.0498 BTC</Text>
              </View>
              <Pressable onPress={() => { void Haptics.selectionAsync(); setFiat((f) => (f === "USD" ? "EUR" : "USD")); }} hitSlop={HIT} style={{ marginLeft: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 11 }}>{fiat}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Defer heavy UI below using Suspense so bundle init happens later */}
        <View style={styles.bodyPad}>
          <Suspense fallback={<View style={{ paddingVertical: 14, alignItems: "center" }}><ActivityIndicator /></View>}>
            <LazyAssetsAndPayments account={account} width={width} />
          </Suspense>
        </View>
      </Animated.ScrollView>

      {/* Lazy infra mounted only when opened */}
      <Suspense fallback={null}>
        {/* Placeholders kept minimal; real usage will mount on demand in future edits */}
      </Suspense>
    </SafeAreaView>
  );
}

function useTokenRows(positions: Position[], account: Account, mode: string) {
  const ACCOUNT = ACCOUNT_IDS[account];
  const filtered = useMemo(() => positions.filter((p: any) => String(p?.accountId ?? "").toLowerCase() === ACCOUNT), [positions, ACCOUNT]);
  const rows = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => (b.fiatValue ?? 0) - (a.fiatValue ?? 0));
    return sorted.slice(0, 4).map((p) => ({ id: `${p.currencyId}:${p.chainId}`, name: String(p.currencyId), valueUSD: p.fiatValue ?? 0 }));
  }, [filtered]);
  return rows;
}

function LazyAssetsAndPayments({ account, width }: { account: Account; width: number }) {
  const { t, i18n } = useTranslation();
  const positions = usePortfolioStore((s) => s.positions);
  const mode = usePortfolioStore((s) => s.mode);
  const rows = useTokenRows(positions, account, mode);

  return (
    <View>
      {/* Simplified assets list placeholder to validate route and layout; can be expanded */}
      <View style={{ backgroundColor: "rgba(27,45,54,0.85)", borderRadius: 14, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }}>
        {rows.map((r, i) => (
          <View key={r.id} style={{ paddingVertical: 8, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }} numberOfLines={1}>{r.name}</Text>
            <Text style={{ color: "#fff" }}>{new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(r.valueUSD)}</Text>
          </View>
        ))}
        {rows.length === 0 && (
          <View style={{ paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ color: "#9eb4bd" }}>{t("dashboard:assets.empty", "No assets yet")}</Text>
          </View>
        )}
      </View>

      {/* Payments simplified block */}
      <View style={{ backgroundColor: "rgba(27,45,54,0.85)", borderRadius: 14, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", marginTop: 14 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{t("dashboard:payments.recentActivity", "Recent activity")}</Text>
        <Text style={{ color: "#9eb4bd", marginTop: 8 }}>{t("dashboard:payments.empty", "No recent payments")}</Text>
      </View>
    </View>
  );
}


