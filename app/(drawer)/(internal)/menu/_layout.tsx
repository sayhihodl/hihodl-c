// app/(drawer)/(internal)/menu/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function MenuStack() {
  return (
    <Stack
      screenOptions={{
        ...pushOptions,
        gestureResponseDistance: { start: 40 }, // borde sensible al swipe-back en iOS
      }}
    >
      {/* pantalla principal del menú */}
      <Stack.Screen name="index" />

      {/* subrutas del menú */}
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="security" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="legal-terms" />
      <Stack.Screen name="legal-privacy" />
    </Stack>
  );
}