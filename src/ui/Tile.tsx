// src/ui/Tile.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legacy as legacyColors } from "@/theme/colors";

const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

/** Tile “grande” de acción (como los de Plan / Invite) */
export function Tile({
  icon,
  tint = "rgba(255,255,255,0.12)",
  title,
  sub,
  onPress,
  style,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tint?: string;                 // color de fondo del icon bubble
  title: string;
  sub?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [styles.card, style, pressed && { backgroundColor: "rgba(255,255,255,0.04)" }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {!!sub && <Text style={styles.sub} numberOfLines={2}>{sub}</Text>}
    </Pressable>
  );
}

/** Contenedor 2 columnas que mantiene el mismo gutter que las GlassCards */
export function TileRow2Up({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,                 // mismo espacio que entre items de tus lists
    marginHorizontal: 16,
  },
  card: {
    flex: 1,
    height: 124,             // ≈ alto “grande” como en tu referencia
    borderRadius: 18,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    padding: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sub:   { color: SUB,  fontSize: 13, marginTop: 4, lineHeight: 18 },
});