import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Image, Animated, FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import CTAButton from "@/ui/CTAButton";

const BG = "#0D1820";
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<any>);

// ✅ tipos y mock locales
type Tx = {
  id: string;
  direction: "out" | "in";
  token: string;
  amount: number;
  fiat: string;
  timestamp: string;
  chain: "Solana" | "Base" | "Ethereum";
  status: "confirmed" | "pending" | "failed";
};

const MOCK_TXS: Tx[] = [
  { id: "1", direction: "out", token: "USDC", amount: 12.99, fiat: "$12.99", timestamp: "08:40", chain: "Solana",  status: "confirmed" },
  { id: "2", direction: "in",  token: "USDT", amount: 15.00, fiat: "$15.00", timestamp: "21:17", chain: "Base",    status: "confirmed" },
  { id: "3", direction: "out", token: "USDT", amount: 4.20,  fiat: "$4.20",  timestamp: "16:03", chain: "Ethereum", status: "pending"   },
];

export default function PaymentsThread() {
  const { t } = useTranslation(["payments"]);
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<Tx | null>(null);

  const { name = "@helloalex", alias = "@helloalex", avatar } =
    useLocalSearchParams<{ id?: string; name?: string; alias?: string; avatar?: string }>();

  const HEADER_H = insets.top + 6 + 54;

  // 👉 Lanza el flujo de Send en Internal con el destinatario
  const startSendFlow = (mode: "send" | "request") => {
    const to = String(alias || name || "").trim();
    router.push({
      pathname: "/(internal)/send",
      params: { to, mode },
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={54}
        innerTopPad={6}
        sideWidth={60}
        centerWidthPct={60}
        leftSlot={
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <View style={styles.contactInfo}>
            {avatar ? (
              <Image source={{ uri: String(avatar) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" }]}>
                <Text style={{ color: "#9CC6D1", fontWeight: "900" }}>
                  {String(name).slice(0,1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>{alias || name}</Text>
          </View>
        }
        rightSlot={
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Scanner solo en header */}
            <Pressable hitSlop={10} onPress={() => router.push("/scanner")}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => { /* menú del contacto */ }}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </Pressable>
          </View>
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* LISTA “burbujas” scrollable */}
      <AnimatedFlatList
        data={MOCK_TXS}
        keyExtractor={(i: Tx) => i.id}
        contentContainerStyle={{
          paddingTop: HEADER_H + 8,
          paddingHorizontal: 16,
          // más aire para que no “pegue” con el footer (baja la línea óptica)
          paddingBottom: insets.bottom + 140,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleWrap,
              item.direction === "out" ? styles.alignRight : styles.alignLeft,
            ]}
          >
            <Pressable
              onPress={() => setSelected(item)}
              style={[
                styles.bubble,
                item.direction === "out" ? styles.bubbleOut : styles.bubbleIn,
              ]}
            >
              <View style={styles.bubbleRow}>
                <Ionicons
                  name={item.direction === "out" ? "arrow-up" : "arrow-down"}
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.amount}>
                  {item.direction === "out" ? "–" : "+"}
                  {item.amount} {item.token}
                </Text>
              </View>

              <View style={styles.bubbleFooter}>
                <Text style={styles.sub}>{item.fiat}</Text>
              </View>
            </Pressable>
          </View>
        )}
      />

      {/* BARRA INFERIOR FIJA (no scroll) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={{ flex: 1 }}>
          <CTAButton
            title={t("payments:actions.request", "Request")}
            onPress={() => startSendFlow("request")}
            variant="secondary"
            tone="dark"
            backdrop="solid"     // azul oscuro sólido
            size="md"            // 44px de alto
            fullWidth
          />
        </View>

        <View style={{ width: 10 }} />

        <View style={{ flex: 1 }}>
          <CTAButton
            title={t("payments:actions.send", "Send")}
            onPress={() => startSendFlow("send")}
            variant="primary"
            backdrop="solid"
            color="#C8D2D9"      // plateado
            labelColor="#0A1A24" // texto oscuro
            size="md"            // 44px de alto
            fullWidth
          />
        </View>
      </View>

      {/* Sheet de detalle de tx */}
      <BottomKeyboardModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        minHeightPct={0.45}
        maxHeightPct={0.65}
        blurIntensity={70}
        tone="ink"
        showHandle
        ignoreKeyboard
      >
        {selected && (
          <View style={styles.sheetWrap}>
            <Text style={styles.txTitle}>
              {selected.direction === "out" ? t("payments:sent", "You sent") : t("payments:received", "You received")}
            </Text>
            <Text style={styles.txAmount}>{selected.amount} {selected.token}</Text>
            {/* añade aquí más filas si quieres */}
          </View>
        )}
      </BottomKeyboardModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  contactInfo: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 220 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  name: { color: "#fff", fontWeight: "700", fontSize: 15 },

  bubbleWrap: { width: "100%", marginVertical: 6 },
  alignLeft: { alignItems: "flex-start" },
  alignRight: { alignItems: "flex-end" },

  bubble: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, maxWidth: "80%" },
  bubbleIn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleOut: {
    backgroundColor: "rgba(255, 183, 3, 0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  amount: { color: "#fff", fontWeight: "800", fontSize: 15 },
  bubbleFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  sub: { color: "rgba(255,255,255,0.65)", fontSize: 12 },

  // Footer fijo
  footer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

  // Sheet
  sheetWrap: { gap: 12 },
  txTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  txAmount: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 6 },
});