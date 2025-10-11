import React, { useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { legacy } from "@/theme/colors";
import type { ChainKey } from "@/types/send";

// iconos base (svg)
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "@/config/iconRegistry";
// builder con reglas de prioridad/coherencia
import { buildSendChoices } from "@/config/sendChoices";

// mini-badges reales
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";

type Account = "Daily" | "Savings" | "Social";
const { BG, TEXT, SUB } = legacy;

/* ====== mini badge mapping ====== */
const CHAIN_MINI: Partial<Record<ChainKey, React.ComponentType<any>>> = {
  solana: SolBadge,
  ethereum: EthBadge,
  base: BaseBadge,
  polygon: PolyBadge,
};

/* ====== tamaños ====== */
const AVATAR = 34;
const MINI_BADGE = 18;
const MINI_INNER = 18;

/* ====== util: dirección corta con extremos en negrita ====== */
function AddrShort({ addr }: { addr?: string }) {
  if (!addr) return null;
  const a = String(addr);
  const isHex = /^0x[0-9a-fA-F]+$/.test(a);
  const head = isHex ? a.slice(0, 6) : a.slice(0, 4);
  const tail = a.slice(-4);
  return (
    <Text style={styles.headerPillSub} numberOfLines={1}>
      <Text style={styles.addrStrong}>{head}</Text>
      {"…"}
      <Text style={styles.addrStrong}>{tail}</Text>
    </Text>
  );
}

/* ====== token icon con mini-badge dentro ====== */
function TokenWithMini({ tokenId, bestNet }: { tokenId: keyof typeof TOKEN_ICONS | string; bestNet: ChainKey }) {
  const def = (TOKEN_ICONS as any)[tokenId] ?? DEFAULT_TOKEN_ICON;
  const Mini = CHAIN_MINI[bestNet];

  return (
    <View style={{ width: AVATAR, height: AVATAR, position: "relative", overflow: "visible" }}>
      {def.kind === "svg" ? (
        <def.Comp width={AVATAR} height={AVATAR} />
      ) : (
        <def.Img width={AVATAR} height={AVATAR} />
      )}
      {!!Mini && (
        <View
          style={{
            position: "absolute",
            right: -7,
            bottom: -10,
            width: MINI_BADGE,
            height: MINI_BADGE,
            borderRadius: 6,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.18)",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <Mini width={MINI_INNER} height={MINI_INNER} />
        </View>
      )}
    </View>
  );
}

/* ====== screen ====== */
export default function TokenSelect() {
  const insets = useSafeAreaInsets();
  const { toType, toRaw, display, chain, resolved, account, label } = useLocalSearchParams<{
    toType?: string;
    toRaw: string;              // dirección/handle original
    display?: string;           // address larga (si aplica)
    label?: string;             // nombre guardado ("Address 1") o @alias
    chain?: ChainKey;           // red elegida en la pantalla previa
    resolved?: string;          // address resuelta
    account?: Account;
  }>();

  const acc: Account = (account as Account) ?? "Daily";
  const selectedChain = chain as ChainKey | undefined;

  /** ===== Header metrics: más aire ===== */
  const HEADER_INNER_TOP = 12;
  const TITLE_H = 44;
  const HEADER_CONTENT_H = TITLE_H;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  const scrollY = useRef(new Animated.Value(0)).current;

  /** ===== Derivamos las redes del destinatario para el builder =====
   *  - Si viene Solana -> ["solana"]
   *  - Si viene EVM (base/polygon/ethereum) -> ["base","polygon","ethereum"]
   *  - Si no viene nada -> undefined (builder decide con catálogo por defecto)
   */
  const recipientChains = useMemo<ChainKey[] | undefined>(() => {
    if (!selectedChain) return undefined;
    if (selectedChain === "solana") return ["solana"];
    if (["base", "polygon", "ethereum"].includes(selectedChain)) return ["base", "polygon", "ethereum"] as ChainKey[];
    return undefined;
  }, [selectedChain]);

  /** ===== Catálogo con coherencia por red y prioridades ===== */
  const choices = useMemo(() => buildSendChoices(recipientChains), [recipientChains]);

  const goAmount = useCallback(
    (tokenId: string, sendOn: ChainKey) => {
      router.push({
        pathname: "/(drawer)/(tabs)/send/amount",
        params: {
          tokenId,
          to: resolved || toRaw,
          account: acc,
          network: sendOn,
          toType,
          toDisplay: (label as string) || (display as string) || toRaw, // mantiene alias/label
        } as any,
      });
    },
    [acc, resolved, toRaw, toType, display, label]
  );

  const onBack = () => router.back();

  // Header: título = label/alias si existe; subtítulo = address corta SOLO si no es alias
  const titleLabel = (label as string) || (display as string) || toRaw;
  const isAlias = String(titleLabel).startsWith("@");
  const addrForHeader = (resolved as string) || (display as string) || (toRaw as string);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "bottom"]}>
      <ScreenBg account={acc} height={HEADER_TOTAL + 220} />

      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 16 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <View style={styles.headerRow}>
            <Pressable onPress={onBack} hitSlop={10} style={styles.headerIconBtnBare} accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color={TEXT} />
            </Pressable>

            <View style={styles.headerPill}>
              <Text style={styles.headerPillTop} numberOfLines={1}>{titleLabel}</Text>
              {!isAlias && <AddrShort addr={addrForHeader} />}
            </View>

            <View style={{ width: 22 }} />
          </View>
        }
      />

      {/* Body con más espacio bajo el header */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 28 + insets.bottom,
          paddingTop: HEADER_CONTENT_H + HEADER_INNER_TOP + 22,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Text style={styles.sectionTitle}>Recommended</Text>

        {choices.map((t) => (
          <Pressable key={t.id} onPress={() => goAmount(t.id, t.bestNet)} style={styles.row} hitSlop={8}>
            <TokenWithMini tokenId={t.id} bestNet={t.bestNet} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>{t.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={SUB} />
          </Pressable>
        ))}

        <Text style={styles.hint}>
          We pick the cheapest network automatically. You can change it on the confirmation screen.
        </Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

const styles = StyleSheet.create({
  headerRow: {
    height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%",
  },
  headerIconBtnBare: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  headerPill: {
    flex: 1, marginHorizontal: 8, paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 10, android: 12 }),
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },
  headerPillTop: { color: "#fff", fontWeight: "900", fontSize: 16 },
  headerPillSub: { color: SUB, fontSize: 12, marginTop: 2 },
  addrStrong: { color: "#fff", fontWeight: "900" },

  sectionTitle: { color: SUB, fontSize: 12, letterSpacing: 0.3, marginTop: 2, marginBottom: 10 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    marginBottom: 10,
  },

  rowTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hint: { color: SUB, fontSize: 12, marginTop: 14, textAlign: "center" },
});