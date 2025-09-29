// app/menu/settings/index.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider } from "@/ui/Glass";
import { Row as RowButton } from "@/ui/Row";
import GlassHeader from "@/ui/GlassHeader";
import { glass as rowStyles } from "@/ui/Glass"; // estilos de títulos/subtítulos de fila

/* ===== theme — igual al menú ===== */
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

  // Gradiente de fondo
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

  // Diales header
  const HEADER_INNER_TOP = 6;
  const TITLE_H = 44;
  const HEADER_CONTENT_H = TITLE_H;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // Estado (mock)
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [nTxIncoming, setNTxIncoming] = useState(true);
  const [nTxOutgoing, setNTxOutgoing] = useState(false);
  const [nSecurity, setNSecurity] = useState(true);

  const [nPriceChange, setNPriceChange] = useState(true);
  const [nPriceAlerts, setNPriceAlerts] = useState(false);

  const [nWeekly, setNWeekly] = useState(true);
  const [nMarketing, setNMarketing] = useState(false);

  const depsDisabled = !pushEnabled && !emailEnabled;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {Backdrop}

      <SafeAreaView style={{ flex: 1 }} edges={["left", "top", "right", "bottom"]}>
        {/* Header con título centrado y sin hairline visible */}
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
          centerSlot={<Text style={styles.headerTitle}>Settings</Text>}
          rightSlot={<View style={{ width: 36 }} />}
        />

        {/* Contenido */}
        <Animated.ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            paddingTop: HEADER_TOTAL - 21, // un pelín de aire bajo el header
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          bounces
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance */}
          <Text style={styles.sectionTitle}>Appearance</Text>
          <GlassCard>
            <RowNav
              icon="color-palette-outline"
              label="Colors & Gradients"
              sub="Accent, backgrounds"
              onPress={() => router.push("/menu/settings/colors")}
            />
            <Divider />
            <RowNav
              icon="cash-outline"
              label="Currency"
              value={currency}
              onPress={() => {
                const next = currency === "USD" ? "EUR" : "USD";
                setCurrency(next);
                router.push("/menu/settings/currency");
              }}
            />
          </GlassCard>

          {/* Notifications */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          <GlassCard>
            <RowToggle icon="notifications-outline" label="Push notifications" value={pushEnabled} onChange={setPushEnabled} />
            <Divider />
            <RowToggle icon="mail-outline" label="Email notifications" value={emailEnabled} onChange={setEmailEnabled} />
          </GlassCard>

          {/* Activity */}
          <Text style={styles.sectionTitle}>Activity</Text>
          <GlassCard>
            <RowToggle icon="arrow-down-circle-outline" label="Incoming transfers" value={nTxIncoming} onChange={setNTxIncoming} disabled={depsDisabled} />
            <Divider />
            <RowToggle icon="arrow-up-circle-outline" label="Outgoing transfers" value={nTxOutgoing} onChange={setNTxOutgoing} disabled={depsDisabled} />
            <Divider />
            <RowToggle icon="shield-checkmark-outline" label="Security alerts" value={nSecurity} onChange={setNSecurity} disabled={depsDisabled} />
          </GlassCard>

          {/* Markets */}
          <Text style={styles.sectionTitle}>Markets</Text>
          <GlassCard>
            <RowToggle icon="trending-up-outline" label="Daily price changes" value={nPriceChange} onChange={setNPriceChange} disabled={depsDisabled} />
            <Divider />
            <RowToggle icon="alarm-outline" label="Custom price alerts" value={nPriceAlerts} onChange={setNPriceAlerts} disabled={depsDisabled} />
          </GlassCard>

          {/* Other */}
          <Text style={styles.sectionTitle}>Other</Text>
          <GlassCard>
            <RowToggle icon="calendar-outline" label="Weekly summary" value={nWeekly} onChange={setNWeekly} disabled={depsDisabled} />
            <Divider />
            <RowToggle icon="megaphone-outline" label="Product updates & offers" value={nMarketing} onChange={setNMarketing} disabled={depsDisabled} />
          </GlassCard>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ===== Filas reutilizables ===== */
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
    <RowButton
      icon={icon}
      label={label}
      onPress={disabled ? undefined : () => onChange(!value)}
      rightSlot={<Switch value={value} onValueChange={onChange} disabled={disabled} />}
      titleStyle={disabled ? { color: "rgba(255,255,255,0.45)" } : undefined}
    />
  );
}

function RowNav({
  icon,
  label,
  sub,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sub?: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <RowButton
      icon={icon}
      labelNode={
        <View>
          <Text style={rowStyles.rowTitle}>{label}</Text>
          {!!sub && <Text style={rowStyles.rowSub}>{sub}</Text>}
        </View>
      }
      value={value}
      onPress={onPress}
      rightIcon="chevron-forward"
    />
  );
}

/* ===== estilos ===== */
const styles = StyleSheet.create({
  headerTitle: { color: TITLE, fontSize: 18, fontWeight: "800" },
  sectionTitle: { color: SUB, fontSize: 13, marginTop: 16, marginBottom: 8, fontWeight: "600" },
});