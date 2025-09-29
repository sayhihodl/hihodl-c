// app/(tabs)/payments/_layout.tsx
import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { legacy } from "@/theme/colors";

const { BG } = legacy;

export default function PaymentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: Platform.select({ ios: "slide_from_right", android: "fade", default: "fade" }),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      {/* Si luego añades modales:
          <Stack.Screen name="select-token" options={{ presentation: "modal" }} />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      */}
    </Stack>
  );
}