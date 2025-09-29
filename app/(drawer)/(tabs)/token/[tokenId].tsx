// app/(drawer)/(tabs)/token/[tokenId].tsx
import React, { useMemo, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Animated, Share } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/theme/colors";
import T from "@/ui/T";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { GlassCard, Divider } from "@/ui/Glass";
import SegmentedPills, { type PillItem } from "@/ui/SegmentedPills";
import { Tile, TileRow2Up } from "@/ui/Tile";
import { isStableCurrency, isVolatile } from "@/token/coins";
import { useSmartBack } from "@/nav/useSmartBack";

/* ---------- helpers ---------- */
type TokenKey = { currencyId: string; chainId?: string | null; accountId: string };
function parseTokenKey(raw?: string | string[]): TokenKey | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  const [currencyId, chainId, accountId] = v.split("::");
  if (!currencyId || !accountId) return null;
  return { currencyId, chainId: chainId || null, accountId };
}

function TokenBadge({ symbol }: { symbol: string }) {
  const label = (symbol || "?").slice(0, 3).toUpperCase();
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
      <T kind="caption" style={{ fontWeight: "800" }}>{label}</T>
    </View>
  );
}

function PriceBlock({ price, changePct }: { price?: number | null; changePct?: number | null }) {
  const p = typeof price === "number" ? price : null;
  const c = typeof changePct === "number" ? changePct : null;
  const positive = (c ?? 0) > 0;
  return (
    <View>
      <T kind="display">{p && p > 0 ? `$${p.toFixed(2)}` : "$—"}</T>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {c == null ? (
          <T kind="sub">—</T>
        ) : (
          <>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: positive ? "#177a49" : "rgba(255,255,255,0.1)" }}>
              <T kind="caption" style={{ fontWeight: "800", color: "#fff" }}>
                {(c >= 0 ? "+" : "") + c.toFixed(2)}%
              </T>
            </View>
            <T kind="caption" style={{ color: colors.textSubtle }}>24h</T>
          </>
        )}
      </View>
    </View>
  );
}

function PriceChartPlaceholder() {
  return <View style={styles.chart} />;
}

function CollapsibleSection({ collapsedHeight = 180, children }: React.PropsWithChildren<{ collapsedHeight?: number }>) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <View style={!open ? { maxHeight: collapsedHeight, overflow: "hidden" } : undefined}>{children}</View>
      {!open && (
        <View style={{ marginTop: -40 }}>
          <View pointerEvents="none" style={{ height: 40, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: "rgba(2,9,13,0.65)" }} />
          <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.seeMoreBtn, pressed && { opacity: 0.85 }]}>
            <T kind="body" style={{ fontWeight: "800" }}>See more</T>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const RANGE: PillItem[] = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "1Y", label: "1Y" },
  { id: "ALL", label: "ALL" },
];

