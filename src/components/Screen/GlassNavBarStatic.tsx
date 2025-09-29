// components/GlassNavBarStatic.tsx
import React, { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/** Props públicas */
export type GlassNavBarProps = {
  /** Si true, el vidrio está siempre visible (opacidad 1). */
  forceGlass?: boolean;
  /** Alto del área de contenido del header (sin contar el notch). */
  headerHeight?: number; // por defecto 44
  /** Padding extra debajo del notch. */
  headerPad?: number; // por defecto 8
  /** Intensidad del blur iOS. */
  intensityIOS?: number; // por defecto 60
  /** Opacidad del tinte oscuro sobre el blur. */
  tintOpacity?: number; // por defecto 0.35
};

const GlassNavBarStatic: React.FC<GlassNavBarProps> = ({
  forceGlass = true,
  headerHeight = 44,
  headerPad = 8,
  intensityIOS = 60,
  tintOpacity = 0.35,
}) => {
  const insets = useSafeAreaInsets();
  const FIXED_H = insets.top + headerHeight + headerPad;

  // Como es “Static”, su visibilidad depende sólo de forceGlass
  const opacity = forceGlass ? 1 : 0;

  return (
    <View pointerEvents="none" style={[styles.wrap, { height: FIXED_H, opacity }]}>
      {Platform.OS === "ios" ? (
        <>
          <BlurView tint="dark" intensity={intensityIOS} style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: `rgba(6,14,20,${tintOpacity})`,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255,255,255,0.08)",
              },
            ]}
          />
        </>
      ) : (
        // En Android simulamos el vidrio con un fondo translúcido
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(7,16,22,0.86)",
            },
          ]}
        />
      )}

      {/* Zona segura para que el alto incluya el notch (no contiene UI interactiva) */}
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default memo(GlassNavBarStatic);