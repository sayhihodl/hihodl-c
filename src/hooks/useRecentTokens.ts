// src/hooks/useRecentTokens.ts
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Clave única en storage */
const KEY = "recentTokens";
/** Máximo de items a guardar */
const MAX = 6;

export async function getRecentTokens(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveRecentToken(id: string): Promise<void> {
  try {
    const list = await getRecentTokens();
    const updated = [id, ...list.filter((x) => x !== id)].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // noop
  }
}

export async function clearRecentTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // noop
  }
}

/**
 * Hook para leer y mantener el estado de recientes.
 * Carga una vez al montar y expone actions para refrescar.
 */
export function useRecentTokens() {
  const [recent, setRecent] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setRecent(await getRecentTokens());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (id: string) => {
    await saveRecentToken(id);
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearRecentTokens();
    setRecent([]);
  }, []);

  return { recent, add, refresh, clear };
}