/* ---------- screen ---------- */
export default function TokenDetails() {
  const { tokenId } = useLocalSearchParams<{ tokenId?: string }>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;

  const parsed = useMemo(() => parseTokenKey(tokenId), [tokenId]);
  const currencyId = parsed?.currencyId ?? "";

  // ===== back inteligente (rota por tabs cuando no hay historial) =====
  const MAIN_CYCLE = [
    "/(drawer)/(tabs)/(home)",
    "/(drawer)/(tabs)/referral",
    "/(drawer)/(tabs)/swap",
    "/(drawer)/(tabs)/payments",
    "/(drawer)/(tabs)/discover",
  ];
  const { goBackSmart, attachToNavigation } = useSmartBack({
    mainCycle: MAIN_CYCLE,
    fallback: { pathname: "/(drawer)/(tabs)/(home)" as any },
    drawerId: "app-drawer",
  });

  // habilitar gesto del stack
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: true, headerShown: false });
  }, [navigation]);

  // enganchar listeners + bloquear drawer mientras está en foco
  useEffect(() => attachToNavigation(navigation), [attachToNavigation, navigation]);

  const stable = isStableCurrency(currencyId);
  const volatile = isVolatile(currencyId);

  // Share
  const onShare = async () => {
    const symbol = currencyId.toUpperCase();
    const url = `https://hihodl.app/token/${encodeURIComponent(symbol)}`; // <-- pon tu deep link real
    const msg = `Estoy mirando ${symbol} en HiHODL. Échale un ojo: ${url}`;
    try {
      await Share.share({ message: msg, url, title: `HiHODL • ${symbol}` });
    } catch {}
  };

  // demo
  const [rangeIdx, setRangeIdx] = useState(0);
  const mockPrice = stable ? 1.0 : 73.12;
  const mockChange = stable ? 0.02 : -2.34;

  return (
    <View style={styles.root}>
      <ScreenBg account="Daily" />

      <GlassHeader
        scrolly={scrolly}
        leftSlot={
          <Pressable onPress={goBackSmart} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TokenBadge symbol={currencyId} />
            <T kind="header">{currencyId ? currencyId.toUpperCase() : "—"}</T>
          </View>
        }
        rightSlot={
          <Pressable onPress={onShare} hitSlop={10} accessibilityLabel="Share token">
            <Ionicons name="share-outline" size={20} color="#fff" />
          </Pressable>
        }
        blurTint="dark"
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 44 + 8, paddingBottom: insets.bottom + 28 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolly } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <GlassCard tone="panel" style={{ padding: 16 }}>
            <PriceBlock price={mockPrice} changePct={mockChange} />
            {stable && (
              <>
                <View style={{ height: 10 }} />
                <T kind="caption" style={{ color: colors.textSubtle }}>
                  Stablecoin detectada. Omitimos la gráfica para centrarte en tu posición y acciones.
                </T>
              </>
            )}
          </GlassCard>
        </View>

        {volatile && (
          <>
            <View style={{ height: 12 }} />
            <View style={{ paddingHorizontal: 16 }}>
              <GlassCard tone="glass" style={{ padding: 12 }}>
                <PriceChartPlaceholder />
                <View style={{ height: 12 }} />
                <SegmentedPills items={RANGE} activeIndex={rangeIdx} onPress={(i) => setRangeIdx(i)} wrapBackground="rgba(255,255,255,0.06)" />
              </GlassCard>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <T kind="section">Actions</T>
        </View>
        <View style={{ height: 8 }} />
        <TileRow2Up style={{ paddingHorizontal: 0 }}>
          <Tile icon="qr-code" title="Receive" sub="Share your address" />
          <Tile icon="send" title="Send" sub="Transfer to others" />
        </TileRow2Up>
        <View style={{ height: 12 }} />
        <TileRow2Up style={{ paddingHorizontal: 0 }}>
          <Tile icon="swap-horizontal" title="Swap" sub="Exchange assets" />
          <Tile icon="ellipsis-horizontal" title="More" sub="Manage token" />
        </TileRow2Up>

        <View style={{ height: 20 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <T kind="section">Your position</T>
        </View>
        <View style={{ height: 8 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <GlassCard tone="glass">
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <T kind="bodyDim">Balance</T>
                <View style={{ height: 6 }} />
                <T kind="title" style={{ fontWeight: "800" }}>249.995440</T>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <T kind="bodyDim">Value</T>
                <View style={{ height: 6 }} />
                <T kind="title" style={{ fontWeight: "800" }}>$250.00</T>
              </View>
            </View>
            <Divider />
            <View style={{ padding: 16 }}>
              <T kind="bodyDim">24h Return</T>
              <View style={{ height: 6 }} />
              <T kind="title" style={{ fontWeight: "800" }}>$5.85</T>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 14 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <CollapsibleSection collapsedHeight={180}>
            <GlassCard tone="panel">
              <View style={{ padding: 16 }}>
                <T kind="section">Details</T>
                <View style={{ height: 8 }} />
                <T kind="bodyDim">
                  Contract, supply, market cap, volumen, links, explorer, notas, alerts…
                </T>
              </View>
              <Divider />
              <View style={{ padding: 16 }}>
                <T kind="bodyDim">Security tips</T>
                <View style={{ height: 6 }} />
                <T kind="caption">Nunca compartas tu seed phrase. Verifica direcciones al enviar.</T>
              </View>
            </GlassCard>
          </CollapsibleSection>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navBg },
  chart: {
    height: 180,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  seeMoreBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});