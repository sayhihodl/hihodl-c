// app/(drawer)/(internal)/tokens/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function TokensLayout() {
  return <Stack screenOptions={pushOptions} />;
}