// app/(tabs)/receive/scanner.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult, // ✅ tipos para onBarcodeScanned
  type BarcodeType,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BG = "#0D1820";
const TEXT = "#ffffff";
const SUB = "rgba(255,255,255,0.7)";

export default function ReceiveScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false); // evita múltiples lecturas seguidas

  useEffect(() => {
    if (!permission?.granted) {
      // pedir permiso al montar o si cambia a denegado
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const onClose = () => router.back();

  const onScanned = async (data: string) => {
    if (locked) return;
    setLocked(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(data);
      Alert.alert(
        "Scanned",
        Platform.select({
          ios: "Contenido copiado al portapapeles",
          android: "Contenido copiado al portapapeles",
          default: "Copied to clipboard",
        }) as string,
        [{ text: "OK", onPress: onClose }]
      );
      // Si quieres, redirige a Receive con el payload:
      // router.replace({ pathname: "/(tabs)/receive", params: { scanned: encodeURIComponent(data) } });
    } catch {
      setLocked(false);
    }
  };

  if (!permission?.granted) {
    // Estado sin permisos (o aún cargando)
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: BG, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Camera permission</Text>
        <Pressable onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryTxt}>Allow</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.iconBtn, { marginTop: 12 }]}>
          <Text style={{ color: SUB }}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.fill}>
      {/* Header flotante */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Scan QR</Text>
        <Pressable
          onPress={() => setTorch((v) => !v)}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel="Toggle torch"
        >
          <Ionicons name={torch ? "flashlight" : "flashlight-outline"} size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Cámara */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        // ✅ param tipado; evita 'implicit any'
        onBarcodeScanned={({ data }: BarcodeScanningResult) => {
          if (data) onScanned(String(data));
        }}
        barcodeScannerSettings={{ barcodeTypes: ["qr" as BarcodeType] }}
      />

      {/* Marco de guía */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.box} />
        <Text style={styles.helper}>Coloca el QR dentro del recuadro</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "black" },

  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 260,
    height: 260,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent",
  },
  helper: {
    marginTop: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },

  primaryBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#FFB703",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTxt: { color: "#0D1820", fontWeight: "800" },
});