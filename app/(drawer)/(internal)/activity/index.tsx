// app/(drawer)/(internal)/activity/index.tsx
// Pantalla de todas las actividades/transacciones del dashboard

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import colors, { alpha } from "@/theme/colors";
import type { PaymentItem, PaymentKind } from "@app/(drawer)/(tabs)/(home)/_lib/_dashboardShared";
import { PAYMENTS_MOCK } from "@app/(drawer)/(tabs)/(home)/_lib/_dashboardShared";
import { formatRelativeDate } from "@/utils/dashboard/formatting";
import Avatar from "@app/(drawer)/(tabs)/(home)/components/Avatar";
import { useDashboardI18n } from "@/hooks/useDashboardI18n";
import TxDetailsModal from "@/payments/TxDetailsModal";
import { TxDetails } from "@/components/tx/TransactionDetailsSheet";

const BG = colors.navBg;
const TEXT_DIM = "#9FB7C2";
const HIT = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const ACCOUNT_NAME: Record<string, string> = {
  daily: "Daily",
  savings: "Savings",
  social: "Social",
};

/* =========================  SCREEN  ========================= */
export default function AllActivityScreen() {
  const { account = "daily" } = useLocalSearchParams<{ account?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t: tt } = useDashboardI18n();

  // estado de búsqueda
  const [q, setQ] = useState("");
  // estado para transacción seleccionada
  const [selectedTx, setSelectedTx] = useState<TxDetails | null>(null);

  // Obtener todos los payments para la cuenta
  const allPayments = useMemo(() => {
    const accountName = ACCOUNT_NAME[String(account).toLowerCase()] || "Daily";
    return PAYMENTS_MOCK[accountName as keyof typeof PAYMENTS_MOCK] || [];
  }, [account]);

  // Filtrar por búsqueda
  const filteredPayments = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return allPayments;
    return allPayments.filter((p) => p.title.toLowerCase().includes(query));
  }, [allPayments, q]);

  // Abrir modal de detalles de transacción
  const handlePaymentPress = useCallback(
    async (payment: PaymentItem) => {
      await Haptics.selectionAsync();
      
      // Parsear amount para extraer token y cantidad
      // Formato: "+ USDT 19.00" o "- USDC 124.24"
      const amountMatch = payment.amount.match(/^([+-])\s*(\w+)\s+([\d.]+)$/);
      const tokenSymbol = amountMatch ? amountMatch[2] : undefined;
      const amountStr = amountMatch ? amountMatch[3] : "0";
      const isPositive = amountMatch ? amountMatch[1] === "+" : false;
      const tokenAmount = parseFloat(amountStr) * (isPositive ? 1 : -1);
      
      // Convertir fecha
      const date = typeof payment.date === "string" ? new Date(payment.date) : payment.date;
      const when = date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      // Convertir PaymentItem a TxDetails
      const txDetails: TxDetails = {
        id: payment.id,
        dir: payment.type === "in" ? "in" : payment.type === "out" ? "out" : "refund",
        when,
        peer: payment.title,
        tokenSymbol,
        tokenAmount,
        status: "Succeeded",
      };
      
      setSelectedTx(txDetails);
    },
    []
  );

  /* ---- render item ---- */
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PaymentItem>) => {
      return (
        <Pressable
          onPress={() => handlePaymentPress(item)}
          hitSlop={HIT}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title} transaction`}
        >
          <View style={styles.left}>
            <Avatar title={item.title} type={item.type} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.when} numberOfLines={1}>
                {formatRelativeDate(item.date, "en", tt)}
              </Text>
            </View>
          </View>
          <Text style={styles.amount}>{item.amount}</Text>
        </Pressable>
      );
    },
    [handlePaymentPress, tt]
  );

  const accountLabel = ACCOUNT_NAME[String(account).toLowerCase()] || "Daily";

  return (
    <View style={styles.container}>
      {/* Fondo + leve gradiente para coherencia con dashboard */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
      <LinearGradient
        colors={["rgba(255,255,255,0.03)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Recent Activity — {accountLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <View style={styles.searchWrap}>
          <BlurView style={StyleSheet.absoluteFill} intensity={30} tint="dark" />
          <Ionicons name="search-outline" size={18} color={TEXT_DIM} style={{ marginLeft: 12 }} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search activity..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.searchInput}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ("")} hitSlop={8} style={{ marginRight: 12 }}>
              <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        initialNumToRender={12}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: TEXT_DIM }}>No activity found.</Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      {selectedTx && (
        <TxDetailsModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </View>
  );
}

/* ========================= styles ========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  searchWrap: {
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: alpha("#FFFFFF", 0.08),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 15,
  },

  row: {
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(2, 48, 71, 0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  when: {
    color: TEXT_DIM,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 12,
  },

  sep: { height: 12 },
});

