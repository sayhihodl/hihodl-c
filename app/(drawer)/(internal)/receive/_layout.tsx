// app/(drawer)/(internal)/receive/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function ReceiveStack() {
  return (
    <Stack screenOptions={pushOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="request-link" />
      <Stack.Screen name="request-amount" />
    </Stack>
  );
}