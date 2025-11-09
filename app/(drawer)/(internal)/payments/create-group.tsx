// app/(drawer)/(internal)/payments/create-group.tsx
import React, { useRef, useState } from "react";
import { View, StyleSheet, Animated, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import GroupSplitBuilder from "@/payments/GroupSplitBuilder";
import { SendFlowProvider } from "@/send/SendFlowProvider";
import { CTAButton } from "@/ui/CTAButton";

export default function CreateGroupScreen() {
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const [canConfirm, setCanConfirm] = useState(false);
  const confirmRef = useRef<(() => void) | null>(null);
  
  // Altura total del header: insets.top + innerTopPad + height
  const HEADER_TOTAL = insets.top + 6 + 42;

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />
      
      {/* Header */}
      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={66}
        centerWidthPct={65}
        leftSlot={
          <Pressable 
            style={styles.backBtn} 
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <Text style={styles.headerTitle} numberOfLines={1}>
            Create group
          </Text>
        }
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Body - ScrollView */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: HEADER_TOTAL + 12,
          paddingBottom: 100, // Espacio para el CTA fijo
          paddingHorizontal: 16,
        }}
      >
        <SendFlowProvider
          initialStep="amount"
          allowedSteps={["token", "amount"]}
          initialState={{}}
        >
          <GroupSplitBuilder
            onCanConfirmChange={setCanConfirm}
            onConfirmReady={(fn) => { confirmRef.current = fn; }}
            onConfirm={({ groupName, emoji, tokenId, chain, smartSettle }) => {
              const id = `grp_${Date.now()}`;
              router.replace({
                pathname: "/(internal)/payments/thread",
                params: { 
                  id, 
                  name: groupName, 
                  alias: groupName, 
                  isGroup: "1",
                  emoji,
                  tokenId,
                  chain,
                  smartSettle: smartSettle ? "1" : "0",
                },
              });
            }}
          />
        </SendFlowProvider>
      </Animated.ScrollView>

      {/* CTA Fixed Bottom */}
      <View style={[styles.fixedCTA, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <CTAButton
          title="Create group"
          onPress={() => {
            confirmRef.current?.();
          }}
          disabled={!canConfirm}
          variant="secondary"
          tone="dark"
          fullWidth
          size="lg"
          style={!canConfirm ? { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.06)" } : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#0D1820" 
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  fixedCTA: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 12,
    backgroundColor: "#0D1820",
  },
});


