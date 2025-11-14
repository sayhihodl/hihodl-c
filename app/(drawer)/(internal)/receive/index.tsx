// app/(tabs)/receive/index.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams, useNavigation, type Href } from "expo-router";
import ReceiveSheet from "../../../../src/components/ReceiveSheet";
import { legacy } from "@/theme/colors";
import GlassHeader from "@/ui/GlassHeader";
import ScreenBg from "@/ui/ScreenBg";
import SearchField from "@/ui/SearchField";

/** ===== Chain logos ===== */
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import SuiBadge from "@assets/chains/Sui-chain.svg";

/** ===== Token logos ===== */
import ICON_USDC from "@assets/tokens/USDcoin.png";
import ICON_USDT_SVG from "@assets/tokens/TetherBadge.svg";

const { BG, TEXT, SUB, SEPARATOR } = legacy;

/* ---------- UI base ---------- */
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/** ===== tamaños ===== */
const AVATAR = 34;
const AVATAR_RADIUS = AVATAR / 5;
const MINI_BADGE = 18;
const MINI_INNER = 18;
const COUNTER_W = 18;
const NETWORK_LOGO = 34;

type Account = "Daily" | "Savings" | "Social";

/* ---------- Tipos y mocks ---------- */
export type ChainKey = "solana" | "ethereum" | "base" | "polygon" | "bitcoin" | "sui";
type TokenMeta = { id: string; symbol: string; name: string; chains: ChainKey[]; nativeChain: ChainKey };

const CHAINS: { key: ChainKey; name: string; short: string }[] = [
  { key: "solana", name: "Solana", short: "7WePY3…RU" },
  { key: "ethereum", name: "Ethereum", short: "0xD95E…A4E9" },
  { key: "base", name: "Base", short: "0xD95E…A4E9" },
  { key: "polygon", name: "Polygon", short: "0xD95E…A4E9" },
  { key: "sui", name: "Sui", short: "0x1fc8…c591" },
  { key: "bitcoin", name: "Bitcoin", short: "bc1q…mzpp" },
];

const ADDRESSES: Record<ChainKey, string> = {
  solana: "7WePY3xxxxxxxxxxxxxxxxxxxxxxxxxxxxRUn3UJ",
  ethereum: "0xd95e00000000000000000000000000000000a4e9",
  base: "0xd95e00000000000000000000000000000000a4e9",
  polygon: "0xd95e00000000000000000000000000000000a4e9",
  bitcoin: "bc1qexampleexampleexampleexamplemzpp",
  sui: "0x1fc8c5910000000000000000000000000000c591",
};

const TOKENS: TokenMeta[] = [
  { id: "usdc", symbol: "USDC", name: "USD Coin", chains: ["solana", "ethereum", "base", "polygon"], nativeChain: "ethereum" },
  { id: "usdt", symbol: "USDT", name: "Tether", chains: ["solana", "ethereum", "base", "polygon"], nativeChain: "ethereum" },
  { id: "sol", symbol: "SOL", name: "Solana", chains: ["solana"], nativeChain: "solana" },
  { id: "eth", symbol: "ETH", name: "Ether", chains: ["ethereum", "base", "polygon"], nativeChain: "ethereum" },
  { id: "btc", symbol: "BTC", name: "Bitcoin", chains: ["bitcoin"], nativeChain: "bitcoin" },
  { id: "sui", symbol: "SUI", name: "Sui", chains: ["sui"], nativeChain: "sui" },
];

/* ---------- Mapas exportables ---------- */
export const TOKEN_CHAINS: Record<string, ChainKey[]> = Object.fromEntries(TOKENS.map(t => [t.id, t.chains]));
export const TOKEN_DEFAULT_CHAIN: Record<string, ChainKey> = Object.fromEntries(
  TOKENS.map(t => [t.id, (t.chains.includes("solana") ? "solana" : t.nativeChain)])
);

