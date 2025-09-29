// app/(tabs)/swap/select-token.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import { useSwapStore } from "@/store/swap.store";
import { useLocalSearchParams, useRouter } from "expo-router";

/* Catálogo + iconos */
import { useTokenCatalog, type TokenMeta as CatalogToken } from "@/config/tokensCatalog";
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON, CHAIN_BADGE_BY_ID } from "@/config/iconRegistry";

const { BG, TEXT, SUB, SEPARATOR } = legacy;
type TokenMeta = CatalogToken;

const AVATAR = 34;
const AVATAR_RADIUS = AVATAR / 5;
const MINI_BADGE = 18;
const MINI_INNER = 18;

const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/** Mini-badge solo si es multichain y no es nativo */
const shouldShowMini = (t: TokenMeta) => !t.isNative && (t.supportedChains?.length ?? 0) > 1;

function TokenIcon({ token }: { token: TokenMeta }) {
  const def = TOKEN_ICONS[token.id] ?? DEFAULT_TOKEN_ICON;
  const Mini = shouldShowMini(token) ? CHAIN_BADGE_BY_ID[token.nativeChainId]?.Comp : undefined;

  return (
    <View style={styles.tokenIconWrap}>
      {def.kind === "img" && <Image source={def.src} style={styles.tokenIconImg} resizeMode="contain" />}
      {def.kind === "svg" && <def.Comp width={AVATAR} height={AVATAR} />}
      {!def && (
        <View style={styles.iconCircle}>
          <Text style={styles.iconTxt}>{token.symbol?.[0] ?? "?"}</Text>
        </View>
      )}
      {!!Mini && (
        <View style={styles.chainMini}>
          <View style={styles.miniBadgeBox}>
            <Mini width={MINI_INNER} height={MINI_INNER} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function SelectToken() {
  const router = useRouter();
  const { side = "pay" } = useLocalSearchParams<{ side?: "pay" | "receive" }>();
  const setToken = useSwapStore((s) => s.setToken);

  const allTokens = useTokenCatalog();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTokens;
    return allTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [query, allTokens]);

  const closeModal = () => {
    // Como estamos en el stack de swap, back() cierra el modal sin remount
    router.back();
  };

  const onSelect = (t: TokenMeta) => {
    setToken(side as "pay" | "receive", t.id); // actualiza store
    closeModal();                               // cierra modal (sin animación lateral)
  };

  const title = side === "receive" ? "You Receive" : "You Pay";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={closeModal} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={SUB} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search token"
          placeholderTextColor={SUB}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={SUB} />
          </Pressable>
        )}
      </View>

      {/* List */}
      <FlatList<TokenMeta>
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: t }) => (
          <View style={styles.row}>
            <TokenIcon token={t} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.symbol}</Text>
              <Text style={styles.rowSub}>{t.name}</Text>
            </View>
            <Pressable onPress={() => onSelect(t)} style={styles.selectBtn} hitSlop={10} accessibilityLabel={`Select ${t.symbol}`}>
              <Text style={styles.selectTxt}>Select</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerRow: {
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  title: { color: TEXT, fontWeight: "800", fontSize: 20 },

  search: {
    margin: 16, paddingHorizontal: 12, height: 46, borderRadius: 14,
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  input: { flex: 1, color: TEXT, fontSize: 15 },

  row: {
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
  },
  rowTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  rowSub: { color: SUB, fontSize: 12, marginTop: 2 },

  tokenIconWrap: { width: AVATAR, height: AVATAR, position: "relative" },
  tokenIconImg: { width: AVATAR, height: AVATAR },
  iconCircle: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR_RADIUS, backgroundColor: SEPARATOR,
    alignItems: "center", justifyContent: "center",
  },
  iconTxt: { color: TEXT, fontWeight: "800", fontSize: 18 },

  chainMini: { position: "absolute", right: -7, bottom: -10 },
  miniBadgeBox: {
    width: MINI_BADGE, height: MINI_BADGE, borderRadius: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)",
  },

  selectBtn: {
    paddingHorizontal: 14, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  selectTxt: { color: TEXT, fontWeight: "700", fontSize: 13 },
});