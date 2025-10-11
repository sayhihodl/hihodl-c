// app/(internal)/payments/new/index.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard } from "@/ui/Glass";

const BG = "#0D1820";
const TILE_BG = "rgba(255,255,255,0.06)";
const TILE_ICON_BG = "rgba(255,255,255,0.08)";
const AVATAR = 34;

type Contact = { id: string; name: string; alias?: string; avatar?: string; last?: string };

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Netflix", alias: "@netflix", last: "–12.99 USDC" },
  { id: "2", name: "Alex", alias: "@helloalex", last: "paid 15 USDT" },
  { id: "3", name: "María", alias: "@maria", last: "request 4.20 USDT" },
];

export default function NewPaymentScreen() {
  const { t } = useTranslation(["payments"]);
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;

  const [q, setQ] = useState("");

  // placeholders (mismo patrón que PaymentsHome)
  const PHRASES = useMemo(
    () => [
      t("payments:searchPh", "Search"),
      t("payments:ph.user", "Search @username"),
      t("payments:ph.contact", "Search contact"),
      t("payments:ph.addr", "Paste wallet address"),
    ],
    [t]
  );
  const [phIdx, setPhIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PHRASES.length), 2000);
    return () => clearInterval(id);
  }, [PHRASES.length]);

  // 🔹 Acciones (5 tiles unificadas)
  type Action = {
    key: "hihodl" | "bank" | "card" | "link" | "group";
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    go: () => void;
  };

  const actions: Action[] = [
    {
      key: "hihodl",
      icon: "at", // si no existe en tu set, cambia a "person-outline"
      label: "HIHODL",
      go: () => router.push({ pathname: "/(internal)/send", params: { kind: "hihodl", to: q } }),
    },
    {
      key: "bank",
      icon: "cash-outline",
      label: "Bank",
      go: () => router.push({ pathname: "/(internal)/send", params: { kind: "bank", to: q } }),
    },
    {
      key: "card",
      icon: "card-outline",
      label: "Card",
      go: () => router.push({ pathname: "/(internal)/send", params: { kind: "card", to: q } }),
    },
    {
      key: "link",
      icon: "link-outline",
      label: "Request / Link",
      go: () => router.push("/(internal)/request/index"),
    },
    {
      key: "group",
      icon: "people-outline",
      label: "Group / Split",
      go: () => router.push({ pathname: "/(internal)/payments/new", params: { tab: "group" } }),
    },
  ];

  const filtered: Contact[] = useMemo(
    () => MOCK_CONTACTS.filter((c) => (c.name + (c.alias ?? "")).toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const HEADER_H = insets.top + 6 + 54;

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
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <View style={[styles.searchBar, { marginLeft: 4, marginRight: 18 }]}>
            <Ionicons name="search" size={16} color="#8FD3E3" />
            <TextInput
              style={styles.searchInput}
              placeholder={PHRASES[phIdx]}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={q}
              onChangeText={setQ}
              returnKeyType="go"
              onSubmitEditing={() =>
                router.push({ pathname: "/(internal)/send", params: { kind: "hihodl", to: q } })
              }
              autoFocus
            />
          </View>
        }
        rightSlot={
          // Scan en el header
          <Pressable hitSlop={10} onPress={() => router.push("/(internal)/send/scanner")}>
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
          </Pressable>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Grid de acciones (5 tiles) */}
      <View style={[styles.grid, { marginTop: HEADER_H + 10 }]}>
        {actions.map((a) => (
          <Pressable key={a.key} style={styles.gridItem} onPress={a.go}>
            <View style={styles.gridIcon}>
              <Ionicons name={a.icon} size={18} color="#8FD3E3" />
            </View>
            <Text style={styles.gridLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Separador */}
      <Text style={styles.sectionTitle}>
        {t("payments:section.hihodlContacts", "HiHODL Contacts")}
      </Text>

      {/* Lista de contactos */}
      <Animated.FlatList<Contact>
        data={filtered}
        keyExtractor={(i: Contact) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }: { item: Contact }) => (
          <Pressable
            onPress={() => {
              // pre-rellena el destino y abre el flujo; si es @alias, perfecto
              const to = item.alias ?? item.name;
              router.push({ pathname: "/(internal)/send", params: { kind: "hihodl", to } });
            }}
            style={{ marginBottom: 12 }}
          >
            <GlassCard style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.alias ?? item.last ?? ""}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </View>
            </GlassCard>
          </Pressable>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  backBtn: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 36,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "400", letterSpacing: -0.2 },

  // Tiles (botones grandes)
  grid: { paddingHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  gridItem: {
    width: "31.5%",
    backgroundColor: TILE_BG,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gridIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TILE_ICON_BG,
  },
  gridLabel: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },

  sectionTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },

  avatarWrap: { width: AVATAR, height: AVATAR, borderRadius: 18, overflow: "hidden" },
  avatar: { width: "100%", height: "100%", borderRadius: 18 },

  name: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: -0.2 },
  sub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
});