// app/(internal)/payments/tx-details.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenBg from "@/ui/ScreenBg";
import { renderChainBadge, mapChainKeyToChainId, renderTokenIcon } from "@/config/iconRegistry";

const BG = "#0D1820";
const TEXT = "#fff";
const SUB = "rgba(255,255,255,0.65)";
const CARD = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.10)";

export default function TxDetails() {
  const p = useLocalSearchParams<{
    id?: string; dir?: "in" | "out"; token?: string; amount?: string; fiat?: string;
    status?: string; dateISO?: string; time?: string; chain?: "Solana" | "Base" | "Ethereum";
    txHash?: string; memo?: string; name?: string; handle?: string;
  }>();

  const amountStr = `${p?.dir === "out" ? "-" : "+"}${p?.amount ?? "0"} ${p?.token ?? ""}`;
  const approxFiat = p?.fiat ? `≈ ${p.fiat}` : "";
  const chainId = mapChainKeyToChainId((p?.chain || "base").toLowerCase() as any);

  const dateStr = p?.dateISO
    ? new Date(String(p.dateISO)).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  const timeStr = p?.time ?? "";

  const handleOpenExplorer = () => {
    if (p?.txHash) {
      // ajusta por chain (ejemplo simple)
      const base = p.chain === "Solana"
        ? "https://solscan.io/tx/"
        : p.chain === "Ethereum"
        ? "https://etherscan.io/tx/"
        : "https://basescan.org/tx/";
      Linking.openURL(base + p.txHash);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={200} showTopSeam />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Payment</Text>
        <Pressable onPress={() => { /* compartir recibo */ }} hitSlop={10}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Amount */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={styles.amount}>{amountStr}</Text>
        {!!approxFiat && <Text style={styles.approx}>{approxFiat}</Text>}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <View style={styles.pill}><Text style={styles.pillText}>Daily</Text></View>
          <View style={styles.pill}>
            {renderChainBadge(chainId, { size: 14, chip: false })}
            <Text style={[styles.pillText, { marginLeft: 6 }]}>{p.chain?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Counterparty card */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {renderTokenIcon(p?.token === "USDT" ? "USDT.tether" : "USDC.circle", { size: 36, inner: 24, withCircle: true })}
          <View style={{ flex: 1 }}>
            <Text style={styles.counterTitle}>{p?.name || "Contact"}</Text>
            <Text style={styles.counterSub}>{p?.handle || ""}</Text>
          </View>
        </View>
      </View>

      {/* Info card */}
      <View style={[styles.card, { marginTop: 14, paddingHorizontal: 0 }]}>
        <Row label="Status" value={capitalize(p?.status || "confirmed")} />
        <Separator />
        <Row label="Date" value={`${dateStr} ${timeStr}`} />
        <Separator />
        <Row label="Network" value={String(p?.chain || "").toUpperCase()} />
        <Separator />
        <Row
          label="Transaction"
          value={shortHash(p?.txHash)}
          onPressIcon={p?.txHash ? handleOpenExplorer : undefined}
        />
        <Separator />
        <Row label="Memo" value={p?.memo || "—"} dim />
      </View>

      {/* Actions card */}
      <View style={[styles.card, { marginTop: 14, paddingHorizontal: 0 }]}>
        <ActionRow icon="share-outline" label="Share receipt" onPress={() => { /* compartir */ }} />
        <Separator />
        <ActionRow icon="open-outline" label="View on explorer" onPress={handleOpenExplorer} />
      </View>
    </View>
  );
}

function Separator() {
  return <View style={sepStyles.sep} />;
}

const sepStyles = StyleSheet.create({
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginLeft: 14,      // alinear con el contenido
    marginRight: 14,
  },
});
/* ---------- small components ---------- */
function Row({ label, value, dim, onPressIcon }:{label:string; value?:string; dim?:boolean; onPressIcon?:()=>void}) {
  return (
    <View style={rowStyles.wrap}>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={[rowStyles.value, dim && { color: SUB }]} numberOfLines={1}>{value ?? ""}</Text>
        {onPressIcon && (
          <Pressable onPress={onPressIcon} hitSlop={10}>
            <Ionicons name="open-outline" size={18} color="#BFD4DB" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
function ActionRow({ icon, label, onPress }:{icon:any; label:string; onPress:()=>void}) {
  return (
    <Pressable onPress={onPress} style={actStyles.wrap}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={icon} size={18} color="#BFD4DB" />
        <Text style={actStyles.text}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#BFD4DB" />
    </Pressable>
  );
}
function shortHash(h?: string) { if (!h) return "—"; return h.length > 12 ? `${h.slice(0,6)}…${h.slice(-6)}` : h; }
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: {
    height: 54, paddingHorizontal: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between"
  },
  headerTitle: { color: TEXT, fontWeight: "900", fontSize: 18 },

  amount: { color: TEXT, fontSize: 28, fontWeight: "900" },
  approx: { color: SUB, fontSize: 14, marginTop: 4 },

  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)"
  },
  pillText: { color: TEXT, fontWeight: "700", fontSize: 12 },

  card: {
    marginHorizontal: 14, padding: 14, borderRadius: 16,
    backgroundColor: CARD, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER
  },

  counterTitle: { color: TEXT, fontWeight: "800", fontSize: 16 },
  counterSub: { color: SUB, fontWeight: "600", fontSize: 12 },
});

const rowStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between"
  },
  label: { color: TEXT, fontWeight: "800", fontSize: 14 },
  value: { color: TEXT, fontWeight: "700", fontSize: 14, maxWidth: 190 },
});
const actStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between"
  },
  text: { color: TEXT, fontWeight: "800", fontSize: 14 },
});