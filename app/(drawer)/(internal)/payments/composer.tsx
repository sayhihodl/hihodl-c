// app/(drawer)/(internal)/payments/composer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Animated, FlatList, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import PaymentComposer from "@/payments/PaymentComposer";
import { router } from "expo-router";
import SearchField from "@/ui/SearchField";
import { GlassCard } from "@/ui/Glass";
import { parseRecipient, isSendableAddress } from "@/send/parseRecipient";
import type { RecipientKind } from "@/send/types";

// Importar MOCK_THREADS para buscar
const MOCK_THREADS = [
  // Usuarios HiHODL
  { id: "2",  name: "@helloalex", alias: "@helloalex", lastMsg: "–15 USDT",         lastTime: "21:17", favourite: true, account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "4",  name: "@maria",     alias: "@maria",     lastMsg: "request 2 USDC",   lastTime: "09:12",                  account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "6",  name: "@luna",      alias: "@luna",      lastMsg: "–7.50 USDC",       lastTime: "08:20",                  account: "social" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "8",  name: "@john",      alias: "@john",      lastMsg: "request 12 USDT",  lastTime: "Ayer",                   account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "10", name: "@li",        alias: "@li",        lastMsg: "paid 5 DAI",       lastTime: "Lun",                    account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "11", name: "@cami",      alias: "@cami",      lastMsg: "–3.00 USDC",       lastTime: "Lun",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "13", name: "@memo",      alias: "@memo",      lastMsg: "tip 2 HODL",       lastTime: "Dom",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "15", name: "@pablo",     alias: "@pablo",     lastMsg: "paid 9 USDT",      lastTime: "Sab",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "16", name: "@noa",       alias: "@noa",       lastMsg: "request 1.5 USDC", lastTime: "Sab", favourite: true,   account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "17", name: "@lucas",     alias: "@lucas",     lastMsg: "–22 USDT",         lastTime: "Sab",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "18", name: "@julia",     alias: "@julia",     lastMsg: "+0.2 SOL",         lastTime: "Vie",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "20", name: "@nina",      alias: "@nina",      lastMsg: "–3.33 USDC",       lastTime: "Vie",                    account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "21", name: "@omar",      alias: "@omar",      lastMsg: "paid 4 USDT",      lastTime: "Jue",                    account: "daily" as const, recipientKind: "hihodl" as RecipientKind },
  { id: "22", name: "@zoe",       alias: "@zoe",       lastMsg: "request 0.5 USDC", lastTime: "Jue",                    account: "savings" as const, recipientKind: "hihodl" as RecipientKind },
  // Groups
  { id: "3",  name: "Trip to Barcelona", alias: "@friend2",   lastMsg: "+4.20 USDT",       lastTime: "16:03", isGroup: true, account: "social" as const, recipientKind: "group" as any },
  { id: "7",  name: "Group Trip", alias: "@groupTrip", lastMsg: "split pending",    lastTime: "Ayer", isGroup: true, account: "social" as const, recipientKind: "group" as any },
  { id: "12", name: "Dev Squad", alias: "@devsquad",  lastMsg: "group created",    lastTime: "Dom", isGroup: true, account: "social" as const, recipientKind: "group" as any },
  { id: "19", name: "BBQ Group", alias: "@groupBBQ",  lastMsg: "split settled",    lastTime: "Vie", isGroup: true, account: "social" as const, recipientKind: "group" as any },
];

type Thread = typeof MOCK_THREADS[number];

export default function PaymentsComposerScreen() {
  const { t } = useTranslation(["payments"]);
  const scrolly = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const insets = useSafeAreaInsets();
  
  // Altura total del header: insets.top + innerTopPad + height
  const HEADER_TOTAL = insets.top + 6 + 42;

  // Mismo sistema de frases alternando que PaymentsHome
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

  // Búsqueda inteligente
  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return null;

    const qLower = q.toLowerCase();

    // Si es una dirección sendable, mostrar preview para navegar
    if (isSendableAddress(q)) {
      const parsed = parseRecipient(q);
      if (parsed) {
        return { type: "address" as const, parsed, query: q };
      }
    }

    // Buscar en threads existentes (exact match primero, luego parcial)
    const exactMatch = MOCK_THREADS.find((t) => 
      t.alias.toLowerCase() === qLower || t.name.toLowerCase() === qLower
    );
    const matchingThreads = exactMatch 
      ? [exactMatch]
      : MOCK_THREADS.filter((t) => 
          (t.name + t.alias).toLowerCase().includes(qLower)
        );

    // Si hay threads que coinciden, mostrarlos
    if (matchingThreads.length > 0) {
      return { type: "threads" as const, threads: matchingThreads };
    }

    // Si parece un usuario HiHODL (@username) pero no existe thread
    if (qLower.startsWith("@")) {
      return { type: "new_hihodl" as const, query: q };
    }

    // Sugerencias basadas en búsqueda parcial
    return { type: "suggestions" as const, query: q };
  }, [search]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1820" }}>
      <ScreenBg account="Daily" height={160} showTopSeam />
      
      {/* Header - igual que PaymentsHome */}
      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={66}
        centerWidthPct={65}
        leftSlot={
          <Pressable style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder={PHRASES[phIdx]}
            containerStyle={{ marginLeft: 0, marginRight: 0 }}
            enableAddressDetection={false}
            onClear={search ? () => setSearch("") : undefined}
          />
        }
        rightSlot={
          <View style={{ paddingRight: 8, marginLeft: 29 }}>
            <Pressable hitSlop={10} onPress={() => router.push("/(internal)/send/scanner")}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Body - ScrollView con PaymentComposer o resultados de búsqueda */}
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: HEADER_TOTAL + 12,
          paddingBottom: 20 
        }}
      >
        {searchResults ? (
          <SearchResultsView results={searchResults} onClose={() => setSearch("")} />
        ) : (
          <PaymentComposer
            onRequest={() => router.push("/(drawer)/(internal)/payments/QuickRequestScreen")}
            onScan={() => router.push("/(drawer)/(internal)/send/scanner")}
            onGroup={() => router.push("/(drawer)/(internal)/payments/create-group")}
          />
        )}
      </Animated.ScrollView>
    </View>
  );
}

