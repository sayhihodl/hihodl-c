// app/(drawer)/(tabs)/(home)/components/HeroSection.tsx
// Sección hero del Dashboard con balance, tabs y acciones

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Animated } from "react-native";
import { router } from "expo-router";
import SegmentedPills from "@/ui/SegmentedPills";
import type { Account } from "@/hooks/useAccount";
import { ACCOUNTS_ORDER, accountToId } from "@/hooks/useAccount";
import { HIT_SLOP, DASHBOARD_LAYOUT } from "@/constants/dashboard";
import { styles } from "../_lib/_dashboardShared";
import MiniAction from "../components/MiniAction";

const HERO_HPAD = DASHBOARD_LAYOUT.HERO_HPAD;

interface HeroSectionProps {
  account: Account;
  accountIndex: number;
  totalUSD: string; // ya formateado
  fiat: "USD" | "EUR";
  showDust: boolean;
  setFiat: (f: "USD" | "EUR" | ((prev: "USD" | "EUR") => "USD" | "EUR")) => void;
  setShowDust: (show: boolean | ((prev: boolean) => boolean)) => void;
  pagerRef: React.RefObject<any>;
  pagerProg: Animated.Value;
  ignoreNextRef: React.MutableRefObject<boolean>;
  goReceive: () => void;
  goSend: () => void;
  goSwap: () => void;
  goCards: () => void;
  tt: (key: string, defaultValue?: string) => string;
  t: any; // TFunction de i18n
  topPad: number;
}

/**
 * Hero section del Dashboard
 * Incluye: tabs de cuentas, balance total, y acciones rápidas
 */
function HeroSection({
  account,
  accountIndex,
  totalUSD,
  fiat,
  showDust,
  setFiat,
  setShowDust,
  pagerRef,
  pagerProg,
  ignoreNextRef,
  goReceive,
  goSend,
  goSwap,
  goCards,
  tt,
  t,
  topPad,
}: HeroSectionProps) {
  return (
    <View style={{ flex: 1, paddingTop: Math.max(6, topPad), paddingHorizontal: HERO_HPAD }}>
      {/* Tabs */}
      <View style={{ marginTop: 6, alignItems: "center" }}>
        <SegmentedPills
          items={ACCOUNTS_ORDER.map((a) => ({
            id: accountToId(a),
            label: tt(`accounts.${accountToId(a)}`, a),
          }))}
          activeIndex={accountIndex}
          onPress={(i) => {
            if (i === accountIndex) return;
            void Haptics.selectionAsync();

            ignoreNextRef.current = true;
            // salto instantáneo del pager
            pagerRef.current?.setPageWithoutAnimation?.(i);

            // anima SOLO el indicador (200–240ms está nice)
            Animated.timing(pagerProg, {
              toValue: i,
              duration: 220,
              useNativeDriver: false,
            }).start(() => {
              const nextAcc = ACCOUNTS_ORDER[i] ?? "Daily";
              router.setParams?.({ account: accountToId(nextAcc) } as any);
            });
          }}
          progress={pagerProg}
          height={36}
          pillMinWidth={72}
          pillHPad={14}
          wrapHPad={8}
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          indicatorStyle={{ backgroundColor: "#fff", top: 4, bottom: 4, borderRadius: 14 }}
          textStyle={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
          activeTextStyle={{ color: "#0A1A24" }}
        />
      </View>

      {/* Balance + chip */}
      <View style={styles.balanceWrap}>
        <Text style={styles.balance}>{totalUSD}</Text>
        <View style={styles.eqRow}>
          <View style={[styles.eqBadge, { paddingHorizontal: 10, paddingVertical: 5 }]}>
            <MaterialCommunityIcons name="bitcoin" size={14} color="#0A1A24" />
            <Text style={styles.eqText}>0.0498 BTC</Text>
          </View>
          <Text style={styles.gain}>{"+2%"}</Text>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setFiat((f) => (f === "USD" ? "EUR" : "USD"));
            }}
            onLongPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowDust((v) => !v);
            }}
            delayLongPress={280}
            hitSlop={HIT_SLOP}
            style={[styles.fiatToggle, { marginLeft: 4 }]}
            accessibilityRole="button"
            accessibilityLabel={t("dashboard:a11y.toggleFiat", "Tap to switch currency, long press to toggle small balances")}
          >
            <Text style={styles.fiatToggleTxt}>{fiat}</Text>
          </Pressable>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsSwipeArea}>
        <View style={styles.actionsRowFixed}>
          <MiniAction
            icon="qr-code-outline"
            label={tt("actions.receive", "Receive")}
            onPress={goReceive}
          />
          <MiniAction
            icon="paper-plane-outline"
            label={tt("actions.send", "Send")}
            onPress={goSend}
          />
          <MiniAction
            icon="swap-horizontal"
            label={tt("actions.swap", "Swap")}
            onPress={goSwap}
          />
          <MiniAction
            icon="card-outline"
            label={tt("actions.cards", "Cards")}
            onPress={goCards}
          />
        </View>
      </View>
    </View>
  );
}

export default HeroSection;

