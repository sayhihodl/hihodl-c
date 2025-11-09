// src/components/token/TokenActions.tsx
// Componente de acciones - Refactorizado como barra docked

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CTAButton } from "@/ui/CTAButton";
import type { TokenMeta } from "@/hooks/useTokenDetails";
import { tokens } from "@/lib/layout";

interface TokenActionsProps {
  variant: "docked" | "card";
  meta: TokenMeta;
  onSend?: () => void;
  onReceive?: () => void;
  onSwap?: () => void;
  disabledSwap?: boolean;
  testID?: string;
}

export default function TokenActions({
  variant,
  meta,
  onSend,
  onReceive,
  onSwap,
  disabledSwap = false,
  testID,
}: TokenActionsProps) {
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    await Haptics.selectionAsync();
    onSend?.();
  };

  const handleReceive = async () => {
    await Haptics.selectionAsync();
    onReceive?.();
  };

  const handleSwap = async () => {
    await Haptics.selectionAsync();
    onSwap?.();
  };

  if (variant === "docked") {
    return (
      <View
        style={[
          styles.dockedContainer,
          {
            marginBottom: insets.bottom,
          },
        ]}
        testID={testID}
      >
        <BlurView
          intensity={60}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.dockedContent}>
          <CTAButton
            title="Send"
            onPress={handleSend}
            variant="primary"
            leftIcon={<Ionicons name="arrow-up" size={18} color="#fff" />}
            fullWidth={false}
            style={styles.actionButton}
            size="md"
            accessibilityLabel={`Send ${meta.symbol}`}
            testID={`${testID}-send`}
          />

          <CTAButton
            title="Receive"
            onPress={handleReceive}
            variant="primary"
            leftIcon={<Ionicons name="arrow-down" size={18} color="#fff" />}
            fullWidth={false}
            style={styles.actionButton}
            size="md"
            accessibilityLabel={`Receive ${meta.symbol}`}
            testID={`${testID}-receive`}
          />

          <CTAButton
            title="Swap"
            onPress={handleSwap}
            variant="primary"
            leftIcon={<Ionicons name="swap-horizontal" size={18} color="#fff" />}
            fullWidth={false}
            style={styles.actionButton}
            size="md"
            disabled={disabledSwap}
            accessibilityLabel={`Swap ${meta.symbol}`}
            testID={`${testID}-swap`}
          />
        </View>
      </View>
    );
  }

  // Fallback a card variant (no usado pero mantenido por compatibilidad)
  return (
    <View style={styles.cardContainer}>
      <View style={styles.actions}>
        <CTAButton
          title="Send"
          onPress={handleSend}
          variant="primary"
          leftIcon={<Ionicons name="arrow-up" size={18} color="#fff" />}
          fullWidth={false}
          style={styles.actionButton}
          size="md"
          accessibilityLabel={`Send ${meta.symbol}`}
          testID={`${testID}-send`}
        />

        <CTAButton
          title="Receive"
          onPress={handleReceive}
          variant="primary"
          leftIcon={<Ionicons name="arrow-down" size={18} color="#fff" />}
          fullWidth={false}
          style={styles.actionButton}
          size="md"
          accessibilityLabel={`Receive ${meta.symbol}`}
          testID={`${testID}-receive`}
        />

        <CTAButton
          title="Swap"
          onPress={handleSwap}
          variant="primary"
          leftIcon={<Ionicons name="swap-horizontal" size={18} color="#fff" />}
          fullWidth={false}
          style={styles.actionButton}
          size="md"
          disabled={disabledSwap}
          accessibilityLabel={`Swap ${meta.symbol}`}
          testID={`${testID}-swap`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: tokens.space[12],
    paddingTop: tokens.space[12],
    paddingBottom: tokens.space[8],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dockedContent: {
    flexDirection: "row",
    gap: tokens.space[12],
  },
  actionButton: {
    flex: 1,
    minHeight: 44, // Touch target mínimo
  },
  cardContainer: {
    marginHorizontal: tokens.space[24],
    marginTop: tokens.space[16],
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space[12],
  },
});
