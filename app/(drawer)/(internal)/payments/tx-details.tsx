import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Share,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import Row from "@/ui/Row";
import { GlassCard } from "@/ui/Glass";
import { legacy as legacyColors, glass as glassColors } from "@/theme/colors";

const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";
const GLASS_BG     = glassColors.cardOnSheet ?? "rgba(3,12,16,0.35)";
const GLASS_BORDER = glassColors.cardBorder  ?? "rgba(255,255,255,0.08)";

type Payment = {
  id: string;
  direction: "in" | "out";             // in = received, out = sent
  token: string;                       // e.g. USDC
  amount: number;                      // positive number
  fiatAmount?: number;                 // optional
  account: "Daily" | "Savings" | "Social";
  counterparty: { name?: string; alias?: string; address?: string };
  status: "confirmed" | "pending" | "failed";
  createdAt: number;                   // ms epoch
  chain: "solana" | "ethereum" | "base" | "polygon" | "bitcoin";
  txHash?: string;
  memo?: string;
  iconEmoji?: string;
};

/** --------- helpers de store segura (no rompe si no existe) --------- */
const getPaymentByIdSafe = (id: string): Payment | undefined => {
  try {
    // @ts-ignore
    const { usePaymentsStore } = require("@/store/payments.store");
    const st = usePaymentsStore.getState?.();
    return st?.byId?.(id) || st?.items?.find?.((p: Payment) => p.id === id);
  } catch {
    return undefined;
  }
};

/** fallback por si no hay store (útil en dev) */
const MOCK: Payment = {
  id: "mock",
  direction: "out",
  token: "USDC",
  amount: 12.99,
  fiatAmount: 12.99,
  account: "Daily",
  counterparty: { name: "Netflix", alias: "@netflix", address: "0x4f7c...f11a" },
  status: "confirmed",
  createdAt: Date.now() - 1000 * 60 * 60 * 2,
  chain: "base",
  txHash: "0x9e8f...d1a2c4",
  memo: "Subscription",
  iconEmoji: "🎬",
};

const fmtMoney = (n?: number) =>
  typeof n === "number" ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

const fmtDateTime = (ts: number) => {
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "—";
  }
};

