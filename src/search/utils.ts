// src/search/utils.ts
export function normalizeText(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .trim();
}