// src/components/token/TokenQuickActions.tsx
// Quick actions usando MiniAction del dashboard

import React from "react";
import { View, StyleSheet } from "react-native";
import { MiniAction } from "@app/(drawer)/(tabs)/(home)/components/MiniAction";
import { tokens } from "@/lib/layout";

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  onPress: () => void;
}

interface TokenQuickActionsProps {
  actions: QuickAction[];
  testID?: string;
}

export default function TokenQuickActions({ actions, testID }: TokenQuickActionsProps) {
  return (
    <View style={styles.container} testID={testID}>
      {actions.map((action) => (
        <MiniAction
          key={action.id}
          icon={action.icon}
          label={action.label}
          onPress={action.onPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: tokens.space[12],
    marginTop: tokens.space[16],
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
