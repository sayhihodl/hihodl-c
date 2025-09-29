// app/(tabs)/referral/help.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { legacy } from "@/theme/colors";

const { BG, TEXT, SUB } = legacy;

export default function ReferralHelp() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>Referral Help</Text>
        <View style={{ width: 22 }} /> {/* espacio para balancear */}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.paragraph}>
          Here you can find answers about referral rewards:
        </Text>

        <Text style={styles.bullet}>
          • Your invitee must complete all required steps before the deadline.
        </Text>
        <Text style={styles.bullet}>
          • If the campaign ends, the reward won’t carry over to the next one.
        </Text>
        <Text style={styles.bullet}>
          • Rewards are distributed after successful verification of your
          invitee’s account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800" },
  paragraph: { color: TEXT, fontSize: 14, marginBottom: 12 },
  bullet: { color: SUB, fontSize: 14, marginBottom: 8 },
});