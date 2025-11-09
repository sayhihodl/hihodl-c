// src/lib/format.ts
// Formateadores para la pantalla de detalles de token

/**
 * Formatea un monto de token con decimales opcionales
 */
export function formatToken(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || !Number.isFinite(num)) {
    return "0";
  }
  return num.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

/**
 * Formatea un monto en USD (siempre en-US locale)
 */
export function formatFiat(usd: number | null, options?: { locale?: string }): string {
  if (usd === null || isNaN(usd)) {
    return "$—";
  }
  // Siempre usar en-US para USD (punto decimal)
  const locale = options?.locale || "en-US";
  return `$${usd.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

/**
 * Acorta una dirección a formato: 0xabc…1234
 */
export function shortAddr(addr: string, keep: number = 6): string {
  if (!addr || addr.length <= keep * 2 + 3) {
    return addr;
  }
  return `${addr.slice(0, keep)}…${addr.slice(-keep)}`;
}

/**
 * Formatea una fecha ISO a formato corto relativo (ej: "2d", "5d", "1h")
 */
export function shortDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d`;
  }
  if (diffHours > 0) {
    return `${diffHours}h`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m`;
  }
  return "now";
}

/**
 * Obtiene la URL del explorador para un token en una red específica
 */
export type NetworkKey = "solana" | "base" | "ethereum" | "polygon";

export function getExplorerUrl(network: NetworkKey, contractAddress?: string): string {
  const baseUrls: Record<NetworkKey, string> = {
    solana: "https://solscan.io/token/",
    base: "https://basescan.org/token/",
    ethereum: "https://etherscan.io/token/",
    polygon: "https://polygonscan.com/token/",
  };

  const base = baseUrls[network] || baseUrls.ethereum;
  if (contractAddress) {
    return `${base}${contractAddress}`;
  }
  return base;
}

/**
 * Mapea ChainId a NetworkKey
 */
export function chainIdToNetworkKey(chainId: string): NetworkKey {
  if (chainId.includes("solana")) return "solana";
  if (chainId.includes("8453")) return "base";
  if (chainId.includes("137")) return "polygon";
  if (chainId.includes("1") || chainId.includes("eip155:1")) return "ethereum";
  return "ethereum"; // default
}

// Re-export NetworkKey type
export type { NetworkKey };

