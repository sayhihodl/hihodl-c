// app/(paywall)/plans.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ImageBackground,
  ColorValue,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";                     // 👈 NUEVO
import { Ionicons } from "@expo/vector-icons";            // 👈 NUEVO
import SegmentedPills from "@/ui/SegmentedPills";
import { GlassCard, Divider } from "@/ui/Glass";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@/hooks/useUser";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ===================== Data model ===================== */
export type Perk = {
  key: string;
  label: string;
  tier: "free" | "plus" | "premium" | "metal" | "coming";
  note?: string;
};
export type Plan = {
  id: "standard" | "plus" | "premium" | "metal";
  name: string;
  priceMonthlyEUR: number | 0;
  highlight?: boolean;
  heroPerks?: string[];   // shown in hero card
  perks: string[];        // full matrix
};

/* ====== PERKS (English copy, short) ====== */
export const PERKS: Record<string, Perk> = {
  // Standard Plan
  hero_selfcustody_passkey: { key: "hero_selfcustody_passkey", label: "Self-custody & Passkey login", tier: "free" },
  hero_three_wallets:       { key: "hero_three_wallets",       label: "3 wallets (Daily / Savings / Social)",       tier: "free" },
  hero_alias:               { key: "hero_alias",               label: "Alias (@nickname)",                           tier: "free" },
  hero_gasless_quota:       { key: "hero_gasless_quota",       label: "Gasless transfers",                           tier: "free" },
  hero_stablecard:          { key: "hero_stablecard",          label: "StableCard",                                   tier: "free", note: "Coming soon" },
  stablecard_plus:          { key: "stablecard_plus",          label: "StableCard Plus",                               tier: "plus", note: "Coming soon" },
  stablecard_premium:       { key: "stablecard_premium",       label: "StableCard Premium",                            tier: "premium", note: "Coming soon" },
  address_rotation_none:   { key: "address_rotation_none",     label: "Address rotation",                            tier: "free", note: "Not available" },
  support_community:       { key: "support_community",         label: "Support",                                       tier: "free", note: "Community" },

  // Plus Plan
  gasless_plus:             { key: "gasless_plus",             label: "Gasless transfers",                           tier: "plus" },
  verified_badge:           { key: "verified_badge",           label: "Verified badge (NFT)",                         tier: "plus" },
  perks_marketplace:        { key: "perks_marketplace",        label: "Perks marketplace (early access)",            tier: "plus" },
  card_physical_std:        { key: "card_physical_std",        label: "Physical card standard finish",               tier: "plus", note: "premium finishes in higher plans" },
  address_rotation_manual:  { key: "address_rotation_manual",  label: "Address rotation",                            tier: "plus", note: "Manual (10 addresses)" },
  wallets_plus:             { key: "wallets_plus",           label: "Wallets",                                     tier: "plus", note: "10 wallets" },
  alias_custom:             { key: "alias_custom",             label: "Alias type",                                  tier: "plus", note: "Custom" },
  support_email:            { key: "support_email",            label: "Support",                                       tier: "plus", note: "Email" },

  // Premium Plan
  gasless_unlimited:        { key: "gasless_unlimited",        label: "Gasless transfers",                           tier: "premium" },
  cashback_boost:           { key: "cashback_boost",           label: "Cashback boost (5–7%)",                       tier: "premium" },
  wallets_unlimited:        { key: "wallets_unlimited",        label: "Unlimited sub-wallets",                       tier: "premium" },
  privacy_rotation:         { key: "privacy_rotation",         label: "Automatic address rotation",                  tier: "premium" },
  advanced_notifications:   { key: "advanced_notifications",   label: "Advanced notifications",                      tier: "premium" },
  insights_ai:              { key: "insights_ai",              label: "Insights & analytics (AI)",                   tier: "premium" },
  alias_premium:            { key: "alias_premium",            label: "Alias type",                                   tier: "premium", note: "Premium (3 handles)" },
  support_priority:         { key: "support_priority",         label: "Support",                                      tier: "premium", note: "Priority" },
};

