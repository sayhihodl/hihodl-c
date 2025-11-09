// app/(drawer)/(internal)/cards/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import colors from "@/theme/colors";
import ScreenBg from "@/ui/ScreenBg";
import { CTAButton } from "@/ui/CTAButton";
import StableCard from "@/components/cards/StableCard";
import { useStableCards } from "@/hooks/useStableCards";
import type { StableCard as StableCardType } from "@/types/api";
import {
  type Account,
  ACCOUNT_PRIMARY,
} from "@/theme/gradients";

const DEFAULT_ACC_COLOR = "#FFB703";

const accountMap: Record<string, Account> = {
  daily: "Daily",
  savings: "Savings",
  social: "Social",
};

const schemeMap: Record<string, "visa" | "mastercard" | "none"> = {
  VISA: "visa",
  MASTERCARD: "mastercard",
};

export default function CardDetails() {
  const params = useLocalSearchParams<{ id?: string; account?: Account }>();
  const cardId = (params.id as string) ?? "";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getCardDetails, freeze, remove, reveal } = useStableCards();

  const [card, setCard] = useState<StableCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [secrets, setSecrets] = useState<{
    panFull?: string;
    exp?: string;
    cvv?: string;
  } | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    const loadCard = async () => {
      if (!cardId || cardId === "general") {
        setLoading(false);
        return;
      }
      try {
        const details = await getCardDetails(cardId);
        setCard(details.card);
        if (details.secrets) {
          setSecrets(details.secrets);
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to load card details");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    loadCard();
  }, [cardId, getCardDetails, router]);

  const handleFreeze = async () => {
    if (!card) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isFrozen = card.status === "frozen";
    const newFreezeState = !isFrozen;
    try {
      await freeze(card.id, newFreezeState);
      setCard({ ...card, status: newFreezeState ? "frozen" : "active" });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success",
        newFreezeState ? "Card frozen" : "Card unfrozen"
      );
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update card");
    }
  };

  const handleDelete = () => {
    if (!card) return;
    Alert.alert(
      "Delete Card",
      "Are you sure you want to delete this card? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(card.id);
              Alert.alert("Success", "Card deleted", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete card");
            }
          },
        },
      ]
    );
  };

  const handleRevealSecrets = async () => {
    if (!card) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (secrets) {
      setShowSecrets(!showSecrets);
      return;
    }
    try {
      const revealed = await reveal(card.id);
      setSecrets(revealed);
      setShowSecrets(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to reveal secrets");
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScreenBg account="Daily" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading card...</Text>
        </View>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScreenBg account="Daily" />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Card not found</Text>
          <CTAButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  const account: Account = accountMap[card.account] || "Daily";
  const accountColor = ACCOUNT_PRIMARY[account] ?? DEFAULT_ACC_COLOR;
  const cardTitle = card.label || `${account} Card`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenBg account={account} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.brand}>HiHODL</Text>
        <Pressable hitSlop={10} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO: tarjeta grande */}
        <View style={styles.cardWrap}>
          <StableCard
            issuer="HIHODL"
            topRightLabel={card.type.toUpperCase()}
            last4={card.last4}
            scheme={schemeMap[card.brand] || "none"}
            size="l"
            style={styles.card}
          />
        </View>

        {/* Card Info */}
        <View style={styles.infoSection}>
          <InfoRow label="Status" value={card.status} />
          <InfoRow
            label="Type"
            value={card.type === "virtual" ? "Virtual" : "Physical"}
          />
          <InfoRow label="Provider" value={card.provider.toUpperCase()} />
          <InfoRow label="Brand" value={card.brand} />
          {card.limit && (
            <InfoRow
              label="Limit"
              value={`$${card.limit.amount}/${card.limit.frequency === "per24HourPeriod" ? "day" : card.limit.frequency === "perMonth" ? "month" : "transaction"}`}
            />
          )}
          <InfoRow
            label="Expires"
            value={`${card.expirationMonth}/${card.expirationYear}`}
          />
        </View>

        {/* Secrets Section */}
        {showSecrets && secrets && (
          <View style={styles.secretsSection}>
            <Text style={styles.secretsTitle}>Card Details</Text>
            {secrets.panFull && (
              <InfoRow label="Card Number" value={secrets.panFull} />
            )}
            {secrets.exp && <InfoRow label="Expiration" value={secrets.exp} />}
            {secrets.cvv && <InfoRow label="CVV" value={secrets.cvv} />}
            <Text style={styles.secretsWarning}>
              ⚠️ Keep this information secure
            </Text>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <Action
            icon="eye-outline"
            label={showSecrets ? "Hide details" : "Show details"}
            onPress={handleRevealSecrets}
          />
          <Action
            icon="snow-outline"
            label={card.status === "frozen" ? "Unfreeze" : "Freeze"}
            onPress={handleFreeze}
          />
          <Action icon="trash-outline" label="Delete" onPress={handleDelete} />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Info Row Component ---------- */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* ---------- Action Component ---------- */
function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionItem,
        pressed && styles.actionItemPressed,
      ]}
    >
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navBg },
  topBar: {
    height: 52,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginTop: 8,
  },
  cardWrap: { marginTop: 6, paddingHorizontal: 12, alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 360,
  },
  infoSection: {
    marginTop: 24,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0F151A",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  secretsSection: {
    marginTop: 16,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,183,3,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,183,3,0.2)",
  },
  secretsTitle: {
    color: "#FFB703",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  secretsWarning: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 12,
    fontStyle: "italic",
  },

  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 12,
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
  },
  actionItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionLabel: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "600" },
});