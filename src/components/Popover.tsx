// components/Popover.tsx
import React from "react";
import { Modal, Pressable, View, StyleSheet, Platform } from "react-native";

export type AnchorRect = { x: number; y: number; w: number; h: number };

export default function Popover({
  visible,
  onClose,
  anchorRect,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  anchorRect: AnchorRect | null;
  children: React.ReactNode;
}) {
  // Mantener montado siempre; si no hay anchor aún, no renderizamos la tarjeta para evitar saltos
  const anchor = anchorRect;
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {anchor && (
        <View
          pointerEvents="box-none"
          style={[
            styles.card,
            {
              top: Math.max(16, anchor.y - 12),
              left: Math.max(12, anchor.x + anchor.w - CARD_W),
            },
          ]}
        >
          <View style={styles.caret} />
          {children}
        </View>
      )}
    </Modal>
  );
}

const CARD_W = 240;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "transparent" },
  card: {
    position: "absolute",
    width: CARD_W,
    backgroundColor: "rgba(10,25,35,0.98)",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    ...Platform.select({ ios: { zIndex: 9999 } }),
  },
  caret: {
    position: "absolute",
    right: 16,
    top: -6,
    width: 12,
    height: 12,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "rgba(10,25,35,0.98)",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
});