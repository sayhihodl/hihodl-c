import { router } from "expo-router";
export type Step = "search" | "token" | "amount" | "confirm";

export function openSend(opts?: { startAt?: Step; toRaw?: string; toDisplay?: string }) {
  const step: Step =
    opts?.startAt ?? (opts?.toRaw || opts?.toDisplay ? "token" : "search");
  router.navigate(`/(drawer)/(tabs)/send?step=${step}`);
}