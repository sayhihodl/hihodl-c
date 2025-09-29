import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { legacy } from "@/theme/colors";

const { BG, SUB, SEPARATOR } = legacy;

/* UI */
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/* Mock */
export type Invite = {
  id: string;
  name: string;
  stepsDone: number; // 0..4
  status: "unlocked" | "expired" | "in_progress";
  invitedAt?: string; // ISO (opcional) para calcular deadline 7d
};
const MOCK: Invite[] = [
  { id: "1", name: "Alex Johnson", stepsDone: 2, status: "in_progress", invitedAt: new Date().toISOString() },
  { id: "2", name: "Blake Lee", stepsDone: 4, status: "unlocked", invitedAt: new Date(Date.now() - 2*86400000).toISOString() },
  { id: "3", name: "Casey Kim", stepsDone: 0, status: "expired", invitedAt: new Date(Date.now() - 10*86400000).toISOString() },
];

export default function PastInvites() {
  const goBack = () => router.back();

  const openDetail = (inv: Invite) => {
    router.push({
      pathname: "/(tabs)/referral/detail",
      params: {
        id: inv.id,
        name: inv.name,
        stepsDone: String(inv.stepsDone),
        status: inv.status,
        invitedAt: inv.invitedAt ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={goBack} style={s.iconBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={s.title}>Past invites</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* List */}
      <View style={s.card}>
        <FlatList
          data={MOCK}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => openDetail(item)} android_ripple={{ color: "transparent" }}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>
                  {item.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>
                  {item.status === "unlocked"
                    ? "Reward unlocked"
                    : item.status === "expired"
                    ? "Offer ended"
                    : `${item.stepsDone}/4 steps`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={SUB} />
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "900" },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 64 },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: SEPARATOR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#0A1A24", fontWeight: "900" },

  name: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sub: { color: SUB, fontSize: 12, marginTop: 2 },
});