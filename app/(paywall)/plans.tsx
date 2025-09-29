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
import SegmentedPills from "@/ui/SegmentedPills";
import { GlassCard, Divider } from "@/ui/Glass";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { LinearGradient } from "expo-linear-gradient";

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
  hero_selfcustody_passkey: { key: "hero_selfcustody_passkey", label: "Self-custody & Passkey login", tier: "free" },
  hero_three_wallets:       { key: "hero_three_wallets",       label: "3 wallets (Daily / Savings / Social)",       tier: "free" },
  hero_alias:               { key: "hero_alias",               label: "Alias (@nickname)",                           tier: "free" },
  hero_gasless_quota:       { key: "hero_gasless_quota",       label: "Gasless — 5 tx/mo",                           tier: "free", note: "ETH, Solana, Base" },
  hero_stablecard:          { key: "hero_stablecard",          label: "StableCard virtual + physical*",              tier: "free", note: "*physical with issuance fee" },

  social_login:             { key: "social_login",             label: "Social login (Google / Apple)",               tier: "free" },
  send_all_chains:          { key: "send_all_chains",          label: "Send across all supported blockchains",       tier: "free" },
  cashback_base:            { key: "cashback_base",            label: "Cashback (1–2%)",                              tier: "free" },
  hipoints:                 { key: "hipoints",                 label: "HiPoints — 1 point / €10 spent",              tier: "free" },
  stablecard_virtual:       { key: "stablecard_virtual",       label: "StableCard virtual",                           tier: "free" },
  stablecard_physical:      { key: "stablecard_physical",      label: "StableCard physical (issuance fee)",          tier: "free" },

  verified_badge:           { key: "verified_badge",           label: "Verified badge (NFT)",                         tier: "plus" },
  domain_discount:          { key: "domain_discount",          label: "-20% on on-chain domains",                    tier: "plus" },
  perks_marketplace:        { key: "perks_marketplace",        label: "Perks marketplace (early access)",            tier: "plus" },
  card_physical_std:        { key: "card_physical_std",        label: "Physical card standard finish",               tier: "plus", note: "premium finishes in higher plans" },

  gasless_unlimited:        { key: "gasless_unlimited",        label: "Gasless — Unlimited",                         tier: "premium" },
  cashback_boost:           { key: "cashback_boost",           label: "Cashback boost (5–7%)",                       tier: "premium" },
  wallets_unlimited:        { key: "wallets_unlimited",        label: "Unlimited sub-wallets",                       tier: "premium" },
  privacy_rotation:         { key: "privacy_rotation",         label: "Address rotation (auto)",                     tier: "premium" },

  card_metal:               { key: "card_metal",               label: "Metal / NFT card designs",                    tier: "metal" },

  advanced_notifications:   { key: "advanced_notifications",   label: "Advanced notifications",                      tier: "premium" },
  insights_ai:              { key: "insights_ai",              label: "Insights & analytics (AI)",                   tier: "premium" },

  ibans_locales:            { key: "ibans_locales",            label: "Local IBANs / payroll",                       tier: "coming", note: "coming soon" },
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
      "send_all_chains",
      "cashback_base",
      "hipoints",
      "stablecard_virtual",
      "stablecard_physical",
      "social_login",
      "hero_selfcustody_passkey",
      "hero_three_wallets",
      "hero_alias",
      "hero_gasless_quota",
    ],
  },
  { id: "plus", name: "Plus", priceMonthlyEUR: 4.99, perks: ["verified_badge", "domain_discount", "perks_marketplace", "card_physical_std"] },
  { id: "premium", name: "Premium", priceMonthlyEUR: 9.99, perks: ["gasless_unlimited", "cashback_boost", "wallets_unlimited", "privacy_rotation", "advanced_notifications", "insights_ai"] },
  { id: "metal", name: "Metal", priceMonthlyEUR: 19.99, perks: ["card_metal", "cashback_boost", "gasless_unlimited", "perks_marketplace"] },
];

