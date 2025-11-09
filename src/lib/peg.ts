// src/lib/peg.ts
// Utilidades para el peg de stablecoins

export interface PegStatus {
  status: "ok" | "warn";
  deviationPct: number;
}

const PEG_THRESHOLD = 0.3; // 0.3% de desviación

/**
 * Obtiene el estado del peg basado en el precio y el valor esperado (1.0)
 */
export function getPegStatus(price: number | null, peg: number = 1.0): PegStatus | null {
  if (price === null || isNaN(price)) {
    return null;
  }

  const deviationPct = Math.abs(((price - peg) / peg) * 100);

  return {
    status: deviationPct < PEG_THRESHOLD ? "ok" : "warn",
    deviationPct,
  };
}




