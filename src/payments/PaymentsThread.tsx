// src/payments/PaymentsThread.tsx
import React, { useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import {
  renderTokenIcon,
  renderChainBadge,
  mapChainKeyToChainId,
} from "@/config/iconRegistry";

// Store
import { usePaymentsStore } from "@/store/payments";

/* =========================================================================
   Types
   ======================================================================== */
type ChainKeyUi = "Solana" | "Base" | "Ethereum" | "Polygon" | string;

type MsgBase = {
  id: string;
  threadId: string;
  ts: number;
  status: "pending" | "confirmed" | "failed" | "canceled"; // US spelling
  toDisplay?: string;
};

type TxMsg = MsgBase & {
  kind: "tx";
  direction: "out" | "in";
  tokenId: string; // "USDC.circle"
  chain: string; // "solana" | "base" | ...
  amount: number;
  txHash?: string;
};

type RequestMsg = MsgBase & {
  kind: "request";
  tokenId: string;
  chain: string;
  amount: number;
  meta?: { requestId?: string };
};

type AnyMsg = TxMsg | RequestMsg;

/* =========================================================================
   Const / UI tuning
   ======================================================================== */
const BG = "#0D1820";
const BUBBLE_MAX_PCT = 0.72;
const BUBBLE_MIN_W = 220;

const FOOTER_H = 64;
const FOOTER_TOP_GAP = 8;
const SEPARATOR_ALPHA = 0.1;
const CTA_H = 44;
const LINE_GAP = 8;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<any>);

// Fallback estable para el selector de Zustand
const EMPTY_LIST: AnyMsg[] = [];

/* =========================================================================
   Safe helpers (lowercase + locale)
   ======================================================================== */
const lc = (s?: string) => (typeof s === "string" ? s.toLowerCase() : "");
const safeLocale = () => {
  try {
    // Usa el locale real si hay Intl disponible, si no, fallback estable
    // (algunos entornos RN/Android tienen polyfill parcial y fallan con undefined)
    const l =
      (typeof Intl !== "undefined" &&
        typeof Intl.DateTimeFormat === "function" &&
        new Intl.DateTimeFormat().resolvedOptions().locale) ||
      undefined;
    return l || "en-US";
  } catch {
    return "en-US";
  }
};


const fmtAmount = (n?: number, max = 6) => {
  const v = Number(n);
  return Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: max })
    : "0";
};

/* =========================================================================
   Helpers
   ======================================================================== */
function dayLabelFromEpoch(ms: number | undefined) {
  if (!ms) return "Hoy";
  const d = new Date(ms);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return d.toLocaleDateString(safeLocale(), { day: "2-digit", month: "short" });
}
function isFirstOfDay(list: AnyMsg[], idx: number) {
  if (idx === 0) return true;
  return dayLabelFromEpoch(list[idx].ts) !== dayLabelFromEpoch(list[idx - 1].ts);
}
function chainIdFromStr(chain?: string) {
  // 🔒 evitar `.toLowerCase()` sobre undefined y dar un default estable
  const key = lc(chain) || "sol"; // cámbialo si tu red base es otra
  return mapChainKeyToChainId(key as any);
}
function tokenTickerFromId(tokenId?: string) {
  const base = (tokenId || "usdc").split(".")[0] || "usdc";
  return base.toUpperCase();
}
function avatarNode(avatar?: string, fallbackEmoji: string = "👤") {
  if (avatar?.startsWith?.("emoji:")) {
    const e = avatar.split(":")[1] || fallbackEmoji;
    return (
      <View style={[styles.avatar, styles.avatarCircle]}>
        <Text style={{ fontSize: 16 }}>{e}</Text>
      </View>
    );
  }
  if (avatar) return <Image source={{ uri: String(avatar) }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarCircle]}>
      <Text style={{ fontSize: 16 }}>{fallbackEmoji}</Text>
    </View>
  );
}
function fmtTime(ms?: number) {
  if (!ms) return "";
  const d = new Date(ms);
  // 🔒 mismo motivo que arriba: evitar locale undefined
  return d.toLocaleTimeString(safeLocale(), { hour: "2-digit", minute: "2-digit" });
}
function statusBadgeText(s: AnyMsg["status"] | "cancelled") {
  // tolerante a UK spelling por compat visual
  switch (s) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "failed":
      return "Failed";
    case "canceled":
    case "cancelled":
      return "Cancelled";
    default:
      return String(s);
  }
}

/* =========================================================================
   Component
   ======================================================================== */
