// src/hooks/useDashboardI18n.ts
// Hook simplificado para manejo de i18n en Dashboard

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { preloadNamespaces } from "@/i18n/i18n";
import type { TFunction } from "i18next";

/**
 * Hook para manejar i18n del dashboard con preload de namespaces
 * Retorna función de traducción lista para usar y estado de carga
 */
export function useDashboardI18n() {
  const { i18n } = useTranslation();
  const [ready, setReady] = useState(false);
  
  // Precargar namespaces necesarios
  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      await preloadNamespaces(["dashboard", "common", "tx"]);
      if (!cancelled) {
        setReady(true);
      }
    };
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);
  
  // Función de traducción fija con fallback
  const t = useMemo(() => {
    if (!ready) {
      // Fallback mientras carga
      return ((key: string, defaultValue?: string) => defaultValue ?? key) as TFunction;
    }
    
    const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
    return i18n.getFixedT(lang, "dashboard");
  }, [ready, i18n.resolvedLanguage, i18n.language]);
  
  return { t, ready };
}

