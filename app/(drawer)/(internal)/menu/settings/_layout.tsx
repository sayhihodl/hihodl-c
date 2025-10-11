// app/(drawer)/(internal)/menu/settings/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function SettingsLayout() {
  return <Stack screenOptions={pushOptions} />;
}