/* ---------- Badges ---------- */
const CHAIN_MINI: Record<ChainKey, React.ComponentType<any> | null> = {
  solana: SolBadge, ethereum: EthBadge, base: BaseBadge, polygon: PolyBadge, bitcoin: null, sui: SuiBadge,
};
const CHAIN_LOGO: Partial<Record<ChainKey, React.ComponentType<any>>> = {
  solana: SolBadge, ethereum: EthBadge, base: BaseBadge, polygon: PolyBadge, sui: SuiBadge,
};

const defaultChainForToken = (t: TokenMeta): ChainKey =>
  TOKEN_DEFAULT_CHAIN[t.id] ?? (t.chains[0] ?? t.nativeChain);

/** Token icons */
const TOKEN_ICON: Partial<
  Record<string, { kind: "png"; src: any } | { kind: "svg"; Comp: React.ComponentType<any> }>
> = {
  usdc: { kind: "png", src: ICON_USDC },
  usdt: { kind: "svg", Comp: ICON_USDT_SVG as unknown as React.ComponentType<any> },
  eth: { kind: "svg", Comp: EthBadge },
  sol: { kind: "svg", Comp: SolBadge },
  sui: { kind: "svg", Comp: SuiBadge },
};

function TokenIcon({ token, chains }: { token: TokenMeta; chains: ChainKey[] }) {
  const def = TOKEN_ICON[token.id];
  const primary = defaultChainForToken(token);
  const showMini = chains.length > 1;
  const Mini = CHAIN_MINI[primary];

  return (
    <View style={styles.tokenIconWrap}>
      {def?.kind === "png" && <Image source={def.src} style={styles.tokenIconImg} resizeMode="contain" />}
      {def?.kind === "svg" && <def.Comp width={AVATAR} height={AVATAR} />}
      {!def && (
        <View style={styles.iconCircle}>
          <Text style={styles.iconTxt}>{token.symbol?.[0] ?? "?"}</Text>
        </View>
      )}
      {showMini && (
        <View style={styles.chainBadges}>
          <View style={[styles.chainBadgeItem, { left: 5, bottom: -10 }]}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeTxt}>{chains.length}</Text>
            </View>
          </View>
          {!!Mini && (
            <View style={[styles.chainBadgeItem, { right: -7, bottom: -10 }]}>
              <View style={styles.miniBadgeBox}>
                <Mini width={MINI_INNER} height={MINI_INNER} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function NetworkIcon({ chain }: { chain: ChainKey }) {
  const Logo = CHAIN_LOGO[chain];
  if (!Logo) {
    return (
      <View style={styles.iconCircle}>
        <Text style={styles.iconTxt}>{chain.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <View style={styles.networkCircle}>
      <Logo width={NETWORK_LOGO} height={NETWORK_LOGO} />
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ================================== */
export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ account?: string; token?: string; network?: string }>();
  const nav = useNavigation<any>();

  const account: Account = useMemo(() => {
    const m = String(params.account ?? "").toLowerCase();
    if (m === "savings") return "Savings";
    if (m === "social") return "Social";
    return "Daily";
  }, [params.account]);

  // ===== Header dials (ajustables) =====
  const HEADER_HEIGHT = 52;    // altura del header (similar a PaymentsHome)
  const HEADER_INNER_TOP = 16;  // pegado al notch (menor = más arriba)
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_HEIGHT;

  const [query, setQuery] = useState("");
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [showAllChains, setShowAllChains] = useState(false);
  const [qrState, setQrState] = useState<null | { token?: TokenMeta; chain: ChainKey }>(null);

  // Si se pasa token y network, abrir QR directamente
  useEffect(() => {
    if (params.token && params.network) {
      const tokenSymbol = params.token.toLowerCase();
      const network = params.network.toLowerCase() as ChainKey;
      const foundToken = TOKENS.find(t => 
        t.symbol.toLowerCase() === tokenSymbol || 
        t.id.toLowerCase() === tokenSymbol
      );
      if (foundToken) {
        setQrState({ token: foundToken, chain: network });
      }
    }
  }, [params.token, params.network]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { tokens: TOKENS, chains: CHAINS };
    return {
      tokens: TOKENS.filter(t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)),
      chains: CHAINS.filter(c => c.name.toLowerCase().includes(q) || c.key.includes(q as ChainKey)),
    };
  }, [query]);

  const openQRForToken = (t: TokenMeta) => setQrState({ token: t, chain: defaultChainForToken(t) });
  const openQRForChain = (c: ChainKey) => setQrState({ chain: c });

  const copyAddress = async (c: ChainKey) => {
    await Clipboard.setStringAsync(ADDRESSES[c]);
    Alert.alert("Copied", `${capitalize(c)} address copied`);
  };

  const openScanner = () => router.push("/(drawer)/(internal)/receive/scanner" as Href);
  const openRequestLink = () => router.push("/(drawer)/(internal)/receive/request-link" as Href);
  const openRequestAmount = (p: { token?: string; chain: ChainKey }) =>
    router.push({ pathname: "/(drawer)/(internal)/receive/request-amount", params: p } as Href);

  const closeReceive = () => {
    if (nav?.canGoBack?.()) router.back();
    else router.replace({ pathname: "/(drawer)/(tabs)/(home)" } as Href);
  };

  // Header blur / sticky
  const scrollY = useRef(new Animated.Value(0)).current;

  // Lists
  const tokenList = showAllTokens ? filtered.tokens : filtered.tokens.slice(0, 3);
  const chainList = showAllChains ? filtered.chains : filtered.chains.slice(0, 3);
  type SectionItem = { type: "tokens" | "chains" };
  const sections: SectionItem[] = [{ type: "tokens" }, { type: "chains" }];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Fondo que cubre notch + header */}
      <ScreenBg account={account} height={HEADER_TOTAL + 160} showTopSeam />

      {/* ===== GlassHeader con notch + blur ===== */}
      <GlassHeader
        scrolly={scrollY}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={HEADER_HEIGHT}
        innerTopPad={HEADER_INNER_TOP}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={
          <Pressable onPress={closeReceive} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search tokens or networks"
            containerStyle={{ marginLeft: 4, marginRight: 18 }}
            onClear={() => setQuery("")}
          />
        }
        rightSlot={
          <View style={styles.rightBtns}>
            <Pressable onPress={openRequestLink} hitSlop={10} accessibilityLabel="Open request via link">
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={openScanner} hitSlop={10} accessibilityLabel="Open QR scanner">
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* ===== Listas ===== */}
      <Animated.FlatList<SectionItem>
        data={sections}
        keyExtractor={(i, idx) => `${i.type}-${idx}`}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 72,
          paddingTop: HEADER_TOTAL + 8,
        }}
        ListFooterComponent={<View style={{ height: 32 }} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        renderItem={({ item }) =>
          item.type === "tokens" ? (
            <View>
              <Text style={styles.sectionTitle}>Tokens</Text>
              {tokenList.length > 0 ? (
                <>
                  {tokenList.map(t => (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                      onPress={() => openQRForToken(t)}
                      android_ripple={{ color: "rgba(255,255,255,0.05)" }}
                    >
                      <TokenIcon token={t} chains={t.chains} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{t.symbol}</Text>
                        {t.name !== t.symbol && (
                          <Text style={styles.rowSub}>{t.name}</Text>
                        )}
                      </View>
                      <View style={styles.actionButtons}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            openRequestAmount({ token: t.id, chain: defaultChainForToken(t) });
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Request via link"
                        >
                          <Ionicons name="log-out-outline" size={20} color={SUB} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            openQRForToken(t);
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Show QR code"
                        >
                          <Ionicons name="qr-code-outline" size={20} color={SUB} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            copyAddress(defaultChainForToken(t));
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Copy address"
                        >
                          <Ionicons name="copy-outline" size={20} color={SUB} />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))}
                  {filtered.tokens.length > 3 && (
                    <Pressable style={styles.moreRow} onPress={() => setShowAllTokens(v => !v)}>
                      <Text style={styles.moreTxt}>{showAllTokens ? "Show less" : "View more"}</Text>
                      <Ionicons name={showAllTokens ? "chevron-up" : "chevron-down"} size={16} color={SUB} />
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={SUB} />
                  <Text style={styles.emptyStateText}>No tokens found</Text>
                  <Text style={styles.emptyStateSub}>Try a different search term</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Networks</Text>
              {chainList.length > 0 ? (
                <>
                  {chainList.map(c => (
                    <Pressable
                      key={c.key}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                      onPress={() => openQRForChain(c.key)}
                      android_ripple={{ color: "rgba(255,255,255,0.05)" }}
                    >
                      <NetworkIcon chain={c.key} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{c.name}</Text>
                        <Text style={styles.rowSub}>{c.short}</Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            openRequestAmount({ chain: c.key });
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Request via link"
                        >
                          <Ionicons name="log-out-outline" size={20} color={SUB} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            openQRForChain(c.key);
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Show QR code"
                        >
                          <Ionicons name="qr-code-outline" size={20} color={SUB} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            copyAddress(c.key);
                          }}
                          style={styles.iconBtn}
                          hitSlop={10}
                          accessibilityLabel="Copy address"
                        >
                          <Ionicons name="copy-outline" size={20} color={SUB} />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))}
                  {filtered.chains.length > 3 && (
                    <Pressable style={styles.moreRow} onPress={() => setShowAllChains(v => !v)}>
                      <Text style={styles.moreTxt}>{showAllChains ? "Show less" : "View more"}</Text>
                      <Ionicons name={showAllChains ? "chevron-up" : "chevron-down"} size={16} color={SUB} />
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={SUB} />
                  <Text style={styles.emptyStateText}>No networks found</Text>
                  <Text style={styles.emptyStateSub}>Try a different search term</Text>
                </View>
              )}
            </View>
          )
        }
      />

      {/* QR Sheet */}
      {qrState && (
        <ReceiveSheet
          token={qrState.token}
          chain={qrState.chain}
          addresses={ADDRESSES}
          chains={CHAINS.map(c => c.key as ChainKey)}
          onSelectChain={(c: ChainKey) => setQrState(s => (s ? { ...s, chain: c } : s))}
          onClose={() => setQrState(null)}
        />
      )}
    </SafeAreaView>
  );
}

/* ================= styles ================= */
const BADGE_SHADOW = { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 3, elevation: 3 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  rightBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  /* Lists */
  sectionTitle: {
    color: SUB,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 12,
    marginTop: 4,
    textTransform: "uppercase",
  },

  row: {
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
    minHeight: 68,
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
  },

  iconCircle: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR_RADIUS,
    backgroundColor: SEPARATOR,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  networkCircle: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR_RADIUS,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconTxt: { color: TEXT, fontWeight: "800", fontSize: 18 },

  tokenIconWrap: { width: AVATAR, height: AVATAR, position: "relative", overflow: "visible" },
  tokenIconImg: { width: AVATAR, height: AVATAR },

  chainBadges: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, overflow: "visible" },
  chainBadgeItem: { position: "absolute", alignItems: "center", justifyContent: "center" },

  miniBadgeBox: {
    width: MINI_BADGE,
    height: MINI_BADGE,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    ...BADGE_SHADOW,
  },

  countBadge: {
    minWidth: COUNTER_W,
    height: COUNTER_W,
    borderRadius: COUNTER_W / 2,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    ...BADGE_SHADOW,
  },
  countBadgeTxt: { color: "#fff", fontSize: 13, fontWeight: "900" },

  rowTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  rowSub: {
    color: SUB,
    fontSize: 13,
    marginTop: 3,
    fontWeight: "400",
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },

  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  moreTxt: {
    color: SUB,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSub: {
    color: SUB,
    fontSize: 13,
    textAlign: "center",
  },
});