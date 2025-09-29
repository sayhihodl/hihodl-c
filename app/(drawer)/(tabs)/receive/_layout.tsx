// app/(tabs)/receive/_layout.tsx
import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { legacy } from "@/theme/colors";
const { BG } = legacy;

export default function ReceiveStack() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: Platform.select({ ios: "slide_from_right", android: "fade", default: "fade" }),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="request-link" />
      <Stack.Screen name="request-amount" />
    </Stack>
  );
}