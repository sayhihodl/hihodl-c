// src/components/ReceiveSheet.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Share } from "react-native";
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

export type ChainKey = "solana" | "ethereum" | "base" | "polygon" | "bitcoin" | "sui";

type Props = {
  token?: { symbol: string; name: string };
  chain: ChainKey;
  chains: ChainKey[];
  addresses: Record<ChainKey, string>;
  onSelectChain: (c: ChainKey) => void;
  onClose: () => void;
};

export default function ReceiveSheet({ token, chain, chains, addresses, onSelectChain, onClose }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const addr = addresses[chain];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop clickable para cerrar */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* “Sheet” fijo pegado abajo (sin drag) */}
      <SafeAreaView edges={["bottom", "left", "right"]} style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}><Ionicons name="chevron-down" size={22} color={TEXT} /></Pressable>
          <Text style={styles.title}>Your {capitalize(chain)} address</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Selector de red */}
        <View style={styles.selectorWrap}>
          <Pressable style={styles.selector} onPress={() => setShowDropdown(v => !v)}>
            <Text style={styles.selectorTxt}>{capitalize(chain)}</Text>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={SUB} />
          </Pressable>
          {showDropdown && (
            <View style={styles.dropdown}>
              {chains.map((c) => (
                <Pressable key={c} style={[styles.dropItem, c === chain && { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => { setShowDropdown(false); onSelectChain(c); }}>
                  <Text style={styles.dropTxt}>{capitalize(c)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* QR */}
        <View style={styles.qrWrap}>
          <QRCode value={addr} size={220} backgroundColor="transparent" />
        </View>
        <Text style={styles.helper}>
          Use this address to receive any token on <Text style={{ color: TEXT, fontWeight: "700" }}>{capitalize(chain)}</Text>.
        </Text>

        {/* Address + acciones */}
        <View style={styles.addrRow}>
          <Text style={styles.addrText} numberOfLines={1}>{addr}</Text>
          <Pressable onPress={async () => { await Clipboard.setStringAsync(addr); }} hitSlop={8}>
            <Ionicons name="copy-outline" size={18} color={SUB} />
          </Pressable>
        </View>

        <Pressable style={styles.shareBtn} onPress={() => Share.share({ message: addr })}>
          <Ionicons name="share-outline" size={16} color="#0B0B0B" />
          <Text style={styles.shareTxt}>Share</Text>
        </Pressable>

        <Text style={styles.disclaimer}>⚠️ Send only assets on {capitalize(chain)}.</Text>
      </SafeAreaView>
    </Modal>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: BG, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { color: TEXT, fontSize: 16, fontWeight: "800" },
  selectorWrap: { paddingHorizontal: 16, marginTop: 6 },
  selector: { height: 44, borderRadius: 12, backgroundColor: CARD, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectorTxt: { color: TEXT, fontSize: 14, fontWeight: "700" },
  dropdown: { marginTop: 6, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: SEPARATOR, overflow: "hidden" },
  dropItem: { paddingHorizontal: 12, paddingVertical: 12 },
  dropTxt: { color: TEXT, fontSize: 14 },
  qrWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 18 },
  helper: { color: SUB, textAlign: "center", paddingHorizontal: 20, marginTop: 6 },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, padding: 12, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: SEPARATOR },
  addrText: { flex: 1, color: TEXT, fontFamily: "Courier", fontSize: 13 },
  shareBtn: { marginHorizontal: 16, marginTop: 10, height: 44, borderRadius: 14, backgroundColor: BTN, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  shareTxt: { color: "#0B0B0B", fontSize: 14, fontWeight: "700" },
  disclaimer: { color: SUB, fontSize: 11, textAlign: "center", paddingHorizontal: 16, marginTop: 14 },
});