// app/(drawer)/(internal)/payments/ConfirmPaymentScreen.tsx
// Pantalla completa de confirmación para pagos a wallets externas (no HiHODL users)
import React, { useMemo, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import CTAButton from "@/ui/CTAButton";
import { legacy } from "@/theme/colors";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId, iconKeyForTokenId } from "@/config/iconRegistry";
import type { ChainKey } from "@/config/sendMatrix";
import { fmt } from "@/utils/format";
import { validateFeeBalance, findBestTokenForFees } from "@/services/feeBalanceValidation";

type ConfirmPaymentScreenParams = {
  to: string;
  tokenId: string;
  chain: ChainKey;
  amount: string;
  account: "daily" | "savings" | "social";
  autoBridge?: string; // JSON stringified autoBridgePlan
};

export default function ConfirmPaymentScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ConfirmPaymentScreenParams>();
  
  const {
    to = "",
    tokenId = "",
    chain = "solana" as ChainKey,
    amount = "0",
    account = "daily",
    autoBridge,
  } = params;

  const autoBridgePlan = useMemo(() => {
    if (!autoBridge) return null;
    try {
      return JSON.parse(autoBridge) as Array<{ chain: ChainKey; amount: number }>;
    } catch {
      return null;
    }
  }, [autoBridge]);

  const amountNum = parseFloat(amount.replace(",", "."));
  const uiSymbol = tokenId.toUpperCase();
  const iconKey = iconKeyForTokenId(tokenId) || tokenId;

  // Calcular fees estimadas
  const feePct = chain === "solana" ? 0.001 : chain === "base" ? 0.002 : 0.003;
  const feeAmount = amountNum * feePct;

  // Obtener balances del usuario
  const [userBalances, setUserBalances] = useState<Record<string, Partial<Record<ChainKey, number>>>>({});
  const [balanceCheck, setBalanceCheck] = useState<ReturnType<typeof validateFeeBalance> | null>(null);
  
  useEffect(() => {
    try {
      // Usar require dinámico exactamente como en QuickSendScreen y StepToken
      const { useBalancesStore } = require("@/store/balances");
      const balancesFlat = useBalancesStore.getState().flat || [];
      
      // Formatear balances
      const byToken: Record<string, Partial<Record<ChainKey, number>>> = {};
      for (const b of balancesFlat as any[]) {
        const id = (b.tokenId || "").toLowerCase();
        if (!byToken[id]) byToken[id] = {};
        byToken[id][b.chain as ChainKey] = (byToken[id][b.chain as ChainKey] || 0) + (b.amount || 0);
      }
      
      setUserBalances(byToken);
      
      // Validar balance
      const check = validateFeeBalance({
        tokenId,
        chain,
        amount: amountNum,
        feeAmount,
        userBalances: byToken,
        account,
      });
      
      setBalanceCheck(check);
    } catch (e) {
      console.error("[ConfirmPaymentScreen] Error loading balances:", e);
    }
  }, [tokenId, chain, amountNum, feeAmount, account]);

  const balanceOnChain = userBalances[tokenId.toLowerCase()]?.[chain] ?? 0;

  const handleConfirm = async () => {
    // Validar balance antes de confirmar
    if (balanceCheck && !balanceCheck.hasSufficientBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You need ${fmt(balanceCheck.amountNeeded, 6)} ${uiSymbol} but only have ${fmt(balanceOnChain, 6)} ${uiSymbol}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy Crypto",
            onPress: () => {
              router.push({
                pathname: "/(drawer)/(tabs)/buy" as any,
                params: { tokenId, chain },
              });
            },
          },
        ]
      );
      return;
    }
    
    // Si hay balance suficiente, ejecutar el envío
    router.setParams({ confirmed: "true", executeSend: "true" });
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1820" }}>
      <ScreenBg />
      <GlassHeader
        title="Confirm Payment"
        onBack={handleCancel}
        style={{ paddingTop: insets.top }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Recipient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          <View style={styles.recipientCard}>
            <View style={styles.recipientIcon}>
              <Ionicons name="wallet" size={24} color="#4CAF50" />
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientLabel}>External Wallet</Text>
              <Text style={styles.recipientAddress} numberOfLines={1} ellipsizeMode="middle">
                {to}
              </Text>
            </View>
            <View style={styles.externalBadge}>
              <Text style={styles.externalBadgeText}>EXTERNAL</Text>
            </View>
          </View>
        </View>

        {/* Amount & Token */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountValue}>{fmt(amountNum, 6)}</Text>
              <Text style={styles.amountSymbol}>{uiSymbol}</Text>
            </View>
            <View style={styles.tokenRow}>
              {renderTokenIcon(String(iconKey), { size: 32, inner: 28, withCircle: false })}
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{uiSymbol}</Text>
                <View style={styles.chainBadge}>
                  {renderChainBadge(mapChainKeyToChainId(chain), { size: 16, chip: false })}
                  <Text style={styles.chainText}>{chain.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Amount and Fees (separados, no total) */}
        <View style={styles.section}>
          <View style={styles.amountFeeRow}>
            <Text style={styles.amountLabel}>Sending</Text>
            <Text style={styles.amountFeeValue}>{fmt(amountNum, 6)} {uiSymbol}</Text>
          </View>
          <View style={styles.amountFeeRow}>
            <Text style={styles.feesLabel}>Network Fee</Text>
            <Text style={styles.feesValue}>~{fmt(feeAmount, 6)} {uiSymbol}</Text>
          </View>
        </View>

        {/* Balance Validation & Solutions */}
        {balanceCheck && !balanceCheck.hasSufficientBalance && (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#FF7676" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Insufficient Balance</Text>
                <Text style={styles.warningDesc}>
                  You need {fmt(balanceCheck.amountNeeded, 6)} {uiSymbol} but only have {fmt(balanceOnChain, 6)} {uiSymbol}.
                </Text>
              </View>
            </View>

            {/* Soluciones */}
            <View style={styles.solutionsContainer}>
              {/* Solución 1: Usar otro token para pagar fees */}
              {balanceCheck.canPayFeesFromOtherToken && balanceOnChain >= amountNum && (
                <Pressable
                  style={styles.solutionCard}
                  onPress={() => {
                    const bestToken = findBestTokenForFees(feeAmount, userBalances, chain);
                    if (bestToken) {
                      Alert.alert(
                        "Pay Fees with " + bestToken.tokenId.toUpperCase(),
                        `Use ${fmt(bestToken.balance, 6)} ${bestToken.tokenId.toUpperCase()} to cover the ${fmt(feeAmount, 6)} ${uiSymbol} network fee?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Use It",
                            onPress: () => {
                              // TODO: Actualizar parámetros para usar este token para fees
                              // Por ahora, solo mostramos la opción
                              Alert.alert("Coming Soon", "This feature will automatically use the alternative token for fees.");
                            },
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Ionicons name="swap-horizontal" size={18} color="#FFB703" />
                  <View style={styles.solutionText}>
                    <Text style={styles.solutionTitle}>Pay fees with another token</Text>
                    <Text style={styles.solutionDesc}>
                      Use {balanceCheck.alternativeTokens[0]?.tokenId.toUpperCase()} to cover network fees
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#AFC9D6" />
                </Pressable>
              )}

              {/* Solución 2: Comprar más crypto */}
              <Pressable
                style={styles.solutionCard}
                onPress={() => {
                  router.push({
                    pathname: "/(drawer)/(tabs)/buy" as any,
                    params: { tokenId, chain },
                  });
                }}
              >
                <Ionicons name="card-outline" size={18} color="#4CAF50" />
                <View style={styles.solutionText}>
                  <Text style={styles.solutionTitle}>Buy more crypto</Text>
                  <Text style={styles.solutionDesc}>
                    Purchase {fmt(balanceCheck.missingAmount, 6)} {uiSymbol} to complete payment
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#AFC9D6" />
              </Pressable>

              {/* Solución 3: Cambiar de token */}
              {balanceCheck.alternativeTokens.length > 0 && (
                <Pressable
                  style={styles.solutionCard}
                  onPress={() => {
                    router.back();
                    // Volver a QuickSendScreen con el token alternativo
                  }}
                >
                  <Ionicons name="refresh-outline" size={18} color="#FFB703" />
                  <View style={styles.solutionText}>
                    <Text style={styles.solutionTitle}>Use different token</Text>
                    <Text style={styles.solutionDesc}>
                      Switch to {balanceCheck.alternativeTokens[0]?.tokenId.toUpperCase()} to send payment
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#AFC9D6" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Auto-Bridge Info */}
        {autoBridgePlan && autoBridgePlan.length > 0 && (
          <View style={styles.section}>
            <View style={styles.bridgeCard}>
              <Ionicons name="swap-horizontal" size={20} color="#FFB703" />
              <Text style={styles.bridgeTitle}>Auto-Bridge Enabled</Text>
            </View>
            <Text style={styles.bridgeDesc}>
              Funds will be automatically bridged from multiple networks to complete this payment.
            </Text>
            <View style={styles.bridgePlan}>
              {autoBridgePlan.map((p, idx) => (
                <View key={idx} style={styles.bridgePlanItem}>
                  <Text style={styles.bridgePlanAmount}>{fmt(p.amount, 6)} {uiSymbol}</Text>
                  <Text style={styles.bridgePlanChain}>{p.chain.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>From Account</Text>
            <Text style={styles.accountValue}>{account === "daily" ? "Daily" : account === "savings" ? "Savings" : "Social"}</Text>
          </View>
        </View>

        {/* Warnings */}
        <View style={styles.warningCard}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>External Wallet Payment</Text>
            <Text style={styles.warningDesc}>
              This payment will be sent to an external crypto wallet. Please verify the address is correct.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 16,
            paddingTop: 16,
          },
        ]}
      >
        <CTAButton
          title={balanceCheck && !balanceCheck.hasSufficientBalance ? "Insufficient Balance" : "Confirm & Send"}
          onPress={handleConfirm}
          variant="primary"
          backdrop="solid"
          color={balanceCheck && !balanceCheck.hasSufficientBalance ? "#FF7676" : "#FFB703"}
          labelColor="#0A1A24"
          fullWidth
          size="lg"
          disabled={balanceCheck ? !balanceCheck.hasSufficientBalance : false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: legacy.SUB,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76,175,80,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  recipientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(76,175,80,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientLabel: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  recipientAddress: {
    color: "#CFE3EC",
    fontSize: 14,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  externalBadge: {
    backgroundColor: "rgba(76,175,80,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  externalBadgeText: {
    color: "#4CAF50",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amountCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  // amountRow para el card interno (grande)
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  amountValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginRight: 8,
  },
  amountSymbol: {
    color: legacy.SUB,
    fontSize: 24,
    fontWeight: "600",
  },
  // amountFeeRow para la sección de "Sending" y "Network Fee" (separados, no total)
  amountFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  amountLabel: {
    color: legacy.SUB,
    fontSize: 14,
    fontWeight: "600",
  },
  amountFeeValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  chainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chainText: {
    color: legacy.SUB,
    fontSize: 12,
    fontWeight: "500",
  },
  feesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  feesLabel: {
    color: legacy.SUB,
    fontSize: 14,
  },
  feesValue: {
    color: "#CFE3EC",
    fontSize: 14,
    fontWeight: "600",
  },
  feesTotal: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  bridgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,183,3,0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,183,3,0.3)",
  },
  bridgeTitle: {
    color: "#FFB703",
    fontSize: 14,
    fontWeight: "600",
  },
  bridgeDesc: {
    color: legacy.SUB,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  bridgePlan: {
    marginTop: 12,
    gap: 8,
  },
  bridgePlanItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  bridgePlanAmount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bridgePlanChain: {
    color: legacy.SUB,
    fontSize: 12,
    fontWeight: "500",
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  accountLabel: {
    color: legacy.SUB,
    fontSize: 14,
  },
  accountValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  warningCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,118,118,0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,118,118,0.3)",
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    color: "#FF7676",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  warningDesc: {
    color: legacy.SUB,
    fontSize: 12,
    lineHeight: 18,
  },
  solutionsContainer: {
    marginTop: 12,
    gap: 12,
  },
  solutionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  solutionText: {
    flex: 1,
  },
  solutionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  solutionDesc: {
    color: legacy.SUB,
    fontSize: 12,
    lineHeight: 16,
  },
  ctaContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: "rgba(13,24,32,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
});

