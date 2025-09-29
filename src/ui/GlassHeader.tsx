// ui/GlassHeader.tsx
import React from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

type GlassHeaderProps = {
  scrolly: Animated.Value;
  height?: number;
  innerTopPad?: number;

  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;

  blurRange?: [number, number, number];
  solidRange?: [number, number, number];
  solidColor?: string;
  overlayColor?: string;          // NEW: color de la capa translúcida encima del blur
  blurTint?: "dark" | "light" | "default"; // NEW: tinte del BlurView
  contentStyle?: ViewStyle;
  showBottomHairline?: boolean;
};

export default function GlassHeader({
  scrolly,
  height = 44,
  innerTopPad = 8,
  leftSlot,
  centerSlot,
  rightSlot,
  blurRange = [0, 12, 60],
  solidRange = [0, 80, 140],
  solidColor = "transparent",          // por defecto transparente (lo pinta ScreenBg)
  overlayColor = "rgba(2,48,71,0.28)", // navy con alpha suave (HiHODL)
  blurTint = "default",
  contentStyle,
  showBottomHairline = false,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const TOTAL_H = insets.top + innerTopPad + height;

  const blurOpacity = scrolly.interpolate({
    inputRange: blurRange,
    outputRange: [0, 0.6, 1],
    extrapolate: "clamp",
  });

  const solidOpacity = scrolly.interpolate({
    inputRange: solidRange,
    outputRange: [0, 0, 0.45],
    extrapolate: "clamp",
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { height: TOTAL_H }]}>
      {/* Capa blur */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: blurOpacity }]}>
        <BlurView intensity={60} tint={blurTint} style={[StyleSheet.absoluteFillObject, { height: TOTAL_H }]} />
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: TOTAL_H,
            backgroundColor: overlayColor,                    // ← suave, no tan oscuro
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />
      </Animated.View>

      {/* Capa sólida (cuando haces scroll) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: solidColor, opacity: solidOpacity }]}
      />

      {/* Contenido */}
      <SafeAreaView edges={["top", "left", "right"]} style={{ paddingTop: 0 }}>
        <View
          style={[
            styles.rowBase,
            { height, paddingTop: innerTopPad },
            contentStyle,
          ]}
        >
          <View style={styles.side}>{leftSlot}</View>
          <View style={styles.center} pointerEvents="box-none">{centerSlot}</View>
          <View style={[styles.side, { alignItems: "flex-end" }]}>{rightSlot}</View>
        </View>
      </SafeAreaView>

      {showBottomHairline && <View style={styles.hairline} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  rowBase: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  side: { width: 80, flexDirection: "row", alignItems: "center", gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hairline: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});