export default function PaymentsThread() {
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const { id, name = "@user", alias = "@user", avatar, emoji } =
    useLocalSearchParams<{ id?: string; name?: string; alias?: string; avatar?: string; emoji?: string }>();

  // thread id
  const threadId = useMemo(() => {
    if (id) return String(id);
    const handle = String(alias || name).replace(/^@/, "");
    return `peer:${handle}`;
  }, [id, alias, name]);

  const HEADER_H = insets.top + 6 + 54;
  const lineTop = FOOTER_H - CTA_H - (insets.bottom + 14) - LINE_GAP;

  // === Selector ESTABLE leyendo el mapa crudo del store ===
  const rawItems = usePaymentsStore(
  useCallback(
    (s: any) =>
      (s.byThread && s.byThread[threadId]
        ? (s.byThread[threadId] as AnyMsg[])
        : EMPTY_LIST),
    [threadId]
  )
);

  // Ordena FUERA del selector (no rompe el cache)
  const items = useMemo(
    () => [...rawItems].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)),
    [rawItems]
  );

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

      {/* Header */}
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
            {avatarNode(emoji ? `emoji:${emoji}` : avatar)}
            <Text style={styles.name} numberOfLines={1}>
              {alias || name}
            </Text>
          </View>
        }
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* LISTA */}
      <AnimatedFlatList
        data={items}
        keyExtractor={(i: AnyMsg) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_H + 8,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + FOOTER_H + FOOTER_TOP_GAP + 12,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          const isOut = item.kind === "tx" ? item.direction === "out" : false;
          const chainId = chainIdFromStr(item.chain);
          const tokenTicker = tokenTickerFromId(item.tokenId);
          const showDay = isFirstOfDay(items, index);
          const maxW = Math.max(BUBBLE_MIN_W, width * BUBBLE_MAX_PCT);
          const amountNum = Number(item.amount ?? 0);

          const onPressTx = () => {
            if (item.kind !== "tx") return;
            router.push({
              pathname: "/(drawer)/(internal)/payments/tx-details",
              params: {
                id: item.id,
                dir: item.direction,
                token: tokenTicker,
                amount: String(amountNum),
                status: item.status,
                dateISO: String(item.ts || ""),
                time: fmtTime(item.ts),
                chain: item.chain as ChainKeyUi,
                txHash: (item as TxMsg).txHash ?? "",
                name: alias || name,
                handle: alias || name,
              },
            });
          };

          const onPayRequest = () => {
            if (item.kind !== "request") return;
            router.push({
              pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
              params: {
                to: alias || name,
                avatar,
                amount: String(amountNum),
                tokenId: item.tokenId,
                chain: item.chain,
                intent: "pay_request",
                requestId: (item as RequestMsg).meta?.requestId ?? "",
              },
            });
          };

          const onDeclineRequest = () => {
            if (item.kind !== "request") return;
            usePaymentsStore.getState().updateMsg(item.id, { status: "canceled" });
          };

          return (
            <View>
              {showDay && (
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                  <Text style={styles.dayLabel}>{dayLabelFromEpoch(item.ts)}</Text>
                </View>
              )}

              <View style={[styles.bubbleWrap, isOut ? styles.alignRight : styles.alignLeft]}>
                <Pressable
                  onPress={item.kind === "tx" ? onPressTx : undefined}
                  style={[
                    styles.bubble,
                    item.kind === "tx"
                      ? isOut
                        ? styles.bubbleOut
                        : styles.bubbleIn
                      : styles.bubbleRequest,
                    { maxWidth: maxW },
                  ]}
                >
                  {item.kind === "tx" ? (
                    <View style={styles.rowBubble}>
                      <View style={styles.leftInline}>
                        <Text style={styles.amountSign}>{isOut ? "–" : "+"}</Text>
                        <Text style={styles.amountNum}>
                          {fmtAmount(amountNum, 6)}
                        </Text>
                        <Text style={styles.amountTicker}>{tokenTicker}</Text>
                      </View>

                      <View style={styles.tokenIconSlot}>
                        {renderTokenIcon(item.tokenId, { size: 32, inner: 24, withCircle: true })}
                        <View style={styles.chainMiniOnToken}>
                          {renderChainBadge(chainId, { size: 16, chip: true, chipPadding: 3 })}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      <View style={[styles.rowBubble, { justifyContent: "flex-start" }]}>
                        <View style={styles.tokenIconSlot}>
                          {renderTokenIcon(item.tokenId, { size: 32, inner: 24, withCircle: true })}
                          <View style={styles.chainMiniOnToken}>
                            {renderChainBadge(chainId, { size: 16, chip: true, chipPadding: 3 })}
                          </View>
                        </View>
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.reqTitle}>Payment request</Text>
                      <Text style={styles.reqAmount}>
                        {fmtAmount(amountNum, 6)} {tokenTicker}
                      </Text>
                    </View>
                      </View>

                      <View style={styles.reqActionsRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <StatusPill status={item.status} />
                        </View>

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Pressable
                            onPress={onDeclineRequest}
                            disabled={item.status !== "pending"}
                            style={[
                              styles.reqBtn,
                              { backgroundColor: "rgba(255,255,255,0.06)" },
                              item.status !== "pending" && { opacity: 0.5 },
                            ]}
                          >
                            <Text style={[styles.reqBtnTxt, { color: "#D8E5EC" }]}>Decline</Text>
                          </Pressable>

                          <Pressable
                            onPress={onPayRequest}
                            disabled={item.status !== "pending"}
                            style={[
                              styles.reqBtn,
                              { backgroundColor: "#FFB703" },
                              item.status !== "pending" && { opacity: 0.5 },
                            ]}
                          >
                            <Text style={[styles.reqBtnTxt, { color: "#0A1A24" }]}>Pay</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>

              <View
                style={[
                  styles.metaWrap,
                  {
                    alignSelf: isOut ? "flex-end" : "flex-start",
                    maxWidth: Math.max(BUBBLE_MIN_W, width * BUBBLE_MAX_PCT),
                  },
                ]}
              >
                <Text style={styles.metaTime}>{fmtTime(item.ts)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: HEADER_H + 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>No messages yet</Text>
          </View>
        }
      />

      {/* FOOTER / CTAs */}
      <View
        style={[
          styles.footer,
          {
            height: FOOTER_H,
            paddingBottom: insets.bottom + 14,
            borderTopWidth: 0,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.max(0, lineTop),
            height: StyleSheet.hairlineWidth,
            backgroundColor: `rgba(255,255,255,${SEPARATOR_ALPHA})`,
          }}
        />

        <View style={{ flex: 1 }}>
          <CTAButton
            title="Request"
            onPress={() =>
              router.push({
                pathname: "/(drawer)/(internal)/payments/QuickRequestScreen",
                params: { to: alias || name, avatar },
              })
            }
            variant="secondary"
            tone="dark"
            backdrop="solid"
            size="md"
            fullWidth
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <CTAButton
            title="Send"
            onPress={() =>
              router.push({
                pathname: "/(drawer)/(internal)/payments/QuickSendScreen",
                params: { to: alias || name, avatar },
              })
            }
            variant="primary"
            backdrop="solid"
            color="#C8D2D9"
            labelColor="#0A1A24"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

/* =========================================================================
   UI auxiliares
   ======================================================================== */
function StatusPill({ status }: { status: AnyMsg["status"] | "cancelled" }) {
  const label = statusBadgeText(status);
  const bg =
    status === "pending"
      ? "rgba(255,255,255,0.08)"
      : status === "confirmed"
      ? "rgba(46, 204, 113, 0.18)"
      : status === "failed"
      ? "rgba(231, 76, 60, 0.18)"
      : "rgba(149, 165, 166, 0.18)";
  const color =
    status === "pending"
      ? "#CFE3EC"
      : status === "confirmed"
      ? "#2ECC71"
      : status === "failed"
      ? "#E74C3C"
      : "#C8D2D9";
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg }}>
      <Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/* =========================================================================
   Styles
   ======================================================================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  contactInfo: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 220 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarCircle: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  name: { color: "#fff", fontWeight: "700", fontSize: 15 },

  dayLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "600" },

  bubbleWrap: { width: "100%", marginVertical: 6 },
  alignLeft: { alignItems: "flex-start" },
  alignRight: { alignItems: "flex-end" },

  bubble: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
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
  bubbleRequest: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },

  rowBubble: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },

  leftInline: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  amountSign: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  amountNum: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  amountTicker: { color: "#fff", fontWeight: "800", fontSize: 13, opacity: 0.9, paddingTop: 1 },

  tokenIconSlot: { width: 36, height: 36, alignItems: "center", justifyContent: "center", position: "relative" },
  chainMiniOnToken: { position: "absolute", right: -4, bottom: -6 },

  reqTitle: { color: "#CFE3EC", fontWeight: "800", fontSize: 12, opacity: 0.9 },
  reqAmount: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
  reqActionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  reqBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  reqBtnTxt: { fontWeight: "900", fontSize: 13 },

  metaWrap: { marginTop: 6, alignItems: "flex-end" },
  metaTime: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "600" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "rgba(6,14,20,0.02)",
    flexDirection: "row",
    alignItems: "center",
  },
});