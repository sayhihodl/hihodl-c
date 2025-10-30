// app/menu/security.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, Switch, Pressable, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider } from "@/ui/Glass";
import Row from "@/ui/Row";
import GlassHeader from "@/ui/GlassHeader";

const BG  = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const TITLE = "#fff";

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // state
  const [passcode, setPasscode] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [autoLock, setAutoLock] = useState<"30s"|"1m"|"5m"|"10m">("1m");

  // invariant: at least one of biometrics or passcode must be enabled
  const togglePasscode = (next: boolean) => {
    if (!next && !biometrics) {
      // cannot turn both off; keep biometrics on
      Alert.alert("Security", "Enable Face/Touch ID or keep passcode enabled.");
      return;
    }
    setPasscode(next);
  };

  const toggleBiometrics = (next: boolean) => {
    if (!next && !passcode) {
      // if turning biometrics off while passcode is off, force-enable passcode
      setPasscode(true);
    }
    setBiometrics(next);
  };

  const HEADER_INNER_TOP = 6;
  const TITLE_H = 44;
  const HEADER_CONTENT_H = TITLE_H;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={{ flex: 1 }} edges={["left", "top", "right", "bottom"]}>
        <Stack.Screen options={{ title: "Security" }} />

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
          centerSlot={<Text style={styles.headerTitle}>Security</Text>}
          rightSlot={<View style={{ width: 36 }} />}
        />

        <Animated.ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: HEADER_TOTAL - 21 }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          bounces
          showsVerticalScrollIndicator={false}
        >
          {/* App Lock */}
          <Text style={styles.sectionTitle}>App lock</Text>
          <GlassCard>
            <Row
              icon="keypad-outline"
              label="Passcode"
              value={passcode ? "Enabled" : "Disabled"}
              onPress={() => togglePasscode(!passcode)}
              rightIcon={null}
            />
            <Divider />
            <RowToggle
              icon="finger-print-outline"
              label="Face/Touch ID"
              value={biometrics}
              onChange={toggleBiometrics}
            />
            <Divider />
            <Row
              icon="timer-outline"
              label="Auto-lock"
              value={autoLock}
              onPress={() => {
                const next = autoLock === "30s" ? "1m" : autoLock === "1m" ? "5m" : autoLock === "5m" ? "10m" : "30s";
                setAutoLock(next);
              }}
              rightIcon={null}
            />
          </GlassCard>

          {/* Sensitive actions */}
          <Text style={styles.sectionTitle}>Security policy</Text>
          <GlassCard>
            <Row
              icon="warning-outline"
              label="Sensitive actions require authentication"
              value="Always on"
              onPress={undefined}
              rightIcon={null}
            />
          </GlassCard>

          {/* Recovery */}
          <Text style={styles.sectionTitle}>Recovery</Text>
          <GlassCard>
            <Row
              icon="shield-checkmark-outline"
              label="View recovery phrase"
              value=""
              onPress={() => router.push("/onboardingflow/confirm-seed")}
              rightIcon={undefined}
            />
          </GlassCard>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: { color: TITLE, fontSize: 18, fontWeight: "800" },
  sectionTitle: { color: SUB, fontSize: 13, marginTop: 16, marginBottom: 8, fontWeight: "600" },
});

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