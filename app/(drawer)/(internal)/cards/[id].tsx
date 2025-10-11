// app/cards/[id].tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient as SvgLG, Stop, Rect } from "react-native-svg";

import colors from "@/theme/colors";
import ScreenBg from "@/ui/ScreenBg";
import { CTAButton } from "@/ui/CTAButton";
import {
  type Account,
  ACCOUNT_PRIMARY,      // color del pill de cuenta
  CARD_GRADS,           // gradiente de la tarjeta
} from "@/theme/gradients";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_ASPECT = 1.586; // 85.60 × 53.98 mm
const CARD_WIDTH = SCREEN_WIDTH - 24;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);

// apoyo
const H_NAVY = "#023047";

// ===== utils de seguridad =====
const DEFAULT_GRADIENT: [string, string] = ["#0D1820", "#16232E"];
const DEFAULT_ACC_COLOR = "#FFB703";

function normalizeGradient(
  maybe: ReadonlyArray<string> | undefined,
  fallbackBase?: string
): [string, string] {
  if (Array.isArray(maybe) && maybe.length > 0) {
    const c0 = (maybe[0] as string) ?? fallbackBase ?? DEFAULT_GRADIENT[0];
    const c1 = (maybe[1] as string) ?? c0;
    return [c0, c1];
  }
  const base = fallbackBase ?? DEFAULT_GRADIENT[0];
  return [base, DEFAULT_GRADIENT[1]];
}

type Tx = { id: string; name: string; date: string; amount: string };

