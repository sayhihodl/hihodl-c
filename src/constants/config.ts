// src/constants/config.ts
// Constantes de configuración para evitar valores mágicos en el código

/**
 * Timeouts y delays
 */
export const TIMEOUTS = {
  /** Timeout para requests HTTP (ms) */
  HTTP_REQUEST: 8000,
  /** Debounce para búsquedas y inputs (ms) */
  DEBOUNCE_SEARCH: 300,
  /** Backoff inicial para retries (ms) */
  BACKOFF_INITIAL: 200,
  /** Retardo mínimo para operaciones mock (ms) */
  MOCK_MIN_DELAY: 180,
  /** Retardo máximo para operaciones mock (ms) */
  MOCK_MAX_DELAY: 450,
} as const;

/**
 * Límites y rangos
 */
export const LIMITS = {
  /** Máximo número de reintentos para requests */
  MAX_RETRIES: 3,
  /** Límite de resultados de búsqueda */
  SEARCH_RESULTS: 60,
  /** Límite de tokens recomendados */
  RECOMMENDED_TOKENS: 50,
  /** Límite para tokens en categorías Jupiter */
  JUPITER_CATEGORY_LIMIT: 50,
} as const;

/**
 * Probabilidades y porcentajes
 */
export const PROBABILITIES = {
  /** Probabilidad de error transitorio en mocks */
  MOCK_TRANSIENT_ERROR: 0.08,
  /** Porcentaje mínimo de impacto de precio */
  MIN_PRICE_IMPACT: 0.85,
  /** Factor de variación de precio aleatorio */
  PRICE_VARIATION_FACTOR: 0.02,
} as const;

/**
 * Configuración de slippage
 */
export const SLIPPAGE_OPTIONS = {
  AUTO: "auto",
  LOW: 0.5,
  STANDARD: 1,
  HIGH: 2,
} as const;

/**
 * Configuración de fees y costos (en USD)
 */
export const FEES = {
  ROUTER_FEE_MIN: 0.02,
  ROUTER_FEE_MAX: 0.1,
  GAS_MIN: 0.05,
  GAS_MAX: 0.18,
  TIP_DEFAULT: 0.05, // 0.05%
} as const;

