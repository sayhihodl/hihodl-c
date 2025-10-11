import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard } from "@/ui/Glass";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";

const BG = "#0D1820";
const AVATAR_SIZE = 34;
const CHIPS_H = 34; // altura de cada chip

type AccountKey = "all" | "daily" | "savings" | "social";

type Thread = {
  id: string;
  name: string;
  alias: string;
  avatar?: string;
  lastMsg: string;
  lastTime: string;
  unread?: boolean;
  isGroup?: boolean;
  favourite?: boolean;
  /** opcional: cuando lo añadas podremos filtrar de verdad por cuenta */
  account?: Exclude<AccountKey, "all">;
};

// 👇 solo usuarios/grupos HiHODL (nada de merchants)
const MOCK_THREADS: Thread[] = [
  { id: "2",  name: "@helloalex", alias: "@helloalex", lastMsg: "–15 USDT",         lastTime: "21:17", favourite: true, account: "daily" },
  { id: "3",  name: "@friend2",   alias: "@friend2",   lastMsg: "–4.20 USDT",       lastTime: "16:03", isGroup: true,   account: "social" },
  { id: "4",  name: "@maria",     alias: "@maria",     lastMsg: "request 2 USDC",   lastTime: "09:12",                  account: "savings" },
  { id: "5",  name: "@satoshi",   alias: "@satoshi",   lastMsg: "paid 0.001 BTC",   lastTime: "08:40",                  account: "daily" },
  { id: "6",  name: "@luna",      alias: "@luna",      lastMsg: "–7.50 USDC",       lastTime: "08:20",                  account: "social" },
  { id: "7",  name: "@groupTrip", alias: "@groupTrip", lastMsg: "split pending",    lastTime: "Ayer", isGroup: true,    account: "social" },
  { id: "8",  name: "@john",      alias: "@john",      lastMsg: "request 12 USDT",  lastTime: "Ayer",                   account: "savings" },
  { id: "9",  name: "@sara",      alias: "@sara",      lastMsg: "–1.2 SOL",         lastTime: "Ayer",                   account: "daily" },
  { id: "10", name: "@li",        alias: "@li",        lastMsg: "paid 5 DAI",       lastTime: "Lun",                    account: "savings" },
  { id: "11", name: "@cami",      alias: "@cami",      lastMsg: "–3.00 USDC",       lastTime: "Lun",                    account: "daily" },
  { id: "12", name: "@devsquad",  alias: "@devsquad",  lastMsg: "group created",    lastTime: "Dom", isGroup: true,     account: "social" },
  { id: "13", name: "@memo",      alias: "@memo",      lastMsg: "tip 2 HODL",       lastTime: "Dom",                    account: "daily" },
  { id: "14", name: "@daniela",   alias: "@dani",      lastMsg: "–0.05 ETH",        lastTime: "Dom",                    account: "savings" },
  { id: "15", name: "@pablo",     alias: "@pablo",     lastMsg: "paid 9 USDT",      lastTime: "Sab",                    account: "daily" },
  { id: "16", name: "@noa",       alias: "@noa",       lastMsg: "request 1.5 USDC", lastTime: "Sab", favourite: true,   account: "savings" },
  { id: "17", name: "@lucas",     alias: "@lucas",     lastMsg: "–22 USDT",         lastTime: "Sab",                    account: "daily" },
  { id: "18", name: "@julia",     alias: "@julia",     lastMsg: "paid 0.2 SOL",     lastTime: "Vie",                    account: "daily" },
  { id: "19", name: "@groupBBQ",  alias: "@groupBBQ",  lastMsg: "split settled",    lastTime: "Vie", isGroup: true,     account: "social" },
  { id: "20", name: "@nina",      alias: "@nina",      lastMsg: "–3.33 USDC",       lastTime: "Vie",                    account: "savings" },
  { id: "21", name: "@omar",      alias: "@omar",      lastMsg: "paid 4 USDT",      lastTime: "Jue",                    account: "daily" },
  { id: "22", name: "@zoe",       alias: "@zoe",       lastMsg: "request 0.5 USDC", lastTime: "Jue",                    account: "savings" },
];

