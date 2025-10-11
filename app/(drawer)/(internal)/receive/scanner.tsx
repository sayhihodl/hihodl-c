// app/(drawer)/(tabs)/send/scanner.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useContacts } from "@/store/useContacts";
import { parseSolanaPayUrl, isBase58Sol } from "@/lib/solanaPay";

type Account = "Daily" | "Savings" | "Social";

export default function SendScanner() {
  const { tokenId, account } = useLocalSearchParams<{ tokenId?: string; account?: Account }>();
  const token = tokenId ?? "USDC.circle";
  const acc: Account = (account as Account) ?? "Daily";

  const upsert = useContacts((s) => s.upsert);

  const [hasPerm, setHasPerm] = useState<"unknown" | "granted" | "denied">("unknown");
  const [BarCodeScanner, setBarCodeScanner] = useState<any>(null);
  const locked = useRef(false);

  useEffect(() => {
    // En web no hay cámara
    if (Platform.OS === "web") {
      setHasPerm("denied");
      return;
    }
    (async () => {
      try {
        // 👇 import dinámico: evita cargar el nativo si tu binario no lo tiene
        const mod = await import("expo-barcode-scanner");
        setBarCodeScanner(() => mod.BarCodeScanner);
        const { status } = await mod.requestPermissionsAsync();
        setHasPerm(status === "granted" ? "granted" : "denied");
      } catch {
        // Si el binario no incluye el módulo nativo, caemos aquí
        setHasPerm("denied");
      }
    })();
  }, []);

  const goAmount = useCallback(
    (uccId: string) => {
      router.replace({
        pathname: "/(drawer)/(tabs)/send/amount",
        params: { tokenId: token, to: uccId, account: acc } as any,
      });
    },
    [token, acc]
  );

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (locked.current) return;
      locked.current = true;
      try {
        const raw = (data || "").trim();

        // Solana Pay (directo/gateway/https)
        const sp = parseSolanaPayUrl(raw);
        if (sp) {
          const uccId = upsert({
            displayName: sp.label ?? sp.recipient.slice(0, 6) + "…",
            addresses: { sol: [sp.recipient] },
            preferred: { sol: sp.recipient },
            isHiHodl: false,
            status: "Unverified",
          });
          goAmount(uccId);
          return;
        }

        // Dirección SOL cruda
        if (isBase58Sol(raw)) {
          const uccId = upsert({
            displayName: raw.slice(0, 6) + "…",
            addresses: { sol: [raw] },
            preferred: { sol: raw },
            isHiHodl: false,
            status: "Unverified",
          });
          goAmount(uccId);
          return;
        }

        // No reconocido
        router.back();
      } finally {
        setTimeout(() => (locked.current = false), 600);
      }
    },
    [upsert, goAmount]
  );

  // Fallbacks (web / sin permisos / sin nativo)
  if (!BarCodeScanner || hasPerm !== "granted") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>
          {Platform.OS === "web"
            ? "QR scanning is not available on web."
            : "Camera not available. Check permissions or rebuild the app with expo-barcode-scanner."}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnTxt}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BarCodeScanner onBarCodeScanned={handleScan} style={{ flex: 1, width: "100%" }} />
      <View style={styles.overlay}>
        <Pressable onPress={() => router.back()} style={styles.fab}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.hint}>Scan Solana Pay or a Solana address</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  text: { color: "#fff", textAlign: "center", marginTop: 24 },
  btn: { alignSelf: "center", marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10 },
  btnTxt: { color: "#fff" },
  overlay: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" },
  hint: { color: "rgba(255,255,255,0.9)", marginTop: 10, fontSize: 13 },
  fab: { position: "absolute", top: -8, right: 16, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
});