export default function CardDetails() {
  const params = useLocalSearchParams<{ id?: string; account?: Account }>();
  const account: Account = (params.account as Account) ?? "Daily";
  const cardId = (params.id as string) ?? "general";

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const txs = useMemo<Tx[]>(
    () => [
      { id: "1", name: "Nuzest Uk & Eu", date: "2 September, 22:18", amount: "-66,45 €" },
      { id: "2", name: "Renfe", date: "12 August, 15:25", amount: "-110 €" },
      { id: "3", name: "Renfe", date: "12 August, 15:25 · Card verification", amount: "0 €" },
    ],
    []
  );

  // color/gradiente seguros
  const accountColor = ACCOUNT_PRIMARY[account] ?? DEFAULT_ACC_COLOR;
  const gradient = normalizeGradient(CARD_GRADS[account] as ReadonlyArray<string> | undefined, accountColor);

  // Título visible
  const cardTitle =
    cardId.toLowerCase() === "general"
      ? "General"
      : cardId.charAt(0).toUpperCase() + cardId.slice(1);

  const alias = `@alex.${account.toLowerCase()}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* background del menú */}
      <ScreenBg account={account} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.brand}>HiHODL</Text>
        <Pressable hitSlop={10} accessibilityLabel="Help">
          <Ionicons name="help-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO: tarjeta grande */}
        <View style={styles.cardWrap}>
          <CardFaceSVG
            gradient={gradient}
            accountLabel={account}
            accountColor={accountColor}
            masked="•• 4011"
            alias={alias}
            variant="virtual"
            network="mastercard"
            title={cardTitle}
          />
        </View>

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <Action icon="eye-outline" label="Show details" onPress={() => {}} />
          <Action icon="snow-outline" label="Freeze" onPress={() => {}} />
          <Action icon="settings-outline" label="Settings" onPress={() => {}} />
        </View>

        {/* Movimientos + CTA */}
        <View style={styles.sheet}>
          <FlatList
            data={txs}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={<View style={{ height: 6 }} />}
            renderItem={({ item }) => (
              <Pressable style={styles.txRow} onPress={() => {}}>
                <View style={styles.txIcon}>
                  <Ionicons name="bag-handle" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName}>{item.name}</Text>
                  <Text style={styles.txMeta}>{item.date}</Text>
                </View>
                <Text style={styles.txAmount}>{item.amount}</Text>
              </Pressable>
            )}
            ListFooterComponent={
              <>
                <Pressable onPress={() => {}} style={styles.seeAll}>
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>

                <CTAButton
                  title="Add to Apple Wallet"
                  onPress={() => {}}
                  style={styles.appleCta}
                  variant="secondary"
                  leftIcon={<Ionicons name="wallet-outline" size={18} color="#000" />}
                />
              </>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Card UI con SVG gradient ---------- */
function CardFaceSVG({
  gradient,
  accountLabel,
  accountColor,
  variant,
  title,
  alias,
  masked,
  network,
}: {
  gradient: [string, string];
  accountLabel: string;
  accountColor: string;
  variant: "virtual" | "physical";
  title: string;
  alias?: string;
  masked: string;
  network: "mastercard" | "visa";
}) {
  const [c0, c1] = gradient;

  // evitar colisiones de id en <Defs> si se renderizan varias tarjetas
  const gradId = useMemo(() => `cardGrad-${Math.random().toString(36).slice(2)}`, []);

  return (
    <View style={styles.card}>
      {/* fondo gradiente */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLG id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c0} />
            <Stop offset="1" stopColor={c1} />
          </SvgLG>
        </Defs>
        <Rect width="100%" height="100%" rx={22} fill={`url(#${gradId})`} />
      </Svg>

      {/* contenido */}
      <View style={{ flex: 1, padding: 18 }}>
        {/* Top pills */}
        <View style={styles.cardTopRow}>
          <View style={[styles.pillSolid, { backgroundColor: accountColor }]}>
            <Text style={styles.pillSolidTxt}>{accountLabel}</Text>
          </View>
          <View style={styles.pillMuted}>
            <Text style={styles.pillMutedTxt}>
              {variant === "virtual" ? "Virtual" : "Physical"}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{title}</Text>

        {/* Chip + contactless */}
        <View style={styles.cardMidRow}>
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={[styles.chipLine, { width: 18 }]} />
            <View style={[styles.chipLine, { width: 22 }]} />
          </View>
          <Ionicons
            name="wifi-outline"
            size={18}
            color="rgba(0,0,0,0.75)"
            style={{ transform: [{ rotate: "90deg" }] }}
          />
        </View>

        {/* Alias + masked */}
        <View style={{ marginTop: 10 }}>
          {!!alias && <Text style={styles.alias}>{alias}</Text>}
          <Text style={styles.masked}>{masked}</Text>
        </View>

        {/* Marca */}
        <View style={styles.brandRow}>
          {network === "mastercard" ? (
            <View style={styles.mcRight}>
              <View style={[styles.mcCircle, { backgroundColor: "#EA001B" }]} />
              <View style={[styles.mcCircle, { backgroundColor: "#F79E1B", marginLeft: -14 }]} />
            </View>
          ) : (
            <Text style={styles.visa}>VISA</Text>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- tiny ---------- */
function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionItem}>
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

  cardWrap: { marginTop: 6, paddingHorizontal: 12 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    padding: 0, // el padding va en el contenido interior
    overflow: "hidden", // para que el rect con rx haga el borde redondeado
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  pillSolid: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillSolidTxt: { color: "#0B0B0F", fontWeight: "900", letterSpacing: 0.2, fontSize: 12 },

  pillMuted: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  pillMutedTxt: { color: "#111", fontWeight: "700", letterSpacing: 0.2, fontSize: 12 },

  cardTitle: { color: H_NAVY, fontSize: 20, fontWeight: "900", marginTop: 8, paddingHorizontal: 18 },

  cardMidRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  chip: {
    width: 44,
    height: 34,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    padding: 6,
    gap: 4,
  },
  chipLine: { height: 3, width: 24, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 2 },

  alias: { color: H_NAVY, fontWeight: "800", fontSize: 14, letterSpacing: 0.2, paddingHorizontal: 18 },
  masked: { color: "#0F1720", fontWeight: "900", fontSize: 22, marginTop: 2, paddingHorizontal: 18 },

  brandRow: { flex: 1, alignItems: "flex-end", justifyContent: "flex-end", padding: 18 },
  mcRight: { flexDirection: "row", alignItems: "center" },
  mcCircle: { width: 36, height: 36, borderRadius: 18, opacity: 0.95 },
  visa: { fontWeight: "900", fontSize: 22, color: "#14213D" },

  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 12,
  },
  actionItem: { alignItems: "center", gap: 8 },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionLabel: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "600" },

  sheet: {
    marginTop: 18,
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#0F151A",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  txName: { color: "#fff", fontWeight: "800", fontSize: 15 },
  txMeta: { color: "rgba(255,255,255,0.6)", marginTop: 2, fontSize: 12 },
  txAmount: { color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 8 },

  seeAll: { alignItems: "center", paddingVertical: 14 },
  seeAllText: { color: "#fff", fontWeight: "900", letterSpacing: 0.2, fontSize: 15 },

  appleCta: { marginTop: 6, borderRadius: 14 },
});