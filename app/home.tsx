// app/home.tsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import GlassNavBar from "@/components/Screen/GlassNavBar";
import { useAuth } from "@/store/auth";
import '@/shims/node';

export default function HomeScreen() {
  const { isAuthenticated, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    
    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, ready]);

  // Mostrar loading mientras se verifica la autenticación
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f14",
        }}
      >
        <ActivityIndicator size="large" color="#FFB703" />
      </View>
    );
  }

  // Si no está autenticado, mostrar mensaje mientras se redirige
  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f14",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>Redirigiendo a login...</Text>
      </View>
    );
  }

  return (
    <>
      <GlassNavBar
        forceGlass
        headerHeight={44}
        headerPad={8}
        tintOpacity={0.35}
        intensityIOS={60}
      />
      <View
        style={{
          flex: 1,
          paddingTop: 44 + 8, // coincide con los props arriba
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f14", // opcional para ver el efecto del blur
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>HOME OK</Text>
      </View>
    </>
  );
}