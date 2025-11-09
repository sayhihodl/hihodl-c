// src/utils/testSupabaseConnection.ts
// Helper para verificar que Supabase está conectado y funcionando

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { logger } from "./logger";

/**
 * Verifica la conexión a Supabase y prueba insertar un evento de prueba
 */
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  error?: string;
}> {
  const configured = isSupabaseConfigured();
  
  if (!configured) {
    return {
      configured: false,
      connected: false,
      error: "Supabase no está configurado. Verifica EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY",
    };
  }

  try {
    // Probar conexión insertando un evento de prueba
    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        event_name: "connection_test",
        event_params: { test: true, timestamp: new Date().toISOString() },
        platform: "test",
      })
      .select();

    if (error) {
      logger.error("[Test] Supabase connection error", error);
      return {
        configured: true,
        connected: false,
        error: error.message,
      };
    }

    logger.info("[Test] Supabase connection successful!", { data });
    return {
      configured: true,
      connected: true,
    };
  } catch (error) {
    logger.error("[Test] Supabase connection failed", error);
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verifica el estado de configuración sin hacer conexión
 */
export function checkSupabaseConfig(): {
  configured: boolean;
  url?: string;
  keyPresent: boolean;
} {
  const configured = isSupabaseConfigured();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return {
    configured,
    url: url || undefined,
    keyPresent: !!key,
  };
}






