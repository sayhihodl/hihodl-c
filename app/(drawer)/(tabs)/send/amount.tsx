// app/(tabs)/send/amount.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import GlassScaffold, { type Account } from "@/components/Screen/GlassScaffold";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";

const { TEXT, SUB, SEPARATOR } = legacy;

const BALANCE: Record<string, number> = {
  "USDC.circle": 25.12,
  "USDT.tether": 9.5,
  "SOL.native": 0.31,
  "ETH.native": 0.03,
};

export default function SendAmount() {
  const params = useLocalSearchParams<{ tokenId?: string; account?: Account }>();

  const tokenId = params.tokenId ?? "USDC.circle";
  const account: Account = (params.account as Account) ?? "Daily";

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const bal = BALANCE[tokenId] ?? 0;

  // normaliza la entrada: solo dígitos, coma o punto; usa punto como decimal
  const parsed = useMemo(() => {
    const t = (amount || "").replace(/[^\d.,]/g, "").replace(",", ".");
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const tokenSym = useMemo(() => tokenId.split(".")[0]?.toUpperCase() || "USD", [tokenId]);

  const canContinue = parsed > 0 && parsed <= bal && !!to.trim();

  const setMax = () => setAmount(String(bal));

  const goSearch = () => {
    const q = new URLSearchParams({ tokenId, account });
    router.push(`/(tabs)/send/search?${q.toString()}`);
  };

  const next = () => {
    if (!canContinue) return;
    const q = new URLSearchParams({
      tokenId,
      amount: parsed.toString(),
      to,
      account,
    });
    router.push(`/(tabs)/send/confirm?${q.toString()}`);
  };

  return (
    <GlassScaffold title="Send" account={account} showCard>
      {/* To */}
      <Text style={s.label}>To</Text>
      <View style={s.inputRow}>
        <Ionicons name="person-circle-outline" size={18} color={SUB} />
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="@alias or 0x… / solana…"
          placeholderTextColor={SUB}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable hitSlop={8} onPress={goSearch} accessibilityRole="button" accessibilityLabel="Search a friend">
          <Ionicons name="search" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Amount */}
      <Text style={[s.label, { marginTop: 12 }]}>Amount</Text>
      <View style={s.inputRow}>
        <Ionicons name="cash-outline" size={18} color={SUB} />
        <TextInput
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^\d.,]/g, ""))}
          placeholder="0.00"
          placeholderTextColor={SUB}
          style={s.input}
          keyboardType="decimal-pad"
        />
        <Pressable style={s.pill} onPress={setMax} accessibilityRole="button" accessibilityLabel="Use max">
          <Text style={s.pillTxt}>Max</Text>
        </Pressable>
        <View style={{ width: 8 }} />
        <View style={[s.pill, { backgroundColor: SEPARATOR }]}>
          <Text style={s.pillTxtDark}>{tokenSym}</Text>
        </View>
      </View>

      <Text style={s.balanceHint}>
        Balance: {bal} {tokenSym}
      </Text>

      <Pressable
        style={[s.primaryBtn, !canContinue && { opacity: 0.5 }]}
        disabled={!canContinue}
        onPress={next}
        accessibilityRole="button"
        accessibilityLabel="Continue to confirmation"
      >
        <Text style={s.primaryTxt}>Continue</Text>
      </Pressable>
    </GlassScaffold>
  );
}

const s = StyleSheet.create({
  label: { color: SUB, fontSize: 12, letterSpacing: 0.3, marginBottom: 6 },
  inputRow: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  pill: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  pillTxtDark: { color: "#081217", fontWeight: "800", fontSize: 12 },
  balanceHint: { color: SUB, fontSize: 12, marginTop: 8 },
  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFB703",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTxt: { color: "#0A1A24", fontWeight: "800", fontSize: 15 },
});