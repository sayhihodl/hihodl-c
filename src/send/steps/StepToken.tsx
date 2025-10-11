// src/send/steps/StepToken.tsx
import React, { useMemo, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  TextInput,
  Keyboard, // opcional: para cerrar al seleccionar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import GlassHeader from "@/ui/GlassHeader";
import Row from "@/ui/Row";
import { legacy, glass } from "@/theme/colors";
import type { ChainKey } from "@/send/types";
import { useSendFlow } from "@/send/SendFlowProvider";

// iconos base (svg)
import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "@/config/iconRegistry";
// builder con reglas de prioridad/coherencia
import { buildSendChoices } from "@/config/sendChoices";

// mini-badges
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";

type Account = "Daily" | "Savings" | "Social";
const { TEXT, SUB } = legacy;
const GLASS_BG = glass.cardOnSheet;
const GLASS_BORDER = glass.cardBorder;

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

/* ====== icono de token con mini-badge de red ====== */
function TokenWithMini({
  tokenId,
  bestNet,
}: {
  tokenId: keyof typeof TOKEN_ICONS | string;
  bestNet: ChainKey;
}) {
  const def = (TOKEN_ICONS as any)[tokenId] ?? DEFAULT_TOKEN_ICON;
  const Mini = CHAIN_MINI[bestNet];
  return (
    <View style={{ width: AVATAR, height: AVATAR, position: "relative" }}>
      {def.kind === "svg" ? (
        <def.Comp width={AVATAR} height={AVATAR} />
      ) : (
        <def.Img width={AVATAR} height={AVATAR} />
      )}
      {!!Mini && (
        <View style={styles.miniBadge}>
          <Mini width={MINI_INNER} height={MINI_INNER} />
        </View>
      )}
    </View>
  );
}

type StepTokenProps = {
  /** Alias o nombre a mostrar en el título */
  title: string;
  /** Cuenta activa (para futuros matices visuales si hiciera falta) */
  account?: Account;
  /** Red ya seleccionada en el paso anterior (limita el builder) */
  selectedChain?: ChainKey;
  /** Callback cuando el user elige token */
  onPick?: (sel: { tokenId: string; bestNet: ChainKey }) => void;
  /** Volver al paso anterior */
  onBack?: () => void;
  /** Opcional: catálogo custom (tests/demos) */
  choicesOverride?: Array<{ id: string; label: string; bestNet: ChainKey }>;
};

export default function StepToken({
  title,
  account = "Daily",
  selectedChain,
  onPick,
  onBack,
  choicesOverride,
}: StepTokenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { patch, goTo } = useSendFlow(); // ✅ hooks dentro del componente

  // ===== filtro =====
  const [q, setQ] = useState("");

  // redes del destinatario
  const recipientChains = useMemo<ChainKey[] | undefined>(() => {
    if (!selectedChain) return undefined;
    if (selectedChain === "solana") return ["solana"];
    if (["base", "polygon", "ethereum"].includes(selectedChain))
      return ["base", "polygon", "ethereum"] as ChainKey[];
    return undefined;
  }, [selectedChain]);

  // catálogo
  const allChoices = useMemo(() => {
    const base = choicesOverride ?? buildSendChoices(recipientChains);
    // Preferimos SOLANA para stables si el destinatario la permite
    const solanaAllowed = !recipientChains || recipientChains.includes("solana");
    if (!solanaAllowed) return base;
    return base.map((t) =>
      t.id === "usdc" || t.id === "usdt" ? { ...t, bestNet: "solana" as ChainKey } : t
    );
  }, [recipientChains, choicesOverride]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allChoices;
    return allChoices.filter(
      (t) =>
        t.label.toLowerCase().includes(needle) ||
        t.id.toLowerCase().includes(needle)
    );
  }, [q, allChoices]);

  // secciones
  const recommended = filtered.slice(0, Math.min(4, filtered.length));
  const rest = filtered.slice(recommended.length);
  const sections = useMemo(
    () => [
      ...(recommended.length
        ? [{ title: "Recommended", key: "rec", data: recommended }]
        : []),
      ...(rest.length ? [{ title: "All tokens", key: "all", data: rest }] : []),
    ],
    [filtered]
  );

  const HEADER_INNER_TOP = 6;
  const TITLE_H = 44;
  const ROW_SEARCH_GAP = 16;
  const SEARCH_H = 50;
  const AFTER_SEARCH_GAP = 10;
  const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H + AFTER_SEARCH_GAP;
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  const handlePick = useCallback(
    (t: { id: string; label: string; bestNet: ChainKey }) => {
      // Guarda token+chain y resetea cantidad
      patch({ tokenId: t.id, chain: t.bestNet, amount: "" });
      onPick?.({ tokenId: t.id, bestNet: t.bestNet });
      // UX: cerrar teclado y limpiar query
      setQ("");
      Keyboard.dismiss();
      // Avanza a amount
      goTo("amount");
    },
    [patch, goTo, onPick]
  );

  const keyExtractor = useCallback(
    (it: { id: string }, idx: number) => `${it.id}-${idx}`,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: { id: string; label: string; bestNet: ChainKey } }) => (
      <Row
        containerStyle={styles.rowGlass}
        leftSlot={<TokenWithMini tokenId={item.id} bestNet={item.bestNet} />}
        labelNode={
          <View style={styles.labelWrap}>
            <Text style={styles.alias} numberOfLines={1} ellipsizeMode="tail">
              {item.label}
            </Text>
          </View>
        }
        rightIcon="chevron-forward"
        onPress={() => handlePick(item)}
        {...({ accessibilityLabel: `Pick ${item.label} on ${String(item.bestNet)}` } as any)}
      />
    ),
    [handlePick]
  );

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 20 }}
        leftSlot={null}
        rightSlot={null}
        centerSlot={
          <>
            <View style={[styles.topRow, { justifyContent: "space-between" }]}>
              <Pressable
                onPress={onBack}
                hitSlop={10}
                style={styles.headerIconBtnBare}
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={22} color={TEXT} />
              </Pressable>

              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>

              <View style={{ width: 36, height: 36 }} />
            </View>

            <View style={[styles.searchInHeader, { marginTop: 14, height: 50, marginBottom: 10 }]}>
              <Ionicons name="search" size={18} color={SUB} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search token or network…"
                placeholderTextColor={SUB}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {!!q && (
                <Pressable onPress={() => setQ("")} hitSlop={8} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={SUB} />
                </Pressable>
              )}
            </View>
          </>
        }
      />

      {/* LISTA */}
      <Animated.SectionList
        style={{ flex: 1 }}
        sections={sections as any}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 22,
          paddingTop: HEADER_TOTAL - 38,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        bounces={Platform.OS === "ios"}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        stickySectionHeadersEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={renderItem}
        ListFooterComponent={
          <Text style={styles.hint}>
            We pick the cheapest network automatically. You can change it on the
            confirmation screen.
          </Text>
        }
        ListEmptyComponent={
          <View style={{ paddingTop: 8 }}>
            <Text style={[styles.hint, { textAlign: "center" }]}>
              No matches. Try another token or network name.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/* ============== styles ============== */
const styles = StyleSheet.create({
  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerIconBtnBare: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: { color: legacy.TEXT, fontSize: 18, fontWeight: "600", textAlign: "center" },

  searchInHeader: {
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: "#fff", fontSize: 15 },

  sectionTitle: { color: SUB, fontSize: 12, letterSpacing: 0.3, marginTop: 10, marginBottom: 6 },

  labelWrap: { flex: 1, minWidth: 0, justifyContent: "center" },

  rowGlass: {
    backgroundColor: GLASS_BG,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  alias: { color: "#fff", fontWeight: "500", fontSize: 15, letterSpacing: 0.3 },
  phone: { color: SUB, fontSize: 12, marginTop: 2 },
  hint: { color: SUB, fontSize: 12, marginTop: 14, textAlign: "center" },

  miniBadge: {
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
  },
});