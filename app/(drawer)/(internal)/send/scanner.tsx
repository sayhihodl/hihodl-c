// app/(drawer)/(tabs)/send/scanner.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Alert, Platform, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { parseSolanaPayUrl, isBase58Sol, validateSolanaPayData } from "@/lib/solanaPay";

type AnyCmp = React.ComponentType<any>;

export default function ScannerScreen() {
  const [ScannerView, setScannerView] = useState<AnyCmp | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // carga dinámica SIN top-level await
        const mod: any = await import("expo-barcode-scanner");
        const Cmp: AnyCmp =
          mod?.BarCodeScanner ??
          mod?.default ??
          (() => null);

        if (mounted) setScannerView(() => Cmp);
      } catch (e) {
        console.warn("barcode-scanner not available, using noop", e);
        if (mounted) setScannerView(() => (() => null));
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!ScannerView) return <View style={{ flex: 1 }} />;

  const handleScan = useCallback(async ({ data }: { data: string }) => {
    const raw = (data || "").trim();
    // 1) Solana Pay
    const sp = parseSolanaPayUrl(raw);
    if (sp) {
      const v = validateSolanaPayData(sp);
      if (!v.ok) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
        Alert.alert("Invalid QR", v.reason);
        return;
      }
      try { await Haptics.selectionAsync(); } catch {}
      router.replace({
        pathname: "/(drawer)/(internal)/send/search",
        params: { to: sp.recipient },
      });
      return;
    }
    // 2) Dirección SOL cruda
    if (isBase58Sol(raw)) {
      try { await Haptics.selectionAsync(); } catch {}
      router.replace({ pathname: "/(drawer)/(internal)/send/search", params: { to: raw } });
      return;
    }
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    Alert.alert("Unsupported QR", "We only support Solana addresses or Solana Pay URIs.");
  }, []);

  // Opcional: no intentes pedir permisos en web/ios si no lo necesitas
  return <ScannerView onBarCodeScanned={handleScan} style={{ flex: 1 }} />;
}