// Componente de resultados de búsqueda
function SearchResultsView({ 
  results, 
  onClose 
}: { 
  results: { type: "address"; parsed: any; query: string } | { type: "threads"; threads: Thread[] } | { type: "new_hihodl"; query: string } | { type: "suggestions"; query: string };
  onClose: () => void;
}) {
  const { t } = useTranslation(["payments"]);

  if (results.type === "address") {
    const { parsed, query } = results;
    // Vista previa de dirección detectada
    const handlePress = () => {
      const addr = parsed.resolved?.address ?? parsed.toRaw;
      let toChain = parsed.toChain || parsed.resolved?.chain;
      
      if (parsed.kind === "evm") {
        toChain = toChain || "ethereum";
      }

      // Navegar al flujo de send
      router.push({
        pathname: "/(drawer)/(tabs)/send/token-select",
        params: {
          toType: parsed.kind,
          toRaw: parsed.toRaw,
          display: addr,
          ...(toChain ? { chain: toChain } : {}),
          ...(parsed.resolved?.address ? { resolved: parsed.resolved.address } : {}),
        } as any,
      });
      onClose();
    };

    return (
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 12, marginLeft: 4 }}>
          {t("payments:detectedAddress", "Detected address")}
        </Text>
        <GlassCard tone="glass" style={{ marginBottom: 12 }}>
          <Pressable
            style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
            onPress={handlePress}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(143,211,227,0.20)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons 
                name={parsed.kind === "iban" ? "card" : parsed.kind === "card" ? "card" : "wallet"} 
                size={20} 
                color="#8FD3E3" 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                {parsed.kind === "iban" ? t("payments:sendToIBAN", "Send to IBAN") : parsed.kind === "card" ? t("payments:sendToCard", "Send to Card") : t("payments:sendToWallet", "Send to Wallet")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                {parsed.resolved?.address || parsed.toRaw}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </GlassCard>
      </View>
    );
  }

  if (results.type === "threads") {
    const { threads } = results;
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 12, marginLeft: 4 }}>
          {t("payments:existingChats", "Existing chats")}
        </Text>
        {threads.map((thread) => (
          <GlassCard key={thread.id} tone="glass" style={{ marginBottom: 12 }}>
            <Pressable
              style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}
              onPress={() => {
                router.push({
                  pathname: "/(internal)/payments/thread",
                  params: { id: thread.id, name: thread.name, alias: thread.alias },
                });
                onClose();
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
                {thread.isGroup ? (
                  <Text style={{ fontSize: 16 }}>👥</Text>
                ) : (
                  <Text style={{ color: "#9CC6D1", fontWeight: "900", fontSize: 14 }}>
                    {thread.alias.replace("@", "").slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }} numberOfLines={1}>
                  {thread.name}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {thread.lastMsg}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
            </Pressable>
          </GlassCard>
        ))}
      </View>
    );
  }

  if (results.type === "new_hihodl") {
    const { query } = results;
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <GlassCard tone="glass" style={{ marginBottom: 12 }}>
          <Pressable
            style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
            onPress={() => {
              // Navegar a crear nuevo chat con este usuario
              router.push({
                pathname: "/(internal)/payments/thread",
                params: { id: query, name: query, alias: query },
              });
              onClose();
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(143,211,227,0.20)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person-add" size={20} color="#8FD3E3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                {t("payments:newChatWith", "New chat with")} {query}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                {t("payments:startConversation", "Start a conversation")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </GlassCard>
      </View>
    );
  }

  // suggestions
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 12, marginLeft: 4 }}>
        {t("payments:suggestions", "Suggestions")}
      </Text>
      <GlassCard tone="glass">
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, padding: 16, textAlign: "center" }}>
          {t("payments:noResults", "No results found")}
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({});


