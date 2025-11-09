// app/(tabs)/(home)/index.tsx
import BottomSheet from "@/components/BottomSheet/BottomKeyboardModal";
import SuperTokenSearchSheet from "@/components/SuperTokenSearchSheet";
import SendFlowModal from "@/send/SendFlowModal";
import TransactionDetailsSheet, { type TxDetails } from "@/components/tx/TransactionDetailsSheet";
// Token icons ahora importados desde componentes extraídos
import {
  usePortfolioStore,
  type CurrencyId,
  type ChainId,
} from "@/store/portfolio.store";
import colors from "@/theme/colors";
// Chain badges ahora importados desde TokenIcon component
import { Ionicons } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
// LinearGradient ahora importado desde DashboardBackgrounds
import { router, type Href } from "expo-router";
import { BlurView } from "expo-blur";
import { bestChainForToken, type ChainKey } from "@/config/sendMatrix";

import { useProfileStore } from "@/store/profile";
import { useBalancesStore } from "@/store/balances";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analytics } from "@/utils/analytics";
import 'react-native-get-random-values';
import 'react-native-webcrypto'; // expone globalThis.crypto con subtle, getRandomValues, etc.
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

// Nuevos hooks y utils
import { type Account, ACCOUNTS_ORDER, accountToId } from "@/hooks/useAccount";
import { useAccountNavigation } from "@/hooks/useAccountNavigation";
import { useDashboardI18n } from "@/hooks/useDashboardI18n";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useWalletDetection } from "@/hooks/useWalletDetection";
import { useTokenData } from "@/hooks/useTokenData";
import { useHasAccounts } from "@/hooks/useHasAccounts";
import { getChainId } from "@/config/chainMapping";
import { DASHBOARD_LAYOUT, DASHBOARD_COLORS, HIT_SLOP } from "@/constants/dashboard";
import { formatFiatAmount } from "@/utils/dashboard/currencyHelpers";
import { type BannerItem } from "@/store/dashboard.types";
import { GlassCard } from "@/ui/Glass";
import { PAYMENTS_MOCK, type PaymentItem } from "./_lib/_dashboardShared";

// Componentes extraídos
import DashboardHeader from "./components/DashboardHeader";
import HeroSection from "./components/HeroSection";
import TokenList from "./components/TokenList";
import PaymentList from "./components/PaymentList";
import BannerCarousel from "./components/BannerCarousel";
import TokenIcon from "./components/TokenIcon";
import TokenActionSheet from "./components/TokenActionSheet";
import { TopCapOverlay, HeroBackdrop, MenuBackdrop } from "./_lib/components/_DashboardBackgrounds";

// Hooks
import { useDashboardNavigation } from "./_lib/hooks/_useDashboardNavigation";
import { useTokenPicker } from "./_lib/hooks/_useTokenPicker";
import { useTokenNavigation } from "./_lib/hooks/_useTokenNavigation";
import { useDashboardPayments } from "./_lib/hooks/_useDashboardPayments";
import { useDashboardSheets } from "./_lib/hooks/_useDashboardSheets";
import { useRecommendedTokens } from "./_lib/hooks/_useRecommendedTokens";
import { useDashboardBanners } from "./_lib/hooks/_useDashboardBanners";

// Utils y constantes - ACCOUNT_GRADS ahora en DashboardBackgrounds

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
  // Banner styles movidos a BannerCarousel component
});

/* -------------------- Constantes de layout -------------------- */
const { PAGE_GAP_LEFT, PAGE_GAP_RIGHT, HERO_HEIGHT, CONTENT_TOP_OFFSET } = DASHBOARD_LAYOUT;

/* ================= helpers FUERA del componente ================= */
export type TokenParams = { id: CurrencyId; chainId?: ChainId; accountId: string };
// buildTokenTargetKey movido a dashboardShared.ts para evitar ciclos
export { buildTokenTargetKey } from "./_lib/_dashboardShared";

