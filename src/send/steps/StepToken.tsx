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
import { useUserPrefs } from "@/store/userPrefs";
import { useBalancesStore } from "@/store/balances";

import { multichainSearch, type MCGroup, type MCItem } from "@/services/multichainSearch";
import TokenItemWithChainSelector, { type TokenVariant } from "@/components/TokenItemWithChainSelector";
import { selectBestChain } from "@/services/tokenSelectionRules";
// ⬇️ añade TextInput al import de tipos si no estaba
import type { TextInput as RNTextInput } from "react-native"; // 👈 solo para el tipo del ref
import SolBadge from "@assets/chains/Solana-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import BaseBadge from "@assets/chains/Base-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import { logger } from "@/utils/logger";

const { SUB } = legacy;
const GLASS_BG = glass.cardOnSheet;
const GLASS_BORDER = glass.cardBorder;

const CHAIN_MINI: Partial<Record<ChainKey, React.ComponentType<any>>> = {
  solana: SolBadge, ethereum: EthBadge, base: BaseBadge, polygon: PolyBadge,
};

const AVATAR = 34;
const MINI_BADGE = 18;
const MINI_INNER = 18;

function useDebounced<T>(val: T, ms = 300) {
  const [v, setV] = useState(val);
  const isFirstRender = useRef(true);
  
  useEffect(() => { 
    // Si el valor está vacío, actualizar inmediatamente (para limpiar resultados rápido)
    if (val === "" || (typeof val === "string" && val.trim() === "")) {
      setV(val);
      return;
    }
    
    // En el primer render, si hay un valor, establecerlo inmediatamente
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setV(val);
      return;
    }
    
    const h = setTimeout(() => setV(val), ms); 
    return () => clearTimeout(h); 
  }, [val, ms]);
  
  // Reset flag si el valor cambia a vacío
  if (val === "" || (typeof val === "string" && val.trim() === "")) {
    isFirstRender.current = false;
  }
  
  return v;
}

