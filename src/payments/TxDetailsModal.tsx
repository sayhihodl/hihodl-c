// src/payments/TxDetailsModal.tsx
import React, { useRef } from "react";
import { View, ScrollView, StyleSheet, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import TransactionDetailsSheet, { TxDetails } from "@/components/tx/TransactionDetailsSheet";

export default function TxDetailsModal({
  tx,
  onClose,
}: {
  tx: TxDetails;
  onClose?: () => void;
}) {
  const dragGateRef = useRef<boolean>(true);

  return (
    <BottomKeyboardModal
      visible
      onClose={onClose ?? (() => {})}
      /* visual: igual que el sheet de token */
      scrimOpacity={0.85}
      blurIntensity={50}
      sheetTintRGBA="rgba(2,48,71,0.28)"
      blurTopOnly={false}
      blurTopHeight={48}
      /* interacción */
      dragAnywhere={false}
      dragCloseThreshold={100}
      dismissOnScrimPress={false}
      ignoreKeyboard
      dragGateRef={dragGateRef}
      /* tamaño */
      minHeightPct={0.88}
      maxHeightPct={0.94}
      /* header/handle centrado - estilo token selector */
      header={{
        height: 98,
        innerTopPad: -32,
        sideWidth: 45,
        centerWidthPct: 92,
        blurTint: "dark",
        overlayColor: "transparent",
        showHandleTop: true,
        centerHeaderContent: true,
        left: <View style={{ width: 45 }} />,
        center: (
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Transaction Details
            </Text>
          </View>
        ),
        right: (
          <Pressable onPress={onClose} hitSlop={10} style={{ width: 45, alignItems: "flex-end" }}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        ),
      }}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        onScroll={() => { /* arrastre en cualquier parte */ }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <TransactionDetailsSheet
          tx={tx}
          onReceive={() => {}}
          onSend={() => {}}
          onSwap={() => {}}
        />
      </ScrollView>
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 12 },
});