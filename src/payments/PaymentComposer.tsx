import React, { useRef, useState } from "react";
import {
  View, TextInput, Text, Pressable, StyleSheet, Keyboard, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { sendSolanaPayment } from "@/services/solanaTx";
import { useThreads } from "@/store/threads";
import { router } from "expo-router";
import { nanoid } from "nanoid/non-secure";

const BG = "rgba(7,16,22,0.86)";
const BORDER = "rgba(255,255,255,0.10)";
const SUB = "rgba(255,255,255,0.65)";
const TXT = "#fff";

type Props = {
  onSend: (p: { amount?: string; memo?: string }) => void;
  onRequest?: () => void;
  onScan?: () => void;
  onGroup?: () => void;
  tokenSymbol?: string;          // USDC, USDT...
  peerAlias?: string;     // e.g. "@maria" (para el thread)
  toAddress?: string;     // Solana address del receptor
  tokenMint?: string;     // USDC mint en Solana
  myAlias?: string;       // tu alias emisor (opcional)
  available?: number;     // balance disponible (en unidades humanas)
};

export default function PaymentComposer({
  onSend, onRequest, onScan, onGroup, tokenSymbol = "USDC",
  peerAlias = "@maria",
  toAddress = "1111111111", // placeholder para mock
  tokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
  myAlias = "@me",
  available = 0,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation(["payments"]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const memoRef = useRef<TextInput>(null);

  // === helpers ===
  const IS_MOCK =
  process.env.EXPO_PUBLIC_MOCK_PAYMENTS === "1" ||
  !process.env.EXPO_PUBLIC_RELAY_URL; // si no hay relayer, permitimos enviar para diseño

  const parseHumanAmount = (s: string) => {
    // admite "1.011.111" (miles) o "1,23" (decimales)
    if (!s) return 0;
    const cleaned = s.replace(/[^0-9.,]/g, "")
                     .replace(/\./g, "")         // quita separadores de miles
                     .replace(",", ".");         // coma -> punto
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const amountNum = parseHumanAmount(amount);

  const { upsert, patchStatus } = useThreads();

  const disabled = IS_MOCK ? amountNum <= 0 : (amountNum <= 0 || amountNum > available);

  const handleSend = async () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // notificar al parent (si quiere reaccionar)
    onSend?.({ amount, memo });

    const id = nanoid();
    // 1) Optimistic item en el thread
    if (peerAlias) {
      upsert(peerAlias, {
        id,
        kind: "tx",
        direction: "out",
        amount,
        token: tokenSymbol,
        chain: "solana",
        status: "pending",
        createdAt: Date.now(),
        memo,
      } as any);
    }

    // 2) Enviar (mock si no hay relayer configurado)
     let signature: string | undefined;
      let mocked = false;

      try {
        const res = await sendSolanaPayment({ to: toAddress, amount, tokenMint, memo, fromAlias: myAlias });
        signature = res.signature;
        mocked = res.mocked === true;
        if (peerAlias) patchStatus(peerAlias, id, "processed" as any);
        try {
          const { notifyPaymentSent } = require("@/lib/notifications");
          await notifyPaymentSent({ amount, token: tokenSymbol, to: peerAlias });
        } catch {}
      } catch (e) {
        // En mock, si algo falla, generamos una firma falsa para poder diseñar el flujo
        if (IS_MOCK) {
          signature = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          mocked = true;
          if (peerAlias) patchStatus(peerAlias, id, "processed" as any);
        } else {
          if (peerAlias) patchStatus(peerAlias, id, "failed" as any);
          return; // en real, mantenemos la salida
        }
      } finally {
      // limpiar inputs
      setAmount("");
      setMemo("");
      Keyboard.dismiss();
    }
console.log("IS_MOCK?", IS_MOCK, process.env.EXPO_PUBLIC_MOCK_PAYMENTS, process.env.EXPO_PUBLIC_RELAY_URL);
    // 3) Navegar a confirm (hará polling del estado)
if (signature) {
  router.push({
    pathname: "/(drawer)/(internal)/payments/tx-confirm",
    params: { sig: signature, peer: peerAlias, amount, token: tokenSymbol },
  });
}

    // 4) Mock progression para diseño si es necesario
    if (mocked && peerAlias) {
      setTimeout(() => patchStatus(peerAlias, id, "confirmed" as any), 2500);
      setTimeout(() => patchStatus(peerAlias, id, "finalized" as any), 5000);
    }
  };

  return (
    <>
      {/* COMPOSER BAR */}
      <View style={[styles.wrap, { paddingBottom: Math.max(8, bottom ? 8 : 0) }]}>
        <View style={styles.actionsGridWrap}>
          {[
            { key: 'hihodl', label: 'HIHODL', icon: 'at',    onPress: () => {} },
            { key: 'bank',   label: 'Bank',   icon: 'cash',   onPress: () => {} },
            { key: 'card',   label: 'Card',   icon: 'card',   onPress: () => {} },
            { key: 'request',label: 'Request / Link', icon: 'link', onPress: onRequest },
            { key: 'group',  label: 'Group / Split', icon: 'people', onPress: () => { (onGroup || (() => router.push('/(drawer)/(internal)/payments/create-group')))(); } },
          ].map((item) => (
            <Pressable key={item.key} style={styles.actionBlock} onPress={item.onPress}>
              <Ionicons name={item.icon} size={28} color="#8FD3E3" style={{ marginBottom: 6 }} />
              <Text style={styles.actionLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.searchBarComposer}>
          <Ionicons name="search" size={16} color="#8FD3E3" style={{ marginHorizontal: 4 }} />
          <TextInput
            style={styles.searchInputComposer}
            placeholder="Buscar usuario, grupo o dirección"
            placeholderTextColor="rgba(255,255,255,0.45)"
            returnKeyType="search"
          />
        </View>
        <View style={styles.row}>
          {/* Scan */}
          <Pressable style={styles.iconBtn} onPress={onScan} hitSlop={8} accessibilityLabel={t("payments:scan","Scan")}>
            <Ionicons name="scan" size={20} color={TXT} />
          </Pressable>

          {/* Amount */}
          <View style={styles.amountWrap}>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(",", "."))}
              placeholder={t("payments:amountPh","Amount")}
              placeholderTextColor={SUB}
              keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
              returnKeyType="next"
              onSubmitEditing={() => memoRef.current?.focus()}
              style={styles.amount}
            />
            <Pressable onPress={() => setMoreOpen(true)} style={styles.tokenBtn}>
              <Text style={styles.tokenTxt}>{tokenSymbol}</Text>
              <Ionicons name="chevron-up" size={14} color={SUB} />
            </Pressable>
          </View>

          {/* Send */}
          <Pressable
            style={[styles.sendBtn, disabled && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={disabled}
            accessibilityLabel={t("payments:send","Send")}
          >
            <Ionicons name="arrow-up-circle" size={24} color="#0A1A24" />
          </Pressable>
        </View>

        {/* Memo */}
        <View style={styles.memoRow}>
          <Ionicons name="chatbubble-ellipses" size={16} color={SUB} />
          <TextInput
            ref={memoRef}
            value={memo}
            onChangeText={setMemo}
            placeholder={t("payments:memoPh","Write a note (optional)")}
            placeholderTextColor={SUB}
            style={styles.memo}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable hitSlop={8} onPress={onRequest} accessibilityLabel={t("payments:request","Request")}>
            <Text style={styles.request}>{t("payments:request","Request")}</Text>
          </Pressable>
        </View>
      </View>

      {/* MORE (token picker / quick actions) */}
     <BottomKeyboardModal
  visible={moreOpen}
  onClose={() => setMoreOpen(false)}
  minHeightPct={0.32}
  maxHeightPct={0.5}
  showHandle
  ignoreKeyboard
  sheetTintRGBA="rgba(9,24,34,0.55)"   // <- antes era glassTintRGBA
>
        <Text style={styles.sheetTitle}>{t("payments:chooseToken","Choose token")}</Text>
        <View style={{ height: 10 }} />
        {["USDC","USDT","SOL"].map(sym => (
          <Pressable key={sym} style={styles.moreRow} onPress={() => { setMoreOpen(false); }}>
            <Text style={styles.moreLabel}>{sym}</Text>
            <Ionicons name={sym===tokenSymbol ? "radio-button-on" : "radio-button-off"} size={18} color={TXT}/>
          </Pressable>
        ))}
        <View style={{ height: 12 }} />
        <Pressable style={styles.moreRow} onPress={() => { setMoreOpen(false); onRequest?.(); }}>
          <Text style={styles.moreLabel}>{t("payments:requestPayment","Request payment")}</Text>
          <Ionicons name="cash-outline" size={18} color={TXT}/>
        </Pressable>
      </BottomKeyboardModal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  actionsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 6,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  actionBlock: {
    width: '33.33%',
    aspectRatio: 1.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionLabel: {
    color: '#DFF5FF',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.15,
    marginTop: 3,
  },
  searchBarComposer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 10, marginHorizontal: 10,
    height: 36, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)',
  },
  searchInputComposer: {
    flex: 1, color: '#fff', fontSize: 14, fontWeight: '400', paddingLeft: 4,
  },
  row: {
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  amountWrap: {
    flex: 1, minWidth: 0,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
  },
  amount: { flex: 1, color: TXT, fontSize: 18, fontWeight: "900", letterSpacing: 0.2 },
  tokenBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  tokenTxt: { color: SUB, fontWeight: "800", fontSize: 12 },

  sendBtn: {
    height: 36, width: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#8FD3E3",
  },

  memoRow: {
    marginTop: 8, paddingHorizontal: 10, gap: 8,
    flexDirection: "row", alignItems: "center",
  },
  memo: { flex: 1, color: TXT, fontSize: 14, paddingVertical: 6 },
  request: { color: "#8FD3E3", fontSize: 13, fontWeight: "800" },

  sheetTitle: { color: TXT, fontSize: 16, fontWeight: "900" },
  moreRow: {
    height: 44, borderRadius: 12, paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
    marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  moreLabel: { color: TXT, fontSize: 14, fontWeight: "800" },
});