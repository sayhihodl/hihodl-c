// src/components/token/TokenTransactions.tsx
// Componente de transacciones recientes para la pantalla de detalles de token

import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Divider } from "@/ui/Glass";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import type { TxItem, NetworkKey } from "@/hooks/useTokenDetails";
import { formatFiat, shortDate } from "@/lib/format";
import { tokens } from "@/lib/layout";
import Avatar from "@app/(drawer)/(tabs)/(home)/components/Avatar";

type TxFilter = "all" | "send" | "receive" | "swap";

interface TokenTransactionsProps {
  items: TxItem[];
  enableFilterChips?: boolean;
  onPressItem?: (tx: TxItem) => void;
  onPressViewAll?: () => void;
  testID?: string;
}

// Backwards compatibility
const TokenTransactions = ({
  items,
  transactions,
  enableFilterChips = true,
  onPressItem,
  onTransactionPress,
  onPressViewAll,
  onViewAll,
  testID,
}: TokenTransactionsProps & { transactions?: TxItem[]; onTransactionPress?: (tx: TxItem) => void; onViewAll?: () => void }) => {

const networkLabel: Record<NetworkKey, string> = {
  solana: "SOL",
  base: "BASE",
  ethereum: "ETH",
  polygon: "POL",
};

  // Backwards compatibility
  const txList = items || transactions || [];
  const handleItemPress = onPressItem || onTransactionPress;
  const handleViewAll = onPressViewAll || onViewAll;
  
  // Sin filtros - mostrar todas las transacciones
  const filteredTransactions = txList;

  // Filtros eliminados - se manejarán en activity list

  const handlePress = async (tx: TxItem) => {
    await Haptics.selectionAsync();
    handleItemPress?.(tx);
  };

  const renderItem = ({ item }: ListRenderItemInfo<TxItem>) => {
    const isPositive = item.type === "receive";
    const isNegative = item.type === "send";
    
    // Mapear tipos de transacción a tipos del Avatar del dashboard
    // "in" = receive (arrow-back), "out" = send (arrow-forward), "swap" = swap (swap-horizontal)
    const avatarType: "in" | "out" | "refund" | "swap" = 
      item.type === "receive" ? "in" :
      item.type === "send" ? "out" :
      "swap";

    // Label: solo el username o wallet address
    let label = item.counterpartyLabel;
    
    // Meta text: tipo de transacción + fecha + network
    let typeLabel = "";
    if (item.type === "send") {
      typeLabel = "Sent";
    } else if (item.type === "receive") {
      typeLabel = "Received";
    } else {
      typeLabel = "Swapped";
    }
    
    const metaText = `${typeLabel} · ${shortDate(item.timestamp)}${item.network ? ` · ${networkLabel[item.network]}` : ""}`;

    // Asegurar signo consistente en token y fiat
    const tokenAmount = item.amountToken.startsWith("+") || item.amountToken.startsWith("-")
      ? item.amountToken
      : isPositive
      ? `+${item.amountToken}`
      : isNegative
      ? `-${item.amountToken}`
      : item.amountToken;

    const fiatAmount = item.amountUsd !== null
      ? (item.amountUsd >= 0 ? "+" : "") + formatFiat(Math.abs(item.amountUsd), { locale: "en-US" })
      : null;

    return (
      <View testID={`${testID}-tx-${item.id}`}>
        <Row
          label={label}
          labelNode={
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.txLabel} numberOfLines={1} ellipsizeMode="tail">
                {label}
              </Text>
              <Text style={styles.txMeta} numberOfLines={1} ellipsizeMode="tail">
                {metaText}
              </Text>
            </View>
          }
          value={
            <View style={styles.txValue}>
              <Text 
                style={[styles.txAmount, { color: isPositive ? "#20d690" : "#fff" }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {tokenAmount}
              </Text>
              {fiatAmount !== null && (
                <Text 
                  style={styles.txUsd}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {fiatAmount}
                </Text>
              )}
            </View>
          }
          leftSlot={
            <Avatar 
              title={item.counterpartyLabel} 
              type={avatarType}
            />
          }
          onPress={() => handlePress(item)}
          rightIcon={null}
          containerStyle={styles.txRow}
        />
      </View>
    );
  };

  if (txList.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={32} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyText}>No recent activity for this token</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
      </View>

      {/* Filtros eliminados - se manejan en activity list */}

      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions</Text>
          </View>
        }
      />
      {handleViewAll && (
        <View style={styles.viewAllContainer} testID={`${testID}-view-all`}>
          <CTAButton
            title="See full history"
            onPress={async () => {
              await Haptics.selectionAsync();
              handleViewAll();
            }}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>
      )}
    </View>
  );
};

export default TokenTransactions;

const styles = StyleSheet.create({
  container: {
    marginTop: tokens.space[16],
  },
  header: {
    marginBottom: tokens.space[16],
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  txRow: {
    paddingVertical: tokens.space[16],
  },
  txLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    minWidth: 0,
  },
  txMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  txValue: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
    minWidth: 0,
    maxWidth: "100%",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  txUsd: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  viewAllContainer: {
    marginTop: tokens.space[12],
  },
});

