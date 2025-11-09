import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Animated, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard } from "@/ui/Glass";
import AccountFilterSheet from "@/payments/AccountFilterSheet";
import { SkeletonLine } from "@/ui/Skeleton";
import SearchField from "@/ui/SearchField";
import type { RecipientKind } from "@/send/types";

const BG = "#0D1820";
const AVATAR_SIZE = 34;
const CHIPS_H = 34;

type SingleAccount = "daily" | "savings" | "social";

type Thread = {
  id: string;
  name: string;
  alias: string;
  avatar?: string;
  emoji?: string; // Emoji del usuario HiHODL
  lastMsg: string;   // origen crudo (p.ej. "–15 USDT", "paid 5 DAI", "request 2 USDC", "split pending")
  lastTime: string;
  lastTs?: number; 
  unread?: boolean;
  isGroup?: boolean;
  favourite?: boolean;
  account?: SingleAccount;
  recipientKind?: RecipientKind | "group" | "card"; // Tipo de destinatario para formateo
  recipientAddress?: string; // Dirección completa (para wallets, IBAN, cards)
};

const MOCK_THREADS: Thread[] = [
  // Usuarios HiHODL
  { id: "2",  name: "@helloalex", alias: "@helloalex", lastMsg: "–15 USDT",         lastTime: "21:17", favourite: true, account: "daily", recipientKind: "hihodl" },
  { id: "4",  name: "@maria",     alias: "@maria",     lastMsg: "request 2 USDC",   lastTime: "09:12",                  account: "savings", recipientKind: "hihodl" },
  { id: "6",  name: "@luna",      alias: "@luna",      lastMsg: "–7.50 USDC",       lastTime: "08:20",                  account: "social", recipientKind: "hihodl" },
  { id: "8",  name: "@john",      alias: "@john",      lastMsg: "request 12 USDT",  lastTime: "Ayer",                   account: "savings", recipientKind: "hihodl" },
  { id: "10", name: "@li",        alias: "@li",        lastMsg: "paid 5 DAI",       lastTime: "Lun",                    account: "savings", recipientKind: "hihodl" },
  { id: "11", name: "@cami",      alias: "@cami",      lastMsg: "–3.00 USDC",       lastTime: "Lun",                    account: "daily", recipientKind: "hihodl" },
  { id: "13", name: "@memo",      alias: "@memo",      lastMsg: "tip 2 HODL",       lastTime: "Dom",                    account: "daily", recipientKind: "hihodl" },
  { id: "15", name: "@pablo",     alias: "@pablo",     lastMsg: "paid 9 USDT",      lastTime: "Sab",                    account: "daily", recipientKind: "hihodl" },
  { id: "16", name: "@noa",       alias: "@noa",       lastMsg: "request 1.5 USDC", lastTime: "Sab", favourite: true,   account: "savings", recipientKind: "hihodl" },
  { id: "17", name: "@lucas",     alias: "@lucas",     lastMsg: "–22 USDT",         lastTime: "Sab",                    account: "daily", recipientKind: "hihodl" },
  { id: "18", name: "@julia",     alias: "@julia",     lastMsg: "+0.2 SOL",         lastTime: "Vie",                    account: "daily", recipientKind: "hihodl" },
  { id: "20", name: "@nina",      alias: "@nina",      lastMsg: "–3.33 USDC",       lastTime: "Vie",                    account: "savings", recipientKind: "hihodl" },
  { id: "21", name: "@omar",      alias: "@omar",      lastMsg: "paid 4 USDT",      lastTime: "Jue",                    account: "daily", recipientKind: "hihodl" },
  { id: "22", name: "@zoe",       alias: "@zoe",       lastMsg: "request 0.5 USDC", lastTime: "Jue",                    account: "savings", recipientKind: "hihodl" },
  
  // Wallets
  { id: "5",  name: "Wallet",     alias: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", lastMsg: "paid 0.001 BTC",   lastTime: "08:40", account: "daily", recipientKind: "evm", recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" },
  { id: "9",  name: "Wallet",     alias: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", lastMsg: "–1.2 SOL",         lastTime: "Ayer", account: "daily", recipientKind: "sol", recipientAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
  { id: "14", name: "Wallet",     alias: "0x8ba1f109551bD432803012645Hac136c8C0dA5", lastMsg: "–0.05 ETH",        lastTime: "Dom", account: "savings", recipientKind: "evm", recipientAddress: "0x8ba1f109551bD432803012645Hac136c8C0dA5" },
  
  // IBAN
  { id: "iban1", name: "IBAN", alias: "ES9121000418450200051332", lastMsg: "–500 USDC", lastTime: "Ayer", account: "savings", recipientKind: "iban", recipientAddress: "ES9121000418450200051332" },
  { id: "iban2", name: "IBAN", alias: "DE89370400440532013000", lastMsg: "+250 USDT", lastTime: "Lun", account: "daily", recipientKind: "iban", recipientAddress: "DE89370400440532013000" },
  
  // Cards
  { id: "card1", name: "Card", alias: "4532123456789012", lastMsg: "–50 USDC", lastTime: "Vie", account: "daily", recipientKind: "card", recipientAddress: "4532123456789012" },
  
  // Groups
  { id: "3",  name: "Trip to Barcelona", alias: "@friend2",   lastMsg: "+4.20 USDT",       lastTime: "16:03", isGroup: true, account: "social", recipientKind: "group" },
  { id: "7",  name: "Group Trip", alias: "@groupTrip", lastMsg: "split pending",    lastTime: "Ayer", isGroup: true, account: "social", recipientKind: "group" },
  { id: "12", name: "Dev Squad", alias: "@devsquad",  lastMsg: "group created",    lastTime: "Dom", isGroup: true, account: "social", recipientKind: "group" },
  { id: "19", name: "BBQ Group", alias: "@groupBBQ",  lastMsg: "split settled",    lastTime: "Vie", isGroup: true, account: "social", recipientKind: "group" },
];

type Filter = "all" | "groups" | "favs";

// ===== Store seguro (selección multi-cuentas) =====
function usePaymentsFilterStoreSafe() {
  try {
    const { usePaymentsFilterStore } = require("@/store/paymentsFilter.store");
    return usePaymentsFilterStore() as {
      selected: { Daily: boolean; Savings: boolean; Social: boolean };
    };
  } catch {
    const mem = (global as any).__paymentsFilterMemSel ||= {
      selected: { Daily: true, Savings: true, Social: true },
    };
    return mem as { selected: { Daily: boolean; Savings: boolean; Social: boolean } };
  }
}

/** Convierte el lastMsg crudo a la frase normalizada pedida */

function formatThreadTime(ts?: number, fallback?: string) {
  if (!ts) return fallback ?? "";
  const d = new Date(ts);

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.floor((startToday - startDay) / 86400000);

  // Hoy -> HH:mm
  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  // Últimos 7 días -> día corto
  if (diffDays > 0 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" }); // Lun, Mar, Mié...
  }

  // Mismo año -> 12 May
  const sameYear = d.getFullYear() === today.getFullYear();
  if (sameYear) {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }); // 12 may
  }

  // Años anteriores -> 12 May 2024
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatLastActivity(raw: string): string {
  const msg = raw.trim();

  // –12.3 USDT  |  -12.3 USDT  -> sent
  const reMinus = /^[–-]\s*([\d.,]+)\s*([A-Z]+)\b/;
  // +12.3 USDT  -> received
  const rePlus  = /^\+\s*([\d.,]+)\s*([A-Z]+)\b/;
  // paid 5 DAI -> sent
  const rePaid  = /\bpaid\s+([\d.,]+)\s*([A-Z]+)\b/i;
  // request 2 USDC / requested 2 USDC -> requested
  const reReq   = /\brequest(?:ed)?\s+([\d.,]+)\s*([A-Z]+)\b/i;
  // split pending/settled
  const reSplit = /\bsplit\s+(pending|settled)\b/i;

  let m: RegExpExecArray | null;

  if ((m = rePlus.exec(msg)))    return `You received ${m[1]} ${m[2]}`;
  if ((m = reMinus.exec(msg)))   return `You sent ${m[1]} ${m[2]}`;
  if ((m = rePaid.exec(msg)))    return `You sent ${m[1]} ${m[2]}`;
  if ((m = reReq.exec(msg)))     return `You requested ${m[1]} ${m[2]}`;
  if ((m = reSplit.exec(msg)))   return `Split ${m[1].toLowerCase()}`;

  return msg; // fallback
}

