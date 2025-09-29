import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import GlassScaffold, { type Account } from "@/components/Screen/GlassScaffold";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import BottomSheet from "@/components/BottomSheet/BottomSheet";

const { SUB } = legacy;

const NETWORKS = [
  { id: "sol", name: "Solana",   feeHint: "Up to $0.0004" },
  { id: "eth", name: "Ethereum", feeHint: "Varies" },
];

export default function SendConfirm() {
  const { tokenId, amount, to, account } = useLocalSearchParams<{
    tokenId: string; amount: string; to: string; account?: Account;
  }>();

  const [net, setNet] = useState<"sol" | "eth">("sol");
  const [sheetOpen, setSheetOpen] = useState(false);

  const tokenSym = useMemo(
    () => String(tokenId ?? "").split(".")[0].toUpperCase(),
    [tokenId]
  );

  const send = () => {
    // aquí iría biometría + envío real
    router.back();
  };

  return (
    <>
      <GlassScaffold
        title={`${amount} ${tokenSym}`}
        account={(account as Account) ?? "Daily"}
        centerTitle
        useScroll={true}
        wrapInGlass={false}
        footerSticky
        footer={
          <Pressable
            style={s.sendBtn}
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Text style={s.sendTxt}>Send</Text>
          </Pressable>
        }
      >
        <View style={{ alignItems: "center", marginTop: 8, marginBottom: 14 }}>
          <Ionicons name="rocket-sharp" size={42} color="#C8A33B" />
        </View>

        <View style={s.rowKV}>
          <Text style={s.k}>To</Text>
          <Text style={s.v} numberOfLines={1}>{to}</Text>
        </View>

        <View style={s.rowKV}>
          <Text style={s.k}>Network fee</Text>
          <Text style={s.v}>{net === "sol" ? "Up to $0.0004" : "Varies"}</Text>
        </View>

        <View style={[s.rowKV, { alignItems: "center" }]}>
          <Text style={s.k}>Network</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={s.v}>{net === "sol" ? "Solana" : "Ethereum"}</Text>
            <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
              <Text style={s.link}>Change Network</Text>
            </Pressable>
          </View>
        </View>
      </GlassScaffold>

      {/* BottomSheet: elegir red */}
      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        maxHeightPct={0.45}
        backgroundColor="#0E1A21"
        showHandle
      >
        <Text style={s.sheetTitle}>Choose network</Text>
        {NETWORKS.map((n) => {
          const active = (net === n.id);
          return (
            <Pressable
              key={n.id}
              onPress={() => { setNet(n.id as any); setSheetOpen(false); }}
              style={({ pressed }) => [s.netRow, active && s.netRowOn, pressed && { opacity: 0.9 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.netName}>{n.name}</Text>
                <Text style={s.netHint}>{n.feeHint}</Text>
              </View>
              {active
                ? <Ionicons name="checkmark-circle" size={20} color="#FFB703" />
                : <Ionicons name="ellipse-outline" size={20} color="#fff" />
              }
            </Pressable>
          );
        })}
      </BottomSheet>
    </>
  );
}

const s = StyleSheet.create({
  rowKV: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  k: { color: SUB, fontSize: 12, fontWeight: "500" },
  v: { color: "#fff", fontSize: 14, fontWeight: "600", maxWidth: "65%" },

  link: { color: "#FFB703", fontWeight: "800" },

  // footer sticky
  sendBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFB703",
    alignItems: "center",
    justifyContent: "center",
  },
  sendTxt: { color: "#081217", fontWeight: "900" },

  // sheet
  sheetTitle: { color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 8 },
  netRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  netRowOn: { borderWidth: 1, borderColor: "rgba(255,183,3,0.5)" },
  netName: { color: "#fff", fontWeight: "700" },
  netHint: { color: SUB, fontSize: 12, marginTop: 2 },
});