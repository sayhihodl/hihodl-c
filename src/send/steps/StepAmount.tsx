// src/send/steps/StepAmount.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Animated, Keyboard, Platform, InputAccessoryView, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileStore } from "@/store/profile";

import GlassHeader from "@/ui/GlassHeader";
import { legacy, glass } from "@/theme/colors";
import { useSendFlow } from "@/send/SendFlowProvider";
import type { ChainKey } from "@/send/types";
import CTAButton from "@/ui/CTAButton";

/** ===== theme ===== */
const { TEXT, SUB } = legacy;
const GLASS_BORDER = glass.cardBorder;

/** ===== layout knob ===== */
const AMOUNT_Y_OFFSET = -150;

/** ===== money rules ===== */
const MAX_PER_TX = 99_999_999;

/** ===== utils ===== */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const floorTo = (n: number, dps: number) => Math.floor(n * Math.pow(10, dps)) / Math.pow(10, dps);
const fmt = (n: number, dps = 2) =>
  isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: dps }) : "0";

/** Tamaño dinámico estilo Revolut */
const fontForAmount = (valStr: string) => {
  const plain = (valStr || "0").replace(/[^\d]/g, "");
  const len = plain.length;
  if (len <= 4)  return 54;
  if (len <= 6)  return 48;
  if (len <= 8)  return 42;
  if (len <= 10) return 36;
  if (len <= 12) return 32;
  if (len <= 14) return 28;
  if (len <= 16) return 24;
  if (len <= 18) return 22;
  return 20;
};

type Mode = "token" | "fiat";

