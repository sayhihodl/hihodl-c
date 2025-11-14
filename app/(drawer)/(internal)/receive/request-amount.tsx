// app/(drawer)/(internal)/receive/request-amount.tsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, Keyboard, Animated,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { legacy } from "@/theme/colors";
import type { ChainKey } from "@/config/sendMatrix";
import { coercePair } from "@/config/sendMatrix";

// UI Components
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import { GlassCard } from "@/ui/Glass";
import SuperTokenSearchSheet from "@/components/SuperTokenSearchSheet";
import { QuickAmountPad, TokenWithMini } from "../payments/_lib/_QuickSendScreen.components";

const { BG, TEXT, SUB } = legacy;

/** ====== Tipos / mocks ====== */
type Chain = "solana" | "base" | "ethereum" | "polygon" | "bitcoin" | "sui";
type Token = "usdc" | "usdt" | "sol" | "eth" | "btc" | "sui";

const ADDRS: Record<Chain, string> = {
  solana:  "7WePY3xxxxxxxxxxxxxxxxxxxxxxxxxxxxRUn3UJ",
  base:    "0xd95e00000000000000000000000000000000a4e9",
  ethereum:"0xd95e00000000000000000000000000000000a4e9",
  polygon: "0xd95e00000000000000000000000000000000a4e9",
  bitcoin: "bc1qexampleexampleexampleexamplemzpp",
  sui:     "0x1fc8c5910000000000000000000000000000c591",
};

/** URL builder */
const buildPayUrl = (p: { chain: Chain; token: Token; amount?: string; note?: string }) => {
  const qs = new URLSearchParams();
  qs.set("recipient", ADDRS[p.chain]);
  if (p.amount) qs.set("amount", String(Number(p.amount)));
  qs.set("token", p.token);
  if (p.note) qs.set("message", p.note);
  return `https://pay.hihodl.xyz/pay?${qs.toString()}`;
};

const fmt = (n: number, dps = 2) =>
  (isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: dps }) : "0");

