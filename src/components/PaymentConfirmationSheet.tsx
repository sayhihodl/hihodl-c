// src/components/PaymentConfirmationSheet.tsx
// Sheet de confirmación antes de enviar un pago con toda la información
import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import type { PaymentConfirmation } from "@/services/paymentEnhancements";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId } from "@/config/iconRegistry";

type Props = {
  visible: boolean;
  confirmation: PaymentConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function PaymentConfirmationSheet({
  visible,
  confirmation,
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onCancel}
      minHeightPct={0.6}
      maxHeightPct={0.9}
      scrimOpacity={0.9}
      sheetTintRGBA="rgba(2,48,71,0.95)"
      blurTopOnly={false}
      blurTopHeight={48}
      dismissOnScrimPress={false}
      ignoreKeyboard
      dragAnywhere={false}
      header={{
        height: 60,
        innerTopPad: 0,
        sideWidth: 60,
        centerWidthPct: 100,
        blurTint: "dark",
        showHandleTop: true,
        leftSlot: (
          <Pressable onPress={onCancel} hitSlop={10}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        ),
        center: (
          <Text style={styles.headerTitle}>Confirm Payment</Text>
        ),
        rightSlot: <View style={{ width: 60 }} />,
      }}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipient */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientIcon}>
              <Ionicons name="person" size={20} color="#FFB703" />
            </View>
            <Text style={styles.recipientText}>{confirmation.recipient}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <View style={styles.tokenIcon}>
              {renderTokenIcon(confirmation.tokenId, { size: 32, inner: 28, withCircle: false })}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.amountValue}>{fmt(confirmation.amount)}</Text>
              <Text style={styles.tokenSymbol}>
                {confirmation.tokenId.toUpperCase()} on {confirmation.chain.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Auto-bridge info */}
        {confirmation.autoBridge && (
          <View style={[styles.section, styles.bridgeSection]}>
            <View style={styles.bridgeHeader}>
              <Ionicons name="git-branch" size={16} color="#FFB703" />
              <Text style={styles.bridgeTitle}>Auto-Bridge</Text>
            </View>
            <Text style={styles.bridgeText}>
              {fmt(confirmation.autoBridge.bridgeAmount)} {confirmation.tokenId.toUpperCase()} will be bridged from{" "}
              {confirmation.autoBridge.fromChains.map((c) => c.toUpperCase()).join(" + ")} to{" "}
              {confirmation.chain.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Fees breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fees</Text>
          <View style={styles.feesRow}>
            <Text style={styles.feesLabel}>Network fee</Text>
            <Text style={styles.feesValue}>{fmt(confirmation.fees.networkFee)}</Text>
          </View>
          {confirmation.fees.bridgeFee && (
            <View style={styles.feesRow}>
              <Text style={styles.feesLabel}>Bridge fee</Text>
              <Text style={styles.feesValue}>{fmt(confirmation.fees.bridgeFee)}</Text>
            </View>
          )}
          <View style={[styles.feesRow, styles.feesTotal]}>
            <Text style={styles.feesLabel}>Total fees</Text>
            <Text style={styles.feesValue}>{fmt(confirmation.fees.total)}</Text>
          </View>
        </View>

        {/* Time estimate */}
        <View style={styles.section}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#9CB4C1" />
            <Text style={styles.timeText}>Estimated time: {confirmation.estimatedTime}</Text>
          </View>
        </View>

        {/* Warnings */}
        {confirmation.warnings && confirmation.warnings.length > 0 && (
          <View style={styles.warningsSection}>
            {confirmation.warnings.map((warning, idx) => (
              <View key={idx} style={styles.warning}>
                <Ionicons name="warning-outline" size={18} color="#FFB703" />
                <Text style={styles.warningText}>{warning.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Total */}
        <View style={[styles.section, styles.totalSection]}>
          <Text style={styles.totalLabel}>Total to send</Text>
          <Text style={styles.totalValue}>
            {fmt(confirmation.amount + confirmation.fees.total)} {confirmation.tokenId.toUpperCase()}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onConfirm}
          disabled={loading}
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        >
          {loading ? (
            <Text style={styles.confirmButtonText}>Sending...</Text>
          ) : (
            <>
              <Ionicons name="send" size={18} color="#0A1A24" />
              <Text style={styles.confirmButtonText}>Confirm & Send</Text>
            </>
          )}
        </Pressable>
        <Pressable onPress={onCancel} style={styles.cancelButton} disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#9CB4C1",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  recipientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,183,3,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recipientText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  tokenIcon: {
    marginRight: 12,
  },
  amountValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  tokenSymbol: {
    color: "#9CB4C1",
    fontSize: 14,
    fontWeight: "600",
  },
  bridgeSection: {
    backgroundColor: "rgba(255,183,3,0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,183,3,0.2)",
  },
  bridgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bridgeTitle: {
    color: "#FFB703",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  bridgeText: {
    color: "#CFE3EC",
    fontSize: 13,
    lineHeight: 18,
  },
  feesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  feesTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  feesLabel: {
    color: "#9CB4C1",
    fontSize: 14,
  },
  feesValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(156,180,193,0.1)",
    borderRadius: 8,
  },
  timeText: {
    color: "#9CB4C1",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "600",
  },
  warningsSection: {
    marginBottom: 24,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "rgba(255,183,3,0.1)",
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    color: "#FFB703",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  totalSection: {
    backgroundColor: "rgba(255,183,3,0.15)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,183,3,0.3)",
  },
  totalLabel: {
    color: "#FFB703",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  totalValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  actions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB703",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#0A1A24",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#9CB4C1",
    fontSize: 14,
    fontWeight: "600",
  },
});

