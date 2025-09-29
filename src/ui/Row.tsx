import React from "react";
import { Pressable, Text, View, TextStyle, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { glass } from "@/ui/Glass";
import { legacy as legacyColors } from "@/theme/colors";

const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";

export type RowProps = {
  /** Ícono por defecto a la izquierda (si no usas leftSlot) */
  icon?: React.ComponentProps<typeof Ionicons>["name"] | null;
  /** Contenido custom a la izquierda (avatar, etc.). Si se provee, ignora icon */
  leftSlot?: React.ReactNode;
  /** Línea principal (cuando no usas labelNode) */
  label?: string;
  /** Nodo completo para la parte izquierda (para 2 líneas, etc.) */
  labelNode?: React.ReactNode;
  /** Texto o nodo a la derecha (estado/badge) */
  value?: React.ReactNode;
  /** Slot a la derecha (botón, badge, etc.). Ahora se renderiza ANTES del chevron */
  rightSlot?: React.ReactNode;

  rightIcon?: React.ComponentProps<typeof Ionicons>["name"] | null; // null para ocultar
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;

  /** Overrides */
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
};

export function Row({
  icon = "chevron-forward-outline", // no se usa si hay leftSlot
  leftSlot,
  label,
  labelNode,
  value,
  rightSlot,
  rightIcon = "chevron-forward",
  onPress,
  onLongPress,
  disabled = false,
  titleStyle,
  containerStyle,
}: RowProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      style={({ pressed }) => [
        glass.row,
        containerStyle,
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
      {/* Izquierda: avatar custom o icono */}
      {leftSlot ? (
        <View style={{ marginRight: 10 }}>{leftSlot}</View>
      ) : icon ? (
        <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 10 }} />
      ) : null}

      {/* Título / nodo de la izquierda */}
      {labelNode ? (
        <View style={{ flex: 1 }}>{labelNode}</View>
      ) : (
        <Text style={[glass.rowTitle, titleStyle]} numberOfLines={1}>
          {label}
        </Text>
      )}

      <View style={{ flex: 1 }} />

      {/* Valor a la derecha (texto simple o nodo) */}
      {value != null ? (
        typeof value === "string" || typeof value === "number" ? (
          <Text numberOfLines={1} style={[glass.rowSub, { marginRight: 8 }]}>{value}</Text>
        ) : (
          <View style={{ marginRight: 8 }}>{value}</View>
        )
      ) : null}

      {/* Slot a la derecha (badge/botón) */}
      {rightSlot ? <View style={{ marginRight: 6 }}>{rightSlot}</View> : null}

      {/* Chevron (si no lo ocultas con null) */}
      {rightIcon ? <Ionicons name={rightIcon} size={16} color={SUB} /> : null}
    </Pressable>
  );
}

export default Row;