// app/(drawer)/(internal)/payments/composer.tsx
import React from "react";
import { View } from "react-native";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import PaymentComposer from "@/payments/PaymentComposer";
import { router } from "expo-router";

export default function PaymentsComposerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0D1820" }}>
      <ScreenBg account="Daily" height={160} showTopSeam />
      <GlassHeader
        scrolly={undefined as any}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={null}
        centerSlot={null}
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />
      <PaymentComposer
        onSend={() => router.push("/(drawer)/(internal)/payments/QuickSendScreen")}
        onRequest={() => router.push("/(drawer)/(internal)/payments/QuickRequestScreen")}
        onScan={() => router.push("/(drawer)/(internal)/send/scanner")}
        onGroup={() => router.push("/(drawer)/(internal)/payments/create-group")}
      />
    </View>
  );
}


