/**
 * Constants for QuickSendScreen
 */

export const IS_MOCK =
  process.env.EXPO_PUBLIC_MOCK_PAYMENTS === "1" ||
  !process.env.EXPO_PUBLIC_RELAY_URL;

export const MAX_PER_TX = 99_999_999;

/** Layout constants */
export const UI = {
  HEADER_H: 50,
  TOP_GAP: 84,           // distancia desde header hasta cifra
  AMOUNT_BLOCK_H: 120,   // alto visual cifra+subtítulo
  BETWEEN_GAP: 74,       // distancia entre cifra y selector (alineado con Request)
} as const;

export const CTA_ACTIVE = "#FFB703";
export const CTA_DISABLED = "#C8D2D9";

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

