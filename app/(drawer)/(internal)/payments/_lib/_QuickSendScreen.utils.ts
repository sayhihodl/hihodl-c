/**
 * Utility functions for QuickSendScreen
 */

export const fmt = (n: number, dps = 2) =>
  (isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: dps }) : "0");

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

