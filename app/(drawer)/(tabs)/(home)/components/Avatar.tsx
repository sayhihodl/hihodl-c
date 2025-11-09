// app/(drawer)/(tabs)/(home)/components/Avatar.tsx
// Avatar para pagos con badge de tipo

import React, { memo } from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../_lib/_dashboardShared";

interface AvatarProps {
  title: string;
  type: "in" | "out" | "refund" | "swap";
  photo?: any;
}

/**
 * Avatar para items de pago con badge indicando dirección
 */
const Avatar = memo(function Avatar({ title, type, photo }: AvatarProps) {
  const ch = (title || "")
    .replace(/^@/, "")
    .trim()
    .charAt(0)
    .toUpperCase() || "?";

  return (
    <View style={styles.paymentsAvatarWrap}>
      {photo ? (
        <Image source={photo} style={styles.paymentsAvatar} />
      ) : (
        <View style={[styles.paymentsAvatar, { backgroundColor: "#7CC2D1" }]}>
          <Text style={styles.paymentsAvatarInitial}>{ch}</Text>
        </View>
      )}
      <View style={styles.paymentsBadge}>
        {type === "in" && <Ionicons name="arrow-back" size={12} color="#081217" />}
        {type === "out" && <Ionicons name="arrow-forward" size={12} color="#081217" />}
        {type === "refund" && <Ionicons name="arrow-undo" size={12} color="#081217" />}
        {type === "swap" && <Ionicons name="swap-horizontal" size={12} color="#081217" />}
      </View>
    </View>
  );
});

export default Avatar;