/* ====== Helper para balances (safe wrapper) ====== */
type BalItem = { tokenId: string; chain: string; amount: number; account: string };

// TokenIcon ahora importado de components/TokenIcon.tsx
/* -------------------- data helpers -------------------- */
// TokenRow ahora importado de @/utils/dashboard/tokenHelpers

type ExtendedCurrency = CurrencyId | "BTC.native" | "DAI.maker";

// Avatar y MiniAction ahora importados de components/Avatar.tsx y components/MiniAction.tsx

/* -------------------- grouping helpers -------------------- */
// groupByCurrency, pickDeltaUSD, pickDeltaPctWeighted ahora importados de @/utils/dashboard/tokenHelpers

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

// buildAggregatedRows y buildSplitRows ahora importados de @/utils/dashboard/tokenHelpers

// Tipos del Drawer que usa Expo Router
export type RootDrawerParamList = {
  "(tabs)": undefined;   // pantalla principal con tabs
  menu: undefined;       // tu pantalla/lado de menú
};

/* =========================  Mock de payments ========================= */
// PaymentItem, PaymentKind, PAYMENTS_MOCK importados desde dashboardShared.ts
// Re-exportar para compatibilidad
export type { PaymentItem, PaymentKind } from "./_lib/_dashboardShared";
export { PAYMENTS_MOCK } from "./_lib/_dashboardShared";

/* =========================  Banners / UI ========================= */
// BannerItem ahora importado de @/store/dashboard.types
// GlassCard ahora importado de @/ui/Glass
// BannerCarousel ahora extraído a components/BannerCarousel.tsx

