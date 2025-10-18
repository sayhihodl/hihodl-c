// src/payments/AccountFilterSheet.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import Row from "@/ui/Row";
import ListCard from "@/ui/ListCard";
import { glass as glassColors, legacy as legacyColors } from "@/theme/colors";

type Account = "Daily" | "Savings" | "Social";
export type AccountFilter = Record<Account, boolean>;

const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const ICON_BG = "rgba(255,255,255,0.06)";

function usePaymentsFilterStoreSafe() {
  try {
    const { usePaymentsFilterStore } = require("@/store/paymentsFilter.store");
    return usePaymentsFilterStore() as {
      selected: AccountFilter;
      setSelected: (v: AccountFilter) => void;
    };
  } catch {
    const mem = (global as any).__paymentsFilterMem ||= {
      selected: { Daily: true, Savings: true, Social: true } as AccountFilter,
      setSelected(v: AccountFilter) { mem.selected = v; },
    };
    return mem as { selected: AccountFilter; setSelected: (v: AccountFilter) => void };
  }
}

export default function AccountFilterSheet({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation(["payments","common"]);
  const scrolly = useRef(new Animated.Value(0)).current;

  const ACCOUNTS: Account[] = ["Daily", "Savings", "Social"];
  const { selected, setSelected } = usePaymentsFilterStoreSafe();

  const [draft, setDraft] = useState<AccountFilter>(selected);
  useEffect(() => { if (visible) setDraft(selected); }, [visible, selected]);

  const allOn = useMemo(() => ACCOUNTS.every(a => draft[a]), [draft]);

  const toggle = (a: Account) => {
    setDraft(d => ({ ...d, [a]: !d[a] }));
    void Haptics.selectionAsync();
  };

  const toggleAll = (v: boolean) => {
    const next = ACCOUNTS.reduce((acc, a) => (acc[a] = v, acc), {} as AccountFilter);
    setDraft(next);
    void Haptics.selectionAsync();
  };

  const applyAndClose = () => {
    setSelected(draft);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const labelFor = (a: Account) => t(`payments:filters.accounts.${a.toLowerCase()}`, a);

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={applyAndClose}               // cerrar = aplicar
      blurIntensity={64}
      scrimOpacity={0.55}
      glassTintRGBA="rgba(9,24,34,0.55)"    // 👈 misma transparencia que Swap
      minHeightPct={0.64}
      maxHeightPct={0.88}
      showHandle
      ignoreKeyboard
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("payments:filters.accountFilter", "Account filter")}</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => toggleAll(!allOn)} hitSlop={8}>
            <Text style={styles.selectAll}>
              {allOn ? t("payments:filters.clearAll", "Clear all") : t("payments:filters.selectAll", "Select all")}
            </Text>
          </Pressable>
          <View style={{ width: 10 }} />
          <Pressable onPress={applyAndClose} hitSlop={8} accessibilityRole="button">
            <Text style={styles.doneTxt}>{t("common:done", "Done")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Lista “como Payment” */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 12 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <ListCard>
          {(["Daily","Savings","Social"] as Account[]).map((a, i) => (
            <Row
              key={a}
              variant="list"
              leftSlot={
                <View style={styles.iconWrap}>
                  <Ionicons name="wallet-outline" size={16} color="#9CC6D1" />
                </View>
              }
              labelNode={
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{labelFor(a)}</Text>
                  <Text style={styles.sub}>{a.toUpperCase()}</Text>
                </View>
              }
              rightIcon={null}
              rightSlot={
                <Pressable
                  onPress={() => toggle(a)}
                  hitSlop={8}
                  style={[styles.check, draft[a] && styles.checkOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!draft[a] }}
                >
                  {draft[a] ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </Pressable>
              }
              onPress={() => toggle(a)}
            />
          ))}
        </ListCard>
      </Animated.ScrollView>
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    height: 48, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 6,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },
  selectAll: { color: "#8FD3E3", fontWeight: "800", fontSize: 14 },
  doneTxt:   { color: "#8FD3E3", fontWeight: "900", fontSize: 15, letterSpacing: 0.2 },

  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: ICON_BG, marginRight: 6,
  },

  name: { color: TEXT, fontSize: 15.5, fontWeight: "800", letterSpacing: -0.2 },
  sub:  { color: SUB,  fontSize: 11.5, marginTop: 2 },

  check: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  checkOn: { backgroundColor: "#8FD3E3", borderColor: "#8FD3E3" },
});