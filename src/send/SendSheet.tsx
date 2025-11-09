// src/send/SendSheet.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Platform, Alert } from "react-native";
import type { SvgProps } from "react-native-svg";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { legacy } from "@/theme/colors";
import { parseRecipient } from "@/send/parseRecipient";
import type { ChainKey } from "@/types/send";
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "@/config/iconRegistry";
import { buildSendChoices, networkOrderForToken } from "@/config/sendChoices";
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import { Ionicons } from "@expo/vector-icons";
import { requireSensitiveAuth } from "@/lib/lock";

export type SendSheetInitial = {
  to: string;
  label?: string;
  tokenId?: string;
  network?: ChainKey;
  amount?: string;
};

const { TEXT, SUB } = legacy;

/* ===== mini badges ===== */
const MINI: Partial<Record<ChainKey, React.ComponentType<SvgProps>>> = {
  solana: SolBadge,
  ethereum: EthBadge,
  base: BaseBadge,
  polygon: PolyBadge,
};

/* ===== helpers ===== */
const AVATAR = 34, MINI_BADGE = 18, MINI_INNER = 18;

/** ⬆️ export para poder reutilizar en otros pasos si lo necesitas */
export function shortAddr(a?: string) {
  if (!a) return "";
  const isHex = /^0x[0-9a-fA-F]+$/.test(a);
  const head = isHex ? a.slice(0, 6) : a.slice(0, 4);
  const tail = a.slice(-4);
  return `${head}…${tail}`;
}

/** ⬆️ export para reuso (StepAmount/StepConfirm, etc.) */
export function TokenWithMini({ tokenId, net }: { tokenId: string; net: ChainKey }) {
  const def = TOKEN_ICONS[tokenId] ?? DEFAULT_TOKEN_ICON;
  const Mini = MINI[net];
  return (
    <View style={{ width: AVATAR, height: AVATAR, position: "relative" }}>
      {def.kind === "svg" ? <def.Comp width={AVATAR} height={AVATAR} /> : <def.Img width={AVATAR} height={AVATAR} />}
      {!!Mini && (
        <View style={styles.miniBox}>
          <Mini width={MINI_INNER} height={MINI_INNER} />
        </View>
      )}
    </View>
  );
}