/* ====== Plans ====== */
export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    priceMonthlyEUR: 0,
    heroPerks: [
      "hero_selfcustody_passkey",
      "hero_three_wallets",
      "hero_alias",
      "hero_gasless_quota",
      "hero_stablecard",
    ],
    perks: [
      "hero_gasless_quota",
      "address_rotation_none",
      "hero_three_wallets",
      "hero_alias",
      "hero_stablecard",
      "support_community",
    ],
  },
  { 
    id: "plus", 
    name: "Plus", 
    priceMonthlyEUR: 4.99, 
    heroPerks: [
      "gasless_plus",
      "verified_badge",
      "perks_marketplace",
      "card_physical_std",
    ],
    perks: [
      "gasless_plus",
      "address_rotation_manual",
      "wallets_plus",
      "alias_custom",
      "stablecard_plus",
      "support_email",
    ],
  },
  { 
    id: "premium", 
    name: "Premium", 
    priceMonthlyEUR: 9.99, 
    heroPerks: [
      "gasless_unlimited",
      "cashback_boost",
      "wallets_unlimited",
      "privacy_rotation",
      "advanced_notifications",
      "insights_ai",
    ],
    perks: [
      "gasless_unlimited",
      "privacy_rotation",
      "wallets_unlimited",
      "alias_premium",
      "stablecard_premium",
      "support_priority",
    ],
  },
  { 
    id: "metal", 
    name: "Metal", 
    priceMonthlyEUR: 0, // Coming Soon
    heroPerks: [],
    perks: [],
  },
];

/* ===================== Helpers ===================== */
function tierIndex(tier: Perk["tier"] | Plan["id"]) {
  const order = ["free", "standard", "plus", "premium", "metal", "coming"] as const;
  return order.indexOf(tier as any);
}
function useCurrentPlanId(): Plan["id"] | undefined {
  const { user } = useUser();
  // Map backend plan IDs to frontend plan IDs
  const planMap: Record<string, Plan["id"]> = {
    free: "standard",
    standard: "standard",
    plus: "plus",
    premium: "premium",
    pro: "premium", // 'pro' maps to 'premium'
    metal: "metal",
  };
  const backendPlan = user?.profile?.plan || "standard";
  return planMap[backendPlan] || "standard";
}

/* ===== Themes by plan ===== */
type PlanTheme = { gradient?: ColorValue[]; image?: any; solid?: string; };
const PLAN_THEMES: Record<Plan["id"], PlanTheme> = {
  standard: { solid: "rgba(27,45,54,0.85)" },
  plus:     { gradient: ["rgba(34,193,195,1)", "rgba(253,187,45,1)"] },
  premium:  { gradient: ["#E6EEF5", "#9FB3BF", "#4B5A67"] },
  metal:    { gradient: ["#D4AF37", "#F7CE68", "#B8860B"] },
};

const PILL_H = 44;
const TITLE_GAP = 16;
const HEADER_TOPPAD = 10;
const HEADER_H = 44 + TITLE_GAP + PILL_H;
const BOTTOM_BAR_H = 64;

