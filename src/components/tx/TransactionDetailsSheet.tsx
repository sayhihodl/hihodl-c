// components/tx/TransactionDetailsSheet.tsx
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/theme/colors";
import { type ChainId } from "@/store/portfolio.store";

type Dir = "in" | "out";
type Status = "Succeeded" | "Failed" | "Pending";

export type TxDetails = {
  id: string;
  dir: Dir;                 // "in" | "out"
  when: string;             // "Yesterday, 21:17"
  peer?: string;            // "@helloalex"
  hash?: string;            // "0x18c...abcd"
  status?: Status;
  tokenSymbol?: string;     // "USDT"
  tokenAmount?: number;     // con signo (+/-)
  fiatAmount?: number;      // con signo (+/-)
  fee?: string;             // "0.0005 ETH"
  network?: ChainId | string;
};

export type TransactionDetailsSheetProps = {
  tx: TxDetails;
  onClose?: () => void;
  onReceive?: () => void;
  onSend?: () => void;
  onSwap?: () => void;
};

const CTA_NEUTRAL = "#CFE3EC";

const CHAIN_LABEL: Record<string, string> = {
  "eip155:1": "Ethereum",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
  "solana:mainnet": "Solana",
};
const SCAN_BY_CHAIN: Record<string, string> = {
  "eip155:1": "https://etherscan.io",
  "eip155:8453": "https://basescan.org",
  "eip155:137": "https://polygonscan.com",
  "solana:mainnet": "https://solscan.io",
};

const truncMid = (s?: string, keep = 6) =>
  !s || s.length <= keep * 2 + 3 ? s ?? "" : `${s.slice(0, keep)}…${s.slice(-keep)}`;

const fmtUSD = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    : "";

export default function TransactionDetailsSheet({
  tx,
  onClose,
  onReceive,
  onSend,
  onSwap,
}: TransactionDetailsSheetProps) {
  const isIn = tx.dir === "in";
  const statusColor =
    tx.status === "Succeeded" ? "#20d690" : tx.status === "Failed" ? "#ff6b6b" : "#CFE3EC";

  const explorerUrl = useMemo(() => {
    if (!tx.network) return undefined;
    const base = SCAN_BY_CHAIN[String(tx.network)] ?? undefined;
    return base; // si quieres: añade /tx/<hash> cuando tengas hash real por red
  }, [tx.network]);

  const explorerLabel = useMemo(() => {
    const u = explorerUrl ?? "";
    if (/basescan/i.test(u)) return "View on BaseScan";
    if (/polygonscan/i.test(u)) return "View on PolygonScan";
    if (/solscan/i.test(u)) return "View on Solscan";
    return "View on Etherscan";
  }, [explorerUrl]);

  const amountTxt =
    typeof tx.tokenAmount === "number" && tx.tokenSymbol
      ? `${tx.tokenAmount >= 0 ? "+" : ""}${Math.abs(tx.tokenAmount).toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })} ${tx.tokenSymbol}`
      : undefined;

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Text style={{ color: colors.sheetText, fontWeight: "800", fontSize: 20, marginBottom: 10 }}>
        {isIn ? "Received" : "Sent"}
      </Text>

      {/* Bloque 1 */}
      <View style={styles.block}>
        <KV label="Date" value={tx.when} />
        {tx.status && <KV label="Status" value={tx.status} valueColor={statusColor} />}
        {tx.peer && <KVCopy label={isIn ? "From" : "To"} value={tx.peer} />}
        {tx.network && <KV label="Network" value={CHAIN_LABEL[String(tx.network)] ?? String(tx.network)} />}
        {tx.hash && <KVCopy label="Transaction" value={truncMid(tx.hash)} rawCopy={tx.hash} />}
      </View>

      {/* Bloque 2 */}
      <View style={styles.block}>
        {amountTxt && <KV label="Amount" value={amountTxt} />}
        {typeof tx.fiatAmount === "number" && <KV label="Fiat" value={fmtUSD(tx.fiatAmount)} />}
        {!!tx.fee && <KV label="Network fee" value={tx.fee} />}
      </View>

      {!!explorerUrl && (
        <Pressable
          style={styles.explorerBtn}
          onPress={() => {
            Linking.openURL(explorerUrl).catch(() => {});
          }}
        >
          <Text style={styles.explorerBtnTxt}>{explorerLabel}</Text>
        </Pressable>
      )}

      <View style={{ height: 14 }} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Action icon="qr-code-outline" label="Receive" onPress={onReceive ?? (() => {})} />
        <Action icon="paper-plane-outline" label="Send" onPress={onSend ?? (() => {})} />
        <Action icon="swap-horizontal" label="Swap" onPress={onSwap ?? (() => {})} />
      </View>
    </View>
  );
}

/* ==== subcomponents ==== */
function KV({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvVal, !!valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function KVCopy({ label, value, rawCopy }: { label: string; value: string; rawCopy?: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "70%", flexWrap: "wrap" }}>
        <Text style={styles.kvVal}>{value}</Text>
      </View>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]} hitSlop={6}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color="#0A1A24" />
      </View>
      <Text style={styles.actionTxt}>{label}</Text>
    </Pressable>
  );
}

/* ==== styles ==== */
const styles = StyleSheet.create({
  block: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  kvRow: {
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kvLabel: { color: colors.sheetText, opacity: 0.85 },
  kvVal: { color: colors.sheetText },
  explorerBtn: {
    backgroundColor: CTA_NEUTRAL,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  explorerBtnTxt: { color: "#0A1A1A", fontWeight: "800" },
  action: { flex: 1, alignItems: "center" },
  actionIcon: {
    width: 50, height: 50, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  actionTxt: { color: "#fff", fontSize: 12, marginTop: 6, fontWeight: "600" },
});