// app/(tabs)/receive/request-amount.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors, { legacy } from "@/theme/colors";

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

const TOKEN_CHAINS: Record<Token, Chain[]> = {
  usdc: ["solana","ethereum","base","polygon"],
  usdt: ["solana","ethereum","base","polygon"],
  sol:  ["solana"],
  eth:  ["ethereum","base","polygon"],
  btc:  ["bitcoin"],
  sui:  ["sui"],
};

const DEFAULT_CHAIN_FOR_TOKEN = (t: Token): Chain =>
  TOKEN_CHAINS[t].includes("solana") ? "solana" : TOKEN_CHAINS[t][0];

/** URL builder (placeholder) */
const buildPayUrl = (p: { chain: Chain; token: Token; amount?: string; note?: string }) => {
  const qs = new URLSearchParams();
  qs.set("recipient", ADDRS[p.chain]);
  if (p.amount) qs.set("amount", String(Number(p.amount)));
  qs.set("token", p.token);
  if (p.note) qs.set("message", p.note);
  return `https://pay.hihodl.app/pay?${qs.toString()}`;
};

export default function RequestAmount() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: Token; chain?: Chain }>();
  const insets = useSafeAreaInsets();

  // Estado principal
  const [token, setToken] = useState<Token>((params.token as Token) ?? "usdc");
  const [chain, setChain] = useState<Chain>(
    (params.chain as Chain) ?? DEFAULT_CHAIN_FOR_TOKEN((params.token as Token) ?? "usdc")
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // teclado -> chips visibles cuando está abierto
  const [kbVisible, setKbVisible] = useState(false);

  // popover de Network
  const [netOpen, setNetOpen] = useState(false);

  // Focus automático al amount
  const amountRef = useRef<TextInput>(null);
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // Eventos de teclado (willShow/willHide en iOS para animación suave)
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKbVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => { setKbVisible(false); setNetOpen(false); }
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Validación de chain vs token
  const chainsForToken = useMemo(() => TOKEN_CHAINS[token], [token]);
  useEffect(() => {
    if (!chainsForToken.includes(chain)) setChain(chainsForToken[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const parseAmount = (s: string) => Number(String(s).replace(",", "."));
  const canCreate = parseAmount(amount) > 0;

  /** Pickers */
  const openTokenPicker = () => {
    if (Platform.OS === "ios") {
      // @ts-ignore
      import("react-native").then(({ ActionSheetIOS }) => {
        const opts = ["Cancel", "USDC", "USDT", "SOL", "ETH", "BTC", "SUI"];
        ActionSheetIOS.showActionSheetWithOptions(
          { options: opts, cancelButtonIndex: 0, title: "Choose token" },
          (i: number) => {
            const map = ["", "usdc","usdt","sol","eth","btc","sui"] as const;
            if (i > 0) setToken(map[i] as Token);
          }
        );
      });
    } else {
      const order: Token[] = ["usdc","usdt","sol","eth","btc","sui"];
      const idx = order.indexOf(token);
      setToken(order[(idx + 1) % order.length]);
    }
    setNetOpen(false);
  };

  const toggleNetPopover = () => setNetOpen(v => !v);
  const pickChain = (c: Chain) => { setChain(c); setNetOpen(false); };

  /** Crear link -> abrir overlay */
  const create = async () => {
    if (!canCreate) return;
    Keyboard.dismiss();
    const url = buildPayUrl({ chain, token, amount, note });
    try { await Clipboard.setStringAsync(url); } catch {}
    router.replace({
      pathname: "/(overlays)/link-created",
      params: { url, amount, note, token, chain, expiresDays: "9" },
    });
  };

  const QUICK = [10, 20, 50, 100]; // € solo

  // Constantes para layout
  const CHIPS_H = 52;   // altura aprox. de la tira de chips
  const CTA_BLOCK = 92; // alto aprox. del botón + margins

  // Back seguro en header (por si no hay stack atrás)
  const goSafeBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      const homeHref: Href = { pathname: "/(tabs)/(home)" as any };
      router.replace(homeHref);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setNetOpen(false); }}>
        {/* Contenedor único requerido por TouchableWithoutFeedback */}
        <View style={{ flex: 1 }}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 16,
              // Deja hueco al final para que el CTA NO quede tapado
              paddingBottom: (kbVisible ? CHIPS_H : 0) + CTA_BLOCK + insets.bottom,
            }}
            style={{ flex: 1, backgroundColor: BG }}
          >
            {/* Header tipo sheet */}
            <View style={s.sheetHeader}>
              <View style={s.sheetHeaderBar}>
                <Pressable onPress={goSafeBack} style={s.headerBtn} hitSlop={8}>
                  <Ionicons name="chevron-back" size={20} color={TEXT} />
                </Pressable>
                <Text style={s.sheetTitle}>Request via link</Text>
                <View style={s.headerBtn} />
              </View>

              {/* Amount grande */}
              <TextInput
                ref={amountRef}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={s.amountInput}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={s.fees}>No fees</Text>
            </View>

            {/* Token */}
            <PickerRow label="Token" value={token.toUpperCase()} onPress={openTokenPicker} />

            {/* Exchange rate */}
            <View style={s.rateRow}>
              <Text style={s.rateTitle}>Exchange rate</Text>
              <Text style={s.rateMain}>
                ≈ {amount || "0"} {token.toUpperCase()} → {amount || "0"} €
              </Text>
              <Text style={s.rateSub}>1 {token.toUpperCase()} ≈ 1 €</Text>
            </View>

            {/* Network con popover anclado */}
            <View style={s.anchor}>
              <Pressable onPress={toggleNetPopover} style={[s.pickerRow, netOpen && s.pickerRowActive]}>
                <View>
                  <Text style={s.pickerLabel}>Network</Text>
                  <Text style={s.pickerValue}>{capitalize(chain)}</Text>
                </View>
                <Ionicons name={netOpen ? "chevron-up" : "chevron-down"} size={16} color={SUB} />
              </Pressable>

              {netOpen && (
                <View style={s.popover}>
                  {chainsForToken.map((c) => {
                    const active = c === chain;
                    return (
                      <Pressable key={c} onPress={() => pickChain(c)} style={[s.popItem, active && s.popItemActive]}>
                        <Text style={[s.popItemTxt, active && s.popItemTxtActive]}>{capitalize(c)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Nota */}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add note"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={s.note}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            {/* CTA */}
            <Pressable onPress={create} disabled={!canCreate} style={[s.primary, !canCreate && s.primaryDisabled]}>
              <Text style={[s.primaryTxt, !canCreate && s.primaryTxtDisabled]}>Create link</Text>
            </Pressable>
          </ScrollView>

          {/* Chips encima del teclado (se anclan al borde inferior del KAV) */}
          {kbVisible && (
            <View pointerEvents="box-none" style={[s.bottomChipsWrap, { bottom: 0 }]}>
              <View style={s.bottomChips}>
                {QUICK.map((q) => (
                  <Pressable key={q} onPress={() => setAmount(String(q))} style={s.quickChip} hitSlop={6}>
                    <Text style={s.quickChipTxt}>{q} €</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/** ——— UI bits ——— */
function PickerRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.pickerRow}>
      <View>
        <Text style={s.pickerLabel}>{label}</Text>
        <Text style={s.pickerValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={SUB} />
    </Pressable>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ================= styles ================= */
const s = StyleSheet.create({
  sheetHeader: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHeaderBar: {
    height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 6,
  },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sheetTitle: { color: TEXT, fontSize: 18, fontWeight: "700" },

  amountInput: { color: TEXT, fontSize: 56, fontWeight: "900", textAlign: "center", paddingVertical: 2, marginTop: 6 },
  fees: { color: SUB, textAlign: "center", marginTop: 6 },

  pickerRow: {
    marginTop: 14, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  pickerRowActive: { borderColor: "rgba(255,255,255,0.22)" },
  pickerLabel: { color: SUB, fontSize: 12 },
  pickerValue: { color: TEXT, fontSize: 16, fontWeight: "700", marginTop: 2 },

  // Exchange rate block
  rateRow: {
    marginTop: 14, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },
  rateTitle: { color: SUB, fontSize: 12, marginBottom: 6 },
  rateMain: { color: TEXT, fontSize: 16, fontWeight: "800" },
  rateSub: { color: SUB, fontSize: 12, marginTop: 4 },

  note: {
    marginTop: 14, backgroundColor: "rgba(255,255,255,0.08)", color: TEXT,
    borderRadius: 12, padding: 12,
  },

  primary: {
    marginTop: 16, backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: 16, alignItems: "center",
  },
  primaryDisabled: { backgroundColor: "rgba(255,255,255,0.10)" },
  primaryTxt: { color: colors.primaryTextOn, fontWeight: "700" },
  primaryTxtDisabled: { color: "rgba(255,255,255,0.45)" },

  // Anchor + Popover (Network)
  anchor: { position: "relative", marginTop: 14 },
  popover: {
    position: "absolute",
    left: 0, right: 0, top: "100%",
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "rgba(27,45,54,0.95)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    zIndex: 50,
  },
  popItem: { paddingVertical: 12, paddingHorizontal: 14 },
  popItemActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  popItemTxt: { color: TEXT, fontSize: 15, fontWeight: "600" },
  popItemTxtActive: { color: "#fff" },

  // Chips encima del teclado (ancladas al borde inferior del KAV)
  bottomChipsWrap: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  bottomChips: {
    alignSelf: "stretch",
    backgroundColor: "rgba(10,15,20,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)",
  },
  quickChipTxt: { color: TEXT, fontWeight: "700" },
});