type Filter = "all" | "groups" | "favs";

export default function PaymentsHome() {
  const { t } = useTranslation(["payments"]);
  const scrolly = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [accountFilter, setAccountFilter] = useState<AccountKey>("all");
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  // Placeholders rotatorios (base)
  const PHRASES = useMemo(
    () => [
      t("payments:searchPh", "Search"),
      t("payments:ph.user", "Search @username"),
      t("payments:ph.contact", "Search contact"),
      t("payments:ph.addr", "Paste wallet address"),
    ],
    [t]
  );
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PHRASES.length), 2000);
    return () => clearInterval(id);
  }, [PHRASES.length]);

  // Placeholder contextual
  const searchPh = useMemo(() => {
    const base = PHRASES[phIdx];
    if (accountFilter === "all") return base;
    const scope = accountFilter === "daily" ? "Daily" : accountFilter === "savings" ? "Savings" : "Social";
    return `${base} in ${scope}`;
  }, [PHRASES, phIdx, accountFilter]);

  // Etiqueta del chip Accounts
  const accountLabel = useMemo(() => {
    switch (accountFilter) {
      case "daily": return "Accounts · Daily";
      case "savings": return "Accounts · Savings";
      case "social": return "Accounts · Social";
      default: return "Accounts";
    }
  }, [accountFilter]);

  // Filtro + búsqueda (incluye cuenta)
  const filtered = useMemo(() => {
    const byFilter = (x: Thread) =>
      filter === "all" ? true : filter === "groups" ? !!x.isGroup : !!x.favourite;

    const byAccount = (x: Thread) =>
      accountFilter === "all" ? true : x.account === accountFilter;

    const bySearch = (x: Thread) =>
      (x.name + x.alias).toLowerCase().includes(search.toLowerCase());

    return MOCK_THREADS.filter(byFilter).filter(byAccount).filter(bySearch);
  }, [search, filter, accountFilter]);

  // Altura real del header (igual estética Home)
  const HEADER_H = insets.top + 6 + 54;

  // Chips como header de la lista (se ocultan al hacer scroll)
  const ChipsHeader = () => (
    <View style={{ paddingTop: HEADER_H + 8 }}>
      <View style={styles.chipsRow}>
        {/* Accounts (abre BottomSheet) */}
        <Pressable
          onPress={() => setAccountSheetOpen(true)}
          style={[styles.chip, styles.chipPrimary, { height: CHIPS_H }]}
          hitSlop={10}
          accessibilityLabel="Accounts"
        >
          <Ionicons name="wallet-outline" size={14} color="#DFF5FF" style={{ marginRight: 6 }} />
          <Text style={[styles.chipLabel, { fontWeight: "800" }]} numberOfLines={1}>
            {accountLabel}
          </Text>
          {accountFilter !== "all" ? <View style={styles.dot} /> : null}
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* Filtros sociales a la derecha */}
        {(
          [
            { k: "all", label: t("payments:filters.all", "All") },
            { k: "groups", label: t("payments:filters.groups", "Groups") },
            { k: "favs", label: t("payments:filters.favourites", "Favourites") },
          ] as Array<{ k: Filter; label: string }>
        ).map((c) => {
          const active = filter === c.k;
          return (
            <Pressable
              key={c.k}
              onPress={() => setFilter(c.k)}
              style={[styles.chip, { height: CHIPS_H }, active && styles.chipActive]}
              hitSlop={10}
            >
              <Text style={[styles.chipLabel, active && { fontWeight: "800" }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* separador sutil */}
      <View style={styles.separator} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

      {/* ===== HEADER FIJO ===== */}
      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={
          <Pressable style={styles.emojiBtn} onPress={() => router.push("/menu")}>
            <Text style={{ fontSize: 18 }}>🚀</Text>
          </Pressable>
        }
        centerSlot={
          <View style={[styles.searchBar, { marginLeft: 4, marginRight: 18 }]}>
            <Ionicons name="search" size={16} color="#8FD3E3" />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPh}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        }
        rightSlot={
          <View style={styles.rightBtns}>
            <Pressable hitSlop={10} onPress={() => router.push("/(internal)/send/scanner")}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={() => router.push("/(internal)/payments/new")}
              style={styles.addChipBtn}
            >
              <Ionicons name="add" size={18} color="#FFB703" />
            </Pressable>
          </View>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* ===== LISTA (chips dentro como header) ===== */}
      <Animated.FlatList
        data={filtered}
        keyExtractor={(i: Thread) => i.id}
        ListHeaderComponent={ChipsHeader}
        renderItem={({ item }: { item: Thread }) => (
          <Pressable
            style={styles.threadCard}
            onPress={() =>
              router.push({
                pathname: "/(internal)/payments/thread",
                params: { id: item.id, name: item.name, alias: item.alias },
              })
            }
          >
            <GlassCard style={styles.threadGlass}>
              <View style={styles.threadRow}>
                <View style={styles.avatarWrap}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
                      ]}
                    >
                      <Text style={{ color: "#9CC6D1", fontWeight: "900" }}>
                        {item.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.threadName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.threadMsg} numberOfLines={1}>{item.lastMsg}</Text>
                </View>

                <Text style={styles.threadTime}>{item.lastTime}</Text>
              </View>
            </GlassCard>
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        initialNumToRender={12}
        windowSize={10}
        removeClippedSubviews
      />

      {/* ===== BottomSheet: Accounts ===== */}
      {accountSheetOpen && (
        <BottomKeyboardModal
  visible={accountSheetOpen}
  onClose={() => setAccountSheetOpen(false)}
>
  {/* Header del sheet (DIY) */}
  <View style={styles.sheetHeader}>
    <Text style={styles.sheetTitle}>
      {t("payments:accounts.title", "Select account")}
    </Text>
  </View>

  {([
    { k: "all",     label: "All Accounts" },
    { k: "daily",   label: "Daily" },
    { k: "savings", label: "Savings" },
    { k: "social",  label: "Social" },
  ] as const).map((opt) => {
    const active = accountFilter === opt.k;
    return (
      <Pressable
        key={opt.k}
        onPress={() => { setAccountFilter(opt.k); setAccountSheetOpen(false); }}
        style={[styles.row, active && { backgroundColor: "rgba(255,255,255,0.06)" }]}
      >
        <Text style={[styles.rowLabel, active && { fontWeight: "800" }]}>{opt.label}</Text>
        {active ? <Ionicons name="checkmark" size={18} color="#DFF5FF" /> : null}
      </Pressable>
    );
  })}
</BottomKeyboardModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  emojiBtn: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14, paddingHorizontal: 10, height: 36, flex: 1,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "400", letterSpacing: -0.2 },

  rightBtns: { flexDirection: "row", alignItems: "center", gap: 12 },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  chipActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  chipLabel: { color: "#fff", fontSize: 12, letterSpacing: -0.2 },

  chipPrimary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(223,245,255,0.25)",
    maxWidth: 200,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, marginLeft: 6,
    backgroundColor: "#FFB703",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 1,
  },

  addChipBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: "#FFB703",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,183,3,0.10)",
  },

  threadCard: { marginBottom: 12 },
  threadGlass: { paddingVertical: 12, paddingHorizontal: 12 },
  threadRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 18, overflow: "hidden" },
  avatar: { width: "100%", height: "100%", borderRadius: 18 },
  threadName: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: -0.2 },
  threadMsg: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  threadTime: { color: "rgba(255,255,255,0.55)", fontSize: 12 },

  // Sheet rows
  row: {
    height: 48, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 10, marginBottom: 8,
  },
  rowLabel: { color: "#fff", fontSize: 14 },

  sheetHeader: {
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 12,
},
sheetTitle: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "800",
},

});