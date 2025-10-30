import React from "react";
import { View } from "react-native";

export function SkeletonLine({ width = "100%", height = 14, radius = 8, style }: { width?: number | string; height?: number; radius?: number; style?: any }) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        },
        style,
      ]}
    />
  );
}

export function SkeletonBubble() {
  return (
    <View style={{ width: "100%", alignItems: "flex-start", marginVertical: 8 }}>
      <View style={{ borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", maxWidth: "80%" }}>
        <SkeletonLine width={160} height={16} />
        <View style={{ height: 8 }} />
        <SkeletonLine width={90} height={12} />
      </View>
    </View>
  );
}