export default function RequestAmount() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; chain?: string }>();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Estado principal
  const [tokenId, setTokenId] = useState<string>((params.token?.toLowerCase() as Token) || "usdc");
  const [chain, setChain] = useState<ChainKey>((params.chain?.toLowerCase() as ChainKey) || "solana");
  const [tokenSymbol, setTokenSymbol] = useState<string>("USDC"); // Símbolo del token seleccionado
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");

  // UI State
  const [openToken, setOpenToken] = useState(false);
  const [kbH, setKbH] = useState(0);
  const tokenDragGateRef = useRef<boolean>(true);

  // Input ref
  const amountRef = useRef<TextInput>(null);

  // Focus automático
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  // Inicializar símbolo cuando se carga con parámetros
  useEffect(() => {
    if (params.token && !tokenSymbol) {
      const norm = params.token.toLowerCase();
      // Intentar obtener símbolo del tokenId normalizado
      const normalized = norm.split(".")[0].toUpperCase();
      setTokenSymbol(normalized || "TOKEN");
    }
  }, [params.token]);

  // Parse amount
  const amount = useMemo(() => {
    const clean = amountStr.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = Number(clean) || 0;
    return num;
  }, [amountStr]);

  const canCreate = amount > 0 && tokenId;

  // Keypad handlers
  const appendKey = useCallback((k: string) => {
    setAmountStr((prev) => {
      const clean = prev.replace(/[^\d.,]/g, "").replace(",", ".");
      if (k === ".") {
        if (clean.includes(".")) return prev;
        return clean + ".";
      }
      const [int, dec] = clean.split(".");
      if (dec && dec.length >= 6) return prev; // Max 6 decimals
      return dec ? `${int}.${dec}${k}` : `${clean}${k}`;
    });
  }, []);

  const backspace = useCallback(() => {
    setAmountStr((prev) => prev.slice(0, -1));
  }, []);

  const addPreset = useCallback((n: number) => {
    if (n === Number.POSITIVE_INFINITY) {
      // MAX no tiene sentido en request, usar 1000 como máximo razonable
      setAmountStr("1000");
    } else {
      setAmountStr((prev) => {
        const current = Number(prev.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        return String(current + n);
      });
    }
  }, []);

  // Token picker handler
  const handleTokenPick = useCallback(({ tokenId: id, chain: fixed, symbol, name }: { tokenId: string; chain: ChainKey; symbol?: string; name?: string }) => {
    const norm = id.toLowerCase();
    const coerced = coercePair(norm, fixed);
    setTokenId(norm);
    setChain(coerced);
    // Usar el símbolo del token si está disponible, si no usar el tokenId normalizado
    if (symbol) {
      setTokenSymbol(symbol.toUpperCase());
    } else {
      // Fallback: intentar obtener símbolo del tokenId normalizado
      const normalized = norm.split(".")[0].toUpperCase();
      setTokenSymbol(normalized || "TOKEN");
    }
    setOpenToken(false);
  }, []);

  // Crear link
  const create = useCallback(async () => {
    if (!canCreate) return;
    Keyboard.dismiss();
    const url = buildPayUrl({ 
      chain: chain as Chain, 
      token: tokenId as Token, 
      amount: amountStr, 
      note 
    });
    try { 
      await Clipboard.setStringAsync(url); 
    } catch {}
    router.replace({
      pathname: "/(overlays)/link-created",
      params: { url, amount: amountStr, note, token: tokenId, chain, expiresDays: "9" },
    });
  }, [canCreate, chain, tokenId, amountStr, note, router]);

  // Back seguro
  const goSafeBack = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      const homeHref: Href = { pathname: "/(drawer)/(tabs)/(home)" as any };
      router.replace(homeHref);
    }
  }, [router]);

  // UI Constants
  const HEADER_H = 50;
  const TOP = insets.top + HEADER_H + 20;
  const AMOUNT_BLOCK_H = 120;
  const BETWEEN_GAP = 24;

  // Token symbol for display - usar el símbolo guardado o fallback
  const displaySymbol = tokenId ? tokenSymbol : "Choose token";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={HEADER_H}
    >
      <ScreenBg account="Daily" height={160} showTopSeam />
      
      <GlassHeader
        scrolly={scrollY}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={HEADER_H}
        innerTopPad={6}
        leftSlot={
          <Pressable onPress={goSafeBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
        }
        centerSlot={
          <Text style={styles.headerTitle} numberOfLines={1}>
            Request via link
          </Text>
        }
        rightSlot={<View style={{ width: 36 }} />}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* ===== CANTIDAD ===== */}
      <View style={[styles.amountBlock, { marginTop: TOP }]}>
        <TextInput
          ref={amountRef}
          value={amountStr}
          onChangeText={(t) => {
            const clean = t.replace(/[^\d.,]/g, "").replace(",", ".");
            const [int, dec] = clean.split(".");
            setAmountStr(dec ? `${int}.${dec.slice(0, 6)}` : int);
          }}
          keyboardType={Platform.select({ ios: "decimal-pad", android: "decimal-pad" }) as any}
          style={styles.hiddenInput}
          showSoftInputOnFocus={false}
          caretHidden
        />
        <Pressable style={styles.amountLine} onPress={() => amountRef.current?.focus()}>
          <Text style={styles.amountBig}>{fmt(amount, 6)}</Text>
          <Text style={styles.amountUnit}> {displaySymbol}</Text>
        </Pressable>
        <Text style={styles.subtle}>
          {tokenId ? "No fees" : "Choose a token to continue"}
        </Text>
      </View>

      {/* Tap suave */}
      <Pressable onPress={Keyboard.dismiss} style={{ height: 12 }} />
      <View style={{ height: BETWEEN_GAP }} />

      {/* ===== Selector de Token ===== */}
      <View style={{ paddingHorizontal: 16 }}>
        <Pressable 
          style={styles.selectorRow}
          onPress={() => { Keyboard.dismiss(); setOpenToken(true); }}
        >
          <TokenWithMini tokenId={tokenId} chain={chain} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.tokenTitle}>
              {displaySymbol} <Ionicons name="chevron-down" size={14} color="#AFC9D6" />
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Exchange rate */}
      {tokenId && (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <GlassCard tone="glass" style={styles.rateCard}>
            <Text style={styles.rateTitle}>Exchange rate</Text>
            <Text style={styles.rateMain}>
              ≈ {fmt(amount, 2)} {displaySymbol} → {fmt(amount, 2)} €
            </Text>
            <Text style={styles.rateSub}>1 {displaySymbol} ≈ 1 €</Text>
          </GlassCard>
        </View>
      )}

      {/* Nota */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add note (optional)"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.note}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {/* CTA flotante */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: (kbH || 292) + insets.bottom - 22,
        }}
      >
        <CTAButton
          title="Create link"
          onPress={create}
          variant="primary"
          backdrop="solid"
          disabled={!canCreate}
          fullWidth
          size="lg"
        />
      </View>

      {/* Keypad */}
      <View
        style={[styles.accessoryAndroid, { paddingBottom: insets.bottom + 10 }]}
        onLayout={(e) => setKbH(e.nativeEvent.layout.height)}
      >
        <QuickAmountPad
          onPressKey={appendKey}
          onPreset={addPreset}
          onBackspace={backspace}
          disabled={!tokenId}
        />
      </View>

      {/* Token Selector Sheet */}
      <SuperTokenSearchSheet
        visible={openToken}
        onClose={() => setOpenToken(false)}
        onPick={handleTokenPick}
        selectedChain={chain}
        dragGateRef={tokenDragGateRef}
        onTopChange={(atTop) => { tokenDragGateRef.current = atTop; }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
  },
  amountBlock: {
    paddingHorizontal: 16,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  amountBig: {
    color: TEXT,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1,
  },
  amountUnit: {
    color: SUB,
    fontSize: 32,
    fontWeight: "700",
    marginLeft: 8,
  },
  subtle: {
    color: SUB,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tokenTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  rateCard: {
    padding: 14,
  },
  rateTitle: {
    color: SUB,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  rateMain: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  rateSub: {
    color: SUB,
    fontSize: 12,
  },
  note: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    color: TEXT,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  accessoryAndroid: {
    backgroundColor: "#0A1A24",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
});
