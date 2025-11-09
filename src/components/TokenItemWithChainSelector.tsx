// src/components/TokenItemWithChainSelector.tsx
// Componente que muestra un token agrupado con selector de chain
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SvgUri } from "react-native-svg";
import type { ChainKey } from "@/config/sendMatrix";
import { renderTokenIcon, renderChainBadge, mapChainKeyToChainId } from "@/config/iconRegistry";
import { TOKEN_ALLOWED_CHAINS, normalizeTokenId } from "@/config/sendMatrix";
import ExtraBadge from "@assets/chains/extra-chain.svg";
import { legacy, glass } from "@/theme/colors";

// URLs hardcodeadas - usando icon desde Jupiter API (campo "icon" no "logoURI")
// Para obtener: https://lite-api.jup.ag/tokens/v2/search?query=BONK
// La API devuelve: { "icon": "https://arweave.net/..." }
const HARDCODED_ICONS: Record<string, string[]> = {
  "BONK": [
    "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I", // Desde Jupiter API (icon field)
  ],
  "PYUSD": [
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8/logo.png", // TrustWallet (EVM token)
  ],
};

// Componente que GARANTIZA que siempre se muestre un icono - SOLUCIÓN CRÍTICA
// Estrategia: SIEMPRE mostrar la inicial del token como base, URLs remotas son solo mejoras opcionales
function TokenIconWithGuaranteedFallback({
  iconUrl,
  tokenId,
  symbol,
  size,
  inner,
}: {
  iconUrl?: string;
  tokenId?: string;
  symbol: string;
  size: number;
  inner: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentUriIndex, setCurrentUriIndex] = useState(0);
  
  // Obtener todas las URLs de fallback para este token
  const symbolUpper = symbol?.toUpperCase().trim();
  const fallbackUrls = symbolUpper && HARDCODED_ICONS[symbolUpper] ? HARDCODED_ICONS[symbolUpper] : [];
  const allUrls = iconUrl ? [iconUrl, ...fallbackUrls] : fallbackUrls;
  const currentUri = allUrls[currentUriIndex];
  
  // Debug para tokens problemáticos
  const isTargetToken = symbol === "BONK" || symbol === "JITOSOL" || symbol === "PYUSD" || symbol === "EURC" || symbol === "cbETH";
  
  React.useEffect(() => {
    if (isTargetToken && currentUri) {
      console.log(`[TokenIcon] ${symbol} - Intentando cargar (${currentUriIndex + 1}/${allUrls.length}):`, currentUri);
    }
  }, [currentUri, symbol, isTargetToken, currentUriIndex, allUrls.length]);
  
  // Fallback garantizado: inicial del token (SIEMPRE visible)
  const initialChar = symbol.slice(0, 1).toUpperCase() || "•";
  const baseIcon = (
    <View
      style={{
        width: inner,
        height: inner,
        borderRadius: inner / 2,
        backgroundColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: inner * 0.55 }}>
        {initialChar}
      </Text>
    </View>
  );

  // CRÍTICO: Todos los hooks deben ejecutarse SIEMPRE (antes de cualquier return condicional)
  // Intentar siguiente URL si la actual falló
  React.useEffect(() => {
    if (imageError && currentUriIndex < allUrls.length - 1 && currentUri) {
      console.log(`[TokenIcon] ${symbol} - Intentando siguiente URL (${currentUriIndex + 2}/${allUrls.length})`);
      setCurrentUriIndex(currentUriIndex + 1);
      setImageError(false); // Resetear para intentar siguiente URL
      setImageLoaded(false);
    }
  }, [imageError, currentUriIndex, allUrls.length, symbol, currentUri]);

  // Si NO hay URLs disponibles o todas fallaron, mostrar solo el base (fallback silencioso)
  if (!currentUri || (imageError && currentUriIndex >= allUrls.length - 1)) {
    // No loggear warning - es normal que algunos tokens no tengan iconos disponibles
    // El fallback con inicial es suficiente para la UX
    return <View style={{ width: size, height: size }}>{baseIcon}</View>;
  }

  const isSvg = currentUri.trim().toLowerCase().endsWith(".svg");

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* BASE: Inicial siempre visible como fallback */}
      <View style={{ position: "absolute", width: size, height: size, opacity: imageLoaded ? 0 : 1 }}>
        {baseIcon}
      </View>
      
      {/* OVERLAY: Intentar cargar imagen remota */}
      <View style={{ position: "absolute", width: size, height: size, opacity: imageLoaded ? 1 : 0 }}>
        {isSvg ? (
          <SvgUri 
            width={size} 
            height={size} 
            uri={currentUri}
            onLoad={() => {
              if (isTargetToken) console.log(`[TokenIcon] ${symbol} - SVG cargado exitosamente desde:`, currentUri);
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={(e) => {
              // Logging silencioso - no spamear consola con errores esperados
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        ) : (
          <Image
            source={{ uri: currentUri }}
            style={{ width: size, height: size, borderRadius: 8 }}
            resizeMode="cover"
            // CRÍTICO: Agregar referrerPolicy para evitar bloqueos 403 de CoinGecko
            {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
            onLoad={() => {
              if (isTargetToken) console.log(`[TokenIcon] ${symbol} - Imagen cargada exitosamente desde:`, currentUri);
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={(e) => {
              // Solo loggear error si NO es el último intento (para no spamear la consola)
              if (isTargetToken && currentUriIndex < allUrls.length - 1) {
                console.log(`[TokenIcon] ${symbol} - URL ${currentUriIndex + 1} falló, intentando siguiente...`);
              }
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        )}
      </View>
    </View>
  );
}

export type TokenVariant = {
  chain: ChainKey;
  id: string;
  decimals?: number;
  address?: string;
  reason?: "needs_meta" | "unsupported_chain";
};

type TokenItemWithChainSelectorProps = {
  symbol: string;
  name?: string;
  iconUrl?: string;
  brand?: string;
  variants: TokenVariant[];
  selectedChain: ChainKey;
  onSelect: (variant: TokenVariant) => void;
  disabled?: boolean;
  searchQuery?: string;
  tokenId?: string; // ID completo del token (ej: "BONK.token", "JUP.token") para resolver iconos
};

export default function TokenItemWithChainSelector({
  symbol,
  name,
  iconUrl: iconUrlProp,
  brand,
  variants,
  selectedChain,
  onSelect,
  disabled = false,
  searchQuery = "",
  tokenId,
}: TokenItemWithChainSelectorProps) {
  const [showChainPicker, setShowChainPicker] = useState(false);
  const selectedVariant = variants.find(v => v.chain === selectedChain) || variants[0];
  
  // Resolver iconUrl de forma DIRECTA y GARANTIZADA
  // PRIORIDAD: Hardcoded (para tokens específicos) > iconUrlProp > Catálogo
  const resolvedIconUrl = React.useMemo(() => {
    // PRIORIDAD 1: Hardcoded icons (CRÍTICO - siempre priorizar para tokens específicos como BONK)
    const symbolUpper = symbol?.toUpperCase().trim();
    if (symbolUpper && HARDCODED_ICONS[symbolUpper]) {
      // Devolver el primer URL (el componente intentará los fallbacks automáticamente)
      const firstUrl = HARDCODED_ICONS[symbolUpper][0];
      if (symbolUpper === "BONK") {
        console.log(`[TokenItem] ${symbol} usando hardcoded Jupiter icon (FORZADO):`, firstUrl);
      }
      return firstUrl;
    }
    
    // PRIORIDAD 2: Si viene de props (solo si no hay hardcoded)
    if (iconUrlProp) {
      return iconUrlProp;
    }
    
    // PRIORIDAD 3: Buscar en catálogo
    if (!tokenId && !symbol) return undefined;
    
    try {
      const { TOKENS_CATALOG } = require("@/config/tokensCatalog");
      
      // Buscar por símbolo primero
      let meta: any = null;
      if (symbol) {
        const sym = String(symbol).toUpperCase().trim();
        meta = (TOKENS_CATALOG as any[]).find((t: any) => {
          const tSym = String(t.symbol || "").toUpperCase().trim();
          return sym === tSym && sym.length > 0;
        });
      }
      
      // Si no encontramos por símbolo, buscar por ID
      if (!meta && tokenId) {
        const tid = tokenId.toLowerCase().trim();
        meta = (TOKENS_CATALOG as any[]).find((t: any) => {
          const tId = String(t.id || "").toLowerCase().trim();
          if (tid === tId) return true;
          if (tid.replace(/\./g, "") === tId.replace(/\./g, "")) return true;
          const tidBase = tid.split(".")[0];
          const tIdBase = tId.split(".")[0];
          if (tidBase && tidBase === tIdBase && tidBase.length > 0) return true;
          return false;
        });
      }
      
      if (meta) {
        // Para tokens de Solana: Intentar Jupiter primero
        const isSolana = meta.nativeChainId === "solana:mainnet" || 
                         (Array.isArray(meta.supportedChains) && meta.supportedChains.includes("solana:mainnet"));
        
        if (isSolana) {
          const symbolLower = String(meta.symbol || "").toLowerCase().trim();
          const jupiterKnown: Record<string, string> = {
            "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
            "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
            "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
            "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
            "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
            "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
            "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
          };
          
          if (symbolLower && jupiterKnown[symbolLower]) {
            return `https://assets.jup.ag/icons/${jupiterKnown[symbolLower]}.png`;
          }
        }
        
        // Usar CoinGecko logoURI
        if (meta.logoURI && typeof meta.logoURI === "string" && meta.logoURI.startsWith("http")) {
          return meta.logoURI;
        }
      }
    } catch (e) {
      console.error("[TokenItem] error resolving iconUrl for", symbol, e);
    }
    
    return undefined;
  }, [iconUrlProp, tokenId, symbol]);
  
  // Debug para tokens específicos
  React.useEffect(() => {
    const isTargetToken = symbol === "BONK" || symbol === "JITOSOL" || symbol === "PYUSD" || symbol === "EURC" || symbol === "cbETH";
    if (isTargetToken) {
      console.log(`[TokenItem] ${symbol} - iconUrlProp: "${iconUrlProp}", resolvedIconUrl: "${resolvedIconUrl}"`);
    }
  }, [symbol, iconUrlProp, resolvedIconUrl]);

  // Si solo hay una chain, no mostrar selector
  const hasMultipleChains = variants.length > 1;

  // Click principal: selecciona el token con la chain actual
  const handlePress = () => {
    if (!disabled && selectedVariant.reason !== "unsupported_chain") {
      onSelect(selectedVariant);
    }
  };

  // Click en el botón de swap: abre selector de chains
  const handleSwapPress = (e: any) => {
    e?.stopPropagation?.();
    if (!disabled) {
      setShowChainPicker(true);
    }
  };

  const handleChainSelect = (variant: TokenVariant) => {
    setShowChainPicker(false);
    onSelect(variant);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={disabled || selectedVariant.reason === "unsupported_chain"}
        style={[
          styles.rowGlass,
          { flexDirection: "row", alignItems: "center" },
          (disabled || selectedVariant.reason === "unsupported_chain") && { opacity: 0.5 },
        ]}
      >
        {/* Token Icon - SIEMPRE mostrar algo, incluso si es fallback */}
        <View style={{ width: 34, height: 34, position: "relative" }}>
          <TokenIconWithGuaranteedFallback
            iconUrl={resolvedIconUrl}
            tokenId={tokenId}
            symbol={symbol}
            size={34}
            inner={32}
          />
          
          {/* Badge de número de chains (solo si hay múltiples) - centrado y a la misma altura que el minibadge */}
          {hasMultipleChains && (
            <View style={styles.chainCountBadgeContainer}>
              <View style={styles.chainCountBadge}>
                <ExtraBadge width={14} height={12} />
                <Text style={styles.chainCountText}>{variants.length}</Text>
              </View>
            </View>
          )}
          
          {/* Chain badge de la chain seleccionada - a la misma altura que el badge +X */}
          <View style={styles.chainMini}>
            {renderChainBadge(mapChainKeyToChainId(selectedChain), { size: 16, chip: false })}
          </View>
        </View>

        {/* Token Info */}
        <View style={[styles.labelWrap, { marginLeft: 12, flex: 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.alias}>{symbol}</Text>
            {brand && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#FFB703" />
              </View>
            )}
          </View>
          {name && (
            <Text style={styles.phone}>{name}</Text>
          )}
          {selectedVariant.reason === "needs_meta" && (
            <Text style={[styles.phone, { color: "#F3C969" }]}>Metadata missing</Text>
          )}
          {selectedVariant.reason === "unsupported_chain" && (
            <Text style={[styles.phone, { color: "#FF7676" }]}>Unsupported chain</Text>
          )}
          {/* REMOVIDO: No mostrar etiquetas SOL, BAS, ETH, POL - el badge +X y el switch network son suficientes */}
        </View>

        {/* Action - Botón de swap solo si hay múltiples chains - COLOR GRIS (igual que flechas) */}
        {hasMultipleChains && !disabled && (
          <Pressable
            onPress={handleSwapPress}
            style={({ pressed }) => [
              { 
                padding: 6, 
                marginRight: 4,
                borderRadius: 8,
                backgroundColor: pressed ? "rgba(175,201,214,0.15)" : "transparent",
              }
            ]}
            hitSlop={8}
          >
            <Ionicons name="swap-horizontal" size={18} color="#AFC9D6" />
          </Pressable>
        )}
        {/* REMOVIDO: chevron-forward - el click en el row completo ya selecciona el token */}
      </Pressable>

      {/* Chain Picker Modal */}
      <Modal
        visible={showChainPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChainPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowChainPicker(false)}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select network for {symbol}</Text>
            {variants.map(variant => (
              <Pressable
                key={variant.chain}
                onPress={() => handleChainSelect(variant)}
                style={[
                  styles.chainOption,
                  selectedChain === variant.chain && styles.chainOptionSelected,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  {renderChainBadge(mapChainKeyToChainId(variant.chain), { size: 24, chip: false })}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chainOptionName}>{variant.chain.toUpperCase()}</Text>
                    {variant.reason === "needs_meta" && (
                      <Text style={styles.chainOptionSub}>Metadata missing</Text>
                    )}
                  </View>
                  {selectedChain === variant.chain && (
                    <Ionicons name="checkmark-circle" size={20} color="#FFB703" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  rowGlass: {
    backgroundColor: glass.cardOnSheet,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  alias: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  phone: {
    color: legacy.SUB,
    fontSize: 12,
    marginTop: 2,
  },
  chainMini: {
    position: "absolute",
    right: -7,
    bottom: -6, // Alineado con chainCountBadge (misma altura) - era -4
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  chainCountBadgeContainer: {
    position: "absolute",
    left: "50%", // Centrado horizontalmente
    marginLeft: -7, // Mitad del ancho del badge (14/2) para centrar perfectamente
    bottom: -6, // Más abajo para minimizar solapamiento con el logo (era -4)
    zIndex: 10,
  },
  chainCountBadge: {
    width: 14,
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chainCountText: {
    position: "absolute",
    color: "#000",
    fontSize: 7.5,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    zIndex: 1,
    // Centrar verticalmente dentro del badge
    top: "50%",
    marginTop: -3.75, // Mitad del fontSize
    width: "100%",
    lineHeight: 7.5,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  // REMOVIDO: chainChip y chainChipText - ya no se usan (etiquetas eliminadas)
  tokenIcon: {
    fontSize: 34,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(13,24,32,0.95)",
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  chainOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chainOptionSelected: {
    backgroundColor: "rgba(255,183,3,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,183,3,0.3)",
  },
  chainOptionName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  chainOptionSub: {
    color: legacy.SUB,
    fontSize: 12,
    marginTop: 2,
  },
});

