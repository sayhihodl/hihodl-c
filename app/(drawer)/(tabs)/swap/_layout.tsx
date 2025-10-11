// app/(drawer)/(tabs)/swap/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions, modalOptions } from "@/nav/stackOptions";

export default function SwapLayout() {
  return (
    <Stack screenOptions={pushOptions}>
      {/* Pantalla principal del tab */}
      <Stack.Screen name="index" />

      {/* Modales sobre swap */}
      <Stack.Screen
        name="select-token"
        options={modalOptions}
      />
      <Stack.Screen
        name="settings"
        options={modalOptions}
      />

      {/* Si más adelante creas app/(drawer)/(tabs)/swap/[id].tsx:
          <Stack.Screen name="[id]" />
      */}
    </Stack>
  );
}