// src/send/addressBook.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "hh.addressBook.v1"; // { [lowercasedAddress]: label }

export type AddrBook = Record<string, string>;

async function load(): Promise<AddrBook> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AddrBook) : {};
  } catch { return {}; }
}
async function save(map: AddrBook) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export async function getLabel(addr?: string | null): Promise<string | undefined> {
  if (!addr) return;
  const book = await load();
  return book[String(addr).toLowerCase()];
}

export async function setLabel(addr: string, label: string | undefined) {
  const book = await load();
  const key = addr.toLowerCase();
  if (!label || !label.trim()) delete book[key];
  else book[key] = label.trim();
  await save(book);
}