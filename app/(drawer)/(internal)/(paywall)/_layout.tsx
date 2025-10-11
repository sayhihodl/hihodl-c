// app/(paywall)/_layout.tsx
import { Stack } from "expo-router";

export default function PaywallLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,              // usas GlassHeader
        gestureEnabled: true,            // habilita swipe
        fullScreenGestureEnabled: true,  // evita conflicto con FlatList horizontal
        presentation: "modal",           // si quieres estilo modal; opcional
        // gestureResponseDistance: 30,   // opcional: ampliar borde si prefieres edge-only
      }}
    />
  );
}