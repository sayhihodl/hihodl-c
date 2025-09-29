// src/components/TopInsetBg.tsx
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TopInsetBg({ color }: { color: string }) {
  const { top } = useSafeAreaInsets();
  // En Android el StatusBar puede pintarse directamente; en iOS cubrimos el "notch"
  if (Platform.OS !== "ios" || top === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: top,
        backgroundColor: color,
        zIndex: 999,
      }}
    />
  );
}