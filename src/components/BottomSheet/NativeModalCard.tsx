import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { legacy } from "@/theme/colors";

const { BG, SUB } = legacy;
const GLASS_BG = "rgba(3,12,16,0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

type Action = { label: string; onPress: () => void; testID?: string; disabled?: boolean };

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  primary?: Action | null;
  secondary?: Action | null;
  closeOnBackdrop?: boolean;
  maxWidth?: number;
  testID?: string;
  children: React.ReactNode;
};

export default function NativeModalCard({
  visible,
  title,
  subtitle,
  onClose,
  primary,
  secondary,
  closeOnBackdrop = true,
  maxWidth,
  testID,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} presentationStyle="overFullScreen">
      <View style={[styles.backdrop, { paddingBottom: insets.bottom + 16 }]}>
        {/* Backdrop hit-area */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOnBackdrop ? onClose : undefined} accessibilityElementsHidden />
        <View style={[styles.centerWrap, { paddingTop: insets.top + 16 }]}>
          <View
            testID={testID}
            style={[styles.card, { backgroundColor: BG, borderColor: GLASS_BORDER, maxWidth }]}
            accessibilityLabel={title}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={onClose}
                style={styles.iconBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </Pressable>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              <View style={{ width: 36 }} />
            </View>

            {/* Content */}
            <ScrollView bounces contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            {/* Actions */}
            <View style={{ gap: 10 }}>
              {primary && (
                <Pressable
                  onPress={primary.onPress}
                  disabled={primary.disabled}
                  style={[styles.primaryBtn, primary.disabled && { opacity: 0.5 }]}
                  testID={primary.testID}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryTxt}>{primary.label}</Text>
                </Pressable>
              )}
              {secondary && (
                <Pressable onPress={secondary.onPress} style={styles.secondaryBtn} testID={secondary.testID} accessibilityRole="button">
                  <Text style={styles.secondaryTxt}>{secondary.label}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 16, justifyContent: "center" },
  centerWrap: { width: "100%", alignItems: "center" },
  card: {
    width: "100%",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    ...(Platform.OS === "android" ? { elevation: 6 } : { shadowOpacity: 0.2 }),
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  title: { color: "#fff", fontSize: 20, fontWeight: "900" },
  subtitle: { color: SUB, fontSize: 12, marginTop: 4 },
  primaryBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  primaryTxt: { color: "#0A1A24", fontSize: 16, fontWeight: "900" },
  secondaryBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER },
  secondaryTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});