/* token icon + mini chain, con soporte de iconUrl remoto - GARANTIZA fallback */
function TokenWithMini({ iconKey, bestNet, iconUrl }: { iconKey?: string; bestNet: ChainKey; iconUrl?: string }) {
  const Mini = CHAIN_MINI[bestNet];
  const safeKey = (iconKey || "generic").toLowerCase();
  const [imageError, setImageError] = React.useState(false);
  const url = (iconUrl || "").trim();
  const isSvg = !!url && url.toLowerCase().endsWith(".svg");

  return (
    <View style={{ width: AVATAR, height: AVATAR, position: "relative" }}>
      {url && !imageError ? (
        isSvg ? (
          <SvgUri 
            width={AVATAR} 
            height={AVATAR} 
            uri={url}
            onError={() => setImageError(true)}
          />
        ) : (
          <Image 
            source={{ uri: url }} 
            style={{ width: AVATAR, height: AVATAR, borderRadius: 8 }} 
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )
      ) : (
        // SIEMPRE mostrar algo - renderTokenIcon tiene fallback garantizado
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
  onPick?: (sel: { tokenId: string; bestNet: ChainKey; symbol?: string; name?: string }) => void;
  onBack?: () => void;
  onTopChange?: (atTop: boolean) => void;

  /** Cuando el header lo pinta el modal */
  useExternalHeader?: boolean;
  /** Estado controlado del search (desde el modal) */
  searchValue?: string;
  onChangeSearch?: (t: string) => void;
  /** Ref del input del header del modal */
  searchInputRef?: React.RefObject<RNTextInput | null>;
  /** Destinatario para personalización (último token usado con este destinatario será segunda opción) */
  recipient?: string;
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
  recipient,
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
  const setQ = useCallback((value: string) => {
    if (onChangeSearch) {
      onChangeSearch(value);
    } else {
      setQInternal(value);
    }
  }, [onChangeSearch]);
  // Debounce reducido para búsqueda más rápida mientras escribe (pero sin saturar requests)
  // IMPORTANTE: Si q está vacío, dq debe estar vacío inmediatamente (sin debounce)
  const dq = useDebounced(q.trim(), 250);
  
  // Asegurar que si q está vacío, dq también lo esté (para cargar recommended de primeras)
  const effectiveQuery = useMemo(() => {
    const trimmed = q.trim();
    // Si el input está vacío, forzar query vacía para que se cargue recommended()
    if (trimmed === "") return "";
    // Si hay texto, usar el debounced
    return dq;
  }, [q, dq]);

  const { recent, add: addRecent } = useRecentTokens();
  const [groups, setGroups] = useState<MCGroup[]>([]);
  const [loading, setLoading] = useState(true); // Iniciar en true para mostrar loading mientras carga
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Grupos expandidos (para "View more")
  const favoriteChainByToken = useUserPrefs((s) => s.favoriteChainByToken);
  
  // Obtener balances del usuario (safe, puede fallar)
  const userBalances = useMemo(() => {
    try {
      const { useBalancesStore } = require("@/store/balances");
      const flat = useBalancesStore.getState().flat || [];
      // Convertir a formato { tokenId: { chain: amount } }
      const byToken: Record<string, Record<ChainKey, number>> = {};
      for (const b of flat as any[]) {
        const tokenKey = (b.tokenId || "").toLowerCase();
        if (!byToken[tokenKey]) byToken[tokenKey] = {} as Record<ChainKey, number>;
        byToken[tokenKey][b.chain as ChainKey] = (byToken[tokenKey][b.chain as ChainKey] || 0) + (b.amount || 0);
      }
      return byToken;
    } catch {
      return undefined;
    }
  }, []);

  // redes permitidas según destino
  // IMPORTANTE: Si NO hay query, mostrar TODAS las chains para que se agrupen correctamente
  // Solo filtrar por chain cuando el usuario está buscando activamente
  const allowChains = useMemo<ChainKey[] | undefined>(() => {
    // Si hay query activa, buscar en todas las chains (super buscador)
    if (effectiveQuery) return undefined;
    
    // Si NO hay query: mostrar TODOS los tokens con TODAS sus chains (para agrupamiento completo)
    // Esto permite que USDC/USDT muestren badge "+4" y switch network
    return undefined; // Sin filtros = mostrar todas las chains
    
    // NOTA: Si queremos filtrar por selectedChain en el futuro, sería:
    // if (!selectedChain) return undefined;
    // if (selectedChain === "solana") return ["solana"];
    // if (["base", "polygon", "ethereum"].includes(selectedChain))
    //   return ["base", "polygon", "ethereum"] as ChainKey[];
    // return undefined;
  }, [effectiveQuery]); // Remover selectedChain de dependencias ya que no lo usamos

  // fetch federado - CARGAR INMEDIATAMENTE al montar (incluso con query vacía)
  useEffect(() => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : (null as any);
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Obtener IDs de tokens recientes para priorizar en ordenamiento (pagos frecuentes)
        const recentIds = recent?.length ? recent.map(id => id.toLowerCase()) : undefined;
        
        // Obtener último token usado con este destinatario (para mostrarlo como segunda opción)
        let lastUsedWithRecipient: { tokenId: string; chain: ChainKey } | undefined = undefined;
        if (recipient) {
          try {
            const { getLastUsedWithRecipient } = require("@/services/paymentBehaviorLearning");
            lastUsedWithRecipient = await getLastUsedWithRecipient(recipient);
          } catch {
            // Sistema de aprendizaje no disponible
          }
        }
        
        // IMPORTANTE: usar effectiveQuery (que garantiza "" si no hay input)
        // Si está vacío, multichainSearch() llamará a recommended() automáticamente
        // Pasar userBalances para priorizar tokens con balance
        // Pasar recipient y lastUsedWithRecipient para mostrar última opción usada como segunda opción
        const res = await multichainSearch(effectiveQuery, allowChains as any, selectedChain, recentIds, userBalances, recipient, lastUsedWithRecipient);
        if (mounted) setGroups(res);
      } catch (e) {
        logger.debug("[StepToken] search error", String(e));
      } finally { 
        if (mounted) setLoading(false); 
      }
    })();
    return () => { mounted = false; ctrl?.abort?.(); };
  }, [effectiveQuery, allowChains, recent, selectedChain, recipient]); // Usar effectiveQuery en lugar de dq

  // "Recent" (sin query)
  const recentRows: MCItem[] = useMemo(() => {
    if (effectiveQuery || !recent?.length || !groups.length) return [];
    const flat = groups.flatMap((g) => g.items);
    const byId = new Map(flat.map((i) => [i.id, i]));
    return recent.map((id) => byId.get(id)).filter(Boolean) as MCItem[];
  }, [effectiveQuery, recent, groups]); // Usar effectiveQuery en lugar de dq

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
    onPick?.({ tokenId: meta.id, bestNet: meta.chain as ChainKey, symbol: cleanSymbol, name: meta.name });
    setQ("");
    Keyboard.dismiss();
    goTo("amount");
  }, [addRecent, goTo, onPick, patch]);

  // Render con agrupación y selector de chain
  const renderMCItem = (item: MCItem) => {
    // Extraer variants completos del item (si tiene metadata _variants)
    const variants = (item as any)._variants as TokenVariant[] | undefined;
    
    // Si no hay variants explícitos, usar solo el item actual
    if (!variants || variants.length === 0) {
      const availableChains = (item as any)._availableChains as ChainKey[] || [item.chain];
      // Construir variants desde availableChains
      const builtVariants: TokenVariant[] = availableChains.map(chain => ({
        chain,
        id: chain === item.chain ? item.id : `${item.symbol.toLowerCase()}-${chain}`,
        decimals: item.decimals,
        address: item.address,
        reason: item.reason,
      }));
      
      // Si solo hay una chain, usar render simple
      if (builtVariants.length === 1) {
        return renderSimpleItem(item);
      }
      
      // Usar los variants construidos
      return renderGroupedItem(item, builtVariants);
    }

    // Si solo hay una variant, usar render simple
    if (variants.length === 1) {
      return renderSimpleItem(item);
    }

    // Múltiples variants: usar componente con selector
    return renderGroupedItem(item, variants);
  };

  // Render simple para tokens con una sola chain
  const renderSimpleItem = (item: MCItem) => {
    return (
      <Pressable
        key={`${item.id}-${item.chain}`}
        onPress={() => item.reason !== "unsupported_chain" && pickItem(item)}
        disabled={item.reason === "unsupported_chain"}
        style={[
          styles.rowGlass,
          { flexDirection: "row", alignItems: "center" },
          item.reason === "unsupported_chain" && { opacity: 0.5 },
        ]}
      >
        <TokenWithMini
          iconKey={iconKeyForTokenId(item.id) ?? item.id}
          bestNet={item.chain}
          iconUrl={item.iconUrl}
        />
        <View style={[styles.labelWrap, { marginLeft: 12 }]}>
          <HighlightedText
            text={item.symbol}
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
        {/* Sin flecha: el row completo es clickeable para seleccionar el token */}
      </Pressable>
    );
  };

  // Render agrupado con selector de chain
  const renderGroupedItem = (item: MCItem, variants: TokenVariant[]) => {
    const availableChains = variants.map(v => v.chain);
    
    // Auto-seleccionar mejor chain usando reglas INTELIGENTES
    // Prioridad: Balance del usuario > Favorita > Destinatario > Popularidad
    const bestChain = selectBestChain(
      item.symbol,
      availableChains,
      {
        recipientChain: selectedChain, // Chain del destinatario (baja prioridad ahora)
        userBalances,
        userFavoriteChain: favoriteChainByToken?.[item.symbol.toLowerCase()],
        preferredChain: selectedChain,
        requireBalance: true, // IMPORTANTE: priorizar chains con balance
      }
    ) || variants[0]?.chain || item.chain;

    const handleVariantSelect = (variant: TokenVariant) => {
      // Crear un MCItem con la chain seleccionada
      const selectedItem: MCItem = {
        ...item,
        chain: variant.chain,
        id: variant.id,
        decimals: variant.decimals,
        address: variant.address,
        reason: variant.reason,
      };
      pickItem(selectedItem);
    };

    // Debug: verificar iconUrl antes de pasar al componente
    if ((item.symbol === "JTO" || item.symbol === "ORCA" || item.symbol === "RAY" || item.symbol === "WIF") && !item.iconUrl) {
      logger.debug(`[StepToken] ${item.symbol} MISSING iconUrl`, item.id, "chain:", item.chain);
    }
    
    return (
      <TokenItemWithChainSelector
        key={`${item.symbol}-group`}
        symbol={item.symbol}
        name={item.name}
        iconUrl={item.iconUrl}
        brand={item.brand}
        tokenId={item.id} // Pasar ID completo para resolver iconos correctamente
        variants={variants}
        selectedChain={bestChain}
        onSelect={handleVariantSelect}
        disabled={item.reason === "unsupported_chain"}
        searchQuery={dq}
      />
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
  logger.debug("[StepToken] groups", groups.length, "items", count);
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
                  ref={inputRef || searchInputRef}
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search currency…"
                  placeholderTextColor={SUB}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  // La búsqueda se actualiza automáticamente mientras escribes (debounce de 250ms)
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
        data={groups as any}
        keyExtractor={(g: MCGroup, idx: number) => g.key || `group-${idx}`}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 22,
          paddingTop: useExternalHeader ? 20 : (HEADER_TOTAL - 38),
          flexGrow: 1,
        }}
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
        renderItem={({ item: group }) => {
          const isExpanded = expandedGroups.has(group.key);
          const isOtherGroup = group.key === "other";
          const SHOW_LIMIT = 10;
          const hasMore = group.items.length > SHOW_LIMIT;
          const itemsToShow = isExpanded || !hasMore ? group.items : group.items.slice(0, SHOW_LIMIT);
          
          return (
            <View style={{ marginBottom: 16 }}>
              {/* Título del grupo (solo si hay múltiples grupos o es "Other tokens") */}
              {groups.length > 1 && (
                <Text style={styles.sectionTitle}>{group.title}</Text>
              )}
              
              {/* Items del grupo */}
              {itemsToShow.map((item, idx) => (
                <View key={`${item.id}-${item.chain}-${idx}`} style={{ marginBottom: 8 }}>
                  {renderMCItem(item)}
                </View>
              ))}
              
              {/* Botón "View more" si hay más items */}
              {hasMore && !isExpanded && (
                <Pressable
                  onPress={() => setExpandedGroups(prev => new Set(prev).add(group.key))}
                  style={styles.viewMoreBtn}
                >
                  <Text style={styles.viewMoreText}>View more ({group.items.length - SHOW_LIMIT} more)</Text>
                  <Ionicons name="chevron-down" size={16} color={legacy.SUB} />
                </Pressable>
              )}
              
              {/* Botón "Show less" si está expandido */}
              {hasMore && isExpanded && (
                <Pressable
                  onPress={() => {
                    const newSet = new Set(expandedGroups);
                    newSet.delete(group.key);
                    setExpandedGroups(newSet);
                  }}
                  style={styles.viewMoreBtn}
                >
                  <Text style={styles.viewMoreText}>Show less</Text>
                  <Ionicons name="chevron-up" size={16} color={legacy.SUB} />
                </Pressable>
              )}
            </View>
          );
        }}
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
  sectionTitle: { color: legacy.SUB, fontSize: 12, letterSpacing: 0.3, marginTop: 10, marginBottom: 8, fontWeight: "600" },
  labelWrap: { flex: 1, minWidth: 0, justifyContent: "center" },
  rowGlass: { backgroundColor: GLASS_BG, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  alias: { color: "#fff", fontWeight: "500", fontSize: 15, letterSpacing: 0.3 },
  phone: { color: legacy.SUB, fontSize: 12, marginTop: 2 },
  hint: { color: legacy.SUB, fontSize: 12, marginTop: 14, textAlign: "center" },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  viewMoreText: {
    color: legacy.SUB,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  miniBadge: {
    position: "absolute", right: -7, bottom: -5, width: MINI_BADGE, height: MINI_BADGE, borderRadius: 6, overflow: "hidden",
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },
});