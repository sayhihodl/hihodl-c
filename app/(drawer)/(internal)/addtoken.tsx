// app/dashboard/addtoken.tsx
import { searchTokens, type ChainKey, type TokenCatalogItem } from "@/lib/token-catalog";
import { usePortfolioStore } from "@/store/portfolio.store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { goToTokenDetails } from "@/lib/nav";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// ✅ Usa el SafeAreaView correcto:
import { SafeAreaView } from "react-native-safe-area-context";

/** =========================
 *  Constantes / helpers
 * ========================= */
const CHAIN_KEY_TO_ID = {
  solana: "solana:mainnet",
  ethereum: "eip155:1",
  base: "eip155:8453",
  polygon: "eip155:137",
} as const;
type ChainId = typeof CHAIN_KEY_TO_ID[keyof typeof CHAIN_KEY_TO_ID];

// Mapa por símbolo -> currencyId esperado por tu pantalla de detalles
const SYMBOL_TO_CURRENCY_ID: Record<string, string> = {
  USDC: "USDC.circle",
  USDT: "USDT.tether",
  ETH: "ETH.native",
  SOL: "SOL.native",
  POL: "POL.native",
};

// Intenta obtener el currencyId desde el item del catálogo o por símbolo
function resolveCurrencyId(t: TokenCatalogItem): string | undefined {
  const anyT = t as any;
  if (typeof anyT.currencyId === "string" && anyT.currencyId.length > 0) {
    return anyT.currencyId;
  }
  const sym = (t.symbol || "").toUpperCase();
  return SYMBOL_TO_CURRENCY_ID[sym];
}

const CHAINS: ChainKey[] = ["solana", "ethereum", "base", "polygon"];

export default function AddTokenScreen() {
  const router = useRouter();
  const [chain, setChain] = useState<ChainKey>("solana");
  const [q, setQ] = useState("");
  const [data, setData] = useState<TokenCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addWatchToken = usePortfolioStore((s) => (s as any).addWatchToken);

  // Debounce
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSearch = useCallback(
    (query: string) => {
      if (debRef.current) clearTimeout(debRef.current);
      debRef.current = setTimeout(async () => {
        setLoading(true);
        setErr(null);
        try {
          const res = await searchTokens(chain, query.trim(), 60);
          setData(res);
        } catch (e: any) {
          setErr(e?.message || "Search failed");
          setData([]);
        } finally {
          setLoading(false);
        }
      }, 160);
    },
    [chain]
  );

  useEffect(() => {
    runSearch(q);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [q, chain, runSearch]);

  const onAdd = useCallback(
    async (t: TokenCatalogItem) => {
      await Haptics.selectionAsync();
      try {
        if (typeof addWatchToken === "function") addWatchToken(t);

        // Navegación a detalles
        const chainId: ChainId =
          CHAIN_KEY_TO_ID[t.chain as keyof typeof CHAIN_KEY_TO_ID];
        const currencyId = resolveCurrencyId(t);
        if (!currencyId) {
          // Si no podemos resolver el ID, no navegamos (evitamos "Token not found")
          return;
        }

        // ✅ Usa el helper centralizado con un SOLO argumento (objeto)
        goToTokenDetails({ id: currencyId, chainId });

        // Si prefieres reemplazar el stack en vez de apilar:
        // router.replace({ pathname: "/(tabs)/tokens/[id]", params: { id: currencyId, chainId } });
      } catch {
        // no-op
      }
    },
    [addWatchToken]
  );

  const ListHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: 16 }}>
        {/* Chain pills */}
        <View style={styles.chainRow}>
          {CHAINS.map((c) => {
            const active = c === chain;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setChain(c);
                }}
                style={[styles.chainPill, active && styles.chainPillActive]}
                hitSlop={8}
              >
                <Text style={[styles.chainTxt, active && styles.chainTxtActive]}>{c.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#9FB7C2" />
          <TextInput
            placeholder="Search by name, symbol or address"
            placeholderTextColor="#9FB7C2"
            value={q}
            onChangeText={setQ}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9FB7C2" />
            </Pressable>
          ) : null}
        </View>
      </View>
    ),
    [chain, q]
  );

  const renderItem = useCallback(
    ({ item }: { item: TokenCatalogItem }) => {
      const src = item.logoURI ? { uri: item.logoURI } : undefined;
      return (
        <View style={styles.row}>
          <View style={styles.left}>
            {src ? (
              <Image source={src} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { backgroundColor: "#244652" }]} />
            )}
            <View style={{ maxWidth: "78%" }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.symbol}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {item.name} · {item.chain.toUpperCase()}
              </Text>
            </View>
          </View>

          <Pressable onPress={() => onAdd(item)} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={16} color="#0A1A24" />
            <Text style={styles.addTxt}>Add</Text>
          </Pressable>
        </View>
      );
    },
    [onAdd]
  );

  return (
    <SafeAreaView style={styles.container}>
     
     
     {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Add token</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Results */}
      {loading && data.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingTxt}>Searching {chain}…</Text>
        </View>
      ) : err ? (
        <View style={styles.empty}>
          <Ionicons name="warning-outline" size={18} color="#9FB7C2" />
          <Text style={styles.emptyTxt}>{err}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.chain + ":" + i.address}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>
                {q ? "No results" : `Start typing to find tokens on ${chain}.`}
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

/* =========================
 * Styles
 * ========================= */
const BG = "#0E1722";
const CARD = "#08232E";
const TEXT = "#CFE3EC";
const YELLOW = "#FFB703";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  title: { color: "#fff", fontWeight: "800", fontSize: 16 },

  chainRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 12 },
  chainPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chainPillActive: { backgroundColor: YELLOW },
  chainTxt: { color: "#9FB7C2", fontWeight: "800", fontSize: 12, letterSpacing: 0.2 },
  chainTxtActive: { color: "#0A1A24" },

  searchWrap: {
    height: 44,
    borderRadius: 12,
    backgroundColor: CARD,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  input: { flex: 1, color: "#fff" },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 },

  row: {
    minHeight: 56,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: "74%" },
  logo: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#244652" },
  name: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.2 },
  sub: { color: TEXT, fontSize: 12, marginTop: 2 },

  addBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addTxt: { color: "#0A1A24", fontWeight: "900" },

  empty: { paddingVertical: 24, alignItems: "center", gap: 8 },
  emptyTxt: { color: TEXT },
  loadingBox: { alignItems: "center", gap: 8, marginTop: 24 },
  loadingTxt: { color: TEXT },
});