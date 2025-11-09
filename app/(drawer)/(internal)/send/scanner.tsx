// app/(drawer)/(tabs)/send/scanner.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Alert, Platform, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { parseSolanaPayUrl, isBase58Sol, validateSolanaPayData } from "@/lib/solanaPay";
import { parseRecipient, isSendableAddress } from "@/send/parseRecipient";
import { parsePIXQR, validatePIXData, isPIXQR } from "@/lib/pix";
import { parseMercadoPagoQR, validateMercadoPagoData, isMercadoPagoQR } from "@/lib/mercadoPago";

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
    
    // 1) Solana Pay (prioridad: URLs especiales de Solana Pay)
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

    // 2) PIX (Brasil) - formato EMV
    if (isPIXQR(raw)) {
      const pixData = parsePIXQR(raw);
      if (pixData) {
        const v = validatePIXData(pixData);
        if (!v.ok) {
          try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
          Alert.alert("Invalid PIX QR", v.reason);
          return;
        }
        try { await Haptics.selectionAsync(); } catch {}
        // Navegar al flujo de pago PIX
        router.push({
          pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
          params: {
            kind: "pix",
            pixKey: pixData.pixKey || pixData.merchantAccountInfo || "",
            amount: pixData.amount || "",
            merchantName: pixData.merchantName || "",
            description: pixData.description || "",
            currency: pixData.currency || "BRL",
          },
        });
        return;
      }
    }

    // 3) Mercado Pago - formato EMV o URL
    if (isMercadoPagoQR(raw)) {
      const mpData = parseMercadoPagoQR(raw);
      if (mpData) {
        const v = validateMercadoPagoData(mpData);
        if (!v.ok) {
          try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
          Alert.alert("Invalid Mercado Pago QR", v.reason);
          return;
        }
        try { await Haptics.selectionAsync(); } catch {}
        // Navegar al flujo de pago Mercado Pago
        router.push({
          pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
          params: {
            kind: "mercado_pago",
            mercadoPagoId: mpData.mercadoPagoId || "",
            amount: mpData.amount || "",
            merchantName: mpData.merchantName || "",
            description: mpData.description || "",
            currency: mpData.currency || "",
            reference: mpData.reference || "",
          },
        });
        return;
      }
    }

    // 4) Detectar cualquier dirección sendable (EVM, SOL, IBAN, card, HiHODL, etc.)
    if (isSendableAddress(raw)) {
      const parsed = parseRecipient(raw);
      if (!parsed) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
        Alert.alert("Invalid QR", "Could not parse the scanned data.");
        return;
      }

      try { await Haptics.selectionAsync(); } catch {}

      // Para card numbers: navegar al flujo de card payment
      if (parsed.kind === "phone" && /^\d{13,19}$/.test(raw.replace(/[\s-]/g, ""))) {
        router.push({
          pathname: "/(internal)/send",
          params: {
            kind: "card",
            to: parsed.toRaw,
          },
        });
        return;
      }

      // Para wallets, usuarios HiHODL e IBAN: navegar a token-select
      let toChain = parsed.toChain || parsed.resolved?.chain;
      if (parsed.kind === "evm") {
        toChain = toChain || "ethereum";
      }

      const addr = parsed.resolved?.address ?? parsed.toRaw;
      router.push({
        pathname: "/(drawer)/(tabs)/send/token-select",
        params: {
          toType: parsed.kind,
          toRaw: parsed.toRaw,
          display: addr,
          ...(toChain ? { chain: toChain } : {}),
          ...(parsed.resolved?.address ? { resolved: parsed.resolved.address } : {}),
        } as any,
      });
      return;
    }

    // 5) Fallback: Dirección SOL cruda (por compatibilidad)
    if (isBase58Sol(raw)) {
      try { await Haptics.selectionAsync(); } catch {}
      router.replace({ pathname: "/(drawer)/(internal)/send/search", params: { to: raw } });
      return;
    }

    // No reconocido
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    Alert.alert(
      "Unsupported QR", 
      "We support Solana Pay, PIX, Mercado Pago, wallet addresses (EVM/Solana), IBAN, card numbers, and HiHODL usernames."
    );
  }, []);

  // Opcional: no intentes pedir permisos en web/ios si no lo necesitas
  return <ScannerView onBarCodeScanned={handleScan} style={{ flex: 1 }} />;
}