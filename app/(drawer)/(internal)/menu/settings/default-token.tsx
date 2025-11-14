// app/menu/settings/default-token.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import SearchField from "@/ui/SearchField";
import colors, { legacy as legacyColors } from "@/theme/colors";
import { CTAButton } from "@/ui/CTAButton";
import { useUserPrefs } from "@/store/userPrefs";
import { findTokenById } from "@/config/tokensCatalog";
import { normalizeTokenId } from "@/config/sendMatrix";
import { multichainSearch, type MCItem } from "@/services/multichainSearch";
import TokenItemWithChainSelector, { type TokenVariant } from "@/components/TokenItemWithChainSelector";

/* ===== theme ===== */
const BG   = colors.navBg ?? legacyColors.BG ?? "#0B0B0F";
const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";

/* ===== header dials ===== */
const TITLE_H = 44;
const ROW_SEARCH_GAP = 12;
const SEARCH_H = 42;
const HEADER_INNER_TOP = 6;
const HEADER_CONTENT_H = TITLE_H + ROW_SEARCH_GAP + SEARCH_H;

export default function DefaultTokenScreen() {
  const insets = useSafeAreaInsets();
  const HEADER_TOTAL = insets.top + HEADER_INNER_TOP + HEADER_CONTENT_H;

  // Leer token predeterminado del userPrefs store
  const currentTokenId = useUserPrefs((state) => state.defaultTokenId) || "usdc";
  const setDefaultTokenId = useUserPrefs((state) => state.setDefaultTokenId);
  
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<Array<{ key: string; title: string; items: MCItem[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string>(currentTokenId.toLowerCase());

  // Buscar tokens usando multichainSearch
  useEffect(() => {
    let cancelled = false;
    
    async function searchTokens() {
      setIsLoading(true);
      try {
        const results = await multichainSearch(
          query.trim(),
          undefined, // allowChains - mostrar todas las chains
          undefined, // preferredChain
          undefined, // recentTokenIds
          undefined, // userBalances
          undefined, // recipient
          undefined  // lastUsedWithRecipient
        );
        
        if (!cancelled) {
          setGroups(results);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error searching tokens:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    searchTokens();
    
    return () => {
      cancelled = true;
    };
  }, [query]);

  // Encontrar el token actual en el catálogo para obtener su ID completo
  const currentToken = useMemo(() => {
    if (!currentTokenId) return null;
    let token = findTokenById(currentTokenId);
    if (!token) {
      const normalized = normalizeTokenId(currentTokenId);
      if (normalized) {
        // Buscar en los grupos de resultados
        for (const group of groups) {
          const found = group.items.find(item => normalizeTokenId(item.id) === normalized);
          if (found) {
            return { id: found.id, symbol: found.symbol };
          }
        }
      }
    }
    return token;
  }, [currentTokenId, groups]);

  // Sincronizar selectedTokenId con el token del store
  useEffect(() => {
    const tokenId = currentToken?.id?.toLowerCase() || (currentTokenId || "usdc").toLowerCase();
    if (tokenId !== selectedTokenId) {
      setSelectedTokenId(tokenId);
    }
  }, [currentTokenId, currentToken, selectedTokenId]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const closeScreen = () =>
    (router as any)?.canGoBack?.() ? router.back() : router.replace("/menu");

  const hasChanges = selectedTokenId !== (currentToken?.id?.toLowerCase() || currentTokenId.toLowerCase());

  const onSave = async () => {
    // Guardar en el store
    setDefaultTokenId(selectedTokenId);
    router.replace("/menu"); // ← evita volver a DefaultToken al hacer back
  };

  const handleTokenSelect = useCallback((variant: TokenVariant) => {
    setSelectedTokenId(variant.id.toLowerCase());
  }, []);

  // Función para verificar si un token está seleccionado (comparando por símbolo normalizado)
  const isTokenSelected = useCallback((item: MCItem) => {
    const selectedNormalized = normalizeTokenId(selectedTokenId);
    const itemNormalized = normalizeTokenId(item.id);
    
    // Si ambos se normalizan al mismo token, están seleccionados
    if (selectedNormalized && itemNormalized && selectedNormalized === itemNormalized) {
      return true;
    }
    
    // También verificar match directo por ID
    return selectedTokenId === item.id.toLowerCase();
  }, [selectedTokenId]);

  // Renderizar item agrupado con selector de chain
  const renderGroupedItem = (item: MCItem) => {
    const variants = (item as any)._variants as TokenVariant[] | undefined;
    
    // Si no hay variants explícitos, crear uno desde el item
    const itemVariants: TokenVariant[] = variants && variants.length > 0
      ? variants
      : [{
          chain: item.chain,
          id: item.id,
          decimals: item.decimals,
          address: item.address,
          reason: item.reason,
        }];

    // Determinar si este token está seleccionado
    const isSelected = isTokenSelected(item);

    // Seleccionar la mejor chain:
    // 1. La que coincide con selectedTokenId
    // 2. Si el token está seleccionado pero no hay match exacto, usar la primera variant
    // 3. Si no está seleccionado, usar la primera variant (mejor chain por defecto)
    const selectedVariant = itemVariants.find(v => v.id.toLowerCase() === selectedTokenId) || itemVariants[0];

    return (
      <View key={`${item.symbol}-${item.id}`} style={[styles.rowWrapper, isSelected && styles.selectedRow]}>
        <View style={{ flex: 1 }}>
          <TokenItemWithChainSelector
            symbol={item.symbol}
            name={item.name}
            iconUrl={item.iconUrl}
            brand={item.brand}
            tokenId={item.id}
            variants={itemVariants}
            selectedChain={selectedVariant.chain}
            onSelect={handleTokenSelect}
            disabled={false}
            searchQuery={query}
          />
        </View>
        {/* Radio button indicador de selección */}
        <View style={styles.radioContainer}>
          <Ionicons
            name={isSelected ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={isSelected ? "#fff" : SUB}
          />
        </View>
      </View>
    );
  };

  // Flatten todos los items de todos los grupos
  const allItems = useMemo(() => {
    return groups.flatMap(group => group.items);
  }, [groups]);

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
      {/* Fondo (notch + header) */}
      <ScreenBg account="Daily" height={HEADER_TOTAL + 220} />

      {/* ===== GlassHeader ===== */}
      <GlassHeader
        scrolly={scrollY}
        height={HEADER_CONTENT_H}
        innerTopPad={HEADER_INNER_TOP}
        solidColor="transparent"
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        contentStyle={{ flexDirection: "column", paddingHorizontal: 16 }}
        leftSlot={
          <Pressable onPress={closeScreen} hitSlop={10} style={styles.headerIconBtnClear}>
            <Ionicons name="close" size={22} color={TEXT} />
          </Pressable>
        }
        rightSlot={<View style={{ width: 36 }} />}
        centerSlot={
          <>
            {/* Título */}
            <View style={styles.topRow}>
              <Text style={styles.title}>Default Token</Text>
            </View>

            {/* Search */}
            <View style={{ marginTop: ROW_SEARCH_GAP, width: "100%" }}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder="Search token"
                height={SEARCH_H}
                onClear={() => setQuery("")}
                containerStyle={{ marginLeft: 0, marginRight: 0 }}
                inputProps={{
                  autoCapitalize: "none",
                  autoCorrect: false,
                }}
              />
            </View>
          </>
        }
      />

      {/* ===== Lista ===== */}
      <Animated.FlatList
        data={allItems}
        keyExtractor={(item) => `${item.id}-${item.chain}`}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120, // hueco para CTA
          paddingTop: HEADER_TOTAL - 30,      // acerca el contenido al header
        }}
        ListEmptyComponent={
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            {isLoading ? (
              <Text style={{ color: SUB, textAlign: "center" }}>Loading tokens...</Text>
            ) : (
              <Text style={{ color: SUB, textAlign: "center" }}>No tokens found</Text>
            )}
          </View>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item }) => renderGroupedItem(item)}
      />

      {/* ===== CTA Save (usa CTAButton con brand) ===== */}
      {hasChanges && (
        <View style={[styles.saveBar, { paddingBottom: 12 + insets.bottom }]}>
          <CTAButton
            title="SAVE"
            onPress={onSave}
            variant="secondary"
            tone="light"
            backdrop="blur"
            style={{ height: 52, borderRadius: 16 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  topRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  headerIconBtnClear: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800", textAlign: "center" },

  // Row wrapper
  rowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  // Selected row highlight
  selectedRow: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  radioContainer: {
    paddingLeft: 12,
    paddingRight: 14,
    justifyContent: "center",
  },

  // Save bar
  saveBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
