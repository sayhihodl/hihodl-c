// app/(drawer)/(internal)/send/_layout.tsx
import { Stack } from "expo-router";

export default function SendStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
    </Stack>
  );
}