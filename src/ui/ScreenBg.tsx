import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/theme/colors";
import { ACCOUNT_GRADS, MENU_GRAD_H, TOP_CAP, type Account } from "@/theme/gradients";

type Props = {
  account?: Account;     // Daily | Savings | Social
  height?: number;       // alto del gradiente (por defecto MENU_GRAD_H)
  topCap?: number;       // extra bajo notch
  showTopSeam?: boolean; // línea superior opcional (off por defecto)
};

export default function ScreenBg({
  account = "Daily",
  height = MENU_GRAD_H,
  topCap = TOP_CAP,
  showTopSeam = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const grads = useMemo(() => ACCOUNT_GRADS[account] ?? ACCOUNT_GRADS.Daily, [account]);

  // Cubrimos notch + la altura pedida de una sola pieza (sin costuras)
  const H = insets.top + Math.max(height, topCap);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* color base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navBg }]} />

      {/* gradiente único */}
      <LinearGradient
        colors={grads}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: H }}
      />

      {/* seam opcional (apagada por defecto) */}
      {showTopSeam && (
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
      )}
    </View>
  );
}