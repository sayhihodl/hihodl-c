// app/(drawer)/(internal)/payments/tx-confirm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import colors from "@/theme/colors";
import { pollSolanaStatus, type TxStatus } from "@/services/solanaTx";

export default function TxConfirmScreen() {
  const { sig, peer, amount, token } = useLocalSearchParams<{
    sig?: string;
    peer?: string;
    amount?: string;
    token?: string;
  }>();

  const signature = String(sig || "");
  const [status, setStatus] = useState<TxStatus>("processed");
  const [ticks, setTicks] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const heading = useMemo(() => {
    if (status === "failed") return "Payment failed";
    if (status === "finalized" || status === "confirmed") return "Payment sent";
    return "Sending payment";
  }, [status]);

  useEffect(() => {
    if (!signature) return;
    let mounted = true;
    const tick = async () => {
      try {
        const s = await pollSolanaStatus(signature);
        if (!mounted) return;
        setStatus(s);
        setTicks((t) => t + 1);
        if (s === "failed") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          clear();
        } else if (s === "confirmed" || s === "finalized") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clear();
        }
      } catch {}
    };
    const loop = () => {
      timerRef.current = setTimeout(async () => {
        await tick();
        loop();
      }, Math.min(3000, 800 + ticks * 200));
    };
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    // start
    tick();
    loop();
    return () => {
      mounted = false;
      clear();
    };
  }, [signature, ticks]);

  const onDone = () => {
    router.back();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{heading}</Text>
        <Text style={styles.subtitle}>
          {peer ? `To ${peer}` : ""}
          {peer && amount ? " • " : ""}
          {amount ? `${amount} ${token ?? ""}` : ""}
        </Text>

        {status === "processed" && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <ActivityIndicator color="#FFB703" />
            <Text style={styles.note}>Waiting for confirmation…</Text>
          </View>
        )}

        {(status === "confirmed" || status === "finalized") && (
          <Text style={[styles.note, { color: "#20d690" }]}>Confirmed on Solana</Text>
        )}

        {status === "failed" && (
          <Text style={[styles.note, { color: "#ff6b6b" }]}>The transaction failed</Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onDone}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          hitSlop={10}
        >
          <Text style={styles.btnTxt}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0E1722", alignItems: "center", justifyContent: "center" },
  card: {
    width: "88%",
    borderRadius: 16,
    padding: 18,
    backgroundColor: "#0A1A24",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#CFE3EC", fontSize: 14, opacity: 0.9 },
  note: { color: "#CFE3EC", fontSize: 13, marginTop: 10 },
  btn: {
    marginTop: 18,
    backgroundColor: "#FFB703",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnTxt: { color: "#0A1A24", fontWeight: "900" },
});