/* ===================== Helpers ===================== */
function tierIndex(tier: Perk["tier"] | Plan["id"]) {
  const order = ["free", "standard", "plus", "premium", "metal", "coming"] as const;
  return order.indexOf(tier as any);
}
function useCurrentPlanId(): Plan["id"] | undefined {
  return "standard"; // demo
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

  const [benefitsYByPlan, setBenefitsYByPlan] = useState<Record<string, number>>({});
  const scrollYMap = useRef<Record<string, Animated.Value>>({}).current;
  const getScrollY = (id: string) => (scrollYMap[id] ??= new Animated.Value(0));

  const [showTopCTAByPlan, setShowTopCTAByPlan] = useState<Record<string, boolean>>({});

  const allPerks = useMemo(() => Object.values(PERKS).filter((p) => p.tier !== "coming"), []);

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

  const onJoin = (planId: Plan["id"]) => console.log("Join plan:", planId);

  const getCtaLabel = (planId: Plan["id"]) =>
    planId === "plus" ? "Join Plus" : planId === "premium" ? "Join Premium" : planId === "metal" ? "Join Metal" : "Subscribe for Free";

  const handleViewAll = (planId: Plan["id"]) => {
    setShowTopCTAByPlan((s) => ({ ...s, [planId]: false })); // hide mini CTA(s)
    const ref = vRefs.current[planId];
    const y = benefitsYByPlan[planId] ?? 0;
    if (ref && typeof (ref as any).scrollToOffset === "function") {
      (ref as any).scrollToOffset({ offset: Math.max(0, y - 8), animated: true });
    }
  };

  /* ----- Section definitions for Standard benefits ----- */
  const STANDARD_SECTIONS: { title: string; emoji: string; keys: string[] }[] = [
    { title: "Your Wallets, Your Rules", emoji: "🟣", keys: ["hero_three_wallets", "social_login", "hero_alias", "hero_selfcustody_passkey"] },
    { title: "Send Without Limits",       emoji: "🔵", keys: ["send_all_chains", "hero_gasless_quota"] },
    { title: "Spend & Earn Every Day",    emoji: "🟡", keys: ["stablecard_virtual", "stablecard_physical", "cashback_base", "hipoints"] },
    { title: "Next-Level Privacy",        emoji: "🔒", keys: ["privacy_rotation", "advanced_notifications", "insights_ai"] },
  ];

  /* ---------- Page renderer ---------- */
  const renderPage = useCallback(
    ({ item: plan }: { item: Plan }) => {
      const perksForMatrix = allPerks.map((p) => ({
        ...p,
        available: tierIndex(p.tier) <= tierIndex(plan.id),
      }));

      const theme = PLAN_THEMES[plan.id];
      const gradColors: ColorValue[] = theme.gradient ? [...theme.gradient] : (["#222", "#111"] as ColorValue[]);
      const isStandard = plan.id === "standard";
      const coverTitleStyle = [styles.coverTitle, isStandard && { color: "#CFE3EC" }];
      const coverPriceStyle = [styles.coverPrice, isStandard && { color: "#CFE3EC" }];

      const cover = theme.image ? (
        <ImageBackground source={theme.image} style={styles.cover} imageStyle={styles.coverImageRadius}>
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{plan.priceMonthlyEUR === 0 ? "Free" : `€${plan.priceMonthlyEUR}/month`}</Text>
        </ImageBackground>
      ) : theme.gradient ? (
        <View style={styles.cover}>
          <LinearGradient colors={gradColors as any} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{plan.priceMonthlyEUR === 0 ? "Free" : `€${plan.priceMonthlyEUR}/month`}</Text>
        </View>
      ) : (
        <View style={[styles.cover, { backgroundColor: theme.solid ?? "transparent" }]}>
          <Text style={coverTitleStyle} numberOfLines={1}>{plan.name}</Text>
          <Text style={coverPriceStyle} numberOfLines={1}>{plan.priceMonthlyEUR === 0 ? "Free" : `€${plan.priceMonthlyEUR}/month`}</Text>
        </View>
      );

      const showTopCTAs = showTopCTAByPlan[plan.id] !== false;

      const header = (
        <View style={{ paddingHorizontal: 18, marginTop: 18, marginBottom: 160 }}>
          <GlassCard tone="panel" style={styles.card}>
            {cover}

            {/* ===== Hero highlights (first card) ===== */}
            <View style={styles.cardPad}>
              {plan.id === currentPlanId && <Text style={styles.currentNote}>You’re on this plan</Text>}

              <GlassCard tone="panel" style={{ marginTop: 12 }}>
                {(plan.heroPerks ?? plan.perks).map((k, idx) => {
                  const p = PERKS[k];
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

              {/* Mini CTA solo: View all features (se elimina el botón Join aquí) */}
              {showTopCTAs && (
                <View style={{ marginTop: 14, alignItems: "center" }}>
                  <Pressable onPress={() => handleViewAll(plan.id)} hitSlop={8} style={styles.viewAllPill}>
                    <Text style={styles.viewAllPillText}>View all features</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      );

      /* ----- BENEFITS content (with sections for Standard) ----- */
      const BenefitsContent =
        plan.id === "standard" ? (
          <GlassCard tone="panel" style={{ marginTop: 8 }}>
            {STANDARD_SECTIONS.map((section, si) => (
              <View key={`${plan.id}-section-${section.title}`}>
                {si > 0 && <View style={{ height: 10 }} />}
                <Text style={styles.sectionHeader}>{section.emoji} {section.title}</Text>
                <View style={{ marginTop: 4 }}>
                  {section.keys.map((k, idx) => {
                    const pp = perksForMatrix.find((x) => x.key === k)!;
                    const available = !!pp && pp.available;
                    return (
                      <View key={`${plan.id}-${k}`}>
                        {idx > 0 && <Divider />}
                        <Row
                          icon={available ? "checkmark-circle" : "close-circle"}
                          rightIcon={null}
                          labelNode={
                            <>
                              <Text style={styles.rowTitleNormal} numberOfLines={2}>{PERKS[k].label}</Text>
                              {PERKS[k].note ? <Text style={styles.rowSub} numberOfLines={3}>{PERKS[k].note}</Text> : null}
                            </>
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </GlassCard>
        ) : (
          <GlassCard tone="panel" style={{ marginTop: 8 }}>
            {perksForMatrix.map((pp, idx) => (
              <View key={`${plan.id}-${pp.key}`}>
                {idx > 0 && <Divider />}
                <Row
                  icon={pp.available ? "checkmark-circle" : "close-circle"}
                  rightIcon={null}
                  labelNode={
                    <>
                      <Text style={styles.rowTitleNormal} numberOfLines={2}>{pp.label}</Text>
                      {pp.note ? <Text style={styles.rowSub} numberOfLines={3}>{pp.note}</Text> : null}
                    </>
                  }
                />
              </View>
            ))}
          </GlassCard>
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
              <View
                style={{ paddingHorizontal: 18, marginTop: 32, paddingBottom: BOTTOM_BAR_H + 16 }}
                onLayout={(e) => {
                  if (benefitsYByPlan[plan.id] != null) return;
                  const y = e?.nativeEvent?.layout?.y ?? 0;
                  setBenefitsYByPlan((s) => ({ ...s, [plan.id]: y }));
                }}
              >
                <Text style={styles.sectionTitle}>Benefits in {plan.name}</Text>
                {BenefitsContent}
              </View>
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
              {
                useNativeDriver: true,
                listener: (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const y = ev.nativeEvent.contentOffset.y || 0;
                  if (y < 40) setShowTopCTAByPlan((s) => ({ ...s, [plan.id]: true }));
                },
              }
            )}
            scrollEventThrottle={16}
          />
        </View>
      );
    },
    [allPerks, benefitsYByPlan, insets.bottom, insets.top, currentPlanId, showTopCTAByPlan]
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
        centerSlot={
          <View style={{ alignSelf: "stretch" }}>
            <Text style={styles.headerTitle}>Upgrade plan</Text>
            <View style={{ height: TITLE_GAP }} />
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
        contentStyle={{ flexDirection: "column", gap: 10, paddingHorizontal: 16 }}
      />

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
    {!isCurrent && activePlan.id !== "standard" && (
      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: insets.bottom + 10,
          // nada sólido debajo para que el blur respire
          backgroundColor: "transparent",
          justifyContent: "center",
        }}
        pointerEvents="box-none"
      >
        <CTAButton
          title={getCtaLabel(activePlan.id)}
          onPress={() => onJoin(activePlan.id)}
          variant="primary"
          backdrop="blur"       // 👈 blur real como GlassHeader
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