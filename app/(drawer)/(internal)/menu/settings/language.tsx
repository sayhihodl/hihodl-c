// app/menu/settings/language.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import SearchField from "@/ui/SearchField";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { CTAButton } from "@/ui/CTAButton";

import { SUPPORTED, setLang, preloadNamespaces } from "@/i18n/i18n";
import type { Lang as Code } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";

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

type LangItem = {
  code: Code;
  /** Nombre mostrado (en el propio idioma cuando posible) */
  name: string;
  /** Nota opcional (país/variante) */
  note?: string;
  flag?: string;
};

/**
 * Lista maestra de idiomas visibles en la pantalla.
 * Se filtra por SUPPORTED en runtime, para que sólo salga lo que i18n tiene cargado.
 * Orden: primero los más probables, luego Fase 2.
 */
const ALL_LANGS: LangItem[] = [
  { code: "es-AR", name: "Argentina",        flag: "🇦🇷" },
  { code: "pt-BR", name: "Brazil",           flag: "🇧🇷" },
  { code: "zh-CN", name: "China",            flag: "🇨🇳" },
  { code: "fr",    name: "France",           flag: "🇫🇷" },
  { code: "de",    name: "Germany",          flag: "🇩🇪" },
  { code: "hi",    name: "India",            flag: "🇮🇳" },
  { code: "id",    name: "Indonesia",        flag: "🇮🇩" },
  { code: "it",    name: "Italy",            flag: "🇮🇹" },
  { code: "ja",    name: "Japan",            flag: "🇯🇵" },
  { code: "sw",    name: "Kenya",            flag: "🇰🇪" },
  { code: "es-MX", name: "Mexico",           flag: "🇲🇽" },
  { code: "nl",    name: "Netherlands",      flag: "🇳🇱" },
  { code: "ko",    name: "South Korea",      flag: "🇰🇷" },
  { code: "es-ES", name: "Spain",            flag: "🇪🇸" },
  { code: "th",    name: "Thailand",         flag: "🇹🇭" },
  { code: "tr",    name: "Türkiye",          flag: "🇹🇷" },
  { code: "ar-AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "en",    name: "United States",    flag: "🇺🇸" },
  { code: "vi",    name: "Vietnam",          flag: "🇻🇳" },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation(["settings","common"]);
  useEffect(() => { preloadNamespaces(["settings"]); }, [i18n.language]);

  const insets = useSafeAreaInsets();
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  const supported = SUPPORTED as readonly string[];
  const supportedSet = new Set(supported);

  const visible = useMemo(
    () => ALL_LANGS.filter(l => supportedSet.has(l.code)),
    [supportedSet]
  );

  // ✅ usa resolvedLanguage cuando exista y haz fallback por base (es → alguna variante)
  const current = (i18n.resolvedLanguage || i18n.language || "en") as string;
  const base = current.split("-")[0];
  const fallbackFromBase =
    (supported.find(c => c.startsWith(base + "-")) || supported.find(c => c === base)) as Code | undefined;

  const initialLang = (supported.includes(current) ? current : (fallbackFromBase || "en")) as Code;

  const [selected, setSelected] = useState<Code>(initialLang);
  const [query, setQuery] = useState("");

  // ✅ sincroniza el radio si el idioma cambia fuera de esta screen
  useEffect(() => {
    const L = (i18n.resolvedLanguage || i18n.language || "en") as string;
    if (supported.includes(L)) setSelected(L as Code);
  }, [i18n.language, i18n.resolvedLanguage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.note?.toLowerCase().includes(q) ?? false)
    );
  }, [query, visible]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const closeScreen = () =>
    (router as any)?.canGoBack?.() ? router.back() : router.replace("/menu");

  const hasChanges = selected !== initialLang;

  const onSave = async () => {
    await setLang(selected);
    // Nota: si pasas a RTL (ar), puede requerir reinicio para aplicar layout RTL si lo fuerzas
    router.replace("/menu"); // evita volver aquí al pulsar back
  };

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
      <ScreenBg account="Daily" height={HEADER_TOTAL + 220} />
      <Stack.Screen options={{ title: t("settings:languageTitle", "Language") }} />

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
            <View style={styles.topRow}>
              <Pressable onPress={closeScreen} hitSlop={10} style={styles.headerIconBtnClear}>
                <Ionicons name="close" size={22} color={TEXT} />
              </Pressable>
              <Text style={styles.title}>{t("settings:languageTitle", "Language")}</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={{ marginTop: ROW_SEARCH_GAP }}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder={t("settings:searchLanguage", "Search language")}
                height={SEARCH_H}
                onClear={() => setQuery("")}
                inputProps={{
                  autoCapitalize: "none",
                  autoCorrect: false,
                }}
              />
            </View>

            <View style={{ height: AFTER_SEARCH_GAP }} />
          </>
        }
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(l) => l.code}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120,
          paddingTop: HEADER_TOTAL - 30,
        }}
        ListEmptyComponent={
          <Text style={{ color: SUB, textAlign: "center", marginTop: 24 }}>
            {t("common:noResults", "No results")}
          </Text>
        }
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
              {!!item.flag && <Text style={{ fontSize: 18 }}>{item.flag}</Text>}
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {!!item.note && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.note} numberOfLines={1}>{item.note}</Text>
                </>
              )}
            </View>

            <Ionicons
              name={selected === item.code ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={selected === item.code ? "#fff" : SUB}
            />
          </Pressable>
        )}
      />

      {hasChanges && (
        <View style={[styles.saveBar, { paddingBottom: 12 + insets.bottom }]}>
          <CTAButton
            title={t("common:save", "SAVE")}
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
  name: { color: TEXT, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  note: { color: SUB,  fontSize: 14, fontWeight: "400", flexShrink: 1 },
  dot:  { color: SUB,  fontSize: 14, fontWeight: "600" },

  saveBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GLASS_BORDER,
  },
});