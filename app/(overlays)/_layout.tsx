// app/(overlays)/_layout.tsx
import { Stack } from "expo-router";

export default function OverlaysLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "transparentModal", // modal translúcido
        animation: "fade",                // sin blink
        contentStyle: { backgroundColor: "rgba(0,0,0,0.35)" }, // oscurece detrás
      }}
    >
      <Stack.Screen name="link-created" />
    </Stack>
  );
}