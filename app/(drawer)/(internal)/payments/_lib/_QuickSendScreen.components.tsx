/**
 * UI Components extracted from QuickSendScreen
 */
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SvgUri } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { ChainKey } from "@/config/sendMatrix";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId, iconKeyForTokenId } from "@/config/iconRegistry";
import { TOKEN_ALLOWED_CHAINS, normalizeTokenId } from "@/config/sendMatrix";
import ExtraBadge from "@assets/chains/extra-chain.svg";

const styles = StyleSheet.create({
  chainCountBadge: {
    width: 14,
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chainCountText: {
    position: "absolute",
    color: "#000",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
  },
  chainCountBadgeContainer: {
    position: "absolute",
    left: "50%",
    marginLeft: -7,
    bottom: -6,
    zIndex: 10,
  },
  chainMini: {
    position: "absolute",
    right: -3,
    bottom: -6,
  },
  chainMiniBg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  kbWrap: { gap: 8 },
  presetsRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  presetChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  presetTxt: { color: "#fff", fontWeight: "800" },
  kbRow: { flexDirection: "row", gap: 8 },
  kbKey: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  kbKeyDisabled: { opacity: 0.5 },
  kbKeyTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

/* ============ Badge de número de chains (estilo de la imagen) ============ */
export function ChainCountBadge({ count }: { count: number }) {
  if (count <= 1) return null;

  return (
    <View style={styles.chainCountBadge}>
      <ExtraBadge width={14} height={12} />
      <Text style={styles.chainCountText}>{count}</Text>
    </View>
  );
}

/* ============ token icon + mini-badge, sin aro blanco ============ */
export function TokenWithMini({ tokenId, chain, iconUrl }: { tokenId?: string; chain?: ChainKey; iconUrl?: string }) {
  if (!tokenId) return <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" }} />;
  const iconKey = iconKeyForTokenId(tokenId) || tokenId;
  const isSvg = typeof iconUrl === "string" && iconUrl.trim().toLowerCase().endsWith(".svg");

  const normalized = normalizeTokenId(tokenId);
  const availableChains = normalized ? TOKEN_ALLOWED_CHAINS[normalized] || [] : [];
  const chainCount = availableChains.length;

  return (
    <View style={{ width: 36, height: 36, position: "relative" }}>
      {iconUrl ? (
        isSvg ? (
          <SvgUri width={36} height={36} uri={iconUrl} />
        ) : (
          <Image
            source={{ uri: iconUrl }}
            style={{ width: 36, height: 36, borderRadius: 8 }}
            resizeMode="cover"
          />
        )
      ) : (
        renderTokenIcon(String(iconKey), { size: 36, inner: 32, withCircle: false })
      )}

      {chainCount > 1 && (
        <View style={styles.chainCountBadgeContainer}>
          <ChainCountBadge count={chainCount} />
        </View>
      )}

      {chain && (
        <View style={styles.chainMini}>
          <View style={styles.chainMiniBg}>
            {renderChainBadge(mapChainKeyToChainId(chain), { size: 14, chip: false })}
          </View>
        </View>
      )}
    </View>
  );
}

/* ============ Keypad con presets ============ */
export function QuickAmountPad({
  onPressKey, onPreset, onBackspace, disabled,
}: {
  onPressKey: (k: string) => void;
  onPreset: (n: number) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const row = (keys: Array<string | "back">) => (
    <View style={styles.kbRow}>
      {keys.map((k) =>
        k === "back" ? (
          <Pressable key="back" style={[styles.kbKey, disabled && styles.kbKeyDisabled]} onPress={disabled ? undefined : onBackspace}>
            <Ionicons name="backspace-outline" size={18} color="#CFE3EC" />
          </Pressable>
        ) : (
          <Pressable key={k} style={[styles.kbKey, disabled && styles.kbKeyDisabled]} onPress={() => (!disabled ? onPressKey(k) : undefined)}>
            <Text style={styles.kbKeyTxt}>{k}</Text>
          </Pressable>
        )
      )}
    </View>
  );

  return (
    <View style={styles.kbWrap}>
      <View style={styles.presetsRow}>
        {[10, 20, 50, 100].map((v) => (
          <Pressable key={v} style={styles.presetChip} onPress={() => onPreset(v)}>
            <Text style={styles.presetTxt}>+{v}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.presetChip, { flex: 1.2 }]} onPress={() => onPreset(Number.POSITIVE_INFINITY)}>
          <Text style={styles.presetTxt}>MAX</Text>
        </Pressable>
      </View>
      {row(["1", "2", "3"])}
      {row(["4", "5", "6"])}
      {row(["7", "8", "9"])}
      {row([".", "0", "back"])}
    </View>
  );
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

