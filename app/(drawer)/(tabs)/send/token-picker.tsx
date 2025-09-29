import React, { useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Image, Animated, TextInput
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useNavigation, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "@/config/iconRegistry";
import { legacy } from "@/theme/colors";

type Account = "Daily" | "Savings" | "Social";
type TokenRow = { id: string; symbol: string; name: string; balance: number; fiat?: number };

const TOKENS: TokenRow[] = [
  { id: "USDC.circle", symbol: "USDC", name: "USD Coin", balance: 25.12, fiat: 25.12 },
  { id: "USDT.tether", symbol: "USDT", name: "Tether", balance: 9.5, fiat: 9.5 },
  { id: "SOL.native", symbol: "SOL", name: "Solana", balance: 0.31, fiat: 5.4 },
  { id: "ETH.native", symbol: "ETH", name: "Ethereum", balance: 0.03, fiat: 95.2 },
];

const { BG, TEXT, SUB } = legacy;

/* ======= utils ======= */
function TokenIcon({ id, size = 34 }: { id: string; size?: number }) {
  const def = (TOKEN_ICONS as any)[id] || DEFAULT_TOKEN_ICON;
  if (def?.kind === "svg") { const Comp = def.Comp; return <Comp width={size} height={size} />; }
  return <Image source={def.src} style={{ width: size, height: size }} resizeMode="contain" />;
}

/* ================================== */
export default function TokenPicker() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const params = useLocalSearchParams<{ account?: Account }>();
  const account: Account = (params.account as Account) ?? "Daily";

  // ===== Header dials (alineado a Receive) =====
  const TITLE_H = 44;
  const ROW_SEARCH_GAP = 14;
  const SEARCH_H = 50;
  const AFTER_SEARCH_GAP = 10;
  const HEADER_INNER_TOP = 6;

  const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // ===== Estado =====
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = TOKENS.slice().sort((a, b) => (b.fiat ?? 0) - (a.fiat ?? 0));
    if (!q) return base;
    return base.filter(
      t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [query]);

  // ir al selector de destinatario
  const goRecipient = (tokenId: string) => {
    router.push({
      pathname: "/(drawer)/(tabs)/send/search",
      params: { tokenId, account } as any,
    });
  };

  const goBackSafe = () => {
    if (nav?.canGoBack?.()) nav.goBack();
    else {
      router.replace({
        pathname: "/(drawer)/(tabs)/(home)" as any,
        params: { account: String(account).toLowerCase() },
      } as Href);
    }
  };

  // Header blur
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: BG }}>
      {/* Fondo que cubre notch + header */}
      <ScreenBg account={account} height={HEADER_TOTAL + 200} />

      {/* ===== Header con buscador ===== */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 20 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <>
            <View style={styles.topRow}>
              <Pressable onPress={goBackSafe} hitSlop={10} style={styles.leftBtn}>
                <Ionicons name="close" size={22} color={TEXT} />
              </Pressable>

              <View style={styles.titleWrap}>
                <Text style={styles.title} numberOfLines={1}>Send</Text>
              </View>

              {/* reserva simétrica para la derecha */}
              <View style={styles.rightSpacer} />
            </View>

            <View
              style={[
                styles.searchInHeader,
                { marginTop: ROW_SEARCH_GAP, height: SEARCH_H, marginBottom: AFTER_SEARCH_GAP },
              ]}
            >
              <Ionicons name="search" size={18} color={SUB} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search token"
                placeholderTextColor={SUB}
                style={styles.input as any}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={SUB} />
                </Pressable>
              ) : null}
            </View>
          </>
        }
      />

      {/* ===== Lista ===== */}
      <Animated.FlatList<TokenRow>
        data={data}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
          paddingTop: HEADER_TOTAL - 38,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => goRecipient(item.id)}
            style={styles.row}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${item.symbol}`}
          >
            <View style={styles.left}>
              <View style={styles.iconWrap}><TokenIcon id={item.id} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.sub}>{item.name}</Text>
              </View>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.balance}>
                {item.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.symbol}
              </Text>
              {!!item.fiat && <Text style={styles.sub}>${item.fiat.toFixed(2)}</Text>}
            </View>
          </Pressable>
        )}
        ListFooterComponent={<View style={{ height: 8 }} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
}

/* ============== styles ============== */
const styles = StyleSheet.create({
  // Header row centrada con laterales absolutos
  topRow: {
    height: 44,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  leftBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    position: "absolute",
    left: 0,
  },
  rightSpacer: {
    width: 36,
    height: 36,
    position: "absolute",
    right: 0,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  title: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  // Search
  searchInHeader: {
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(3, 12, 16, 0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: TEXT, fontSize: 15 },

  // Lista
  row: {
    backgroundColor: "rgba(3, 12, 16, 0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  symbol: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  balance: { color: "#fff", fontWeight: "700" },
});