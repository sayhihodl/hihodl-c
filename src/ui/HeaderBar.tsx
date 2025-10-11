import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";

const { TEXT } = legacy;

type HeaderBarProps = {
  title: string;
  onLeftPress?: () => void;
  leftIcon?: "close" | "chevron-back";
  rightActions?: Array<{ icon: keyof typeof Ionicons.glyphMap; onPress: () => void; bubble?: boolean; a11y?: string }>;
  style?: ViewStyle;
};

export default function HeaderBar({
  title,
  onLeftPress,
  leftIcon = "chevron-back",
  rightActions = [],
  style,
}: HeaderBarProps) {
  return (
    <View style={[styles.topRow, style]}>
      <Pressable onPress={onLeftPress} hitSlop={10} style={styles.headerIconBtnBare} accessibilityLabel="Back">
        <Ionicons name={leftIcon} size={22} color={TEXT} />
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.rightBtns}>
        {rightActions.map((a, idx) => (
          <Pressable
            key={idx}
            onPress={a.onPress}
            hitSlop={10}
            style={a.bubble ? styles.headerIconBtn : styles.headerIconBtnBare}
            accessibilityLabel={a.a11y ?? "Action"}
          >
            <Ionicons name={a.icon} size={a.bubble ? 22 : 20} color={TEXT} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    height: 36, // ↓ antes 44 → más fino, Phantom-style
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 4, // un poco más compacto
  },
  headerIconBtnBare: {
    width: 30, // ↓ antes 36
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15, // sigue centrado
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rightBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // ↓ antes 8
  },
  title: {
    color: TEXT,
    fontSize: 16, // ↓ antes 18
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
});