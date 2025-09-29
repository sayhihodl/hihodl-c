// src/store/profile.ts
import { create } from "zustand";

type State = { username: string; avatar: string };
type Actions = { setProfile: (p: Partial<State>) => void };

export const useProfileStore = create<State & Actions>((set) => ({
  username: "@",
  avatar: "🚀",
  setProfile: (p) => set((s) => ({ ...s, ...p })),
}));