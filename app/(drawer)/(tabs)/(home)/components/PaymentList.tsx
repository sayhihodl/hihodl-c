// app/(drawer)/(tabs)/(home)/components/PaymentList.tsx
// Lista de pagos/actividad reciente del Dashboard

import React, { memo, useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import type { PaymentItem } from "../_lib/_dashboardShared";
import type { Account } from "@/hooks/useAccount";
import { formatRelativeDate } from "@/utils/dashboard/formatting";
import { styles } from "../_lib/_dashboardShared";
import Avatar from "./Avatar";
import { HIT_SLOP } from "@/constants/dashboard";

interface PaymentListProps {
  paymentsTop: PaymentItem[];
  account: Account;
  showViewAll: boolean;
  onPaymentPress: (payment: PaymentItem) => void;
  onViewAll: () => void;
  tt: (key: string, defaultValue?: string) => string;
  t: any;
}

/**
 * Lista de pagos/actividad reciente
 */
const PaymentList = memo(function PaymentList({
  paymentsTop,
  account,
  showViewAll,
  onPaymentPress,
  onViewAll,
  tt,
  t,
}: PaymentListProps) {
  const renderItem = useCallback(
    ({ item }: { item: PaymentItem }) => (
      <Pressable
        onPress={() => onPaymentPress(item)}
        style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.85 }]}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t("dashboard:a11y.openTx", {
          defaultValue: "Open {{title}} transaction",
          title: item.title,
        })}
      >
        <View style={styles.activityLeft}>
          <Avatar title={item.title} type={item.type} />
          <View>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityWhen}>{formatRelativeDate(item.date, "en", t)}</Text>
          </View>
        </View>
        <Text style={styles.activityAmt}>{item.amount}</Text>
      </Pressable>
    ),
    [onPaymentPress, tt, t]
  );

  const keyExtractor = useCallback((i: PaymentItem) => i.id, []);

  return (
    <FlatList
      data={paymentsTop}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      ListHeaderComponent={
        <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
            {tt("payments.recentActivity", "Recent activity")}
          </Text>
        </View>
      }
      renderItem={renderItem}
      ListFooterComponent={
        showViewAll ? (
          <Pressable
            onPress={onViewAll}
            style={{ paddingVertical: 14, alignItems: "center" }}
            hitSlop={8}
          >
            <Text style={styles.viewAll}>{tt("payments.viewAll", "View all")}</Text>
          </Pressable>
        ) : null
      }
    />
  );
});

export default PaymentList;

