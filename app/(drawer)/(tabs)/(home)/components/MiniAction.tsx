// app/(drawer)/(tabs)/(home)/components/MiniAction.tsx
// Componente de acción mini (Receive, Send, Swap, Cards)

import React, { memo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { HIT_SLOP } from "@/constants/dashboard";
import { styles } from "../_lib/_dashboardShared";

interface MiniActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

/**
 * Botón de acción mini para el hero del dashboard
 */
export const MiniAction = memo(function MiniAction({
  icon,
  label,
  onPress,
}: MiniActionProps) {
  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <Pressable
      style={styles.miniAction}
      onPress={handlePress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.miniIconWrap}>
        <Ionicons name={icon} size={20} color="#0A1A24" />
      </View>
      <Text style={styles.miniLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

export default MiniAction;