/* =========================  MAIN SCREEN  ========================= */
export default function Dashboard() {
  // i18n simplificado con hook personalizado
  const { t: ttRaw, ready: readyI18n } = useDashboardI18n();
  const { t } = useTranslation(); // Mantener para algunos casos específicos
  
  // Wrapper para adaptar tt a la firma esperada por los componentes
  const tt = useMemo(() => {
    return (key: string, defaultValue?: string) => {
      try {
        return ttRaw(key, defaultValue || "") || defaultValue || key;
      } catch {
        return defaultValue || key;
      }
    };
  }, [ttRaw]);
  
  // Trackear vista de pantalla Home
  useEffect(() => {
    analytics.trackScreenView({ screen_name: "Home", screen_class: "Dashboard" });
  }, []);
  
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Navegación de cuentas simplificada con hook personalizado
  const { account, accountIndex, pagerRef, handlePageSelected, ignoreNextRef } = useAccountNavigation();
  
  // Navegación a tokens con guards
  const { guardNav, openTokenDetails } = useTokenNavigation();
  
  // Handlers de navegación centralizados
  const {
    onTxReceive,
    onTxSend,
    onTxSwap,
    goReceive,
    goSwap,
    goCards,
    goPaymentsFor,
    goAllTokens,
    goAllActivity,
    openScanner,
  } = useDashboardNavigation(account);

  // Progreso animado para SegmentedPills (position + offset del PagerView)
  const pagerProg = useRef(new Animated.Value(accountIndex)).current;
  useEffect(() => { pagerProg.setValue(accountIndex); }, [accountIndex, pagerProg]);

  const onPageScroll = useCallback((e: { nativeEvent?: { position?: number; offset?: number } }) => {
    const { position = 0, offset = 0 } = e?.nativeEvent ?? {};
    pagerProg.setValue(position + offset);
  }, [pagerProg]);

  // ---- contenedor horizontal: Menú (página 0) | Dashboard (página 1)
  const hPagerRef = useRef<ScrollView | null>(null);
  
  // openTokenDetails ahora en useTokenNavigation hook

  // Arrancar directamente en el dashboard (derecha)
  useEffect(() => {
    hPagerRef.current?.scrollTo({ x: width, animated: false });
  }, [width]);

  /* ---------- STATE ---------- */
  // Estado consolidado con hook personalizado
  const {
    ui,
    sheets,
    banners,
    setFiat,
    setShowDust,
    setIsRefreshing,
    openTxSheet,
    closeTxSheet,
    openAddTokenSheet,
    closeAddTokenSheet,
    setSelectedTokenForAction,
    setBanners,
  } = useDashboardState();

 const profileAvatar = useProfileStore((s) => s.avatar);
 const profileUsername = useProfileStore((s) => s.username); 


  /* ---------- Stores ---------- */
  const positions = usePortfolioStore((s) => s.positions);
  const mode = usePortfolioStore((s) => s.mode);

  // Detección de tipo de wallet
  const walletType = useWalletDetection(positions);

  // Verificar si hay cuentas creadas
  const { hasAccounts, isLoading: isLoadingAccounts } = useHasAccounts();

  // Token data transformado
  const tokenData = useTokenData(
    positions,
    account,
    mode,
    ui.showDust,
    walletType
  );

  // Handler para crear primera cuenta
  const handleCreateAccount = useCallback(async () => {
    const startTime = Date.now();
    try {
      const { createThreeWallets } = await import('@/lib/walletsetup');
      await createThreeWallets();
      
      const durationSeconds = (Date.now() - startTime) / 1000;
      
      // Trackear creación de primera cuenta con tiempo
      analytics.trackEvent({
        name: 'first_accounts_created',
        parameters: {
          timestamp: Date.now(),
          source: 'dashboard_empty_state',
        },
      });
      
      analytics.trackFirstAccountCreationTime(durationSeconds);
      
      // Recargar página o redirigir
      router.replace('/(drawer)/(tabs)/(home)');
    } catch (error) {
      console.error('[Dashboard] Error creating accounts:', error);
      analytics.trackEvent({
        name: 'account_creation_failed',
        parameters: {
          error: error instanceof Error ? error.message : 'unknown',
        },
      });
    }
  }, []);

  /* ---------- Pull to refresh ---------- */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 900));
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing]);
  
  // Drag gate para el token selector
  const tokenDragGateRef = useRef<boolean>(true);
  
  // Obtener balances para verificar si el token tiene balance
  const balances = useBalancesStore((s) => s.flat || []) as BalItem[];

  /* ---------- Token Picker ---------- */
  const { handleTokenPick } = useTokenPicker(
    account,
    balances,
    guardNav,
    openTokenDetails,
    closeAddTokenSheet,
    setSelectedTokenForAction
  );

  /* ---------- Sheets handlers ---------- */
  const { openTxDetails } = useDashboardSheets({
    openTxSheet,
    closeTxSheet,
    tt,
  });

  /* ---------- Payments data ---------- */
  const { paymentsTop, showPaymentsViewAll } = useDashboardPayments(account);

  /* ---------- Navegación ---------- */
  // Handlers de navegación ahora en useDashboardNavigation hook
  
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const goSend = useCallback(() => {
    router.navigate({
      pathname: "/(drawer)/(internal)/payments/composer",
      params: { account: accountToId(account) },
    });
  }, [account]);
  
  // Wrappers que cierran el sheet antes de navegar
  const onTxReceiveWithClose = useCallback(() => {
    closeTxSheet();
    onTxReceive();
  }, [closeTxSheet, onTxReceive]);

  const onTxSendWithClose = useCallback(() => {
    closeTxSheet();
    onTxSend();
  }, [closeTxSheet, onTxSend]);

  const onTxSwapWithClose = useCallback(() => {
    closeTxSheet();
    onTxSwap();
  }, [closeTxSheet, onTxSwap]);                                                                   



  /* ---------- Recomendaciones y banners ---------- */
  const recommendedTokensForAccount = useRecommendedTokens(account);
  const { dismissBanner } = useDashboardBanners(readyI18n, tt, setBanners);
  const pressBannerCta = useCallback((b: BannerItem) => {
    if (b.cta?.href) router.navigate(b.cta.href as Href);
    void Haptics.selectionAsync();
  }, []);

  // Token data desde hook
  const { topRows, totalUSD, showViewAll } = tokenData;

 // Formateo de fiat ahora usando helper centralizado
  const formatFiat = useCallback((usdAmount: number) => {
    return formatFiatAmount(usdAmount, "en", ui.fiat); // TODO: usar locale real de i18n
  }, [ui.fiat]);



  /* ---------- Scroll / refs ---------- */
  const scrollRef = useRef<ScrollView | null>(null);
  useScrollToTop(scrollRef);
  const scrolly = useRef(new Animated.Value(0)).current;

  /* ---------- Early return si i18n no está listo ---------- */
