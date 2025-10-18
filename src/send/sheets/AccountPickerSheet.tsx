// src/send/sheets/AccountPickerSheet.tsx
import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AccountId = "daily" | "savings" | "social";
export type Item = { id: AccountId; label: string };

/** ===== Contenido embebible para usar dentro de BottomKeyboardModal ===== */
export function AccountPickerContent({
  selected,
  accounts,
  onPick,
  onClose,
  hideHeader,
}: {
  selected?: Item["id"];
  accounts: Item[];
  onPick: (id: Item["id"]) => void;
  onClose?: () => void;
  hideHeader?: boolean;
}) {
  return (
    <View style={styles.card}>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Choose account</Text>
          {!!onClose && (
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color="#AFC9D6" />
            </Pressable>
          )}
        </View>
      )}

      <FlatList
        data={accounts}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const active = item.id === selected;
          return (
            <Pressable onPress={() => onPick(item.id)} style={[styles.row, active && styles.rowActive]}>
              <Text style={[styles.rowTxt, active && styles.rowTxtActive]}>{item.label}</Text>
              {active && <Ionicons name="checkmark" size={18} color="#0A1A24" />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/** ===== Envoltorio con Modal (compatibilidad opcional) ===== */
export default function AccountPickerSheet({
  visible,
  onClose,
  selected,
  accounts,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  selected?: Item["id"];
  accounts: Item[];
  onPick: (id: Item["id"]) => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <AccountPickerContent
          selected={selected}
          accounts={accounts}
          onPick={onPick}
          onClose={onClose}
          hideHeader={false}
        />
      </View>
    </Modal>
  );
}

/* ================= styles ================= */
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },

  card: {
    maxHeight: "70%",
    backgroundColor: "#0D1820",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },

  row: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowActive: { backgroundColor: "#C8D2D9", borderColor: "#C8D2D9" },
  rowTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  rowTxtActive: { color: "#0A1A24" },
});