// src/ui/Row.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet, StyleProp, TextStyle, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { glass } from "@/ui/Glass";
import { legacy as legacyColors } from "@/theme/colors";
import { tokens } from "@/lib/layout";

const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";

export type RowProps = {
  variant?: "default" | "list"; 
  icon?: React.ComponentProps<typeof Ionicons>["name"] | null;
  leftSlot?: React.ReactNode;
  label?: string;
  labelNode?: React.ReactNode;
  value?: React.ReactNode;
  rightSlot?: React.ReactNode;
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"] | null;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;

  /** Overrides */
  titleStyle?: StyleProp<TextStyle>;       // ← StyleProp
  containerStyle?: StyleProp<ViewStyle>;   // ← StyleProp
};

export default function Row({
  icon,
  leftSlot,
  label,
  labelNode,
  value,
  rightSlot,
  rightIcon,
  onPress,
  onLongPress,
  disabled = false,
  titleStyle,
  containerStyle,
}: RowProps) {
  // Solo mostrar icon por defecto si no hay leftSlot y no se especifica explícitamente icon={null}
  const showLeftIcon = leftSlot ? false : (icon !== null && icon !== undefined);
  const showRightIcon = rightIcon !== null && rightIcon !== undefined;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      style={({ pressed }) => [
        glass.row,
        containerStyle as ViewStyle,
        disabled && { opacity: 0.45 },
        pressed && !disabled && { backgroundColor: "rgba(255,255,255,0.03)" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={typeof label === "string" ? label : undefined}
      accessibilityState={{ disabled }}
      android_ripple={{ color: "transparent" }}
      hitSlop={10}
      disabled={disabled}
    >
      {leftSlot ? (
        <View style={styles.leftWrap}>{leftSlot}</View>
      ) : showLeftIcon ? (
        <Ionicons name={icon || "chevron-forward-outline"} size={18} color="#fff" style={styles.leftIcon} />
      ) : null}

      {labelNode ? (
        <View style={styles.centerWrap} pointerEvents="box-none">
          {labelNode}
        </View>
      ) : (
        <View style={styles.centerWrap} pointerEvents="box-none">
          <Text style={[glass.rowTitle, titleStyle]} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
        </View>
      )}

      {value != null &&
        (typeof value === "string" || typeof value === "number" ? (
          <Text numberOfLines={1} style={[glass.rowSub, styles.rightWrapText]} ellipsizeMode="tail">
            {value}
          </Text>
        ) : (
          <View style={styles.rightWrap}>{value}</View>
        ))}

      {rightSlot ? <View style={styles.rightWrap}>{rightSlot}</View> : null}

      {showRightIcon ? (
        <View style={styles.chevronWrap}>
          <Ionicons name={rightIcon || "chevron-forward-outline"} size={16} color={SUB} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leftWrap: { marginRight: 10 },
  leftIcon: { marginRight: 10 },
  centerWrap: { flex: 1, minWidth: 0, paddingRight: tokens.space[8], maxWidth: "55%" }, // Máximo 55% para el label
  rightWrap: { flexShrink: 0, alignItems: "flex-end", justifyContent: "center", minWidth: 0, maxWidth: "45%", paddingLeft: 4 }, // Máximo 45% para el valor
  rightWrapText: { flexShrink: 1, textAlign: "right", flex: 0, minWidth: 0, maxWidth: "100%" }, // No se expande, se trunca con ellipsis
  chevronWrap: { marginLeft: 6, flexShrink: 0 },
});