/* ===================== Screen ===================== */
export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const hScrollX = useRef(new Animated.Value(0)).current;
  const hRef = useRef<Animated.FlatList<Plan>>(null);
  const isProgrammaticRef = useRef(false);

  const vRefs = useRef<Record<string, Animated.FlatList<any> | null>>({});
  const setVRef = useCallback((id: string) => (r: Animated.FlatList<any> | null) => { vRefs.current[id] = r; }, []);

  const scrollYMap = useRef<Record<string, Animated.Value>>({}).current;
  const getScrollY = (id: string) => (scrollYMap[id] ??= new Animated.Value(0));

  const currentPlanId = useCurrentPlanId();
  useEffect(() => {
    if (!currentPlanId) return;
    const i = Math.max(0, PLANS.findIndex((p) => p.id === currentPlanId));
    setIndex(i);
    requestAnimationFrame(() => {
      hRef.current?.scrollToIndex({ index: i, animated: false });
      hScrollX.setValue(i * SCREEN_WIDTH);
    });
  }, [currentPlanId, hScrollX]);

  const goTo = useCallback((i: number) => {
    if (i === index) return;
    setIndex(i);
    isProgrammaticRef.current = true;
    hRef.current?.scrollToIndex({ index: i, animated: true });
  }, [index]);

  const onJoin = (planId: Plan["id"]) => {
    router.push(`/(drawer)/(internal)/(paywall)/checkout?planId=${planId}`);
  };

  const getCtaLabel = (planId: Plan["id"]) =>
    planId === "plus" ? "Join Plus" : planId === "premium" ? "Join Premium" : planId === "metal" ? "Join Metal" : "Subscribe for Free";

  /* ---------- Page renderer ---------- */
  const renderPage = useCallback(
    ({ item: plan }: { item: Plan }) => {

      const theme = PLAN_THEMES[plan.id];
      const gradColors: ColorValue[] = theme.gradient ? [...theme.gradient] : (["#222", "#111"] as ColorValue[]);
      const isStandard = plan.id === "standard";
      const coverTitleStyle = [styles.coverTitle, isStandard && { color: "#CFE3EC" }];
      const coverPriceStyle = [styles.coverPrice, isStandard && { color: "#CFE3EC" }];

      const isMetal = plan.id === "metal";
      const priceText = isMetal ? "Coming Soon" : plan.priceMonthlyEUR === 0 ? "Free" : `€${plan.priceMonthlyEUR}/month`;
      
      const cover = theme.image ? (
        <ImageBackground source={theme.image} style={styles.cover} imageStyle={styles.coverImageRadius}>
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{priceText}</Text>
        </ImageBackground>
      ) : theme.gradient ? (
        <View style={styles.cover}>
          <LinearGradient colors={gradColors as any} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{priceText}</Text>
        </View>
      ) : (
        <View style={[styles.cover, { backgroundColor: theme.solid ?? "transparent" }]}>
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{priceText}</Text>
        </View>
      );


      const header = (
        <View style={{ paddingHorizontal: 18, marginTop: 18, marginBottom: 160 }}>
          <GlassCard tone="panel" style={styles.card}>
            {cover}

            {/* ===== Hero highlights (first card) ===== */}
            <View style={styles.cardPad}>
              {plan.id === currentPlanId && <Text style={styles.currentNote}>You're on this plan</Text>}

              {isMetal ? (
                <GlassCard tone="panel" style={{ marginTop: 12 }}>
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={[styles.rowTitleNormal, { textAlign: "center", opacity: 0.7 }]}>Coming Soon</Text>
                    <Text style={[styles.rowSub, { textAlign: "center", marginTop: 8 }]}>Stay tuned for exclusive features</Text>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard tone="panel" style={{ marginTop: 12 }}>
                  {plan.perks.map((k, idx) => {
                    const p = PERKS[k];
                    if (!p) return null;
                    return (
                      <View key={p.key}>
                        {idx > 0 && <Divider />}
                        <Row
                          icon="ellipse"
                          rightIcon={null}
                          labelNode={
                            <>
                              <Text style={styles.rowTitleNormal} numberOfLines={2}>{p.label}</Text>
                              {p.note ? <Text style={styles.rowSub} numberOfLines={2}>{p.note}</Text> : null}
                            </>
                          }
                        />
                      </View>
                    );
                  })}
                </GlassCard>
              )}
            </View>
          </GlassCard>
        </View>
      );


      return (
        <View style={{ width: SCREEN_WIDTH }}>
          <Animated.FlatList
            ref={setVRef(plan.id)}
            data={[{ key: "only-footer" }]}
            keyExtractor={(it) => `${plan.id}-${String(it.key)}`}
            ListHeaderComponent={header}
            renderItem={() => null}
            ListFooterComponent={
              <View style={{ paddingHorizontal: 18, marginTop: 32, paddingBottom: BOTTOM_BAR_H + 16 }} />
            }
            showsVerticalScrollIndicator
            contentContainerStyle={{
              paddingTop: insets.top + HEADER_TOPPAD + HEADER_H + 8,
              paddingBottom: insets.bottom + BOTTOM_BAR_H + 20,
            }}
            removeClippedSubviews
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
                onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: getScrollY(plan.id) } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        </View>
      );
    },
    [insets.bottom, insets.top, currentPlanId]
  );

  const activeScrollY = getScrollY(PLANS[Math.max(0, Math.min(index, PLANS.length - 1))].id);
  const activePlan = PLANS[index];
  const isCurrent = activePlan.id === currentPlanId;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBg />

      <GlassHeader
        scrolly={activeScrollY}
        height={HEADER_H}
        innerTopPad={HEADER_TOPPAD}
        sideWidth={45}
        leftSlot={null}
        centerSlot={
          <View style={{ alignItems: "center", justifyContent: "center", marginTop: 44 + TITLE_GAP }}>
            <SegmentedPills
              items={PLANS.map((p) => ({ id: String(p.id), label: p.name }))}
              activeIndex={index}
              onPress={(i) => goTo(i)}
              progress={Animated.divide(hScrollX, SCREEN_WIDTH)}
              height={44}
              pillMinWidth={68}
              pillHPad={16}
              wrapHPad={8}
              style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18 }}
              indicatorStyle={{ backgroundColor: "rgba(0,0,0,0.45)", top: 4, bottom: 4, borderRadius: 14 }}
              textStyle={{ color: "#9FB3BF", fontWeight: "800", fontSize: 14 }}
              activeTextStyle={{ color: "#FFFFFF" }}
            />
          </View>
        }
        rightSlot={<View style={{ width: 45 }} />}
        contentStyle={{ flexDirection: "column", gap: 10 }}
      />
      {/* Overlay: X y título en la misma fila */}
      <View style={{ position: "absolute", top: insets.top + HEADER_TOPPAD, left: 0, right: 0, height: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, zIndex: 21, pointerEvents: "box-none" }}>
        <View style={{ width: 45, alignItems: "flex-start", justifyContent: "center" }} pointerEvents="auto">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(drawer)/(tabs)");
            }}
            hitSlop={12}
            style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" }}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
          <Text style={styles.headerTitle}>Upgrade plan</Text>
        </View>
        <View style={{ width: 45 }} pointerEvents="none" />
      </View>

      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <Animated.FlatList<Plan>
          ref={hRef}
          data={PLANS}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          renderItem={renderPage}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: hScrollX } } }],
            {
              useNativeDriver: false,
              listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const x = e.nativeEvent.contentOffset.x ?? 0;
                const i = Math.round(x / SCREEN_WIDTH);
                if (!isProgrammaticRef.current && i !== index) setIndex(i);
              },
            }
          )}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x ?? 0;
            const i = Math.round(x / SCREEN_WIDTH);
            isProgrammaticRef.current = false;
            if (i !== index) setIndex(i);
          }}
          onScrollToIndexFailed={(info) => {
            requestAnimationFrame(() => {
              hRef.current?.scrollToIndex({ index: info.index, animated: false });
            });
          }}
          scrollEventThrottle={16}
          removeClippedSubviews
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          style={{ flexGrow: 0 }}
        />
      </SafeAreaView>

      {/* Bottom CTA — único CTA por plan */}
      {!isCurrent && activePlan.id !== "standard" && activePlan.id !== "metal" && (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: insets.bottom + 10,
            backgroundColor: "transparent",
            justifyContent: "center",
          }}
          pointerEvents="box-none"
        >
          <CTAButton
            title={getCtaLabel(activePlan.id)}
            onPress={() => onJoin(activePlan.id)}
            variant="primary"
            backdrop="blur"
            style={{ height: 52, borderRadius: 16 }}
          />
        </View>
      )}
    </View>
  );
}

/* ===================== Styles ===================== */
const COVER_H = 132;

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },

  card: { borderRadius: 18, overflow: "hidden" },

  cover: {
    height: COVER_H,
    overflow: "hidden",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    justifyContent: "flex-start",
    padding: 14,
  },
  coverImageRadius: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  coverTitle: { color: "#0A1420", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  coverPrice: { color: "#0A1420", fontSize: 13, fontWeight: "800", marginTop: 2, opacity: 0.9 },

  cardPad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  currentNote: { color: "#CFE3EC", fontSize: 12, fontWeight: "600", marginTop: 6 },

  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 8 },
  sectionHeader: { color: "#CFE3EC", fontWeight: "800", marginTop: 6, marginBottom: 6 },

  rowTitleNormal: { color: "#fff", fontSize: 14, fontWeight: "400" },
  rowSub: { color: "#9AA6C1", fontSize: 12, marginTop: 2 },

  cta: { borderRadius: 18 },

  viewAllPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  viewAllPillText: {
    color: "#CFE3EC",
    fontWeight: "800",
    fontSize: 14,
  },
});