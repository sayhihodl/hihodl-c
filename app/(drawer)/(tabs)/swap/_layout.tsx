// app/(tabs)/swap/_layout.tsx
import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { legacy } from "@/theme/colors";

const { BG } = legacy;

export default function SwapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: Platform.select({
          ios: "slide_from_right",
          android: "fade",
          default: "fade",
        }),
      }}
    >
      {/* Pantalla principal del tab */}
      <Stack.Screen name="index" />

      {/* Modales sobre swap */}
      <Stack.Screen
        name="select-token"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
        }}
      />

      {/* Si más adelante creas app/(tabs)/swap/[id].tsx, entonces añade:
          <Stack.Screen name="[id]" />
       */}
    </Stack>
  );
}