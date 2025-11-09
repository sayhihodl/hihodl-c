// src/services/paymentBehaviorLearning.ts
// Sistema de aprendizaje del comportamiento del usuario para personalizar token por defecto
import { usePaymentsStore } from "@/store/payments";
import { useUserPrefs } from "@/store/userPrefs";
import type { ChainKey } from "@/config/sendMatrix";

export type PaymentRecord = {
  tokenId: string;
  chain: ChainKey;
  timestamp: number;
  recipient?: string;
};

const RECENT_PAYMENTS_KEY = "@hihodl:recent_payments";
const MAX_RECENT_PAYMENTS = 10; // Mantener últimos 10 pagos para análisis

/**
 * Guarda un pago reciente en AsyncStorage para análisis de comportamiento
 */
export async function recordPayment(tokenId: string, chain: ChainKey, recipient?: string): Promise<void> {
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const recent = await getRecentPayments();
    
    // Agregar nuevo pago al inicio
    const newPayment: PaymentRecord = {
      tokenId: tokenId.toLowerCase(),
      chain,
      timestamp: Date.now(),
      recipient,
    };
    
    recent.unshift(newPayment);
    
    // Mantener solo los últimos MAX_RECENT_PAYMENTS
    const trimmed = recent.slice(0, MAX_RECENT_PAYMENTS);
    
    await AsyncStorage.setItem(RECENT_PAYMENTS_KEY, JSON.stringify(trimmed));
    
    // Analizar y actualizar token favorito si hay patrón
    await analyzeAndUpdateDefaultToken(trimmed);
  } catch (e) {
    console.debug("[paymentBehaviorLearning] recordPayment error", String(e));
  }
}

/**
 * Obtiene los últimos pagos guardados
 */
async function getRecentPayments(): Promise<PaymentRecord[]> {
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const json = await AsyncStorage.getItem(RECENT_PAYMENTS_KEY);
    if (!json) return [];
    
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Analiza los últimos pagos y actualiza el token por defecto si hay un patrón claro
 * 
 * REGLAS:
 * 1. Si hay 2+ pagos consecutivos con el mismo token/chain (diferente del favorito actual)
 *    → Actualizar favorito a ese token/chain
 * 2. Si el usuario cambia 2+ veces seguidas el network del token favorito
 *    → Actualizar el network favorito (mantener token, cambiar chain)
 * 3. Si los pagos son aleatorios (no consecutivos) → NO cambiar favorito
 * 4. Si hay 2+ pagos consecutivos con un token diferente → Actualizar token favorito
 */
async function analyzeAndUpdateDefaultToken(recentPayments: PaymentRecord[]): Promise<void> {
  if (recentPayments.length < 2) return; // Necesitamos al menos 2 pagos
  
  const currentDefault = useUserPrefs.getState().defaultTokenId?.toLowerCase() || "usdc";
  const favoriteChainByToken = useUserPrefs.getState().favoriteChainByToken || {};
  const currentFavoriteChain = favoriteChainByToken[currentDefault] || "solana";
  
  // Obtener últimos 2-3 pagos para detectar patrones consecutivos
  const last3 = recentPayments.slice(0, 3);
  
  // PATRÓN 1: Cambio de network en el mismo token favorito (2+ veces seguidas)
  // Ejemplo: USDC en Solana (favorito) → usuario cambia a Base 2 veces → actualizar a USDC en Base
  if (last3.length >= 2) {
    const [last, second] = last3;
    
    // Si los últimos 2 pagos son del mismo token favorito pero diferente chain
    if (last.tokenId === currentDefault && 
        second.tokenId === currentDefault &&
        last.chain !== currentFavoriteChain &&
        last.chain === second.chain) {
      
      // Actualizar chain favorita para ese token
      useUserPrefs.getState().setFavoriteChainForToken(currentDefault, last.chain);
      console.debug("[paymentBehaviorLearning] Updated favorite chain for", currentDefault, "to", last.chain);
      return;
    }
  }
  
  // PATRÓN 2: Cambio a un token diferente (2+ pagos consecutivos)
  // Ejemplo: USDC favorito → usuario envía ETH 2 veces seguidas → hacer ETH el favorito
  if (last3.length >= 2) {
    const [last, second] = last3;
    
    // Si los últimos 2 pagos son del mismo token/chain pero diferente del favorito actual
    if (last.tokenId === second.tokenId &&
        last.chain === second.chain &&
        (last.tokenId !== currentDefault || last.chain !== currentFavoriteChain)) {
      
      // Actualizar token favorito y chain favorita
      useUserPrefs.getState().setDefaultTokenId(last.tokenId);
      useUserPrefs.getState().setFavoriteChainForToken(last.tokenId, last.chain);
      console.debug("[paymentBehaviorLearning] Updated default token to", last.tokenId, "on", last.chain);
      return;
    }
  }
  
  // Si los pagos son aleatorios (diferentes tokens/chains, no consecutivos) → NO cambiar favorito
  // El sistema simplemente seguirá mostrando el token favorito actual
}

/**
 * Obtiene el token usado más recientemente con un destinatario específico
 */
export async function getLastUsedWithRecipient(recipient?: string): Promise<{ tokenId: string; chain: ChainKey } | undefined> {
  try {
    const recent = await getRecentPayments();
    if (!recipient) return undefined;
    
    // Buscar el último pago a este destinatario
    const match = recent.find(p => 
      p.recipient?.toLowerCase() === recipient.toLowerCase()
    );
    
    if (match) {
      return {
        tokenId: match.tokenId,
        chain: match.chain,
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Obtiene tokens usados recientemente (para priorizar en selector)
 */
export async function getRecentTokenIds(): Promise<string[]> {
  try {
    const recent = await getRecentPayments();
    // Devolver IDs únicos de los últimos pagos (priorizando los más recientes)
    const seen = new Set<string>();
    const result: string[] = [];
    
    for (const p of recent.slice(0, 5)) {
      const key = `${p.tokenId}:${p.chain}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p.tokenId);
      }
    }
    
    return result;
  } catch {
    return [];
  }
}

