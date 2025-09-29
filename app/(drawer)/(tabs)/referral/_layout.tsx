import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";

export default function ReferralStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: Platform.select({ ios: "slide_from_right", android: "fade", default: "fade" }),
        contentStyle: { backgroundColor: "#0D1820" },
      }}
    />
  );
}