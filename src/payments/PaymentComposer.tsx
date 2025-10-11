import React, { useRef, useState } from "react";
import {
  View, TextInput, Text, Pressable, StyleSheet, Keyboard, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";

const BG = "rgba(7,16,22,0.86)";
const BORDER = "rgba(255,255,255,0.10)";
const SUB = "rgba(255,255,255,0.65)";
const TXT = "#fff";

type Props = {
  onSend: (p: { amount?: string; memo?: string }) => void;
  onRequest?: () => void;
  onScan?: () => void;
  tokenSymbol?: string;          // USDC, USDT...
};

export default function PaymentComposer({
  onSend, onRequest, onScan, tokenSymbol = "USDC",
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation(["payments"]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const memoRef = useRef<TextInput>(null);

  const disabled = !amount;

  const handleSend = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend({ amount, memo });
    setAmount(""); setMemo("");
    Keyboard.dismiss();
  };

  return (
    <>
      {/* COMPOSER BAR */}
      <View style={[styles.wrap, { paddingBottom: Math.max(8, bottom ? 8 : 0) }]}>
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
        glassTintRGBA="rgba(9,24,34,0.55)"
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