// app/(drawer)/(internal)/cards/request.tsx
// Pantalla para solicitar una nueva Stable Card

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import ScreenBg from "@/ui/ScreenBg";
import { CTAButton } from "@/ui/CTAButton";
import { useStableCards } from "@/hooks/useStableCards";
import { useWallets } from "@/hooks/useWallets";
import { listAccounts } from "@/services/api/accounts.service";
import type { AccountType, Wallet } from "@/types/api";
import colors from "@/theme/colors";

type CardType = "virtual" | "physical";

export default function RequestCardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestCard } = useStableCards();
  const { wallets, loading: walletsLoading } = useWallets();

  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("daily");
  const [cardType, setCardType] = useState<CardType>("virtual");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<
    Array<{ id: string; type: AccountType }>
  >([]);

  // Load accounts on mount
  React.useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accs = await listAccounts();
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccount) {
          setSelectedAccount(accs[0].type);
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
      }
    };
    loadAccounts();
  }, []);

  // Set first wallet as default
  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const handleSubmit = useCallback(async () => {
    if (!selectedWalletId) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please select a wallet");
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const newCard = await requestCard({
        walletId: selectedWalletId,
        account: selectedAccount,
        type: cardType,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Card Requested",
        "Your Stable Card request has been submitted successfully!",
        [
          {
            text: "View Card",
            onPress: () => {
              router.replace({
                pathname: "/(drawer)/(internal)/cards/[id]",
                params: { id: newCard.id },
              });
            },
          },
          {
            text: "Back to List",
            style: "cancel",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to request card. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWalletId, selectedAccount, cardType, requestCard, router]);

  const accountLabels: Record<AccountType, string> = {
    daily: "Daily Wallet",
    savings: "Savings Wallet",
    social: "Social Wallet",
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenBg account="Daily" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Request Stable Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Wallet</Text>
          {walletsLoading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
          ) : wallets.length === 0 ? (
            <Text style={styles.emptyText}>No wallets available</Text>
          ) : (
            <View style={styles.optionsContainer}>
              {wallets.map((wallet) => {
                const isSelected = selectedWalletId === wallet.id;
                return (
                  <OptionButton
                    key={wallet.id}
                    isSelected={isSelected}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedWalletId(wallet.id);
                    }}
                    label={wallet.label || `${wallet.chain.toUpperCase()} Wallet`}
                    subtext={`${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Account</Text>
          <View style={styles.optionsContainer}>
            {(["daily", "savings", "social"] as AccountType[]).map((acc) => (
              <OptionButton
                key={acc}
                isSelected={selectedAccount === acc}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedAccount(acc);
                }}
                label={accountLabels[acc]}
              />
            ))}
          </View>
        </View>

        {/* Card Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Type</Text>
          <View style={styles.optionsContainer}>
            <OptionButton
              isSelected={cardType === "virtual"}
              onPress={() => {
                void Haptics.selectionAsync();
                setCardType("virtual");
              }}
              label="Virtual"
              subtext="Instant, digital card for online purchases"
            />

            <OptionButton
              isSelected={cardType === "physical"}
              onPress={() => {
                void Haptics.selectionAsync();
                setCardType("physical");
              }}
              label="Physical"
              subtext="Physical card shipped to your address"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#FFB703" />
          <Text style={styles.infoText}>
            {cardType === "physical"
              ? "Physical cards require KYC verification and will be shipped to your registered address."
              : "Virtual cards are available immediately after approval."}
          </Text>
        </View>

        {/* Submit Button */}
        <CTAButton
          title={loading ? "Requesting..." : "Request Card"}
          onPress={handleSubmit}
          disabled={loading || !selectedWalletId}
          style={styles.submitButton}
          leftIcon={
            loading ? (
              <ActivityIndicator size="small" color="#0B0B0F" />
            ) : (
              <Ionicons name="card" size={20} color="#0B0B0F" />
            )
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navBg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  optionPressable: {
    padding: 16,
  },
  optionSelected: {
    backgroundColor: "rgba(255,183,3,0.15)",
    borderColor: "#FFB703",
    borderWidth: 1.5,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,183,3,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,183,3,0.2)",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 8,
  },
});

// Option Button Component with animations
function OptionButton({
  isSelected,
  onPress,
  label,
  subtext,
}: {
  isSelected: boolean;
  onPress: () => void;
  label: string;
  subtext?: string;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [isSelected, scaleAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.optionPressable}
      >
        <View style={styles.optionContent}>
          <Ionicons
            name={isSelected ? "radio-button-on" : "radio-button-off"}
            size={24}
            color={isSelected ? "#FFB703" : "#fff"}
          />
          {subtext ? (
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{label}</Text>
              <Text style={styles.optionSubtext}>{subtext}</Text>
            </View>
          ) : (
            <Text style={styles.optionLabel}>{label}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}


