// app/(tabs)/send/confirm.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import GlassScaffold, { type Account } from "@/components/Screen/GlassScaffold";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import BottomSheet from "@/components/BottomSheet/BottomKeyboardModal";

const { SUB } = legacy;

type NetKey = "sol" | "eth";

const NETWORKS: Array<{ id: NetKey; name: string; feeHint: string }> = [
  { id: "sol", name: "Solana",   feeHint: "Up to $0.0004" },
  { id: "eth", name: "Ethereum", feeHint: "Varies" },
];

// normaliza cadenas a nuestro union
function normalizeNet(n?: string): NetKey {
  const v = (n || "").toLowerCase();
  if (v === "sol" || v === "solana") return "sol";
  if (v === "eth" || v === "ethereum") return "eth";
  return "sol";
}

export default function SendConfirm() {
  const { tokenId, amount, to, account, network } = useLocalSearchParams<{
    tokenId: string; amount: string; to: string; account?: Account; network?: string;
  }>();

  const [net, setNet] = useState<NetKey>(normalizeNet(network));
  const [sheetOpen, setSheetOpen] = useState(false);

  const tokenSym = useMemo(
    () => String(tokenId ?? "").split(".")[0].toUpperCase(),
    [tokenId]
  );

  const send = () => {
    // biometría + envío real irían aquí
    router.back();
  };

  const feeText = net === "sol" ? "Up to $0.0004" : "Varies";
  const netName = net === "sol" ? "Solana" : "Ethereum";

  // Alias "any" local solo para este archivo (evita errores de tipo sin tocar el componente global)
  const AnySheet = BottomSheet as unknown as React.ComponentType<any>;

  return (
    <>
      <GlassScaffold
        title={`${amount} ${tokenSym}`}
        account={(account as Account) ?? "Daily"}
        centerTitle
        useScroll
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
          <Text style={s.v}>{feeText}</Text>
        </View>

        <View style={[s.rowKV, { alignItems: "center" }]}>
          <Text style={s.k}>Network</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={s.v}>{netName}</Text>
            <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
              <Text style={s.link}>Change Network</Text>
            </Pressable>
          </View>
        </View>
      </GlassScaffold>

      {/* BottomSheet: elegir red */}
      <AnySheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        maxHeightPct={0.45}
        glassTintRGBA="#0E1A21"
        backdropOpacity={0.5}
      >
        {/* “manija” del sheet */}
        <View style={s.handle} />

        <Text style={s.sheetTitle}>Choose network</Text>
        {NETWORKS.map((n) => {
          const active = net === n.id;
          return (
            <Pressable
              key={n.id}
              onPress={() => { setNet(n.id); setSheetOpen(false); }}
              style={({ pressed }) => [s.netRow, active && s.netRowOn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${n.name}`}
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
      </AnySheet>
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
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 6,
    marginBottom: 10,
  },
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