// src/store/referrals.store.ts
import { create } from "zustand";

type ReferralState = {
  inviteCode: string;
  baseUrl: string;
  referredCount: number;
  rewardsUsd: number;
  // Futuro: load() para pedir métricas reales al backend
};

export const useReferralStore = create<ReferralState>(() => ({
  inviteCode: "alex-7FH3Q",
  baseUrl: "https://hihodl.app",
  referredCount: 0,
  rewardsUsd: 0,
}));