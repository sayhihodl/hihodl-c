import { useEffect, useState } from "react";
import type { Card } from "./types";
import type { CardProvider } from "./provider";

export function useCards(provider: CardProvider) {
  const [cards, setCards] = useState<Card[]>([]);
  const reload = async () => setCards(await provider.list());
  useEffect(() => { reload(); }, [provider]);
  return {
    cards, reload,
    freeze: async (id: string, f: boolean) => { await provider.freeze(id, f); await reload(); },
    setDefault: async (id: string) => { await provider.setDefault(id); await reload(); },
    rename: async (id: string, name: string) => { await provider.rename(id, name); await reload(); },
    reveal: provider.reveal,
  };
}