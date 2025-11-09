// app/_layout.tsx
import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { ActivityIndicator, View, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SystemUI from "expo-system-ui";
import { initI18n /* , setLang */ } from "@/i18n/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analytics } from "@/utils/analytics";
import { crashReporting } from "@/utils/crash-reporting";
import { isSupabaseConfigured } from "@/lib/supabase";
import { initContentsquare } from "@/utils/contentsquare";
// Privy deshabilitado temporalmente para evitar interferencia con Supabase OAuth
// import { PrivyAuthProvider } from "@/auth/PrivyAuthProvider";
import '@/shims/node'; // esto va al principio

const BG = "#0D1820"; // Color de fondo principal de la app

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Configurar SystemUI para Android (color de fondo del sistema y notch)
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(BG).catch(() => {});
    }
    
    (async () => {
      try {
        await initI18n();          // carga 'common' y fija i18n.language
        
        // Inicializar crash reporting (solo en producción)
        // Para activar, descomentar y configurar DSN:
        // crashReporting.init({
        //   enabled: !__DEV__,
        //   dsn: "tu-sentry-dsn-aqui"
        // });
        
        // Inicializar analytics (incluye Mixpanel si está configurado)
        // Token por defecto: 2e63cb0ef9ad3b8419a852941c60ff7e
        const mixpanelToken = 
          process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 
          "2e63cb0ef9ad3b8419a852941c60ff7e"; // Token por defecto del proyecto
        analytics.init(true, mixpanelToken);
        
        // Inicializar Contentsquare (solo web)
        if (Platform.OS === "web") {
          initContentsquare(process.env.EXPO_PUBLIC_CONTENTSQUARE_SITE_ID);
        }
        
        // Verificar y loguear estado de servicios
        const supabaseReady = isSupabaseConfigured();
        if (supabaseReady) {
          console.log("✅ Supabase configurado - Analytics guardará eventos en Postgres");
        } else {
          console.warn("⚠️ Supabase no configurado - Analytics solo se logueará localmente");
          console.warn("   Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY");
        }
        
        if (mixpanelToken) {
          console.log("✅ Mixpanel configurado");
        } else {
          console.warn("⚠️ Mixpanel no configurado - Configura EXPO_PUBLIC_MIXPANEL_TOKEN para habilitarlo");
        }
        
        if (Platform.OS === "web" && process.env.EXPO_PUBLIC_CONTENTSQUARE_SITE_ID) {
          console.log("✅ Contentsquare configurado");
        }
        
        // Trackear que la app se abrió
        analytics.trackEvent({ name: "app_opened" });
      } catch (error) {
        // Capturar errores de inicialización
        crashReporting.captureException(
          error instanceof Error ? error : new Error(String(error)),
          { context: "app_initialization" }
        );
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { 
      mounted = false; 
    };
  }, []);

  if (!ready) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      {/* Privy deshabilitado temporalmente para evitar interferencia con Supabase OAuth */}
      {/* Si necesitas conectar wallets (MetaMask, Phantom), descomenta PrivyAuthProvider */}
      {/* <PrivyAuthProvider> */}
        <GestureHandlerRootView style={styles.flex}>
          <SafeAreaProvider>
            <StatusBar 
              style="light" 
              backgroundColor={BG}
              translucent={Platform.OS === "android"}
            />
            <Slot />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      {/* </PrivyAuthProvider> */}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});