/* ===== modal ===== */
export default function SendSheet({
  visible, initial, onClose,
}: { visible: boolean; initial?: SendSheetInitial; onClose: () => void }) {
  const [step, setStep] = useState<"to"|"token"|"amount"|"confirm">("to");

  // ===== state del flujo =====
  const [to, setTo] = useState(initial?.to ?? "");
  const [label, setLabel] = useState<string|undefined>(initial?.label);
  const [resolved, setResolved] = useState<string|undefined>(undefined);
  const [toChain, setToChain] = useState<ChainKey|undefined>(initial?.network);
  const [tokenId, setTokenId] = useState<string|undefined>(initial?.tokenId);
  const [network, setNetwork] = useState<ChainKey|undefined>(initial?.network);
  const [amount, setAmount] = useState<string>(initial?.amount ?? "");

  // reset al abrir
  useEffect(() => {
    if (!visible) return;
    setStep(initial?.to ? (initial?.tokenId ? (initial?.amount ? "confirm" : "amount") : "token") : "to");
    setTo(initial?.to ?? "");
    setLabel(initial?.label);
    setResolved(undefined);
    setToChain(initial?.network);
    setTokenId(initial?.tokenId);
    setNetwork(initial?.network);
    setAmount(initial?.amount ?? "");
  }, [visible]);

  // ====== STEP 1: Recipient ======
  const parsed = useMemo(() => parseRecipient(to || ""), [to]);
  useEffect(() => {
    const r = parsed?.resolved?.address ?? undefined;
    setResolved(r);
    if (parsed?.toChain) setToChain(parsed.toChain as ChainKey);
  }, [parsed]);

  const canNextTo = !!parsed;
  const titleTop =
    label
      ? label
      : parsed?.kind === "hihodl"
      ? parsed?.display
      : resolved
      ? shortAddr(resolved)
      : to;

  // ====== STEP 2: Token select ======
  // Si el destinatario soporta una sola raíz, pásala como array para ordenar/preferir
  const allowedRoot = toChain; // "solana" | "ethereum" | "base" | "polygon" | ...
  const tokens = useMemo(
    () => buildSendChoices(allowedRoot ? [allowedRoot] as ChainKey[] : undefined),
    [allowedRoot]
  );

  function pickDefaultNet(tid: string): ChainKey {
    // Evita ambigüedad de tipos pasando array cuando hay raíz; si no, undefined
    const order = networkOrderForToken(tid, allowedRoot ? [allowedRoot] : undefined);
    return order[0];
  }

  // ====== STEP 3/4 transition helpers ======
  const selectToken = (tid: string) => {
    const best = pickDefaultNet(tid);
    setTokenId(tid);
    setNetwork(best);
    setStep("amount");
  };
  const proceedAmount = () => (amount && tokenId && network) ? setStep("confirm") : null;

  // ====== Confirm (fake submit) ======
  const onConfirm = async () => {
    const ok = await requireSensitiveAuth("Authorize transaction");
    if (!ok) {
      Alert.alert("Authorization required", "Face ID / biometrics was cancelled or failed.");
      return;
    }
    Alert.alert("Sent ✅", `To: ${titleTop}\nToken: ${tokenId}\nNet: ${network}\nAmount: ${amount}`);
    onClose();
  };

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onClose}
      blurIntensity={40}
      glassTintRGBA="rgba(10,20,28,0.98)"
      minHeightPct={0.35}
      maxHeightPct={0.92}
      dragAnywhere
    >
      {/* HEADER */}
      <View style={styles.header}>
        {step !== "to" ? (
          <Pressable
            onPress={() => setStep(step === "token" ? "to" : step === "amount" ? "token" : "amount")}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
        ) : <View style={{ width: 22 }} />}

        <View style={styles.headerPill}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titleTop || "Send"}
          </Text>
          {!!(resolved && !label) && (
            <Text style={styles.headerSub} numberOfLines={1}>
              <Text style={styles.headerStrong}>{shortAddr(resolved)}</Text>
            </Text>
          )}
        </View>

        <Pressable onPress={onClose} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="close" size={20} color={TEXT} />
        </Pressable>
      </View>

      {/* BODY */}
      {step === "to" && (
        <StepRecipient
          value={to}
          setValue={setTo}
          canNext={canNextTo}
          onNext={() => setStep("token")}
        />
      )}

      {step === "token" && (
        <StepToken tokens={tokens} onPick={selectToken} />
      )}

      {step === "amount" && (
        <StepAmount
          tokenId={tokenId}
          network={network}
          onChangeNetwork={(n) => setNetwork(n)}
          amount={amount}
          setAmount={setAmount}
          onNext={proceedAmount}
        />
      )}

      {step === "confirm" && (
        <StepConfirm
          to={titleTop || ""}
          tokenId={tokenId!}
          network={network!}
          amount={amount}
          onChangeNetwork={setNetwork}
          onConfirm={onConfirm}
        />
      )}
    </BottomKeyboardModal>
  );
}

/* ====== STEP COMPONENTS (compactos) ====== */

function StepRecipient({
  value, setValue, canNext, onNext,
}: { value: string; setValue: (v: string)=>void; canNext: boolean; onNext: ()=>void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <Text style={s.section}>Recipient</Text>
      <View style={s.inputRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="@alias, 0x…, sol…, email…"
          placeholderTextColor={SUB}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => canNext && onNext()}
        />
      </View>
      <Pressable disabled={!canNext} onPress={onNext} style={[s.cta, !canNext && s.ctaDisabled]}>
        <Text style={s.ctaTxt}>Continue</Text>
      </Pressable>
    </View>
  );
}

