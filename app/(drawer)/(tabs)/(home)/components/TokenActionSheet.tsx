// app/(drawer)/(tabs)/(home)/components/TokenActionSheet.tsx
// Sheet que aparece cuando se selecciona un token sin balance

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/theme/colors";
import type { Account } from "@/hooks/useAccount";
import { accountToId } from "@/hooks/useAccount";
import { getChainId } from "@/config/chainMapping";
import { normalizeChainId } from "@/utils/dashboard/tokenHelpers";
import type { CurrencyId } from "@/store/portfolio.store";
import { buildTokenTargetKey } from "../_lib/_dashboardShared";

interface TokenActionSheetProps {
  tokenId: string;
  chain: string;
  account: Account;
  onClose: () => void;
  onTokenDetails: (tokenKey: string) => void;
  guardNav: (fn: () => void) => void;
}

/**
 * Sheet que muestra opciones cuando se selecciona un token sin balance
 */
export default function TokenActionSheet({
  tokenId,
  chain,
  account,
  onClose,
  onTokenDetails,
  guardNav,
}: TokenActionSheetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {tokenId.toUpperCase()} (No balance)
      </Text>
      <Text style={styles.subtitle}>
        You don't have {tokenId.toUpperCase()} in your {account} account. What would you like to do?
      </Text>

      <Pressable
        onPress={() => {
          onClose();
          guardNav(() => {
            router.navigate({
              pathname: "/(drawer)/(internal)/receive",
              params: {
                account: accountToId(account),
                token: tokenId,
                chain: chain,
              },
            });
          });
        }}
        style={styles.actionButton}
      >
        <Ionicons name="qr-code-outline" size={24} color={colors.sheetText} />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Receive</Text>
          <Text style={styles.actionSubtitle}>
            Get {tokenId.toUpperCase()} sent to your wallet
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.sheetTextDim} />
      </Pressable>

      <Pressable
        onPress={() => {
          onClose();
          guardNav(() => {
            router.navigate({
              pathname: "/(drawer)/(tabs)/swap",
              params: {
                account: accountToId(account),
                toToken: tokenId,
                toChain: chain,
              },
            });
          });
        }}
        style={styles.actionButton}
      >
        <Ionicons name="swap-horizontal" size={24} color={colors.sheetText} />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Swap</Text>
          <Text style={styles.actionSubtitle}>
            Exchange other tokens for {tokenId.toUpperCase()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.sheetTextDim} />
      </Pressable>

      <Pressable
        onPress={() => {
          onClose();
          guardNav(() => {
            const chainId = getChainId(chain as any);
            const tokenKey = buildTokenTargetKey({
              id: tokenId as CurrencyId,
              chainId: normalizeChainId(chainId),
              accountId: accountToId(account),
            });
            onTokenDetails(tokenKey);
          });
        }}
        style={[styles.actionButton, styles.lastButton]}
      >
        <Ionicons name="information-circle-outline" size={24} color={colors.sheetText} />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>View Details</Text>
          <Text style={styles.actionSubtitle}>
            Learn more about {tokenId.toUpperCase()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.sheetTextDim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    color: colors.sheetText,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.sheetTextDim,
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  lastButton: {
    marginBottom: 0,
  },
  actionContent: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    color: colors.sheetText,
    fontWeight: "700",
    fontSize: 16,
  },
  actionSubtitle: {
    color: colors.sheetTextDim,
    fontSize: 12,
    marginTop: 2,
  },
});

