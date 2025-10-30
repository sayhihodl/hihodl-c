import React from "react";
import { Platform, requireNativeComponent, ViewStyle } from "react-native";

export type GlassNavBarIOSProps = {
  forceGlass?: boolean;
  headerHeight?: number;  // default 44
  headerPad?: number;     // default 8
  tintOpacity?: number;   // 0..1 (default 0.35)
  materialStyle?: 0 | 1 | 2 | 3 | 4; // opcional
  useSystemTint?: boolean; // opcional
  style?: ViewStyle;
};

const NativeGlass =
  Platform.OS === "ios"
    ? requireNativeComponent<GlassNavBarIOSProps>("GlassNavBarView")
    : null;

export default function GlassNavBarIOS(props: GlassNavBarIOSProps) {
  if (Platform.OS !== "ios" || !NativeGlass) return null;
  return <NativeGlass {...props} />;
}