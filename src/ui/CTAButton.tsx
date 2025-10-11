import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  View,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import colors, { legacy as legacyColors } from "@/theme/colors";

export type CTAButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;            // Solo para primary sin blur/solid
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "primary" | "secondary";
  tone?: "dark" | "light";
  backdrop?: "none" | "blur" | "solid";
  fullWidth?: boolean;
  /** 👉 fuerza color del texto (por ej. "#fff") */
  labelColor?: string;
  /** 👉 tamaño visual del botón */
  size?: "md" | "lg"; // NEW
};

export function CTAButton({
  title,
  onPress,
  disabled,
  color,
  style,
  leftIcon,
  rightIcon,
  variant = "primary",
  tone = "dark",
  backdrop = "none",
  fullWidth = true,
  labelColor,
  size = "lg", // NEW (por defecto igual que antes)
}: CTAButtonProps) {
  const BRAND = colors.cta ?? legacyColors.CTA ?? "#FFB703";
  const BRAND_TEXT = colors.ctaTextOn ?? legacyColors.CTA_ON ?? "#0B0B0F";

  const GLASS_DARK_BG = "rgba(2,48,71,0.28)";
  const GLASS_DARK_BORDER = "rgba(255,255,255,0.08)";
  const GLASS_LIGHT_BG = "rgba(255,255,255,0.18)";
  const GLASS_LIGHT_BORDER = "rgba(255,255,255,0.22)";

  const SOLID_DARK_BG = "#0E2330";
  const SOLID_LIGHT_BG = "#FFFFFF";

  const BRAND_OVERLAY = "rgba(255,191,0,0.48)";
  const BRAND_HAIRLINE = "rgba(255,191,0,0.55)";

  const HIGHLIGHT_TOP = [
    "rgba(255,255,255,0.28)",
    "rgba(255,255,255,0.06)",
  ] as const;

  const BLUR_INT_PRIMARY = Platform.select({ ios: 92, android: 100, default: 92 });
  const BLUR_INT_SECONDARY = Platform.select({ ios: 55, android: 75, default: 55 });

  const isSecondary = variant === "secondary";
  const isLight = isSecondary && tone === "light";
  const useBlur = backdrop === "blur";

  const fg = labelColor ?? (isSecondary ? (isLight ? "#0E2330" : "#FFFFFF") : BRAND_TEXT);

  const borderColor = isSecondary
    ? (isLight ? GLASS_LIGHT_BORDER : GLASS_DARK_BORDER)
    : useBlur
    ? BRAND_HAIRLINE
    : "transparent";

  const baseBG = isSecondary
    ? (isLight ? GLASS_LIGHT_BG : GLASS_DARK_BG)
    : (color ?? BRAND);

  const solidBG = isSecondary
    ? (isLight ? SOLID_LIGHT_BG : SOLID_DARK_BG)
    : (color ?? BRAND);

  const sizeStyle =
    size === "md"
      ? { height: 44, borderRadius: 12 }
      : { height: 56, borderRadius: 18 };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        sizeStyle, // NEW
        fullWidth && { alignSelf: "stretch" },
        useBlur
          ? { backgroundColor: "transparent", overflow: "hidden" }
          : { backgroundColor: backdrop === "solid" ? solidBG : baseBG },
        { borderWidth: StyleSheet.hairlineWidth, borderColor },
        {
          shadowColor: useBlur && !isSecondary ? BRAND : "#000",
          shadowOpacity: useBlur && !isSecondary ? 0.35 : 0.25,
          shadowRadius: useBlur && !isSecondary ? 12 : 10,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        },
        disabled && { opacity: 0.5 },
        style, // 👈 tu style al final para poder forzar opacity, etc.
      ]}
    >
      {useBlur && (
        <>
          <BlurView
            intensity={isSecondary ? BLUR_INT_SECONDARY! : BLUR_INT_PRIMARY!}
            tint={isSecondary ? (isLight ? "light" : "dark") : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: isSecondary
                  ? (isLight ? GLASS_LIGHT_BG : GLASS_DARK_BG)
                  : BRAND_OVERLAY,
              },
            ]}
          />
          <ExpoLinearGradient
            colors={HIGHLIGHT_TOP}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      )}

      <View style={styles.inner}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <Text style={[styles.txt, { color: fg }]}>{title}</Text>
        {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    // height y radius se controlan con 'size'
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  inner: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  txt: { fontWeight: "800", fontSize: 16 },
});

export default CTAButton;