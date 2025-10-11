// app/(tabs)/tokens/[chain]/index.tsx
import React, { useMemo, useCallback, memo } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  Image,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goToTokenDetails } from "@/lib/nav";

/* ===== Tipos básicos ===== */
type ChainId  = "solana:mainnet" | "eip155:1" | "eip155:8453" | "eip155:137";
type ChainKey = "solana" | "ethereum" | "base" | "polygon";
type CurrencyId = "USDC.circle" | "USDT.tether" | "ETH.native" | "SOL.native" | "POL.native";

type TokenListItem = {
  currencyId: CurrencyId;
  symbol: string;
  name: string;
  logoURI?: string;
};

/* ===== Tema local ===== */
const BG = "#0E1722";
const CARD = "#08232E";
const TEXT = "#FFFFFF";
const TEXT_DIM = "#9FB7C2";

/* ===== Helpers red ===== */
const KEY_TO_ID: Record<ChainKey, ChainId> = {
  solana: "solana:mainnet",
  ethereum: "eip155:1",
  base: "eip155:8453",
  polygon: "eip155:137",
};
const isChainId = (v?: string): v is ChainId =>
  v === "solana:mainnet" || v === "eip155:1" || v === "eip155:8453" || v === "eip155:137";

const maybeNormalizeChain = (raw?: string | string[]): ChainId | undefined => {
  if (!raw) return undefined;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (isChainId(v)) return v;
  const k = v.toLowerCase() as ChainKey;
  if (k in KEY_TO_ID) return KEY_TO_ID[k];
  if (v === "ETH.native") return "eip155:1";
  if (v === "SOL.native") return "solana:mainnet";
  if (v === "POL.native") return "eip155:137";
  if (v === "base:mainnet") return "eip155:8453";
  return undefined;
};

/* ===== Datos (placeholder) ===== */
function useTokensByChain(_chainId?: ChainId): TokenListItem[] {
  return [
    { currencyId: "USDC.circle", symbol: "USDC", name: "USD Coin",  logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
    { currencyId: "USDT.tether", symbol: "USDT", name: "Tether",    logoURI: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    { currencyId: "ETH.native",  symbol: "ETH",  name: "Ethereum",  logoURI: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { currencyId: "SOL.native",  symbol: "SOL",  name: "Solana",    logoURI: "https://cryptologos.cc/logos/solana-sol-logo.png" },
    { currencyId: "POL.native",  symbol: "POL",  name: "Polygon",   logoURI: "https://cryptologos.cc/logos/polygon-matic-logo.png" },
  ];
}

/* ===== Item (memo) ===== */
const Row = memo(function Row({
  item,
  onPress,
}: { item: TokenListItem; onPress: (it: TokenListItem) => void }) {
  const src = item.logoURI ? { uri: item.logoURI } : undefined;
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
    >
      {src ? (
        <Image source={src} style={styles.logo} />
      ) : (
        <View style={[styles.logo, { backgroundColor: "#244652" }]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.sub}>{item.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={TEXT_DIM} />
    </Pressable>
  );
});

/* ===== Screen ===== */
export default function TokensByChainScreen() {
  const insets = useSafeAreaInsets();
  const { chain } = useLocalSearchParams<{ chain?: string | string[] }>();
  const chainId = useMemo(() => maybeNormalizeChain(chain), [chain]);

  // ⚠️ Hooks ANTES de cualquier return condicional
  const tokens = useTokensByChain(chainId);

  const openDetails = useCallback(
    (t: TokenListItem) => {
      if (!chainId) return;                 // si no hay red válida, no navega
      goToTokenDetails({ id: t.currencyId, chainId });
    },
    [chainId]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TokenListItem>) => <Row item={item} onPress={openDetails} />,
    [openDetails]
  );

  if (!chainId) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.dim}>Invalid network: {String(chain)}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: BG }}
      data={tokens}
      keyExtractor={(t) => t.currencyId}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      initialNumToRender={8}
      windowSize={8}
      removeClippedSubviews
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.dim}>No tokens on this network.</Text>
        </View>
      }
    />
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: CARD,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 40, height: 40, borderRadius: 10 },
  symbol: { color: TEXT, fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  sub: { color: TEXT_DIM, fontSize: 12, marginTop: 2 },
  sep: { height: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BG },
  dim: { color: TEXT_DIM },
});