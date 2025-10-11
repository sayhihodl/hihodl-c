// app/(drawer)/(tabs)/cards/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function CardsGroupLayout() {
  return <Stack screenOptions={pushOptions} />;
}