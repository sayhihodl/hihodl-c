// src/payments/AccountFilterSheet.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import Row from "@/ui/Row";
import { glass as glassColors, legacy as legacyColors } from "@/theme/colors";

type Account = "Daily" | "Savings" | "Social";
export type AccountFilter = Record<Account, boolean>;

const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
// HiHODL glass (coincide con otros sheets)
const GLASS_BG     = glassColors.cardOnSheet ?? "rgba(7,25,34,0.38)";
const GLASS_BORDER = glassColors.cardBorder  ?? "rgba(255,255,255,0.10)";

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
  const { t } = useTranslation(["payments"]);
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

  const labelFor = (a: Account) =>
    t(`payments:filters.accounts.${a.toLowerCase()}`, a);

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={applyAndClose}          // arrastrar/cerrar = aplicar
      tone="teal"
      scrimOpacity={0.55}
      blurIntensity={64}
      minHeightPct={0.48}              // ⬆️ más arriba
      maxHeightPct={0.70}
      showHandle
      ignoreKeyboard
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("payments:filters.accountFilter", "Account filter")}</Text>
        <Pressable onPress={() => toggleAll(!allOn)} hitSlop={8} accessibilityRole="button">
          <Text style={styles.selectAll}>
            {allOn ? t("payments:filters.clearAll", "Clear all") : t("payments:filters.selectAll", "Select all")}
          </Text>
        </Pressable>
      </View>

      {/* Cards / rows */}
      {(["Daily","Savings","Social"] as Account[]).map((a, i) => (
        <View key={a} style={[styles.card, i>0 && styles.cardGap]}>
          <Row
            leftSlot={
              <View style={styles.iconWrap}>
                <Ionicons name="wallet-outline" size={16} color="#9CC6D1" />
              </View>
            }
            labelNode={
              <View style={{ flex:1, minWidth:0 }}>
                <Text style={styles.name} numberOfLines={1}>{labelFor(a)}</Text>
                <Text style={styles.sub}>{a.toUpperCase()}</Text>
              </View>
            }
            rightSlot={
              <Pressable
                onPress={() => toggle(a)}
                hitSlop={8}
                style={[styles.check, draft[a] && styles.checkOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!draft[a] }}
              >
                {draft[a] ? <Ionicons name="checkmark" size={14} color="#0A1A24" /> : null}
              </Pressable>
            }
            rightIcon={null}
            onPress={() => toggle(a)}
            // ⬇️ filas más compactas
            containerStyle={{ paddingVertical: 12 }}
          />
        </View>
      ))}

      {/* CTA */}
      <Pressable
        style={styles.applyBtn}
        onPress={applyAndClose}
        accessibilityLabel={t("payments:filters.apply","Apply filters")}
      >
        <Text style={styles.applyTxt}>{t("payments:filters.apply","Apply")}</Text>
      </Pressable>
      {/* pequeño spacer para evitar recortes en el borde redondeado */}
      <View style={{ height: 6 }} />
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  title: { color: TEXT, fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
  selectAll: { color: "#8FD3E3", fontWeight: "800", fontSize: 14 },

  card: {
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,                // ⬇️ compact
  },
  cardGap: { marginTop: 10 },

  iconWrap: {
    width: 32, height: 32,            // ⬇️ compacto
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 6,
  },

  name: { color: TEXT, fontSize: 15.5, fontWeight: "800", letterSpacing: -0.2 },
  sub:  { color: SUB,  fontSize: 11.5, marginTop: 2 },

  check: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  checkOn: { backgroundColor: "#8FD3E3", borderColor: "#8FD3E3" },

  applyBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#8FD3E3",
    alignItems: "center", justifyContent: "center",
    marginTop: 14,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  applyTxt: { color: "#0A1A24", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
});