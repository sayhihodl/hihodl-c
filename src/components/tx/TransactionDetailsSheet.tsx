// components/tx/TransactionDetailsSheet.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/theme/colors";
import { type ChainId } from "@/store/portfolio.store";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

type Dir = "in" | "out" | "refund";
type Status = "Succeeded" | "Failed" | "Pending";

export type TxDetails = {
  id: string;
  dir: Dir;                 // "in" | "out" | "refund"
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

/* ===== helpers ===== */
const normalizeChainId = (id: string) =>
  id === "base:mainnet" ? "eip155:8453" : id;

// Propios (nombres de red como marca)
const CHAIN_LABEL: Record<string, string> = {
  "eip155:1": "Ethereum",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
  "solana:mainnet": "Solana",
};

const SCAN_BY_CHAIN: Record<
  string,
  { base: string; brandKey: "etherscan" | "basescan" | "polygonscan" | "solscan" }
> = {
  "eip155:1": { base: "https://etherscan.io", brandKey: "etherscan" },
  "eip155:8453": { base: "https://basescan.org", brandKey: "basescan" },
  "eip155:137": { base: "https://polygonscan.com", brandKey: "polygonscan" },
  "solana:mainnet": { base: "https://solscan.io", brandKey: "solscan" },
};

const truncMid = (s?: string, keep = 6) =>
  !s || s.length <= keep * 2 + 3 ? s ?? "" : `${s.slice(0, keep)}…${s.slice(-keep)}`;

const fmtFiat = (n?: number, currency = "USD") =>
  typeof n === "number"
    ? n.toLocaleString(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      })
    : "";

/* ===== component ===== */
export default function TransactionDetailsSheet({
  tx,
  onReceive,
  onSend,
  onSwap,
}: TransactionDetailsSheetProps) {
  // Usamos el namespace "tx" y evitamos suspense para no ver inglés por defecto
  const { t, i18n, ready } = useTranslation("tx", { useSuspense: false });
  const [nsReady, setNsReady] = useState(ready);

  useEffect(() => {
    if (!ready) {
      i18n.loadNamespaces(["tx"]).then(() => setNsReady(true));
    } else {
      setNsReady(true);
    }
  }, [ready, i18n]);

  if (!nsReady) return null;

  const isIn = tx.dir === "in";
  const statusColor =
    tx.status === "Succeeded" ? "#20d690" : tx.status === "Failed" ? "#ff6b6b" : "#CFE3EC";

  type ExplorerMeta = {
  base: string;
  brandKey: "etherscan" | "basescan" | "polygonscan" | "solscan";
  makeTxUrl: (h?: string) => string;
};

  // Explorer meta + URL directa a la TX si hay hash
  const explorer = useMemo<ExplorerMeta | undefined>(() => {
  if (!tx.network) return undefined;

  const id = normalizeChainId(String(tx.network));
  const meta = SCAN_BY_CHAIN[id];
  if (!meta) return undefined;

  const makeTxUrl = (h?: string) => (!h ? meta.base : `${meta.base}/tx/${h}`);
  return { ...meta, makeTxUrl };
}, [tx.network]);

const explorerUrl = explorer?.makeTxUrl?.(tx.hash);
const explorerLabel = explorer
  ? t("viewOnExplorer", { brand: t(`explorers.${explorer.brandKey}`) })
  : undefined;

  // Título con posible refund (si lo usas)
  const title =
    tx.dir === "in" ? t("received") : tx.dir === "out" ? t("sent") : t("refunded");

  const amountTxt =
    typeof tx.tokenAmount === "number" && tx.tokenSymbol
      ? `${tx.tokenAmount >= 0 ? "+" : ""}${Math.abs(tx.tokenAmount).toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })} ${tx.tokenSymbol}`
      : undefined;

  // Fallback plano/anidado para status
  const statusKeyFlat = tx.status ? `status_${String(tx.status).toLowerCase()}` : undefined;
  const statusKeyNested = tx.status ? `status.${String(tx.status).toLowerCase()}` : undefined;
  const statusText =
    tx.status ? t(statusKeyFlat!, t(statusKeyNested!, String(tx.status))) : undefined;

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Text style={{ color: colors.sheetText, fontWeight: "800", fontSize: 20, marginBottom: 10 }}>
        {title}
      </Text>

      {/* Bloque 1 */}
      <View style={styles.block}>
        <KV label={t("date")} value={tx.when} />

        {!!statusText && (
          <KV
            label={t("status")}
            value={statusText}
            valueColor={statusColor}
          />
        )}

        {tx.peer && <KVCopy label={isIn ? t("from") : t("to")} value={tx.peer} />}

        {tx.network && (
          <KV
            label={t("network")}
            value={CHAIN_LABEL[normalizeChainId(String(tx.network))] ?? String(tx.network)}
          />
        )}

        {tx.hash && (
          <KVCopy label={t("transaction")} value={truncMid(tx.hash)} rawCopy={tx.hash} />
        )}
      </View>

      {/* Bloque 2 */}
      <View style={styles.block}>
        {amountTxt && <KV label={t("amount")} value={amountTxt} />}
        {typeof tx.fiatAmount === "number" && (
          <KV label={t("fiat")} value={fmtFiat(tx.fiatAmount, "USD")} />
        )}
        {!!tx.fee && <KV label={t("networkFee")} value={tx.fee} />}
      </View>

      {!!explorerUrl && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={explorerLabel}
          style={styles.explorerBtn}
          onPress={async () => {
            try {
              await Haptics.selectionAsync();
              await Linking.openURL(explorerUrl);
            } catch {}
          }}
        >
          <Text style={styles.explorerBtnTxt}>{explorerLabel}</Text>
        </Pressable>
      )}

      <View style={{ height: 14 }} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Action icon="qr-code-outline" label={t("action_receive")} onPress={onReceive ?? (() => {})} />
        <Action icon="paper-plane-outline" label={t("action_send")} onPress={onSend ?? (() => {})} />
        <Action icon="swap-horizontal" label={t("action_swap")} onPress={onSwap ?? (() => {})} />
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

function KVCopy({
  label,
  value,
  rawCopy,
}: {
  label: string;
  value: string;
  rawCopy?: string;
}) {
  const handleCopy = async () => {
    if (!rawCopy) return;
    await Clipboard.setStringAsync(rawCopy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Pressable onLongPress={handleCopy} delayLongPress={250} style={styles.kvRow} hitSlop={6}>
      <Text style={styles.kvLabel}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          maxWidth: "70%",
          flexWrap: "wrap",
        }}
      >
        <Text style={styles.kvVal}>{value}</Text>
      </View>
    </Pressable>
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
  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]}
      hitSlop={6}
    >
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
    shadowColor: "#000", shadowOpacity: 0.2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  actionTxt: { color: "#fff", fontSize: 12, marginTop: 6, fontWeight: "600" },
});