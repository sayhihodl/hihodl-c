import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  UIManager,
  findNodeHandle,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";

import { legacy } from "@/theme/colors";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import SegmentedPills from "@/ui/SegmentedPills";
import { GlassCard } from "@/ui/Glass";
import { TOP_CAP } from "@/theme/gradients";
import SegmentedPager from "@/ui/SegmentedPager";

import {
  usePortfolioStore,
  type ChainId,
  type CurrencyId,
  type Position,
} from "@/store/portfolio.store";
import { useSwapStore } from "@/store/swap.store";
import { useTokenCatalog } from "@/config/tokensCatalog";

const { TEXT } = legacy;

/* ============================ Theme / layout ============================ */
type Account = "Daily" | "Savings" | "Social";
const ACCOUNT_IDS: Record<Account, string> = { Daily: "daily", Savings: "savings", Social: "social" };
const ACCOUNTS: Account[] = ["Daily", "Savings", "Social"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const YELLOW = "#FFB703";
const HERO_HEIGHT = 330;

/** Header spacing */
const HEADER_HEIGHT = 70;
const HEADER_TOPPAD = 14;
const HEADER_TITLE_GAP = 10;
const PILL_H = 44;
const ICON_SZ = 32;

/** Ajustes del botón de opciones (absoluto en rightSlot) */
const RIGHT_BTN_RIGHT = 16;     // margen al borde derecho
const RIGHT_BTN_Y_OFFSET = -21;  // ajuste fino vertical

/* ============================ Mock market ============================ */
type ChainFilter = "All" | "Solana" | "Ethereum" | "Base" | "Polygon" | "Bitcoin";
type Timeframe = "1h" | "24h" | "7d" | "30d";
type RankBy = "Rank" | "Volume" | "Price" | "Price Change" | "Market Cap";
type MarketRow = {
  id: string; symbol: string; name: string;
  chain: Exclude<ChainFilter, "All">; mc_usd: number; vol_usd: number; change_pct: number; price?: number;
};
const MARKET_MOCK: MarketRow[] = [
  { id: "solnav", symbol: "SOLNAV", name: "SOLNAV", chain: "Solana", mc_usd: 291_000, vol_usd: 16_000, change_pct: 1112.84, price: 0.0018 },
  { id: "pandu", symbol: "PANDU", name: "PANDU", chain: "Solana", mc_usd: 3_400_000, vol_usd: 87_000, change_pct: 11.08, price: 0.00000319 },
  { id: "nunu", symbol: "NUNU", name: "nunu", chain: "Solana", mc_usd: 4_300_000, vol_usd: 233_000, change_pct: -4.99, price: 0.00436 },
  { id: "stream", symbol: "STRM", name: "STREAMER", chain: "Base", mc_usd: 25_000_000, vol_usd: 390_000, change_pct: 146.85, price: 0.0263 },
  { id: "xvm", symbol: "XVM", name: "XVM", chain: "Polygon", mc_usd: 18_000_000, vol_usd: 68_000, change_pct: 19.66, price: 0.0176 },
];

/* ============================ Popover ============================ */
type Anchor = { x: number; y: number; w: number; h: number };
type MenuState = { open: boolean; anchor: Anchor | null };
type ElemRef<T> = React.RefObject<T> | React.MutableRefObject<T | null>;

function PopoverMenu({
  visible, onClose, anchor, items, value, onSelect, maxWidth = 260,
}: {
  visible: boolean; onClose: () => void; anchor: Anchor | null; items: string[]; value?: string; onSelect: (v: string) => void; maxWidth?: number;
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
          const active = value === it;
          return (
            <Pressable
              key={it}
              onPress={() => { onSelect(it); onClose(); }}
              style={[
                styles.popoverItem,
                idx === 0 && styles.popoverItemFirst,
                idx === items.length - 1 && styles.popoverItemLast,
                active && styles.popoverItemActive,
              ]}
            >
              <Text style={[styles.popoverText, active && styles.popoverTextActive]}>{it}</Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

/* ============================ Screen ============================ */
export default function SwapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // header blur control (vertical)
  const scrolly = React.useRef(new Animated.Value(0)).current;

  // horizontal pager (accounts)
  const hScrollX = React.useRef(new Animated.Value(0)).current;
  const [index, setIndex] = React.useState(0);

  const params = useLocalSearchParams<{ account?: string; currencyId?: string; fromChainId?: string; toChainId?: string }>();

  const positions = usePortfolioStore((s) => s.positions ?? []);
  const storeActive = usePortfolioStore((s: any) => s.activeAccount as Account | undefined);

  // ⛽️ Store swap
  const payId = useSwapStore((s) => s.pay);
  const receiveId = useSwapStore((s) => s.receive);
  const setSwapToken = useSwapStore((s) => s.setToken);
  const swapSides = useSwapStore((s) => s.swapSides);
  const settings = useSwapStore((s) => s.settings);

  // Catálogo
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

  // Defaults
  React.useEffect(() => {
    if (!payId && payToken) setSwapToken("pay", payToken.id);
    if (!receiveId && receiveToken) setSwapToken("receive", receiveToken.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuenta activa inicial
  const initialAccount: Account =
    (params.account?.toLowerCase() === "savings" && "Savings") ||
    (params.account?.toLowerCase() === "social" && "Social") ||
    (params.account?.toLowerCase() === "daily" && "Daily") ||
    storeActive || "Daily";

  React.useEffect(() => {
    const i = Math.max(0, ACCOUNTS.indexOf(initialAccount));
    setIndex(i);
  }, [initialAccount]);

  const [rankBy, setRankBy] = React.useState<RankBy>("Rank");
  const [chain, setChain] = React.useState<ChainFilter>("All");
  const [tf, setTf] = React.useState<Timeframe>("24h");

  const [amount, setAmount] = React.useState("");

  const doFlip = () => { swapSides(); void Haptics.selectionAsync(); };

  const openSelectToken = (side: "pay" | "receive") =>
    router.push({ pathname: "/(drawer)/(tabs)/swap/select-token", params: { side, account: ACCOUNT_IDS[ACCOUNTS[index]] } } as Href);

  const openSettings = () => router.push("/(drawer)/(tabs)/swap/settings" as Href);

  const filtered = React.useMemo(() => {
    return MARKET_MOCK
      .filter((r) => chain === "All" || r.chain === chain)
      .sort((a, b) => {
        switch (rankBy) {
          case "Volume": return b.vol_usd - a.vol_usd;
          case "Price": return (b.price ?? 0) - (a.price ?? 0);
          case "Price Change": return b.change_pct - a.change_pct;
          case "Market Cap": return b.mc_usd - a.mc_usd;
          default: return 0;
        }
      });
  }, [chain, rankBy]);

  /* ---------- Popovers ---------- */
  const rankBtnRef = React.useRef<View>(null);
  const netBtnRef = React.useRef<View>(null);
  const timeBtnRef = React.useRef<View>(null);

  const [rankMenu, setRankMenu] = React.useState<MenuState>({ open: false, anchor: null });
  const [netMenu, setNetMenu] = React.useState<MenuState>({ open: false, anchor: null });
  const [timeMenu, setTimeMenu] = React.useState<MenuState>({ open: false, anchor: null });

  const openMenuFor = (ref: ElemRef<View>, set: React.Dispatch<React.SetStateAction<MenuState>>) => {
    const node = findNodeHandle((ref as any).current);
    if (!node) return;
    // @ts-ignore RN types
    UIManager.measureInWindow(node, (x: number, y: number, w: number, h: number) => { set({ open: true, anchor: { x, y, w, h } }); });
  };

  /* ---------- Header slots ---------- */
  const headerCenter = (
    <View style={{ width: "100%", paddingHorizontal: 4 }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: HEADER_TITLE_GAP }}>
        Swap
      </Text>
      <SegmentedPills
        items={ACCOUNTS.map((a) => ({ id: ACCOUNT_IDS[a], label: a }))}
        activeIndex={index}
        onPress={(i) => {
          if (i === index) return;
          setIndex(i);
          void Haptics.selectionAsync();
        }}
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

  /* Botón de ajustes en absoluto dentro de rightSlot (fuera de la sombra de las pills) */
  const rightSlotAbsolute = (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: RIGHT_BTN_RIGHT,
        top: HEADER_TITLE_GAP + (PILL_H - ICON_SZ) / 2 + RIGHT_BTN_Y_OFFSET,
      }}
    >
      <Pressable onPress={openSettings} style={styles.iconBtnHeader} hitSlop={8} accessibilityLabel="Open swap settings">
        <Ionicons name="options-outline" size={18} color="#fff" />
      </Pressable>
    </View>
  );

  const HEADER_H = insets.top + HEADER_TOPPAD + HEADER_HEIGHT;

  /* ============================ Render helpers ============================ */
  const slipLabel = settings.slippage.mode === "auto" ? "Auto" : `${settings.slippage.fixedPct}%`;
  const prioLabel = settings.priority.mode === "auto" ? "Auto" : `${settings.priority.customSol} SOL`;
  const tipLabel = settings.tip.mode === "auto" ? "Auto (0.05%)" : `${settings.tip.pct}%`;

  const Page = ({ acct }: { acct: Account }) => (
    <Animated.ScrollView
      contentContainerStyle={{ paddingTop: HEADER_H + 12, paddingBottom: insets.bottom + 48 }}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: false })}
      showsVerticalScrollIndicator={false}
    >
      <GlassCard style={[styles.card, { paddingTop: 22 }]}>
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>You Pay</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#7aa6b4"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable onPress={() => openSelectToken("pay")} style={styles.pill} accessibilityLabel="Select pay token">
            <Text style={styles.pillTxt}>{payToken?.symbol ?? "—"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={doFlip} style={styles.swapIconWrap} hitSlop={8} accessibilityLabel="Flip tokens">
          <Text style={styles.swapIcon}>⇅</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>You Receive</Text>
        <View style={styles.inputRow}>
          <Text style={[styles.input, { color: "#9eb4bd" }]}>0</Text>
          <Pressable onPress={() => openSelectToken("receive")} style={styles.pill} accessibilityLabel="Select receive token">
            <Text style={styles.pillTxt}>{receiveToken?.symbol ?? "—"}</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() =>
            Alert.alert(
              "Swap (mock)",
              `Account: ${acct}\nPay: ${amount || 0} ${payToken?.symbol ?? ""} → Receive: ${receiveToken?.symbol ?? ""}\nSlippage: ${slipLabel}\nPriority Fee: ${prioLabel}\nTip: ${tipLabel}`
            )
          }
        >
          <Text style={styles.primaryTxt}>Swap</Text>
        </Pressable>
      </GlassCard>

      <View style={{ height: 14 }} />

      <GlassCard style={[styles.card, { paddingTop: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 2, marginBottom: 8 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Trending</Text>
        </View>

        <View style={styles.filtersBar}>
          <View ref={rankBtnRef}>
            <Pressable onPress={() => openMenuFor(rankBtnRef, setRankMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{rankBy}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </Pressable>
          </View>

          <View ref={netBtnRef}>
            <Pressable onPress={() => openMenuFor(netBtnRef, setNetMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{chain}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </Pressable>
          </View>

          <View ref={timeBtnRef}>
            <Pressable onPress={() => openMenuFor(timeBtnRef, setTimeMenu)} style={styles.filterBtn}>
              <Text style={styles.filterBtnTxt}>{tf}</Text>
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
                  "Token",
                  `${item.name} • ${item.chain}\nMC $${fmt(item.mc_usd)} • Vol $${fmt(item.vol_usd)}\n${item.change_pct.toFixed(2)}%`
                )
              }
              style={styles.row}
            >
              <View style={{ width: 22, alignItems: "center" }}>
                <Text style={styles.rank}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub}>${fmt(item.mc_usd)} MC   ·   ${fmt(item.vol_usd)} Vol</Text>
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

      {/* Pager horizontal controlado */}
      <SegmentedPager<Account>
        items={ACCOUNTS}
        index={index}
        onIndexChange={setIndex}
        scrollX={hScrollX}
        width={SCREEN_WIDTH}
        renderPage={(acct) => <Page acct={acct} />}
        style={{ flexGrow: 0 }}
      />

      {/* Menús Popover */}
      <PopoverMenu
        visible={rankMenu.open}
        anchor={rankMenu.anchor}
        onClose={() => setRankMenu({ open: false, anchor: null })}
        items={["Rank", "Volume", "Price", "Price Change", "Market Cap"]}
        value={rankBy}
        onSelect={(v) => setRankBy(v as RankBy)}
      />
      <PopoverMenu
        visible={netMenu.open}
        anchor={netMenu.anchor}
        onClose={() => setNetMenu({ open: false, anchor: null })}
        items={["All", "Solana", "Ethereum", "Base", "Polygon", "Bitcoin"]}
        value={chain}
        onSelect={(v) => setChain(v as ChainFilter)}
      />
      <PopoverMenu
        visible={timeMenu.open}
        anchor={timeMenu.anchor}
        onClose={() => setTimeMenu({ open: false, anchor: null })}
        items={["1h", "24h", "7d", "30d"]}
        value={tf}
        onSelect={(v) => setTf(v as Timeframe)}
      />
    </SafeAreaView>
  );
}

/* ============================ Utils & Styles ============================ */
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n.toFixed(0)}`;

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Botón del header */
  iconBtnHeader: {
    width: ICON_SZ,
    height: ICON_SZ,
    borderRadius: ICON_SZ / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  /* Cards (Glass) */
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderRadius: 18,
  },

  /* Swap controls */
  sectionTitle: {
    color: TEXT,
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 10,
    fontWeight: "800",
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pillTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  swapIconWrap: { alignItems: "center", marginVertical: 6 },
  swapIcon: { color: "#cdbdff", fontSize: 18, fontWeight: "900" },

  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTxt: { color: "#0A1A24", fontSize: 15, fontWeight: "800" },

  /* Filters */
  filtersBar: { flexDirection: "row", gap: 8, marginBottom: 10 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  filterBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  /* Trending list */
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rank: { color: "#9eb4bd", fontWeight: "800", fontSize: 12 },
  rowName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rowSub: { color: "#9eb4bd", fontSize: 12, marginTop: 2 },
  rowPrice: { fontWeight: "800", fontSize: 13 },

  /* Popover */
  popoverBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    backgroundColor: "rgba(20,27,33,0.98)",
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.09)",
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  popoverItem: { paddingHorizontal: 14, paddingVertical: 10 },
  popoverItemFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  popoverItemLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  popoverItemActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  popoverText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  popoverTextActive: { color: "#fff" },
});