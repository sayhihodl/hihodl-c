import React, { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

type Props = {
  /** Intensidad del blur en iOS */
  intensity?: number;           // 60 por defecto
  /** Opacidad del tinte oscuro encima del blur */
  tintOpacity?: number;         // 0.35 por defecto
};

function GlassBackdrop({ intensity = 60, tintOpacity = 0.35 }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Platform.OS === "ios" ? (
        <>
          <BlurView tint="dark" intensity={intensity} style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: `rgba(6,14,20,${tintOpacity})` },
            ]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,16,22,0.86)" }]} />
      )}
    </View>
  );
}

export default memo(GlassBackdrop);