/** Formatea el nombre de display según el tipo de destinatario */
function formatThreadDisplayName(thread: Thread): string {
  // Si es grupo, mostrar el nombre del grupo
  if (thread.isGroup || thread.recipientKind === "group") {
    return thread.name;
  }

  // Usuario HiHODL
  if (thread.recipientKind === "hihodl" || thread.alias.startsWith("@")) {
    return thread.alias || thread.name;
  }

  // Wallet address (EVM o Solana)
  if (thread.recipientKind === "evm" || thread.recipientKind === "sol" || thread.recipientKind === "tron") {
    const addr = thread.recipientAddress || thread.alias || "";
    if (addr.length > 10) {
      const head = addr.slice(0, 6);
      const tail = addr.slice(-4);
      return `Wallet • ${head}...${tail}`;
    }
    return `Wallet • ${addr}`;
  }

  // IBAN
  if (thread.recipientKind === "iban") {
    const iban = thread.recipientAddress || thread.alias || "";
    if (iban.length > 8) {
      const country = iban.slice(0, 2);
      const last4 = iban.slice(-4);
      return `IBAN • ${country}...${last4}`;
    }
    return `IBAN • ${iban}`;
  }

  // Card number
  if (thread.recipientKind === "card") {
    const card = thread.recipientAddress || thread.alias || "";
    if (card.length >= 4) {
      const last4 = card.slice(-4);
      return `Card • •••• ${last4}`;
    }
    return `Card • ${card}`;
  }

  // Fallback al nombre original
  return thread.name || thread.alias || "Unknown";
}