export default function StepAmount() {
  useSafeAreaInsets(); // reservado si lo necesitas luego
  const { state, patch, goTo } = useSendFlow();
  const profileAvatar = useProfileStore((s) => s.avatar);

  // ------ flow data ------
  const tokenSymbol = (state.tokenId || "USDC").toUpperCase().replace(".CIRCLE", "");
  const recipientTitle = state.toDisplay ?? state.label ?? state.toRaw ?? "Recipient";
  const _chain = (state.chain as ChainKey | undefined) ?? "solana";
  const avatarUrl = (state as any)?.avatarUrl as string | undefined;

  // ------ fees/balance (mock seguros; cambia por tus feeds) ------
  const priceUsdPerToken = 1;
  const nativeToUsd = 150;
  const feeNativeEst = 0.0003;
  const feeInToken = priceUsdPerToken > 0 ? (feeNativeEst * nativeToUsd) / priceUsdPerToken : 0;
  const balanceToken = Number((state as any).balanceToken ?? 0);

  const [mode, setMode] = useState<Mode>("token");
  const [amountStr, setAmountStr] = useState<string>(String(state.amount ?? ""));
  const amountNum = useMemo(() => {
    const v = Number((amountStr || "0").replace(",", "."));
    return isFinite(v) ? v : 0;
  }, [amountStr]);

  const maxSendable = useMemo(
    () => clamp(floorTo(balanceToken - (feeInToken || 0), 6), 0, 1e12),
    [balanceToken, feeInToken]
  );

  const validAmount = amountNum > 0 && amountNum <= maxSendable && amountNum <= MAX_PER_TX;
  const canSend = validAmount;
  const hasInput = amountNum > 0;

  const toFiat   = useCallback((tkn: number)  => tkn * priceUsdPerToken, [priceUsdPerToken]);
  const fromFiat = useCallback((fiat: number) => (priceUsdPerToken ? fiat / priceUsdPerToken : 0), [priceUsdPerToken]);

  // ------ input & focus ------
  const inputRef = useRef<TextInput>(null);
  const accessoryID = "send-amount-accessory";

  useEffect(() => { requestAnimationFrame(() => inputRef.current?.focus?.()); }, []);
  const focusAmount = useCallback(() => inputRef.current?.focus?.(), []);

  // ------ Android accessory ------
  const [kbH, setKbH] = useState(0);
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS === "ios") return;
    const sh = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbOpen(true);
      setKbH(e.endCoordinates?.height ?? 0);
    });
    const hd = Keyboard.addListener("keyboardDidHide", () => {
      setKbOpen(false);
      setKbH(0);
    });
    return () => { sh.remove(); hd.remove(); };
  }, []);

  // ------ handlers ------
  const onBack = () => goTo("token");
  const onNext = () => {
    if (!canSend) return;
    patch({ amount: amountStr });
    goTo("confirm");
  };
  const onToggleMode = () => setMode(m => (m === "token" ? "fiat" : "token"));

  const applyChip = (v: number, isMax = false) => {
    const base = isMax ? Math.min(maxSendable, MAX_PER_TX) : v;
    const asToken = mode === "token" ? base : fromFiat(base);
    setAmountStr(String(floorTo(asToken, 6)));
    requestAnimationFrame(() => inputRef.current?.focus?.());
  };

  const chips = [10, 20, 50, 100];

  const warnMsg =
    amountNum > MAX_PER_TX
      ? `Maximum is ${fmt(MAX_PER_TX, 0)} ${tokenSymbol}`
      : amountNum > maxSendable
      ? "Insufficient balance"
      : "";

  const HEADER_H = 48;

  return (
    // Tap en cualquier parte → cerrar teclado
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false} android_disableSound>
      <GlassHeader
        scrolly={new Animated.Value(0)}
        height={HEADER_H}
        innerTopPad={6}
        solidColor="transparent"
        // más espacio “aire” en los lados
        contentStyle={{ paddingHorizontal: 12 }}
        leftSlot={
          <Pressable onPress={onBack} hitSlop={10} style={styles.headerIconBtnBare} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
        }
        rightSlot={
          <View style={styles.headerRightAvatar} accessible accessibilityLabel="Profile avatar">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarEmojiWrap}>
                <Text style={styles.avatarEmojiTxt}>{profileAvatar ?? "🙂"}</Text>
              </View>
            )}
          </View>
        }
        centerSlot={
          <Pressable
            onPress={() => goTo("search")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Change recipient"
            style={styles.centerTitleTap}
          >
            <Text style={styles.centerTitleTxt} numberOfLines={1} ellipsizeMode="middle">
              {recipientTitle?.startsWith("@") ? recipientTitle : `@${recipientTitle}`}
            </Text>
            <Ionicons name="chevron-down" size={14} color={TEXT} />
          </Pressable>
        }
      />

      {/* Cantidad */}
      <Pressable
        style={[styles.centerArea, { transform: [{ translateY: AMOUNT_Y_OFFSET }] }]}
        onPress={(e) => { e.stopPropagation(); focusAmount(); }}
        accessibilityLabel="Focus amount"
      >
        <TextInput
          ref={inputRef}
          value={amountStr}
          onChangeText={(t) => {
            // Sanitiza a 6 decimales + clamp MAX_PER_TX
            const clean = t.replace(/[^\d.,]/g, "").replace(",", ".");
            const parts = clean.split(".");
            const norm = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 6)}` : parts[0];
            const asNum = Number(norm || "0");
            const clamped = isFinite(asNum) ? Math.min(asNum, MAX_PER_TX) : 0;
            setAmountStr(String(clamp(floorTo(clamped, 6), 0, MAX_PER_TX)));
          }}
          keyboardType={Platform.select({ ios: "decimal-pad", android: "decimal-pad" }) as any}
          style={styles.hiddenInput}
          accessibilityLabel="Amount input"
          {...(Platform.OS === "ios" ? { inputAccessoryViewID: accessoryID } : {})}
        />

        {(() => {
          const dyn = fontForAmount(amountStr);
          return (
            <View style={styles.amountLine}>
              <Text style={[styles.amountBig, { fontSize: dyn }]}>{fmt(amountNum, 6)}</Text>
              <Text style={[styles.amountUnit, { fontSize: Math.max(24, dyn - 18) }]}>
                {" "}{tokenSymbol}
              </Text>
              <Pressable
                onPress={(e) => { e.stopPropagation(); onToggleMode(); }}
                hitSlop={10}
                style={styles.swapBtn}
                accessibilityLabel="Toggle fiat/token"
              >
                <Ionicons name="swap-vertical" size={18} color={SUB} />
              </Pressable>
            </View>
          );
        })()}

        <Text style={styles.subConvert}>
          {mode === "token" ? `≈ $${fmt(toFiat(amountNum), 2)}` : `${fmt(fromFiat(amountNum), 4)} ${tokenSymbol}`}
        </Text>

        {!!warnMsg && <Text style={styles.warning}>{warnMsg}</Text>}

        <View style={styles.availInline}>
          <Text style={styles.availLabel}>Available to send</Text>
          <Text style={styles.availValue}>{fmt(balanceToken, 6)} {tokenSymbol}</Text>
        </View>
      </Pressable>

      {/* Accessory con CTA + chips */}
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={accessoryID}>
          <View style={styles.accessoryBar}>
            <CTAButton
              title="Next"
              onPress={onNext}
              variant="secondary"
              tone="light"
              backdrop="blur"
              fullWidth
              // Visual: activo si hay input, aunque siga disabled si no es válido
              style={{ marginBottom: 10, opacity: hasInput ? 1 : 0.5 }}
              disabled={!canSend}
              labelColor="#FFFFFF"
            />
            <View style={styles.chipsRow}>
              {[10, 20, 50, 100].map((v, i) => (
                <Pressable key={v} style={[styles.chip, i === 0 && styles.firstChip]} onPress={() => applyChip(v)}>
                  <Text style={styles.chipTxt}>{v}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.chip, styles.lastChip]} onPress={() => applyChip(0, true)}>
                <Text style={styles.chipTxt}>MAX</Text>
              </Pressable>
            </View>
          </View>
        </InputAccessoryView>
      ) : (
        kbOpen && (
          <View style={[styles.accessoryBarAndroid, { bottom: kbH }]}>
            <CTAButton
              title="Next"
              onPress={onNext}
              variant="secondary"
              tone="light"
              backdrop="blur"
              fullWidth
              style={{ marginBottom: 10, opacity: hasInput ? 1 : 0.5 }}
              disabled={!canSend}
              labelColor="#FFFFFF"
            />
            <View style={styles.chipsRow}>
              {[10, 20, 50, 100].map((v, i) => (
                <Pressable key={v} style={[styles.chip, i === 0 && styles.firstChip]} onPress={() => applyChip(v)}>
                  <Text style={styles.chipTxt}>{v}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.chip, styles.lastChip]} onPress={() => applyChip(0, true)}>
                <Text style={styles.chipTxt}>MAX</Text>
              </Pressable>
            </View>
          </View>
        )
      )}
    </Pressable>
  );
}

/* ================= styles ================= */
const AVATAR = 28;
const styles = StyleSheet.create({
  headerIconBtnBare: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },

  centerTitleTap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "70%",
    height: 28,
  },
  centerTitleTxt: { color: TEXT, fontSize: 18, fontWeight: "600" },

  // Avatar derecha como dashboard, pegado al borde
  headerRightAvatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: -2,
  },
  avatarImg: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  avatarEmojiWrap: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    backgroundColor: "#7CC2D1", alignItems: "center", justifyContent: "center",
  },
  avatarEmojiTxt: { fontSize: 18, lineHeight: 22, textAlign: "center", color: "#081217", fontWeight: "900" },

  centerArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },

  amountLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  amountBig: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },
  amountUnit: { color: "#fff", fontWeight: "800" },
  swapBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },

  subConvert: { color: SUB, fontSize: 14, marginTop: 8 },
  warning: { color: "#FF6363", fontSize: 14, marginTop: 10, fontWeight: "700" },

  availInline: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  availLabel: { color: SUB, fontSize: 12, fontWeight: "700" },
  availValue: { color: "#fff", fontSize: 14, fontWeight: "800" },

  accessoryBar: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "rgba(12,16,20,0.94)",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)",
  },
  accessoryBarAndroid: {
    position: "absolute", left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "rgba(12,16,20,0.94)",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)",
  },

  chipsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: {
    minWidth: 68, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    alignItems: "center",
  },
  firstChip: { alignSelf: "flex-start" },
  lastChip: { alignSelf: "flex-end" },
  chipTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

export {};