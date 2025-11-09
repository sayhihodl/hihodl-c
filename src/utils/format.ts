// src/utils/format.ts
export function fmt(value: string | number | undefined | null, maxFractionDigits: number = 6): string {
  const num = Number(value);
  if (isNaN(num) || !Number.isFinite(num)) {
    return "0";
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}






