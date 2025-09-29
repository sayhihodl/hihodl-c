// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LoadingProvider } from "@/providers/LoadingProvider";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";

const BG = "#0F0F1A"; // tu azul/teal (el mismo que usas en las screens)

export default function RootLayout() {
  // Pone el color del fondo del sistema (Android) para evitar parpadeos al montar
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(BG).catch(() => {});
  }, []);

  return (
    <LoadingProvider>
      <StatusBar style="light" backgroundColor={BG} translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BG },
          animation: "fade",
        }}
      />
    </LoadingProvider>
  );
}