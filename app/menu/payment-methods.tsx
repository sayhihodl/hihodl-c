// app/menu/payment-methods.tsx
import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { GlassCard, Divider } from "@/ui/Glass";
import { Row as RowButton } from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";

/* ===== theme ===== */
const BG  = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";

export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <Stack.Screen options={{ title: "Payment methods", headerLargeTitle: false }} />

      {/* Cards */}
      <Text style={styles.sectionTitle}>Cards</Text>
      <GlassCard>
        <RowButton
          icon="card-outline"
          label="Open Cards"
          value="Go to wallet cards"
          onPress={() => router.push("/(tabs)/payments")}
        />
        <Divider />
        <RowButton
          icon="card"
          label="HiHODL Virtual Card"
          value="Coming soon"
          onPress={() => Alert.alert("Soon", "Virtual cards will be available soon.")}
        />
        <Divider />
        <RowButton
          icon="add-circle-outline"
          label="Add new card"
          value="Disabled in MVP"
          disabled
        />
        <Divider />
        <RowButton
          icon="star-outline"
          label="Default payment card"
          value="Not set"
          disabled
        />
      </GlassCard>

      {/* Bank accounts */}
      <Text style={[styles.sectionTitle, { opacity: 0.35 }]}>Bank accounts</Text>
      <GlassCard>
        <RowButton
          icon="business-outline"
          label="Add bank account"
          value="Later"
          disabled
        />
      </GlassCard>

      {/* CTA bottom */}
      <View style={styles.footer}>
        <CTAButton
            title="Manage cards in Dashboard"   // <- antes 'label'
            onPress={() => router.push("/(tabs)/payments")}
        />
        </View>
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  sectionTitle: {
    color: SUB,
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    padding: 16,
  },
});