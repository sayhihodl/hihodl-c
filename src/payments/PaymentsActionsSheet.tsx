// src/payments/PaymentsActionsSheet.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function PaymentsActionsSheet({ visible, onClose }: Props) {
  const { t } = useTranslation(["payments"]);

  /** Acciones rápidas del sheet */
  const actions: Array<{ icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; }> = [
    {
      icon: "send",
      label: t("payments:actions.send", "Send payment"),
      onPress: () => router.push("/(internal)/send"), // entry del flow de envío
    },
    {
      icon: "person-add",
      label: t("payments:actions.request", "Request"),
      onPress: () => router.push("/(internal)/request/index"),
    },
    {
      icon: "qr-code-outline",
      label: t("payments:actions.scan", "Scan to Pay"),
      onPress: () => router.push("/(internal)/send/scanner"),
    },
    {
      icon: "swap-horizontal",
      label: t("payments:actions.swap", "Swap"),
      onPress: () => router.push("/(tabs)/swap"), // ajusta si tu ruta de swap es otra
    },
    {
      icon: "wallet-outline",
      label: t("payments:actions.topup", "Top up"),
      onPress: () => router.push("/(internal)/topup"),
    },
  ];

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onClose}
      minHeightPct={0.45}
      maxHeightPct={0.65}
      blurIntensity={70}
      tone="ink"
      showHandle
      ignoreKeyboard
    >
      <View style={styles.wrap}>
        <Text style={styles.title}>{t("payments:newAction", "New action")}</Text>

        {actions.map((a, idx) => (
          <Pressable
            key={idx}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              onClose();
              requestAnimationFrame(a.onPress);
            }}
            android_ripple={{ color: "rgba(255,255,255,0.08)" }}
          >
            <Ionicons name={a.icon} size={18} color="#8FD3E3" />
            <Text style={styles.label}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
          </Pressable>
        ))}
      </View>
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingTop: 10 },
  title: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 4, paddingHorizontal: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.1)" },
  label: { color: "#fff", fontSize: 15, fontWeight: "700", flex: 1 },
});