import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors, { glass } from "@/theme/colors";
import { showToast } from "@/utils/toast";
import { type ChainId } from "@/store/portfolio.store";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { renderTokenIcon } from "@/config/iconRegistry";

type Dir = "in" | "out" | "refund" | "bridge" | "swap";
type Status = "Succeeded" | "Failed" | "Pending";

export type TxDetails = {
  id: string;
  dir: Dir;                 // "in" | "out" | "refund"
  when: string;             // "Yesterday, 21:17"
  peer?: string;            // "@helloalex"
  hash?: string;            // "0x18c...abcd"
  status?: Status;
  tokenSymbol?: string;     // "USDT"
  tokenSymbolTo?: string; // para bridge/swap segundo token
  tokenAmount?: number;     // con signo (+/-)
  fiatAmount?: number;      // con signo (+/-)
  fee?: string;             // "0.0005 ETH"
  network?: ChainId | string;
  slippagePct?: number;     // 0.5 = 0.5%
  alerts?: string[];        // mensajes a mostrar
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

  const dirIcon: keyof typeof Ionicons.glyphMap =
    tx.dir === "in"
      ? "arrow-down"
      : tx.dir === "out"
      ? "arrow-up"
      : tx.dir === "bridge"
      ? "swap-horizontal"
      : "reload";

  const dirColor =
    tx.dir === "in"
      ? "#20d690" // green
      : tx.dir === "out"
      ? "#ffb703" // yellow
      : tx.dir === "bridge"
      ? "#9C6BFF" // purple
      : "#CFE3EC"; // default

  const HeroTokenIcon = ({
    primary,
    secondary,
  }: {
    primary?: string;
    secondary?: string;
  }) => {
    const P = (renderTokenIcon as any)?.(primary, 76);
    const S = secondary ? (renderTokenIcon as any)?.(secondary, 28) : null;

    return (
      <View style={styles.heroTokenWrap}>
        <View style={styles.heroTokenScale}>
          {P || (
            <Text style={styles.heroTicker}>{(primary ?? "").slice(0,4).toUpperCase() || "TOK"}</Text>
          )}
        </View>
        {!!S && <View style={styles.heroTokenSmall}>{S}</View>}
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      {/* Title block removed */}

      {/* Hero amount ala Revolut/Phantom */}
      <View style={styles.heroWrap}>
        <View style={styles.heroIcon}>
          <HeroTokenIcon
            primary={tx.tokenSymbol}
            secondary={(tx.dir === "bridge" || tx.dir === "swap") ? tx.tokenSymbolTo : undefined}
          />
          <View style={styles.heroBadge}>
            <Ionicons name={dirIcon} size={18} color={dirColor} />
          </View>
        </View>
        {!!amountTxt && (
          <Text style={styles.heroAmount}>{amountTxt}</Text>
        )}
      </View>

      {/* Bloque 1: Date + Status */}
      <View style={styles.block}>
        <KV label={t("date")} value={tx.when} />

        {!!statusText && (
          <KV
            label={t("status")}
            value={statusText}
            valueColor={statusColor}
          />
        )}
      </View>

      {/* Bloque 2: To + Network + Network Fee */}
      <View style={[styles.block, styles.blockSpacer]}>
        {tx.peer && <KVCopy label={isIn ? t("from") : t("to")} value={tx.peer} />}

        {tx.network && (
          <KV
            label={t("network")}
            value={CHAIN_LABEL[normalizeChainId(String(tx.network))] ?? String(tx.network)}
          />
        )}

        {!!tx.fee && <KV label={t("networkFee")} value={tx.fee} />}

        {typeof tx.slippagePct === "number" && (
          <KV label={t("slippage", { defaultValue: "Slippage" })} value={`${tx.slippagePct}%`} />
        )}

        {!!tx.hash && (
          <KVCopy
            label={t("transactionHash", { defaultValue: "Transaction Hash" })}
            value={truncMid(tx.hash, 6)}
            rawCopy={tx.hash}
          />
        )}
      </View>

      {!!tx.alerts?.length && (
        <View style={[styles.block, styles.blockSpacer]}>
          {tx.alerts.map((a, i) => (
            <Text key={i} style={{ color: "#FFCC00", fontWeight: "700" }}>{a}</Text>
          ))}
        </View>
      )}

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
  const { t } = useTranslation("tx", { useSuspense: false });
  const handleCopy = async () => {
    if (!rawCopy) return;
    await Clipboard.setStringAsync(rawCopy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { showToast(t("copied", { defaultValue: "Copied" })); } catch {}
  };

  return (
    <Pressable onPress={handleCopy} style={styles.kvRow} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
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
  backgroundColor: glass.cardOnSheet,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: glass.cardBorder,
  gap: 8,
},
  blockSpacer: {
    marginTop: 12,
  },

  explorerBtn: {
    backgroundColor: "rgba(255,191,0,0.55)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  explorerBtnTxt: {
    color: "#0A1A24",
    fontSize: 15,
    fontWeight: "800",
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 28,
    gap: 25,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroTokenWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTokenScale: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 1.92 }], // make the token almost as big as the circle
  },
  heroTokenSmall: {
    position: "absolute",
    right: -6,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,26,36,0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,26,36,0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroTicker: {
    color: "#CFE3EC",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 8,
  },
  actionTxt: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 16,
    opacity: 0.9,
  },
kvRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 12,                // antes 6, mismo ritmo que listas
},
kvLabel: {
  color: "rgba(255,255,255,0.75)",
  fontWeight: "800",
  fontSize: 14,
},
kvVal: {
  color: "#CFE3EC",
  fontWeight: "700",
  fontSize: 14,
},
actionIcon: {
  width: 68, height: 68, borderRadius: 16,
  alignItems: "center", justifyContent: "center",
  backgroundColor: "#FFB703",
  shadowColor: "#000",
  shadowOpacity: 0.25,                // un pelín más para glass
  shadowRadius: 10,                   // antes 8
  shadowOffset: { width: 0, height: 7 },
  elevation: 8,
},
});