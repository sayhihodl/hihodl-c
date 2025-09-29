// app/dashboard/payments/index.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
  Animated,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "@/theme/colors";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard, Divider as GlassDivider } from "@/ui/Glass";

import BottomSheet from "@/components/BottomSheet/BottomSheet";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import type { ChainId, CurrencyId } from "@/store/portfolio.store";
import { PAYMENTS_MOCK } from "@/mocks/payments.mock";

import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";

/* ===================== theme / dials ===================== */
const BG = colors.navBg;
const TEXT_SOFT = "#FFFFFF";
const TEXT_MID = "rgba(255,255,255,0.75)";
const YELLOW = colors.primary; // brand

// Header dials (igual que Currency/Receive)
const TITLE_H = 44;
const ROW_SEARCH_GAP = 12;
const SEARCH_H = 44;
const AFTER_SEARCH_GAP = 8;
const HEADER_INNER_TOP = 10;
const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;

/* ===================== tipos / helpers ===================== */
type Account = "Daily" | "Savings" | "Social";
const ACCOUNT_IDS: Record<Account, string> = { Daily: "daily", Savings: "savings", Social: "social" };

type PaymentKind = "in" | "out" | "swap" | "refund";
export type PaymentItem = {
  id: string; title: string; when: string; amount: string; type: PaymentKind;
  chainId?: ChainId; currencyId?: CurrencyId;
  swapFrom?: { currencyId?: CurrencyId; chainId?: ChainId };
  swapTo?: { currencyId?: CurrencyId; chainId?: ChainId };
};

const CHAIN_LABEL: Record<ChainId, string> = {
  "solana:mainnet": "Solana",
  "eip155:1": "Ethereum",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
};
const CHAIN_BADGE: Record<ChainId, { Icon: React.ComponentType<any> }> = {
  "eip155:1": { Icon: EthBadge },
  "solana:mainnet": { Icon: SolBadge },
  "eip155:8453": { Icon: BaseBadge },
  "eip155:137": { Icon: PolyBadge },
};
const normalizeChainId = (id?: ChainId | string): ChainId | undefined => {
  if (!id) return undefined as any;
  if (id === "base:mainnet") return "eip155:8453";
  return id as ChainId;
};

type MName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
const ICON_BY_KIND: Record<PaymentKind, MName> = {
  in: "arrow-bottom-left", out: "arrow-top-right", swap: "swap-horizontal", refund: "undo",
};

const SYMBOL_TO_ID: Record<string, CurrencyId | undefined> = {
  USDC: "USDC.circle", USDT: "USDT.tether", SOL: "SOL.native", ETH: "ETH.native", POL: "POL.native", BTC: undefined, DAI: undefined,
};
const parseAmount = (amount: string) => {
  const parts = amount.replace(/[+–]/g, "").trim().split(/\s+/);
  let symbol = parts.find((p) => /^(USDC|USDT|SOL|ETH|POL|BTC|DAI)$/i.test(p))?.toUpperCase();
  if (!symbol && /^[A-Z]{3,5}$/.test(parts[0])) symbol = parts[0].toUpperCase();
  return { symbol };
};

const TOKEN_FALLBACK = DEFAULT_TOKEN_ICON;
const MINI = 18;

function ChainMini({ chainId }: { chainId?: ChainId }) {
  const id = normalizeChainId(chainId);
  if (!id || !CHAIN_BADGE[id]) return null;
  const { Icon } = CHAIN_BADGE[id];
  return (
    <View style={{ width: MINI, height: MINI, borderRadius: 5, alignItems: "center", justifyContent: "center" }}>
      <Icon width={MINI - 4} height={MINI - 4} />
    </View>
  );
}
function TokenGlyph({ currencyId, size = 30 }: { currencyId?: CurrencyId; size?: number }) {
  const def = (currencyId && TOKEN_ICONS[currencyId]) || TOKEN_FALLBACK;
  if ((def as any)?.kind === "svg") { const Comp = (def as any).Comp; return <Comp width={size} height={size} />; }
  return <Image source={(def as any).src} style={{ width: size, height: size }} resizeMode="contain" />;
}
function TxAvatar({ item }: { item: PaymentItem }) {
  const parsed = parseAmount(item.amount);
  const currencyId = item.currencyId ?? (parsed.symbol ? SYMBOL_TO_ID[parsed.symbol] : undefined);
  return (
    <View style={styles.avatar}>
      <TokenGlyph currencyId={currencyId} size={30} />
      <View style={styles.avatarBadge}>
        <MaterialCommunityIcons name={ICON_BY_KIND[item.type]} size={12} color="#081217" />
      </View>
      {item.chainId && (
        <View style={styles.avatarChainBadge}>
          <ChainMini chainId={normalizeChainId(item.chainId)} />
        </View>
      )}
    </View>
  );
}
function sectionKey(when: string): string {
  const w = when.toLowerCase();
  if (w.startsWith("today")) return "Today";
  if (w.startsWith("yesterday")) return "Yesterday";
  const comma = when.indexOf(",");
  return comma > 0 ? when.slice(0, comma) : when.split(/\s+/).slice(0, 3).join(" ");
}

