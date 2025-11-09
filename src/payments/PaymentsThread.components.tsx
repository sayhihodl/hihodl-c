/**
 * UI Components extracted from PaymentsThread
 */
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RecipientKind } from "@/send/types";
import type { AnyMsg } from "./PaymentsThread.types";
import { statusBadgeText } from "./PaymentsThread.utils";

const avatarStyles = StyleSheet.create({
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});

/** Determina el avatar/emoji según el tipo de destinatario */
export function AvatarContent({
  avatar,
  emoji,
  recipientKind,
  alias,
  name,
}: {
  avatar?: string;
  emoji?: string;
  recipientKind?: RecipientKind | "group" | "card";
  alias?: string;
  name?: string;
}) {
  if (avatar && !avatar.startsWith("emoji:")) {
    return <Image source={{ uri: String(avatar) }} style={avatarStyles.avatar} />;
  }

  if (emoji) {
    return (
      <View style={[avatarStyles.avatar, avatarStyles.avatarCircle]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
    );
  }

  if (avatar?.startsWith?.("emoji:")) {
    const e = avatar.split(":")[1] || "👤";
    return (
      <View style={[avatarStyles.avatar, avatarStyles.avatarCircle]}>
        <Text style={{ fontSize: 16 }}>{e}</Text>
      </View>
    );
  }

  if (recipientKind === "hihodl" || (alias && alias.startsWith("@"))) {
    const firstLetter = (alias?.replace("@", "") || name || "U").slice(0, 1).toUpperCase();
    return (
      <View style={[avatarStyles.avatar, avatarStyles.avatarCircle]}>
        <Text style={{ color: "#9CC6D1", fontWeight: "900", fontSize: 14 }}>
          {firstLetter}
        </Text>
      </View>
    );
  }

  let fallbackEmoji = "👤";
  if (recipientKind === "group") fallbackEmoji = "👥";
  else if (recipientKind === "evm" || recipientKind === "sol" || recipientKind === "tron")
    fallbackEmoji = "🔷";
  else if (recipientKind === "iban") fallbackEmoji = "🏦";
  else if (recipientKind === "card") fallbackEmoji = "💳";

  return (
    <View style={[avatarStyles.avatar, avatarStyles.avatarCircle]}>
      <Text style={{ fontSize: 16 }}>{fallbackEmoji}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: AnyMsg["status"] | "cancelled" }) {
  const label = statusBadgeText(status);
  const bg =
    status === "pending"
      ? "rgba(255,255,255,0.08)"
      : status === "confirmed"
      ? "rgba(46, 204, 113, 0.18)"
      : status === "failed"
      ? "rgba(231, 76, 60, 0.18)"
      : "rgba(149, 165, 166, 0.18)";
  const color =
    status === "pending"
      ? "#CFE3EC"
      : status === "confirmed"
      ? "#2ECC71"
      : status === "failed"
      ? "#E74C3C"
      : "#C8D2D9";
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg }}>
      <Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

