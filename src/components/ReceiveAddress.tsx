import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";

const BG = "#0F0F1A";
const CARD = "#1B2D36";
const TEXT = "rgba(255,255,255,0.92)";
const SUB = "rgba(255,255,255,0.6)";
const SEPARATOR = "rgba(255,255,255,0.08)";
const BTN = "#8ECAE6";

type Props = {
  chain: "solana" | "ethereum" | "base" | "polygon" | "bitcoin" | "sui";
  address: string;
  tokenLabel?: string;
  allChains: Props["chain"][];
  onSelectChain: (c: Props["chain"]) => void;
  onShare: (address: string) => void | Promise<void>;
  onClose: () => void;
};

export default function ReceiveAddress({
  chain, address, tokenLabel, allChains, onSelectChain, onShare, onClose,
}: Props) {
  const copy = async () => {
    await Clipboard.setStringAsync(address);
    Alert.alert("Copied", "Address copied to clipboard");
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView edges={["top"]} style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}><Ionicons name="chevron-back" size={22} color={TEXT} /></Pressable>
          <Text style={styles.title}>Your {capitalize(chain)} Address</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.qrWrap}>
          <QRCode value={address} size={220} backgroundColor="transparent" />
        </View>

        <Text style={styles.helper}>
          Use this address to receive any token on <Text style={{ color: TEXT, fontWeight: "700" }}>{capitalize(chain)}</Text>.
        </Text>
        {tokenLabel ? <Text style={styles.tokenHint}>Selected: {tokenLabel}</Text> : null}

        {/* Address pill */}
        <View style={styles.addrRow}>
          <Text style={styles.addrText} numberOfLines={1}>{address}</Text>
          <Pressable onPress={copy} hitSlop={8}><Ionicons name="copy-outline" size={18} color={SUB} /></Pressable>
        </View>

        {/* Actions */}
        <Pressable style={styles.shareBtn} onPress={() => onShare(address)}>
          <Ionicons name="share-outline" size={16} color="#0B0B0B" />
          <Text style={styles.shareTxt}>Share</Text>
        </Pressable>

        {/* Chain quick switch (para usuarios perdidos) */}
        <View style={styles.switchRow}>
          {allChains.map((c) => (
            <Pressable
              key={c}
              onPress={() => onSelectChain(c)}
              style={[styles.switchPill, c === chain && { backgroundColor: BTN }]}
            >
              <Text style={[styles.switchTxt, c === chain && { color: "#0B0B0B", fontWeight: "700" }]}>
                {capitalize(c)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          ⚠️ Send only assets on {capitalize(chain)}. Sending other networks may result in loss of funds.
        </Text>
      </SafeAreaView>
    </View>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: BG, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
  title: { color: TEXT, fontSize: 16, fontWeight: "700" },
  qrWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 18 },
  helper: { color: SUB, textAlign: "center", paddingHorizontal: 20, marginTop: 6 },
  tokenHint: { color: TEXT, textAlign: "center", paddingHorizontal: 20, marginTop: 4, fontWeight: "700" },
  addrRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, padding: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: SEPARATOR,
  },
  addrText: { flex: 1, color: TEXT, fontFamily: "Courier", fontSize: 13 },
  shareBtn: {
    marginHorizontal: 16, marginTop: 10, height: 44, borderRadius: 14,
    backgroundColor: BTN, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
  },
  shareTxt: { color: "#0B0B0B", fontSize: 14, fontWeight: "700" },
  switchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginTop: 14 },
  switchPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" },
  switchTxt: { color: SUB, fontSize: 12 },
  disclaimer: { color: SUB, fontSize: 11, textAlign: "center", paddingHorizontal: 16, marginTop: 14, marginBottom: 4 },
});