// app/auth/login.tsx
// Esta pantalla solo redirige según el estado de autenticación
// - Si no está autenticado → redirige a /auth/choose ("How do you want to start?")
// - Si está autenticado con lock → redirige a /auth/lock (PIN/biometría)
// - Si está autenticado sin lock → redirige al dashboard
import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";
import { isLockEnabled } from "@/lib/lock";

export default function Login() {
  const { isAuthenticated } = useAuth();

  // Redirigir automáticamente según el estado de autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      // Si no está autenticado, ir a "How do you want to start?"
      router.replace("/auth/choose");
      return;
    }
    
    // Si está autenticado, redirigir según tenga lock o no
    (async () => {
      try {
        const hasLock = await isLockEnabled();
        if (hasLock) {
          // Si tiene lock, ir a la pantalla de lock (PIN/biometría)
          router.replace("/auth/lock");
        } else {
          // Si no tiene lock, ir directamente al dashboard
          router.replace("/(drawer)/(tabs)/(home)");
        }
      } catch (error) {
        console.error('Error checking lock:', error);
        // En caso de error, ir al dashboard
        router.replace("/(drawer)/(tabs)/(home)");
      }
    })();
  }, [isAuthenticated]);

  // Mostrar loading mientras redirige
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFB703" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
});
