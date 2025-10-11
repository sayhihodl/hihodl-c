// app/(drawer)/(tabs)/token/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function TokenGroupLayout() {
  return <Stack screenOptions={pushOptions} />;
}