export default function PaymentsHome() {
  const { t } = useTranslation(["payments"]);
  const scrolly = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  const { selected } = usePaymentsFilterStoreSafe();
  const selectedKeys = useMemo(
    () =>
      (Object.entries(selected) as Array<[keyof typeof selected, boolean]>)
        .filter(([, v]) => v)
        .map(([k]) => k.toLowerCase() as SingleAccount),
    [selected]
  );
  const isAllAccounts = selectedKeys.length === 3;

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

  const accountLabel = useMemo(() => {
    if (selectedKeys.length === 1) {
      const k = selectedKeys[0];
      return k === "daily" ? "Daily" : k === "savings" ? "Savings" : "Social";
    }
    return "Accounts";
  }, [selectedKeys]);

  const filtered = useMemo(() => {
    const byFilter = (x: Thread) =>
      filter === "all" ? true : filter === "groups" ? !!x.isGroup : !!x.favourite;

    const byAccount = (x: Thread) => {
      if (isAllAccounts) return true;
      if (!x.account) return true;
      return selectedKeys.includes(x.account);
    };

    const bySearch = (x: Thread) =>
      (x.name + x.alias).toLowerCase().includes(search.toLowerCase());

    return MOCK_THREADS.filter(byFilter).filter(byAccount).filter(bySearch);
  }, [search, filter, isAllAccounts, selectedKeys]);

  const HEADER_TOTAL = insets.top + 6 + 62; // insets.top + innerTopPad + height

  const ChipsHeader = () => (
    <View style={{ paddingTop: HEADER_TOTAL + 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
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
          {!isAllAccounts ? <View style={styles.dot} /> : null}
        </Pressable>

        <View style={{ width: 8 }} />

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
      </ScrollView>

      <View style={styles.separator} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

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
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder={PHRASES[phIdx]}
            containerStyle={{ marginLeft: 4, marginRight: 18 }}
            enableAddressDetection={true}
          />
        }
        rightSlot={
          <View style={styles.rightBtns}>
            <Pressable hitSlop={10} onPress={() => router.push("/(internal)/send/scanner")}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={() => router.push("/(drawer)/(internal)/payments/composer")}
              style={styles.addChipBtn}
            >
              <Ionicons name="add" size={18} color="#FFB703" />
            </Pressable>
          </View>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(i: Thread) => i.id}
        ListHeaderComponent={ChipsHeader}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={[styles.threadGlass, { marginBottom: 12 }]}> 
              <SkeletonLine width={180} height={16} />
              <View style={{ height: 8 }} />
              <SkeletonLine width={120} height={12} />
            </View>
            <View style={[styles.threadGlass, { marginBottom: 12 }]}> 
              <SkeletonLine width={200} height={16} />
              <View style={{ height: 8 }} />
              <SkeletonLine width={100} height={12} />
            </View>
            <View style={[styles.threadGlass, { marginBottom: 12 }]}> 
              <SkeletonLine width={160} height={16} />
              <View style={{ height: 8 }} />
              <SkeletonLine width={110} height={12} />
            </View>
          </View>
        }
        renderItem={({ item }: { item: Thread }) => {
          const subtitle = formatLastActivity(item.lastMsg);
          const rightTime = formatThreadTime(item.lastTs, item.lastTime);
          const displayName = formatThreadDisplayName(item);
          
          // Determinar emoji/avatar según tipo
          const getAvatarContent = () => {
            if (item.avatar) {
              return <Image source={{ uri: item.avatar }} style={styles.avatar} />;
            }
            
            // Si es usuario HiHODL, usar emoji si está disponible, si no primera letra
            if (item.recipientKind === "hihodl" || item.alias.startsWith("@")) {
              // Si hay emoji del usuario, usarlo
              if (item.emoji) {
                return (
                  <View
                    style={[
                      styles.avatar,
                      { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                );
              }
              // Si no hay emoji, usar primera letra como fallback
              return (
                <View
                  style={[
                    styles.avatar,
                    { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
                  ]}
                >
                  <Text style={{ color: "#9CC6D1", fontWeight: "900" }}>
                    {item.alias.replace("@", "").slice(0, 1).toUpperCase() || item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              );
            }
            
            // Emoji según tipo de destinatario (no HiHODL)
            let emoji = "👤";
            if (item.isGroup || item.recipientKind === "group") emoji = "👥";
            else if (item.recipientKind === "evm" || item.recipientKind === "sol" || item.recipientKind === "tron") emoji = "🔷";
            else if (item.recipientKind === "iban") emoji = "🏦";
            else if (item.recipientKind === "card") emoji = "💳";
            
            return (
              <View
                style={[
                  styles.avatar,
                  { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
              >
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
              </View>
            );
          };
          
          return (
            <Pressable
              style={styles.threadCard}
              onPress={() =>
                router.push({
                  pathname: "/(internal)/payments/thread",
                  params: { 
                    id: item.id, 
                    name: displayName, 
                    alias: item.alias,
                    ...(item.emoji && { emoji: item.emoji }),
                    ...(item.avatar && { avatar: item.avatar }),
                    ...(item.recipientKind && { recipientKind: item.recipientKind }),
                    ...(item.recipientAddress && { recipientAddress: item.recipientAddress }),
                  },
                })
              }
            >
              <GlassCard style={styles.threadGlass}>
                <View style={styles.threadRow}>
                  <View style={styles.avatarWrap}>
                    {getAvatarContent()}
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.threadName} numberOfLines={1}>{displayName}</Text>
                    <Text style={styles.threadMsg} numberOfLines={1}>{subtitle}</Text>
                  </View>

                  <Text style={styles.threadTime}>{item.lastTime}</Text>
                </View>
              </GlassCard>
            </Pressable>
          );
        }}
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

      <AccountFilterSheet visible={accountSheetOpen} onClose={() => setAccountSheetOpen(false)} />
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


  rightBtns: { flexDirection: "row", alignItems: "center", gap: 12 },

  chipsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.10)", flexShrink: 0,
  },
  chipActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  chipLabel: { color: "#fff", fontSize: 12, letterSpacing: -0.2 },
  chipPrimary: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(223,245,255,0.25)" },
  dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6, backgroundColor: "#FFB703" },

  separator: {
    height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 8, marginBottom: 12, marginHorizontal: 16, borderRadius: 1,
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
  threadMsg: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }, // un pelín más claro
  threadTime: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
});