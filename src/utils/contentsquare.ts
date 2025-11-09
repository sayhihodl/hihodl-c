// src/utils/contentsquare.ts
// Helper para inicializar Contentsquare (solo web)
// Contentsquare proporciona mapas de calor, grabaciones de sesiones y análisis de UX

import { Platform } from "react-native";
import { logger } from "./logger";

let contentsquareInitialized = false;

/**
 * Inicializa Contentsquare (solo funciona en web)
 * @param siteId - ID del sitio de Contentsquare (ej: "8dd547cc125f2")
 */
export function initContentsquare(siteId: string | undefined): void {
  if (Platform.OS !== "web") {
    logger.debug("[Contentsquare] Skipping initialization (not web platform)");
    return;
  }

  if (contentsquareInitialized) {
    logger.debug("[Contentsquare] Already initialized");
    return;
  }

  const csSiteId = siteId || process.env.EXPO_PUBLIC_CONTENTSQUARE_SITE_ID;
  if (!csSiteId) {
    logger.warn("[Contentsquare] No site ID provided, skipping initialization");
    return;
  }

  if (typeof window === "undefined") {
    logger.warn("[Contentsquare] Window object not available");
    return;
  }

  try {
    // Verificar si el script ya existe
    const existingScript = document.querySelector(
      `script[src*="contentsquare.net/uxa/${csSiteId}"]`
    );
    if (existingScript) {
      logger.debug("[Contentsquare] Script already exists");
      contentsquareInitialized = true;
      return;
    }

    // Crear e inyectar script de Contentsquare
    const script = document.createElement("script");
    script.src = `https://t.contentsquare.net/uxa/${csSiteId}.js`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      contentsquareInitialized = true;
      logger.info("[Contentsquare] Initialized", { siteId: csSiteId });
    };
    
    script.onerror = (error) => {
      logger.warn("[Contentsquare] Failed to load script", error);
    };

    // Insertar en el head
    const head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(script);
  } catch (error) {
    logger.warn("[Contentsquare] Failed to initialize", error);
  }
}

/**
 * Verifica si Contentsquare está inicializado
 */
export function isContentsquareInitialized(): boolean {
  return contentsquareInitialized;
}

