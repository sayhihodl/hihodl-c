// app/menu/settings/currency.tsx 
import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { CURRENCIES } from "@/constants/currencies";
import { CTAButton } from "@/ui/CTAButton";

/* ===== theme ===== */
const BG   = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const GLASS_BG     = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/* ===== header dials ===== */
const TITLE_H = 44;
const ROW_SEARCH_GAP = 16;
const SEARCH_H = 45;
const AFTER_SEARCH_GAP = 12;
const HEADER_INNER_TOP = 10;
const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;

export default function CurrencyScreen() {
  const insets = useSafeAreaInsets();
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // TODO: hidratar desde tu store (Zustand/AsyncStorage)
  const initialCurrency = "EUR";
  const [selected, setSelected] = useState(initialCurrency);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? CURRENCIES.filter(c =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
        )
      : CURRENCIES;
  }, [query]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const closeScreen = () =>
    (router as any)?.canGoBack?.() ? router.back() : router.replace("/menu");

  const hasChanges = selected !== initialCurrency;

  const onSave = async () => {
    // TODO: persist selected (store/AsyncStorage)
    // p.ej: useSettingsStore.getState().setCurrency(selected)
    router.replace("/menu"); // ← evita volver a Currency al hacer back
  };

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
      {/* Fondo (notch + header) */}
      <ScreenBg account="Daily" height={HEADER_TOTAL + 220} />

      {/* ===== GlassHeader ===== */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 16 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <>
            {/* X + título */}
            <View style={styles.topRow}>
              <Pressable onPress={closeScreen} hitSlop={10} style={styles.headerIconBtnClear}>
                <Ionicons name="close" size={22} color={TEXT} />
              </Pressable>
              <Text style={styles.title}>Currency</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Search */}
            <View style={[styles.searchInHeader, { marginTop: ROW_SEARCH_GAP, height: SEARCH_H }]}>
              <Ionicons name="search" size={18} color={SUB} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by code or name"
                placeholderTextColor={SUB}
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={SUB} />
                </Pressable>
              ) : null}
            </View>

            <View style={{ height: AFTER_SEARCH_GAP }} />
          </>
        }
      />

      {/* ===== Lista ===== */}
      <Animated.FlatList
        data={filtered}
        keyExtractor={(c) => c.code}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120, // hueco para CTA
          paddingTop: HEADER_TOTAL - 30,      // acerca el contenido al header
        }}
        ListEmptyComponent={<Text style={{ color: SUB, textAlign: "center", marginTop: 24 }}>No results</Text>}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item.code)}
            style={styles.row}
            android_ripple={{ color: "transparent" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.dash}>—</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            </View>

            <Ionicons
              name={selected === item.code ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={selected === item.code ? "#fff" : SUB}
            />
          </Pressable>
        )}
      />

      {/* ===== CTA Save (usa CTAButton con brand) ===== */}
      {hasChanges && (
        <View style={[styles.saveBar, { paddingBottom: 12 + insets.bottom }]}>
          <CTAButton
  title="SAVE"
  onPress={onSave}
  variant="secondary"
  tone="light"
  backdrop="blur"
  style={{ height: 52, borderRadius: 16 }}
/>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerIconBtnClear: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800", textAlign: "center" },

  // Search
  searchInHeader: {
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: TEXT, fontSize: 15 },

  // Rows
  row: {
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  code: { color: TEXT, fontSize: 16, fontWeight: "800" },
  dash: { color: SUB,  fontSize: 16, fontWeight: "600" },
  name: { color: SUB,  fontSize: 14, fontWeight: "400", flexShrink: 1 },

  // Save bar
  saveBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GLASS_BORDER,
  },
});