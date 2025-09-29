// app/(tabs)/send/_layout.tsx
import { Stack } from "expo-router";

export default function SendLayout() {
  return (
    <Stack
      initialRouteName="token-picker"     // 👈 entra directo al picker (sin index)
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="token-picker" options={{ gestureEnabled: false }} />
      <Stack.Screen name="amount" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}