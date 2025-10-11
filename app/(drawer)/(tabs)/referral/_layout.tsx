// app/(drawer)/(internal)/referral/_layout.tsx
import { Stack } from "expo-router";
import { pushOptions } from "@/nav/stackOptions";

export default function ReferralStack() {
  return <Stack screenOptions={pushOptions} />;
}