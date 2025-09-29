// app/dashboard/discover.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { searchTokens, type ChainKey, type TokenCatalogItem } from "@/lib/token-catalog";

const CHAINS: ChainKey[] = ["solana", "ethereum", "base", "polygon"];
const BG = "#0E1722", CARD = "#08232E", TEXT = "#CFE3EC", YELLOW = "#FFB703";

export default function DiscoverScreen() {
  const router = useRouter();
  const [chain, setChain] = useState<ChainKey>("solana");
  const [q, setQ] = useState("");
  const [data, setData] = useState<TokenCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const runSearch = useCallback((query: string) => {
  if (debRef.current) clearTimeout(debRef.current);
  debRef.current = setTimeout(async () => {
    setLoading(true);
    try {
      const res = await searchTokens(chain, query, 80);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, 180);
}, [chain]);

useEffect(() => {
  runSearch(q);
  return () => {
    if (debRef.current) clearTimeout(debRef.current);
  };
}, [q, runSearch]);
  const renderItem = ({ item }: { item: TokenCatalogItem }) => {
    const src = item.logoURI ? { uri: item.logoURI } : undefined;
    return (
      <Pressable
        style={styles.row}
        onPress={() => {
          Haptics.selectionAsync();
          // Aquí puedes abrir un preview del token o ir a añadirlo directo:
          // router.push({ pathname: "/dashboard/addtokenconfirm", params: { ... }});
        }}
      >
        <View style={styles.left}>
          {src ? <Image source={src} style={styles.logo} /> : <View style={[styles.logo, { backgroundColor: "#244652" }]} />}
          <View style={{ maxWidth: "78%" }}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{item.symbol} · {item.chain.toUpperCase()}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9FB7C2" />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Discover</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Chain pills */}
      <View style={styles.chainRow}>
        {CHAINS.map(c => {
          const active = c === chain;
          return (
            <Pressable
              key={c}
              onPress={() => { Haptics.selectionAsync(); setChain(c); }}
              style={[styles.chainPill, active && styles.chainPillActive]}
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
          placeholder="Search tokens, symbols or addresses"
          placeholderTextColor="#9FB7C2"
          value={q}
          onChangeText={setQ}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9FB7C2" />
          </Pressable>
        ) : null}
      </View>

      {/* Results */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.chain + ":" + i.address}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}><Text style={styles.emptyTxt}>{q ? "No results" : "Type to search"}</Text></View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  title: { color: "#fff", fontWeight: "800" },

  chainRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 10 },
  chainPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)" },
  chainPillActive: { backgroundColor: YELLOW },
  chainTxt: { color: "#9FB7C2", fontWeight: "800", fontSize: 12 },
  chainTxtActive: { color: "#0A1A24" },

  searchWrap: { height: 42, borderRadius: 10, backgroundColor: CARD, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, color: "#fff" },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 },

  row: { minHeight: 54, paddingVertical: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: "85%" },
  logo: { width: 32, height: 32, borderRadius: 16 },
  name: { color: "#fff", fontWeight: "800" },
  sub: { color: TEXT, fontSize: 12, marginTop: 2 },

  empty: { paddingVertical: 20, alignItems: "center" },
  emptyTxt: { color: TEXT },
});