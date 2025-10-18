// src/send/steps/StepToken.tsx
import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated, Platform, TextInput, Keyboard, Image, FlatList
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SvgUri } from "react-native-svg";
import { BlurView } from "expo-blur";
import GlassHeader from "@/ui/GlassHeader";
import { legacy, glass } from "@/theme/colors";
import type { ChainKey } from "@/send/types";
import { useSendFlow } from "@/send/SendFlowProvider";
import type { TokenMeta } from "@/send/SendFlowProvider";

import { renderTokenIcon, iconKeyForTokenId } from "@/config/iconRegistry";
import { useRecentTokens } from "@/hooks/useRecentTokens";
import { HighlightedText } from "@/utils/highlight";

import { multichainSearch, type MCGroup, type MCItem } from "@/services/multichainSearch";
// ⬇️ añade TextInput al import de tipos si no estaba
import type { TextInput as RNTextInput } from "react-native"; // 👈 solo para el tipo del ref
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";

const { SUB } = legacy;
const GLASS_BG = glass.cardOnSheet;
const GLASS_BORDER = glass.cardBorder;

const CHAIN_MINI: Partial<Record<ChainKey, React.ComponentType<any>>> = {
  solana: SolBadge, ethereum: EthBadge, base: BaseBadge, polygon: PolyBadge,
};

const AVATAR = 34;
const MINI_BADGE = 18;
const MINI_INNER = 18;

function useDebounced<T>(val: T, ms = 220) {
  const [v, setV] = useState(val);
  useEffect(() => { const h = setTimeout(() => setV(val), ms); return () => clearTimeout(h); }, [val, ms]);
  return v;
}

/* token icon + mini chain, con soporte de iconUrl remoto */
function TokenWithMini({ iconKey, bestNet, iconUrl }: { iconKey?: string; bestNet: ChainKey; iconUrl?: string }) {
  const Mini = CHAIN_MINI[bestNet];
  const safeKey = (iconKey || "generic").toLowerCase();
  const url = (iconUrl || "").trim();
  const isSvg = !!url && url.toLowerCase().endsWith(".svg");

  return (
    <View style={{ width: AVATAR, height: AVATAR, position: "relative" }}>
      {url ? (
        isSvg ? <SvgUri width={AVATAR} height={AVATAR} uri={url} /> :
        <Image source={{ uri: url }} style={{ width: AVATAR, height: AVATAR, borderRadius: 8 }} resizeMode="cover" />
      ) : (
        renderTokenIcon(safeKey, { size: AVATAR, inner: AVATAR - 2, withCircle: false })
      )}
      {!!Mini && (
        <View style={styles.miniBadge}><Mini width={MINI_INNER} height={MINI_INNER} /></View>
      )}
    </View>
  );
}

type StepTokenProps = {
  title: string;
  selectedChain?: ChainKey;
  onPick?: (sel: { tokenId: string; bestNet: ChainKey }) => void;
  onBack?: () => void;
  onTopChange?: (atTop: boolean) => void;

  /** Cuando el header lo pinta el modal */
  useExternalHeader?: boolean;
  /** Estado controlado del search (desde el modal) */
  searchValue?: string;
  onChangeSearch?: (t: string) => void;
  /** Ref del input del header del modal */
  searchInputRef?: React.RefObject<RNTextInput | null>;
};

