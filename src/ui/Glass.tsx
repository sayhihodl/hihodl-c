import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { legacy as legacyColors } from "@/theme/colors";

const GLASS_BG   = "rgba(3, 12, 16, 0.35)"; // translúcido (glass)
const PANEL_BG   = "#0F151A";               // sólido estilo menú (ajusta si tu token es otro)
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const DIVIDER      = "rgba(255,255,255,0.08)";

export const glass = StyleSheet.create({
  cardBase: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    overflow: "hidden",
    paddingVertical: 0, // sin padding: las filas controlan alturas
  },
  cardGlass: { backgroundColor: GLASS_BG },
  cardPanel: { backgroundColor: PANEL_BG },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16, // misma altura que el menú
  },
  rowTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  rowSub:   { color: legacyColors.SUB ?? "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "400", marginTop: 2 },
  divider:  { height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginLeft: 46 },
});

export function GlassCard({
  children,
  style,
  tone = "glass",
}: React.PropsWithChildren<{ style?: ViewStyle | ViewStyle[]; tone?: "glass" | "panel" }>) {
  const toneStyle = tone === "panel" ? glass.cardPanel : glass.cardGlass;
  return <View style={[glass.cardBase, toneStyle, style]}>{children}</View>;
}

export function Divider() {
  return <View style={glass.divider} />;
}