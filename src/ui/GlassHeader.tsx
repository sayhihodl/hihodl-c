// ui/GlassHeader.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Animated, ViewStyle, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

type GlassHeaderProps = {
  scrolly?: Animated.Value;
  height?: number;
  innerTopPad?: number;

  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  
  // Nueva API: titlePrimary/titleSecondary para simplificar
  titlePrimary?: string;
  titleSecondary?: string;
  rightAccessory?: React.ReactNode;

  /** Control de estética del fondo */
  blurRange?: [number, number, number];
  solidRange?: [number, number, number];
  solidColor?: string;
  overlayColor?: string;
  blurTint?: "dark" | "light" | "default";

  /** Layout */
  contentStyle?: ViewStyle;
  showBottomHairline?: boolean;

  /** ⬇️ NUEVO: controla el ancho de los laterales y del centro */
  sideWidth?: number;          // ancho de cada “side” (izq/der). Default 80
  centerWidthPct?: number;     // porcentaje del ancho total para el centro. Si se pasa: center deja de ser flex:1
  centerMaxWidth?: number;     // opcional: límite absoluto (px) para el centro
};

export default function GlassHeader({
  scrolly,
  height = 44,
  innerTopPad = 8,
  leftSlot,
  centerSlot,
  rightSlot,
  titlePrimary,
  titleSecondary,
  rightAccessory,
  blurRange = [0, 12, 60],
  solidRange = [0, 80, 140],
  solidColor = "transparent",
  overlayColor = "rgba(2,48,71,0.28)",
  blurTint = "default",
  contentStyle,
  showBottomHairline = false,

  // 👇 nuevos props con defaults
  sideWidth = 80,
  centerWidthPct,
  centerMaxWidth,
}: GlassHeaderProps) {
  // Si se pasan titlePrimary/titleSecondary, construir centerSlot automáticamente
  const resolvedCenterSlot = centerSlot || (titlePrimary ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{titlePrimary}</Text>
      {titleSecondary && (
        <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>
          {titleSecondary}
        </Text>
      )}
    </View>
  ) : null);
  
  const resolvedRightSlot = rightSlot || rightAccessory;
  const insets = useSafeAreaInsets();
  const TOTAL_H = insets.top + innerTopPad + height;

  const staticZeroOpacity = useMemo(() => new Animated.Value(0), []);

  const blurOpacity = scrolly
    ? scrolly.interpolate({
        inputRange: blurRange,
        outputRange: [0, 0.6, 1],
        extrapolate: "clamp",
      })
    : staticZeroOpacity;

  const solidOpacity = scrolly
    ? scrolly.interpolate({
        inputRange: solidRange,
        outputRange: [0, 0, 0.45],
        extrapolate: "clamp",
      })
    : staticZeroOpacity;

  // Estilo dinámico del centro cuando se fija porcentaje / máximo
  const centerSizing =
    centerWidthPct != null
      ? [{ flex: 0 }, { width: `${centerWidthPct}%` } as ViewStyle]
      : [{ flex: 1 }];

  if (centerMaxWidth && centerWidthPct != null) {
    centerSizing.push({ maxWidth: centerMaxWidth } as ViewStyle);
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { height: TOTAL_H }]}>
      {/* Capa blur */}
<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: blurOpacity }]}>
  <BlurView
    intensity={60}
    tint={blurTint}
    experimentalBlurMethod="dimezisBlurView"
    collapsable={false as any}
    style={[StyleSheet.absoluteFillObject, { height: TOTAL_H, backgroundColor: "transparent" }]}
  />
  <View
    style={{
      position: "absolute",
      top: 0, left: 0, right: 0,
      height: TOTAL_H,
      backgroundColor: overlayColor,
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
          <View style={[styles.side, { width: sideWidth }]}>{leftSlot}</View>

          <View style={[styles.center, ...centerSizing]} pointerEvents="box-none">
            {resolvedCenterSlot}
          </View>

          <View style={[styles.side, { width: sideWidth, alignItems: "flex-end" }]}>{resolvedRightSlot}</View>
        </View>
      </SafeAreaView>

      {showBottomHairline && <View style={styles.hairline} pointerEvents="none" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 20,
    elevation: 20 // ✅ necesario para Android
  },
  rowBase: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  side: { flexDirection: "row", alignItems: "center", gap: 10 },
  center: { alignItems: "center", justifyContent: "center" },
  hairline: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