export default function PaymentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const scrolly = useRef(new Animated.Value(0)).current;

  const payment: Payment = useMemo(() => {
    if (!id) return MOCK;
    return getPaymentByIdSafe(id) ?? { ...MOCK, id };
  }, [id]);

  const sign = payment.direction === "out" ? "-" : "+";
  const title = payment.direction === "out" ? "Payment" : "Received";

  const copy = async (text?: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareTx = async () => {
    const msg = [
      `${title} ${sign}${fmtMoney(payment.amount)} ${payment.token}`,
      `Account: ${payment.account}`,
      `Counterparty: ${payment.counterparty.alias ?? payment.counterparty.name ?? payment.counterparty.address ?? "—"}`,
      `Status: ${payment.status}`,
      `Network: ${String(payment.chain).toUpperCase()}`,
      payment.txHash ? `Tx: ${payment.txHash}` : "",
      payment.memo ? `Memo: ${payment.memo}` : "",
    ].filter(Boolean).join("\n");
    try { await Share.share({ message: msg }); } catch {}
  };

  const openExplorer = () => {
    // delega en router si tienes webview/handler, o lanza Linking
    try {
      // @ts-ignore
      const { Linking } = require("react-native");
      const net = payment.chain;
      const tx = payment.txHash;
      if (!tx) return;
      const url =
        net === "solana" ? `https://solscan.io/tx/${tx}`
        : net === "base" ? `https://basescan.org/tx/${tx}`
        : net === "polygon" ? `https://polygonscan.com/tx/${tx}`
        : net === "ethereum" ? `https://etherscan.io/tx/${tx}`
        : `https://www.blockchain.com/explorer/transactions/${net}/${tx}`;
      Linking.openURL(url);
    } catch {}
  };

  /* ---------------- UI ---------------- */

  const HEADER_H = 68;
  const HEADER_TOPPAD = 14;

  const Left = (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerBtn}
      hitSlop={10}
      accessibilityLabel="Back"
    >
      <Ionicons name="chevron-back" size={22} color={TEXT} />
    </Pressable>
  );

  const Right = (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Pressable onPress={shareTx} style={styles.headerBtn} hitSlop={10} accessibilityLabel="Share">
        <Ionicons name="share-outline" size={18} color={TEXT} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenBg account={payment.account} height={280} />

      <GlassHeader
        scrolly={scrolly}
        height={HEADER_H}
        innerTopPad={HEADER_TOPPAD}
        blurTint="dark"
        leftSlot={Left}
        rightSlot={Right}
        centerSlot={
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        }
        overlayColor="rgba(2,48,71,0.28)"
        showBottomHairline={false}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_H + insets.top + 8, paddingBottom: insets.bottom + 32 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Hero amount */}
        <View style={styles.hero}>
          <Text style={styles.heroAmount}>
            {sign}{fmtMoney(payment.amount)} {payment.token}
          </Text>
          {typeof payment.fiatAmount === "number" && (
            <Text style={styles.heroSub}>≈ ${fmtMoney(payment.fiatAmount)}</Text>
          )}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{payment.account}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Text style={styles.badgeTxt}>{String(payment.chain).toUpperCase()}</Text>
            </View>
            {payment.status !== "confirmed" && (
              <View style={[styles.badge, { backgroundColor: payment.status === "pending" ? "rgba(255,183,3,0.28)" : "rgba(255,107,107,0.28)" }]}>
                <Text style={[styles.badgeTxt, { color: "#fff" }]}>
                  {payment.status === "pending" ? "Pending" : "Failed"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Counterparty */}
        <GlassCard style={[styles.card, { paddingVertical: 14 }]}>
          <Row
            leftSlot={
              <View style={styles.avatar}>
                <Text style={{ color: "#9CC6D1", fontSize: 18 }}>{payment.iconEmoji ?? "💸"}</Text>
              </View>
            }
            labelNode={
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {payment.counterparty.name ?? payment.counterparty.alias ?? "Counterparty"}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {payment.counterparty.alias ?? payment.counterparty.address ?? ""}
                </Text>
              </View>
            }
            rightIcon={null}
          />
        </GlassCard>

        {/* Details */}
        <GlassCard style={styles.card}>
          <Row
            leftSlot={<Text style={styles.rowTitle}>Status</Text>}
            value={<Text style={styles.rowValue}>
              {payment.status === "confirmed" ? "Confirmed" : payment.status === "pending" ? "Pending" : "Failed"}
            </Text>}
            rightIcon={null}
          />
          <View style={styles.sep} />
          <Row
            leftSlot={<Text style={styles.rowTitle}>Date</Text>}
            value={<Text style={styles.rowValue}>{fmtDateTime(payment.createdAt)}</Text>}
            rightIcon={null}
          />
          <View style={styles.sep} />
          <Row
            leftSlot={<Text style={styles.rowTitle}>Network</Text>}
            value={<Text style={styles.rowValue}>{String(payment.chain).toUpperCase()}</Text>}
            rightIcon={null}
          />
          {!!payment.txHash && (
            <>
              <View style={styles.sep} />
              <Row
                leftSlot={<Text style={styles.rowTitle}>Transaction</Text>}
                value={
                  <Pressable onPress={() => copy(payment.txHash)}>
                    <Text style={[styles.rowValue, { textDecorationLine: "underline" }]}>
                      {Platform.select({
                        ios: `${payment.txHash.slice(0, 10)}…${payment.txHash.slice(-8)}`,
                        android: `${payment.txHash.slice(0, 12)}…${payment.txHash.slice(-10)}`,
                        default: payment.txHash,
                      })}
                    </Text>
                  </Pressable>
                }
                rightIcon="open-outline"
                onPress={openExplorer}
              />
            </>
          )}
          {!!payment.memo && (
            <>
              <View style={styles.sep} />
              <Row
                leftSlot={<Text style={styles.rowTitle}>Memo</Text>}
                value={<Text style={styles.rowValue}>{payment.memo}</Text>}
                rightIcon={null}
              />
            </>
          )}
        </GlassCard>

        {/* Actions */}
        <GlassCard style={[styles.card, { paddingVertical: 12 }]}>
          <Row
            icon="share-outline"
            label="Share receipt"
            rightIcon={null}
            onPress={shareTx}
          />
          {!!payment.txHash && (
            <>
              <View style={styles.sep} />
              <Row
                icon="open-outline"
                label="View on explorer"
                rightIcon={null}
                onPress={openExplorer}
              />
            </>
          )}
          {!!payment.counterparty.address && (
            <>
              <View style={styles.sep} />
              <Row
                icon="copy-outline"
                label="Copy address"
                rightIcon={null}
                onPress={() => copy(payment.counterparty.address)}
              />
            </>
          )}
        </GlassCard>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: "900", textAlign: "center" },

  hero: { alignItems: "center", paddingHorizontal: 16, marginBottom: 8 },
  heroAmount: { color: TEXT, fontSize: 28, fontWeight: "900" },
  heroSub: { color: SUB, marginTop: 6, fontSize: 13 },
  badges: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  badgeTxt: { color: "#E7F1F5", fontSize: 12, fontWeight: "800" },

  card: {
    backgroundColor: GLASS_BG,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },

  avatar: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  name: { color: TEXT, fontSize: 16, fontWeight: "800" },
  sub: { color: SUB, fontSize: 12, marginTop: 2 },

  rowTitle: { color: TEXT, fontSize: 14, fontWeight: "800" },
  rowValue: { color: SUB, fontSize: 13, fontWeight: "700" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: GLASS_BORDER, marginVertical: 8 },
});