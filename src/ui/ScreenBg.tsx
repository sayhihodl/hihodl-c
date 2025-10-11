// src/ui/ScreenBg.tsx
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/theme/colors";
import { ACCOUNT_GRADS, MENU_GRAD_H, TOP_CAP, type Account } from "@/theme/gradients";

type Props = {
  account?: Account;     // "Daily" | "Savings" | "Social"
  height?: number;       // alto del gradiente
  topCap?: number;       // extra bajo notch
  showTopSeam?: boolean; // línea superior opcional
  variant?: "edge" | "card"; // NUEVO: edge = sin marco (default), card = con marco
};

export default function ScreenBg({
  account = "Daily",
  height = MENU_GRAD_H,
  topCap = TOP_CAP,
  showTopSeam = false,
  variant = "edge",
}: Props) {
  const insets = useSafeAreaInsets();
  const grads = useMemo(() => ACCOUNT_GRADS[account] ?? ACCOUNT_GRADS.Daily, [account]);

  // Cubrimos notch + la altura pedida de una sola pieza (sin costuras)
  const H = insets.top + Math.max(height, topCap);

  // Fondo base (mismo que navbar)
  const BaseBg = (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navBg }]} />
  );

  // Gradiente principal
  const Grad = (
    <LinearGradient
      colors={grads}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[StyleSheet.absoluteFill, { height: H }]}
    />
  );

  // Línea opcional bajo el gradiente
  const Seam = showTopSeam ? (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: H,
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.08)",
      }}
    />
  ) : null;

  if (variant === "card") {
    // Versión con marco (para pantallas embebidas en tabs si la quieres)
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {BaseBg}
        <View style={[styles.cardWrap, { height: H }]}>
          {Grad}
        </View>
        {Seam}
      </View>
    );
  }

  // Versión edge-to-edge (modal sheet) — sin bordes
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BaseBg}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: H }}>
        {Grad}
      </View>
      {Seam}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
});