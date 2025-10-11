// app/menu/settings/index.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider, glass as glassStyles } from "@/ui/Glass";
import Row from "@/ui/Row";
import GlassHeader from "@/ui/GlassHeader";

import { useTranslation } from "react-i18next";
import { preloadNamespaces } from "@/i18n/i18n";

/* theme */
const BG = colors.navBg ?? legacyColors.BG ?? "#0D1820";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const TITLE = "#fff";
const ACCOUNT_GRADS: readonly [string, string] = [
  "rgba(0,194,255,0.45)",
  "rgba(54,224,255,0.00)",
];
const MENU_GRAD_H = 260;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation(["settings", "common"]);
  useEffect(() => { preloadNamespaces(["settings"]); }, [i18n.language]);

  const HEADER_INNER_TOP = 6;
  const TITLE_H = 44;
  const HEADER_CONTENT_H = TITLE_H;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // state
  const [currency] = useState<"USD" | "EUR">("USD"); // cambio en pantalla dedicada
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const channelsOn = pushEnabled || emailEnabled;
  const [nActivity, setNActivity] = useState(true);
  const [nPrices, setNPrices] = useState(false);
  const [nTips, setNTips] = useState(false);

  const prettyLang = useMemo(() => prettifyLanguage(i18n.language), [i18n.language]);

  const Backdrop = useMemo(
    () => (
      <LinearGradient
        colors={ACCOUNT_GRADS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + MENU_GRAD_H, zIndex: 0 }}
        pointerEvents="none"
      />
    ),
    [insets.top]
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {Backdrop}

      <SafeAreaView style={{ flex: 1 }} edges={["left", "top", "right", "bottom"]}>
        <Stack.Screen options={{ title: t("settings:title") }} />

        <GlassHeader
          scrolly={scrollY}
          height={HEADER_CONTENT_H}
          innerTopPad={HEADER_INNER_TOP}
          blurTint="dark"
          solidColor="transparent"
          overlayColor="rgba(2,48,71,0.18)"
          showBottomHairline={false}
          contentStyle={{ paddingHorizontal: 16 }}
          leftSlot={
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          }
          centerSlot={<Text style={styles.headerTitle}>{t("settings:title")}</Text>}
          rightSlot={<View style={{ width: 36 }} />}
        />

        <Animated.ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            paddingTop: HEADER_TOTAL - 21,
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          bounces
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance */}
          <Text style={styles.sectionTitle}>{t("settings:appearance")}</Text>
          <GlassCard>
            <Row
              icon="color-palette-outline"
              labelNode={
                <View>
                  <Text style={glassStyles.rowTitle}>{t("settings:colors")}</Text>
                  <Text style={glassStyles.rowSub}>Accent & backgrounds</Text>
                </View>
              }
              onPress={() => router.push("/menu/settings/colors")}
              rightIcon={null}
            />
            <Divider />
            <Row
              icon="cash-outline"
              label={t("settings:currency")}
              value={currency}         // 👉 valor a la derecha
              onPress={() => router.push("/menu/settings/currency")}
              rightIcon={null}         // sin flecha
            />
            <Divider />
            <Row
              icon="language-outline"
              label={t("settings:language")}
              value={prettyLang}       // 👉 valor a la derecha
              onPress={() => router.push("/menu/settings/language")}
              rightIcon={null}         // sin flecha
            />
          </GlassCard>

          {/* Notifications */}
          <Text style={styles.sectionTitle}>{t("settings:notifications")}</Text>
          <GlassCard>
            <RowToggle
              icon="notifications-outline"
              label={t("settings:push")}
              value={pushEnabled}
              onChange={setPushEnabled}
            />
            <Divider />
            <RowToggle
              icon="mail-outline"
              label={t("settings:email")}
              value={emailEnabled}
              onChange={setEmailEnabled}
            />
            <Divider />
            <RowToggle
              icon="shield-checkmark-outline"
              label={t("settings:activityAlerts")}
              value={nActivity}
              onChange={setNActivity}
              disabled={!channelsOn}
            />
            <Divider />
            <RowToggle
              icon="alarm-outline"
              label={t("settings:priceAlerts")}
              value={nPrices}
              onChange={setNPrices}
              disabled={!channelsOn}
            />
            <Divider />
            <RowToggle
              icon="megaphone-outline"
              label={t("settings:tips")}
              value={nTips}
              onChange={setNTips}
              disabled={!channelsOn}
            />
          </GlassCard>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ==== RowToggle: switch pegado al borde derecho, sin chevron ==== */
function RowToggle({
  icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Row
      icon={icon}
      label={label}
      rightSlot={<Switch value={value} onValueChange={onChange} disabled={!!disabled} />}
      titleStyle={disabled ? { color: "rgba(255,255,255,0.45)" } : undefined}
      disabled={!!disabled}
      onPress={disabled ? undefined : () => onChange(!value)}
      rightIcon={null}
    />
  );
}

/* utils */
function prettifyLanguage(code?: string) {
  if (!code) return "—";
  const lc = code.toLowerCase();
  switch (lc) {
    case "es":
    case "es-es":
      return "Spanish";
    case "es-mx":
      return "Mexican Spanish";
    case "es-ar":
      return "Argentinian Spanish";
    case "pt-br":
      return "Brazilian Portuguese";
    case "en":
    case "en-us":
    case "en-gb":
      return "English";
    default:
      return code.toUpperCase();
  }
}

/* styles */
const styles = StyleSheet.create({
  headerTitle: { color: TITLE, fontSize: 18, fontWeight: "800" },
  sectionTitle: { color: SUB, fontSize: 13, marginTop: 16, marginBottom: 8, fontWeight: "600" },
});