export default function StepToken({
  title,
  selectedChain,
  onPick,
  onBack,
  onTopChange,
  useExternalHeader,
  searchValue,
  onChangeSearch,
  searchInputRef,
}: StepTokenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const atTopRef = useRef(true);
  const lastSentTop = useRef<boolean | null>(null);
  const dragStartY = useRef(0);
  const usingExtHeader = !!useExternalHeader; 
  const { patch, goTo } = useSendFlow();

  const [qInternal, setQInternal] = useState("");
  const q = (searchValue ?? qInternal);
  const setQ = (onChangeSearch ?? setQInternal);
  const dq = useDebounced(q.trim(), 220);

  const { recent, add: addRecent } = useRecentTokens();
  const [groups, setGroups] = useState<MCGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // redes permitidas según destino (pero si hay query, buscamos en todas)
  const allowChains = useMemo<ChainKey[] | undefined>(() => {
    if (dq) return undefined; // 👈 Súper buscador: sin filtros cuando hay texto
    if (!selectedChain) return undefined;
    if (selectedChain === "solana") return ["solana"];
    if (["base", "polygon", "ethereum"].includes(selectedChain))
      return ["base", "polygon", "ethereum"] as ChainKey[];
    return undefined;
  }, [selectedChain, dq]);

  // fetch federado
  useEffect(() => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : (null as any);
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await multichainSearch(dq, allowChains as any);
        if (mounted) setGroups(res);
      } catch {/* noop */}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; ctrl?.abort?.(); };
  }, [dq, allowChains]);

  // “Recent” (sin query)
  const recentRows: MCItem[] = useMemo(() => {
    if (dq || !recent?.length || !groups.length) return [];
    const flat = groups.flatMap((g) => g.items);
    const byId = new Map(flat.map((i) => [i.id, i]));
    return recent.map((id) => byId.get(id)).filter(Boolean) as MCItem[];
  }, [dq, recent, groups]);

  // pick (elige la mejor chain del grupo, o el item dado)
  const pickItem = useCallback((it: MCItem) => {
    const cleanSymbol = (it.symbol || it.name || "TOKEN").split(".")[0].toUpperCase();
    const iconKey = iconKeyForTokenId(it.id) ?? (it.symbol || "generic").toLowerCase();

    const meta: TokenMeta & { iconUrl?: string } = {
      id: it.id,
      chain: it.chain,
      symbol: cleanSymbol,
      displaySymbol: cleanSymbol,
      name: it.name || cleanSymbol,
      brand: it.brand,
      displayName: cleanSymbol,
      iconKey,
      decimals: it.decimals ?? 6,
      iconUrl: it.iconUrl,
    };

    patch({ token: meta as any, tokenId: meta.id, chain: meta.chain, amount: "" });
    Promise.resolve(addRecent(meta.id)).catch(() => {});
    onPick?.({ tokenId: meta.id, bestNet: meta.chain as ChainKey });
    setQ("");
    Keyboard.dismiss();
    goTo("amount");
  }, [addRecent, goTo, onPick, patch]);

  // render de cada item (una chain concreta)
  const renderMCItem = (item: MCItem) => {
    const disabled = item.reason === "unsupported_chain";



    return (
      <Pressable
        key={`${item.id}-${item.chain}`}
        onPress={() => !disabled && pickItem(item)}
        disabled={disabled}
        style={[
          styles.rowGlass,
          { flexDirection: "row", alignItems: "center" },
          disabled && { opacity: 0.5 },
        ]}
        {...({ accessibilityLabel: `Pick ${item.symbol} on ${String(item.chain)}` } as any)}
      >
        <TokenWithMini
          iconKey={iconKeyForTokenId(item.id) ?? item.id}
          bestNet={item.chain}
          iconUrl={item.iconUrl}
        />

        <View style={[styles.labelWrap, { marginLeft: 12 }]}>
          <HighlightedText
            text={`${item.symbol}`}
            query={dq}
            style={styles.alias}
            highlightStyle={{ color: "#FFD86A", fontWeight: "700" }}
            numberOfLines={1}
          />
          {item.reason === "needs_meta" && (
            <Text style={[styles.phone, { color: "#F3C969" }]}>Metadata missing</Text>
          )}
          {item.reason === "unsupported_chain" && (
            <Text style={[styles.phone, { color: "#FF7676" }]}>Unsupported chain</Text>
          )}
          {!item.reason && !!item.name && (
            <Text style={styles.phone}>{item.name}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#AFC9D6" />
      </Pressable>
    );
  };

  const HEADER_CONTENT_H = 44 + 16 + 50 + 10;
  const HEADER_TOTAL = insets.top + 6 + HEADER_CONTENT_H;
  // arriba, junto a otros useRef
  const inputRef = useRef<TextInput>(null);
  // emitir gate al montar
  useEffect(() => {
    if (lastSentTop.current !== atTopRef.current) {
      lastSentTop.current = atTopRef.current;
      onTopChange?.(atTopRef.current);
    }
  }, [onTopChange]);

useEffect(() => {
  // Debug visual y por consola
  const count = groups.flatMap(g => g.items).length;
  console.debug("[StepToken] groups", groups.length, "items", count);
}, [groups]);


return (
  <View style={{ flex: 1 }}>
    {/* Si el header viene del modal, NO dibujamos el del Step */}
    {!useExternalHeader && (
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={6}
        solidColor="transparent"
        contentStyle={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 0,
        }}
        leftSlot={<View style={{ width: 36 }} />}
        rightSlot={<View style={{ width: 36 }} />}
        centerSlot={
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>

            <View style={styles.searchWrap}>
              <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
              {/* Capa densa para que no se “lea” la lista al hacer scroll */}
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(8,15,22,0.55)", borderRadius: 14 },
                ]}
              />
              <Pressable
                style={styles.searchRow}
                onPress={() => inputRef.current?.focus()}
                accessibilityLabel="Search currency"
                hitSlop={8}
              >
                <Ionicons name="search" size={18} color={SUB} />
                <TextInput
                  ref={inputRef}
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search currency…"
                  placeholderTextColor={SUB}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {!!q && (
                  <Pressable onPress={() => setQ("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={SUB} />
                  </Pressable>
                )}
              </Pressable>
            </View>
          </View>
        }
      />
    )}
  
      
      <FlatList
        style={{ flex: 1 }}
        data={groups.flatMap(g => g.items) as any}
        keyExtractor={(it: MCItem, idx: number) => `${it.id}-${it.chain}-${idx}`}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 22,
          paddingTop: useExternalHeader ? 6 : (HEADER_TOTAL - 38),
          flexGrow: 1,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        bounces={Platform.OS === "ios"}
        overScrollMode="never"
        initialNumToRender={16}
        windowSize={7}
        onScroll={(e) => {
          const y = e?.nativeEvent?.contentOffset?.y || 0;
          const atTop = y <= 0.5;
          atTopRef.current = atTop;
          if (lastSentTop.current !== atTop) { lastSentTop.current = atTop; onTopChange?.(atTop); }
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={({ nativeEvent }) => {
          dragStartY.current = nativeEvent.contentOffset.y || 0;
          atTopRef.current = dragStartY.current <= 0.5;
          if (lastSentTop.current !== atTopRef.current) { lastSentTop.current = atTopRef.current; onTopChange?.(atTopRef.current); }
        }}
        onScrollEndDrag={({ nativeEvent }) => {
          if (lastSentTop.current !== atTopRef.current) { lastSentTop.current = atTopRef.current; onTopChange?.(atTopRef.current); }
          const y = nativeEvent.contentOffset.y || 0;
          const overscroll = y < -56;
          const startedAtTop = dragStartY.current <= 0.5;
          if (startedAtTop && overscroll) onBack?.();
        }}
        renderItem={({ item }) => renderMCItem(item as MCItem)}
        ListEmptyComponent={
          <View style={{ paddingTop: 8 }}>
            <Text style={[styles.hint, { textAlign: "center" }]}>
              {loading ? "Searching…" : "No matches found. Try another name or address."}
            </Text>
          </View>
        }
        ListFooterComponent={<Text style={styles.hint}>Networks auto-selected for lowest fee. Change it on the next screen.</Text>}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: legacy.TEXT, fontSize: 18, fontWeight: "600", textAlign: "center" },
   searchWrap: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 10,
    height: 50,
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER, // mantiene el borde sutil original
  },
  searchRow: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  sectionTitle: { color: legacy.SUB, fontSize: 12, letterSpacing: 0.3, marginTop: 10, marginBottom: 6 },
  labelWrap: { flex: 1, minWidth: 0, justifyContent: "center" },
  rowGlass: { backgroundColor: GLASS_BG, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  alias: { color: "#fff", fontWeight: "500", fontSize: 15, letterSpacing: 0.3 },
  phone: { color: legacy.SUB, fontSize: 12, marginTop: 2 },
  hint: { color: legacy.SUB, fontSize: 12, marginTop: 14, textAlign: "center" },
  miniBadge: {
    position: "absolute", right: -7, bottom: -5, width: MINI_BADGE, height: MINI_BADGE, borderRadius: 6, overflow: "hidden",
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },
});