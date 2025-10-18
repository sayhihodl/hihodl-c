// app/(drawer)/(internal)/payments/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function PaymentsInternalStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Asegúrate de tener el archivo thread.tsx en esta carpeta */}
      <Stack.Screen name="thread" />
      {/* Si más adelante creas detalles, añade la screen correspondiente */}
      {/* <Stack.Screen name="tx-details" /> */}
    </Stack>
  );
}