if (!readyI18n) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  );
}


/* ===================== RENDER ===================== */

return (
  <SafeAreaView style={styles.container} edges={["bottom"]}>
    {/* Fondo base */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />

    {/* Gradientes y overlays */}
    <HeroBackdrop account={account} insetsTop={insets.top} />
    <TopCapOverlay account={account} insetsTop={insets.top} />
    <MenuBackdrop account={account} insetsTop={insets.top} />

    {/* Header fijo con transición */}
    <DashboardHeader
      account={account}
      profileAvatar={profileAvatar}
      profileUsername={profileUsername}
      openScanner={openScanner}
      goCards={goCards}
      scrolly={scrolly}
      insetsTop={insets.top}
      tt={tt}
    />

    {/* Spinner fijo (cuando isRefreshing=true) */}
    {ui.isRefreshing && (
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
      ref={scrollRef}
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
          refreshing={ui.isRefreshing}
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
  initialPage={accountIndex}
  overScrollMode="never"
  scrollEnabled
  offscreenPageLimit={2}
  onPageSelected={handlePageSelected}
  onPageScroll={onPageScroll}   // 👈 importante para el progreso de las pills
>
          {ACCOUNTS_ORDER.map((acc) => {
            // Calcular totalUSD para esta cuenta usando el mismo hook pero memoizado por cuenta
            // Nota: Esto se recalcula cuando cambia la cuenta activa
            const isActive = acc === account;
            const accTokenData = isActive ? tokenData : { totalUSD: 0 }; // Para cuentas inactivas, mostrar 0 temporalmente
            return (
              <View
                key={acc}
                collapsable={false}
                style={{ flex: 1, paddingLeft: PAGE_GAP_LEFT, paddingRight: PAGE_GAP_RIGHT }}
              >
                <HeroSection
                  account={acc}
                  accountIndex={accountIndex}
                  totalUSD={formatFiat(accTokenData.totalUSD)}
                  fiat={ui.fiat}
                  showDust={ui.showDust}
                  setFiat={setFiat}
                  setShowDust={setShowDust}
                  pagerRef={pagerRef}
                  pagerProg={pagerProg}
                  ignoreNextRef={ignoreNextRef}
                  goReceive={goReceive}
                  goSend={goSend}
                  goSwap={goSwap}
                  goCards={goCards}
                  tt={tt}
                  t={t}
                  topPad={insets.top}
                />
              </View>
            );
          })}
        </PagerView>
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
            <GlassCard style={{ marginTop: 14 }}>
              <TokenList
                topRows={topRows}
                fiat={ui.fiat}
                formatFiat={formatFiat}
                account={account}
                positions={positions}
                onTokenPress={(tokenKey) => guardNav(() => openTokenDetails(tokenKey))}
                showViewAll={showViewAll}
                onViewAll={goAllTokens}
                onAddToken={openAddTokenSheet}
                tt={(key: string, defaultValue?: string) => tt(key, defaultValue || "")}
                t={t}
              />
            </GlassCard>

            {/* Payments */}
            <GlassCard style={{ marginTop: 14 }}>
              <PaymentList
                paymentsTop={paymentsTop}
                account={account}
                showViewAll={showPaymentsViewAll}
                onPaymentPress={openTxDetails}
                onViewAll={goAllActivity}
                tt={(key: string, defaultValue?: string) => tt(key, defaultValue || "")}
                t={t}
              />
            </GlassCard>
          </View>
    </Animated.ScrollView>
      
      {/* Overlay blur con CTA cuando no hay cuentas - cubre toda la zona de contenido */}
      {!isLoadingAccounts && !hasAccounts && (
        <View
          style={{
            position: "absolute",
            top: CONTENT_TOP_OFFSET + HERO_HEIGHT,
            bottom: 0,
            left: 0,
            right: 0,
            pointerEvents: "box-none",
            zIndex: 10,
          }}
        >
          {/* Blur overlay que cubre toda la zona de contenido */}
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          {/* Tinte oscuro adicional */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(6,14,20,0.6)" },
            ]}
          />
          {/* CTA visible en la parte superior del blur */}
          <View
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              right: 0,
              alignItems: "center",
              paddingHorizontal: 24,
            }}
          >
            <TouchableOpacity
              onPress={handleCreateAccount}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.cta,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 14,
                shadowColor: colors.cta,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <Text
                style={{
                  color: colors.ctaTextOn,
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                Create Accounts
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    {/* ===== Transaction Details – BottomSheet ===== */}
       <BottomSheet
      visible={sheets.tx.open}
      onClose={closeTxSheet}
      maxHeightPct={0.9}
      sheetTintRGBA={colors.sheetBgSolid}
      blurIntensity={40}
      showHandle
      scrimOpacity={0.5}
    >
      {sheets.tx.payment && (
        <TransactionDetailsSheet
          tx={sheets.tx.payment}
          onClose={closeTxSheet}
          onReceive={onTxReceiveWithClose}
          onSend={onTxSendWithClose}
          onSwap={onTxSwapWithClose}
        />
      )}
    </BottomSheet>

    {/* ===== Quick Send – Modal ===== */}
    <SendFlowModal
      visible={sendModalOpen}
      onRequestClose={() => setSendModalOpen(false)}
      step="search"
    />
    {/* sendModalOpen todavía se maneja localmente */}

    {/* ===== Add Token – SuperTokenSearchSheet (mejorado con recomendaciones inteligentes) ===== */}
    <SuperTokenSearchSheet
      visible={sheets.addToken.open}
      onClose={closeAddTokenSheet}
      onPick={handleTokenPick as any}
      title={tt("assets.addToken", "Add Token")}
      placeholder={
        account === "Daily" 
          ? "Search tokens (USDC, USDT...)" 
          : account === "Savings"
          ? "Search tokens (ETH, SOL for long-term...)"
          : "Search tokens (memecoins...)"
      }
      selectedChain={bestChainForToken(recommendedTokensForAccount[0] || "usdc") as ChainKey}
      recipient={`@${account.toLowerCase()}-wallet`} // Clave especial para que StepToken priorice tokens recomendados
      dragGateRef={tokenDragGateRef}
      onTopChange={(atTop) => { tokenDragGateRef.current = atTop; }}
      minHeightPct={0.88}
      maxHeightPct={0.94}
    />

    {/* ===== Token Action Sheet (cuando no tiene balance) ===== */}
    <BottomSheet
      visible={!!sheets.tokenAction}
      onClose={() => setSelectedTokenForAction(null)}
      minHeightPct={0.4}
      maxHeightPct={0.5}
      sheetTintRGBA={colors.sheetBgSolid}
      showHandle
      scrimOpacity={0.5}
    >
      {sheets.tokenAction && (
        <TokenActionSheet
          tokenId={sheets.tokenAction.tokenId}
          chain={sheets.tokenAction.chain}
          account={account}
          onClose={() => setSelectedTokenForAction(null)}
          onTokenDetails={openTokenDetails}
          guardNav={guardNav}
        />
      )}
    </BottomSheet>
  </SafeAreaView>  
);
}