/* ===================== Screen ===================== */
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ account?: string }>();
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // Scroll para GlassHeader
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filtro cuentas
  const defaultAccount = (Object.keys(ACCOUNT_IDS) as Account[]).find(
    (a) => ACCOUNT_IDS[a] === (params.account ?? "").toLowerCase()
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [selAccounts, setSelAccounts] = useState<Record<Account, boolean>>({
    Daily: defaultAccount ? defaultAccount === "Daily" : true,
    Savings: defaultAccount ? defaultAccount === "Savings" : true,
    Social: defaultAccount ? defaultAccount === "Social" : true,
  });

  // Buscador
  const [q, setQ] = useState("");

  // Datos (mock + filtros)
  const picks: (PaymentItem & { _account: Account })[] = useMemo(() => {
    const arr: (PaymentItem & { _account: Account })[] = [];
    (["Daily", "Savings", "Social"] as Account[]).forEach((acc) => {
      if (!selAccounts[acc]) return;
      const items = ((PAYMENTS_MOCK?.[acc] as PaymentItem[]) ?? []).filter((x) => x.type === "out");
      for (const it of items) arr.push({ ...it, _account: acc });
    });
    const qq = q.trim().toLowerCase();
    return qq ? arr.filter((p) => p.title.toLowerCase().includes(qq)) : arr;
  }, [q, selAccounts]);

  const moreThanOneAccountSelected = useMemo(
    () => Object.values(selAccounts).filter(Boolean).length > 1,
    [selAccounts]
  );

  const sections = useMemo(() => {
    const map = new Map<string, (PaymentItem & { _account: Account })[]>();
    for (const p of picks) { const key = sectionKey(p.when); if (!map.has(key)) map.set(key, []); map.get(key)!.push(p); }
    const entries = Array.from(map.entries());
    const weight = (k: string) => (k === "Today" ? 0 : k === "Yesterday" ? 1 : 2);
    entries.sort((a, b) => weight(a[0]) - weight(b[0]));
    return entries;
  }, [picks]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await new Promise((r) => setTimeout(r, 600)); } finally { setRefreshing(false); }
  }, []);

  const toggleAll = useCallback((on: boolean) => setSelAccounts({ Daily: on, Savings: on, Social: on }), []);
  const toggleOne = useCallback((a: Account) => setSelAccounts((s) => ({ ...s, [a]: !s[a] })), []);

  const renderRow = useCallback(
    ({ item }: { item: PaymentItem & { _account: Account } }) => (
      <Pressable onPress={() => { /* abre detalle aquí si lo deseas */ }} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
        <TxAvatar item={item} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {moreThanOneAccountSelected && (
              <View style={styles.accountPill}><Text style={styles.accountPillTxt}>{item._account}</Text></View>
            )}
          </View>
          <Text style={styles.when}>{item.when.split(",")[1]?.trim() ?? item.when}</Text>
        </View>
        <Text style={styles.amount} numberOfLines={1}>{item.amount.replace("+ ", "+").replace("- ", "-")}</Text>
      </Pressable>
    ),
    [moreThanOneAccountSelected]
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Fondo HiHODL que cubre notch + header */}
      <ScreenBg account="Daily" height={HEADER_TOTAL + 180} />

      {/* ===== GlassHeader estándar (título + search + filtro) ===== */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 16 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <>
            {/* Fila superior: título 18 (alineado con el resto de headers) */}
            <View style={styles.topRow}>
              <View style={{ width: 36 }} />
              <Text style={styles.hTitle}>Payments</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Search + Filter en el header */}
            <View style={[styles.searchRow, { marginTop: ROW_SEARCH_GAP, height: SEARCH_H }]}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={TEXT_MID} style={{ marginRight: 8 }} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search"
                  placeholderTextColor={TEXT_MID}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {q ? (
                  <Pressable onPress={() => setQ("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={TEXT_MID} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={() => setFilterOpen(true)} style={styles.filterBtn} hitSlop={8}>
                <Ionicons name="filter" size={18} color="#fff" />
              </Pressable>
            </View>

            {/* aire bajo el buscador */}
            <View style={{ height: AFTER_SEARCH_GAP }} />
          </>
        }
      />

      {/* ===== Lista con GlassCards ===== */}
      <Animated.FlatList
        data={sections}
        keyExtractor={([k]) => k}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: HEADER_TOTAL + 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item: [section, rows] }) => (
          <View>
            <Text style={styles.sectionHdr}>{section}</Text>
            <GlassCard tone="panel">
              {rows.map((p, idx) => (
                <View key={p.id}>
                  {renderRow({ item: p })}
                  {idx < rows.length - 1 && <GlassDivider />}
                </View>
              ))}
            </GlassCard>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: HEADER_TOTAL + 24 }}>
            <Text style={{ color: TEXT_MID }}>No payments</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} colors={[YELLOW]} progressBackgroundColor={BG} />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />

      {/* ===== Filtros (sheet) ===== */}
      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} maxHeightPct={0.82} backgroundColor="#0E1A21" showHandle>
        <View style={{ paddingTop: 4 }}>
          <View style={styles.sheetHdr}>
            <Text style={styles.sheetTitle}>Account filter</Text>
            <Pressable onPress={() => toggleAll(true)} hitSlop={8}><Text style={styles.selectAll}>Select all</Text></Pressable>
          </View>

          {(["Daily", "Savings", "Social"] as Account[]).map((a, i) => {
            const on = selAccounts[a];
            return (
              <View key={a} style={{ marginHorizontal: 8, marginBottom: 8 }}>
                <Pressable onPress={() => toggleOne(a)} style={({ pressed }) => [styles.filterRow, pressed && { opacity: 0.92 }]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <View style={[styles.check, on && styles.checkOn]}>{on && <Ionicons name="checkmark" size={14} color="#081217" />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterTitle}>{a}</Text>
                    <Text style={styles.filterSub}>{ACCOUNT_IDS[a].toUpperCase()}</Text>
                  </View>
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                </Pressable>
                {i < 2 && <View style={{ height: 4 }} />}
              </View>
            );
          })}
          <Pressable onPress={() => setFilterOpen(false)} style={styles.applyBtn} accessibilityRole="button" accessibilityLabel="Apply filters">
            <Text style={styles.applyTxt}>Apply</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

/* ===================== styles ===================== */
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  hTitle: { color: TEXT_SOFT, fontSize: 18, fontWeight: "800", textAlign: "center" },

  /* Search en header */
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: "#fff", fontWeight: "400" },
  filterBtn: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
  },

  /* Secciones */
  sectionHdr: { color: "#fff", fontWeight: "500", fontSize: 14, paddingHorizontal: 2, marginBottom: 8 },

  /* Row dentro de GlassCard */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center", marginRight: 2,
  },
  avatarBadge: {
    position: "absolute", right: -6, bottom: -6, width: MINI, height: MINI, borderRadius: 9,
    backgroundColor: YELLOW, alignItems: "center", justifyContent: "center",
  },
  avatarChainBadge: {
    position: "absolute", left: -6, bottom: -6, width: MINI, height: MINI, borderRadius: 9,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },

  /* —— Body fino —— */
  title:  { color: TEXT_SOFT, fontSize: 15, fontWeight: "400" },
  when:   { color: TEXT_MID,  fontSize: 12, fontWeight: "400", marginTop: 2 },
  amount: { color: "#fff",    fontSize: 15, fontWeight: "400", marginLeft: 10 },

  accountPill: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  accountPillTxt: { color: "#fff", fontSize: 10, fontWeight: "600" },

  /* Sheet filtros */
  sheetHdr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, marginBottom: 10 },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  selectAll: { color: "#7CC2D1", fontWeight: "800" },

  filterRow: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: "row", alignItems: "center",
  },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  checkOn: { backgroundColor: "#7CC2D1", borderColor: "#7CC2D1" },
  filterTitle: { color: "#fff", fontWeight: "700" },
  filterSub: { color: TEXT_MID, fontSize: 12, marginTop: 2 },

  applyBtn: {
    marginTop: 12, backgroundColor: "#7CC2D1", borderRadius: 14, paddingVertical: 12, alignItems: "center",
    marginHorizontal: 8,
  },
  applyTxt: { color: "#081217", fontWeight: "900" },
});