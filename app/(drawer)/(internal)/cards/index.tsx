// app/(drawer)/(internal)/cards/index.tsx
// Pantalla de lista de Stable Cards

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import ScreenBg from "@/ui/ScreenBg";
import { CTAButton } from "@/ui/CTAButton";
import StableCard from "@/components/cards/StableCard";
import { useStableCards } from "@/hooks/useStableCards";
import type { StableCard as StableCardType } from "@/types/api";
import colors from "@/theme/colors";

export default function CardsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cards, loading, error, reload } = useStableCards();

  const handleCardPress = useCallback((card: StableCardType) => {
    void Haptics.selectionAsync();
    router.push({
      pathname: "/(drawer)/(internal)/cards/[id]",
      params: { id: card.id },
    });
  }, [router]);

  const handleRequestCard = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(drawer)/(internal)/cards/request");
  }, [router]);

  const renderCard = ({ item, index }: { item: StableCardType; index: number }) => {
    const accountMap: Record<string, "Daily" | "Savings" | "Social"> = {
      daily: "Daily",
      savings: "Savings",
      social: "Social",
    };

    const schemeMap: Record<string, "visa" | "mastercard" | "none"> = {
      VISA: "visa",
      MASTERCARD: "mastercard",
    };

    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: scaleAnim.interpolate({
              inputRange: [0.97, 1],
              outputRange: [0.9, 1],
            }),
          },
        ]}
      >
        <Pressable
          onPress={() => handleCardPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardPressable}
        >
          <StableCard
            issuer="HIHODL"
            topRightLabel={item.type.toUpperCase()}
            last4={item.last4}
            scheme={schemeMap[item.brand] || "none"}
            size="m"
            style={styles.card}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>
              {item.label || `${accountMap[item.account] || item.account} Card`}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  item.status === "frozen"
                    ? styles.statusDotFrozen
                    : item.status === "cancelled"
                    ? styles.statusDotCancelled
                    : styles.statusDotActive,
                ]}
              />
              <Text style={styles.cardStatus}>
                {item.status === "frozen"
                  ? "Frozen"
                  : item.status === "cancelled"
                  ? "Cancelled"
                  : item.status === "pending"
                  ? "Pending"
                  : "Active"}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.emptyText}>Loading cards...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.emptyText}>Error loading cards</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <CTAButton
            title="Retry"
            onPress={reload}
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={64} color="rgba(255,255,255,0.4)" />
        <Text style={styles.emptyTitle}>No cards yet</Text>
        <Text style={styles.emptyText}>
          Request your first Stable Card to start spending
        </Text>
        <CTAButton
          title="Request Card"
          onPress={handleRequestCard}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenBg account="Daily" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
        {cards.length > 0 && (
          <Pressable
            onPress={handleRequestCard}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Ionicons name="add-circle" size={28} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Cards List */}
      {cards.length > 0 ? (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor="#fff"
            />
          }
          ListFooterComponent={
            <CTAButton
              title="+ Request New Card"
              onPress={handleRequestCard}
              variant="secondary"
              style={styles.requestButton}
              leftIcon={<Ionicons name="add" size={20} color="#fff" />}
            />
          }
        />
      ) : (
        <View style={[styles.emptyWrapper, { paddingBottom: insets.bottom + 20 }]}>
          {renderEmpty()}
        </View>
      )}
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
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardPressable: {
    width: "100%",
  },
  card: {
    marginBottom: 8,
  },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  cardLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: "#4ade80",
  },
  statusDotFrozen: {
    backgroundColor: "#60a5fa",
  },
  statusDotCancelled: {
    backgroundColor: "#f87171",
  },
  cardStatus: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  addButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  requestButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 8,
  },
});


