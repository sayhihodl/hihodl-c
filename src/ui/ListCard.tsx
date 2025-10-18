// src/ui/ListCard.tsx
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { glass as glassColors } from "@/theme/colors";

const GLASS_BG = glassColors.cardOnSheet ?? "rgba(7,25,34,0.38)";
const GLASS_BORDER = glassColors.cardBorder ?? "rgba(255,255,255,0.10)";

export default function ListCard({
  style,
  children,
}: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    overflow: "hidden", // para que las filas list respeten los bordes
    marginBottom: 12,
  },
});