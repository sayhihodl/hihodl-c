// app/menu/_layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        presentation: "card",   // <- navegación normal, no modal
        headerShown: false,      // <- muestra navbar
        animation: "default",   // <- animación estándar
      }}
    />
  );
}