function StepToken({
  tokens, onPick,
}: { tokens: Array<{ id: string; label: string; bestNet: ChainKey }>; onPick: (id: string)=>void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Text style={s.section}>Recommended</Text>
      {tokens.map(t => (
        <Pressable key={t.id} onPress={() => onPick(t.id)} style={s.row}>
          <TokenWithMini tokenId={t.id} net={t.bestNet} />
          <Text style={s.rowTitle}>{t.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={SUB} />
        </Pressable>
      ))}
      <Text style={s.hint}>We pick the cheapest network automatically. You can change it on the confirmation screen.</Text>
    </View>
  );
}

function StepAmount({
  tokenId, network, onChangeNetwork, amount, setAmount, onNext,
}: {
  tokenId?: string; network?: ChainKey; onChangeNetwork: (n: ChainKey)=>void;
  amount: string; setAmount: (v: string)=>void; onNext: ()=>void;
}) {
  if (!tokenId || !network) return null;

  // ⬇️ sin objeto vacío: pasa undefined (o el filtro real si lo necesitas)
  const order = networkOrderForToken(tokenId, undefined);

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Text style={s.section}>Amount</Text>

      <View style={[s.inputRow, { marginBottom: 10 }]}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={SUB}
          keyboardType="decimal-pad"
          style={[s.input, { fontSize: 24, fontWeight: "800" }]}
        />
        <View style={{ width: 10 }} />
        <TokenWithMini tokenId={tokenId} net={network} />
      </View>

      <View style={s.netRow}>
        {order.map(n => (
          <Pressable key={n} onPress={() => onChangeNetwork(n)} style={[s.netChip, network === n && s.netChipActive]}>
            <Text style={[s.netChipTxt, network === n && s.netChipTxtActive]}>{n.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable disabled={!amount} onPress={onNext} style={[s.cta, !amount && s.ctaDisabled]}>
        <Text style={s.ctaTxt}>Review</Text>
      </Pressable>
    </View>
  );
}

function StepConfirm({
  to, tokenId, network, amount, onChangeNetwork, onConfirm,
}: {
  to: string; tokenId: string; network: ChainKey; amount: string;
  onChangeNetwork: (n: ChainKey)=>void; onConfirm: ()=>void;
}) {
  // ⬇️ igual que en Amount
  const order = networkOrderForToken(tokenId, undefined);

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Text style={s.section}>Confirm</Text>

      <View style={s.card}>
        <Text style={s.line}><Text style={s.bold}>To:</Text> {to}</Text>
        <Text style={s.line}><Text style={s.bold}>Token:</Text> {tokenId}</Text>
        <Text style={s.line}><Text style={s.bold}>Amount:</Text> {amount}</Text>
        <Text style={[s.line, { marginTop: 8 }]}><Text style={s.bold}>Network:</Text></Text>
        <View style={s.netRow}>
          {order.map(n => (
            <Pressable key={n} onPress={() => onChangeNetwork(n)} style={[s.netChip, network === n && s.netChipActive]}>
              <Text style={[s.netChipTxt, network === n && s.netChipTxtActive]}>{n.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={onConfirm} style={s.cta}>
        <Text style={s.ctaTxt}>Send</Text>
      </Pressable>
    </View>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, marginBottom: 8 },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerPill: {
    flex: 1,
    marginHorizontal: 6,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 8, android: 10 }),
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  headerSub: { color: SUB, fontSize: 12, marginTop: 2 },
  headerStrong: { color: "#fff", fontWeight: "900" },

  miniBox: {
    position: "absolute",
    right: -7,
    bottom: -10,
    width: MINI_BADGE,
    height: MINI_BADGE,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});

const s = StyleSheet.create({
  section: { color: SUB, fontSize: 12, letterSpacing: 0.3, marginBottom: 10, marginTop: 6 },
  inputRow: {
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
  },
  input: { flex: 1, color: "#fff", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rowTitle: { color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 12 },
  hint: { color: SUB, fontSize: 12, marginTop: 6, textAlign: "center" },

  cta: { marginTop: 12, backgroundColor: "#fff", borderRadius: 12, alignItems: "center", paddingVertical: 12 },
  ctaDisabled: { opacity: 0.5 },
  ctaTxt: { color: "#0A1A24", fontWeight: "900" },

  netRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  netChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)" },
  netChipActive: { backgroundColor: "#fff" },
  netChipTxt: { color: "#c8d5db", fontSize: 11, fontWeight: "800" },
  netChipTxtActive: { color: "#0A1A24" },

  card: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  line: { color: "#fff", marginTop: 6 },
  bold: { fontWeight: "900" },
});