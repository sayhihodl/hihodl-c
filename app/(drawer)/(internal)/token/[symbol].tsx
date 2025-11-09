// app/(drawer)/(internal)/token/[symbol].tsx
// Pantalla principal de detalles de token - Estructura estilo Phantom

import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, RefreshControl, Pressable, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import { useTokenDetails, type TokenScope } from "@/hooks/useTokenDetails";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import TokenIcon from "@app/(drawer)/(tabs)/(home)/components/TokenIcon";
import TokenPriceSection from "@/components/token/TokenPriceSection";
import TokenQuickActions from "@/components/token/TokenQuickActions";
import TokenPositionCard from "@/components/token/TokenPositionCard";
import TokenInfoSection from "@/components/token/TokenInfoSection";
import TokenTransactions from "@/components/token/TokenTransactions";
import { useSmartBack } from "@/nav/useSmartBack";
import { usePersistedState } from "@/hooks/usePersistedState";
import { tokens } from "@/lib/layout";
import { useTokenChains } from "@/lib/tokenChains";
import type { CurrencyId, ChainId } from "@/store/portfolio.store";
import { chainIdToNetworkKey } from "@/lib/format";
import { CHAIN_ID_TO_KEY } from "@/config/chainMapping";
import { TOKENS_CATALOG } from "@/config/tokensCatalog";
import BaseBadge from "@assets/chains/Base-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import SolBadge from "@assets/chains/Solana-chain.svg";
import TxDetailsModal from "@/payments/TxDetailsModal";
import { TxDetails } from "@/components/tx/TransactionDetailsSheet";
import type { TxItem } from "@/hooks/useTokenDetails";

const SCOPE_STORAGE_KEY = "@token_details_scope";

export default function TokenDetailsScreen() {
  const { symbol } = useLocalSearchParams<{ symbol?: string }>();
  const router = useRouter();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrolly = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showNetworkSheet, setShowNetworkSheet] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TxDetails | null>(null);

  // Parse symbol
  const tokenSymbol = useMemo(() => {
    if (!symbol) return "usdc";
    return symbol.toLowerCase();
  }, [symbol]);
  
  // Scope persistido por token
  const [persistedScope, setPersistedScope] = usePersistedState<TokenScope>(
    `${SCOPE_STORAGE_KEY}_${tokenSymbol}`,
    { kind: "wallet-all" }
  );

  const { data, isLoading, error, scope, setScope } = useTokenDetails(tokenSymbol, persistedScope);
  
  // Obtener chains del token para multi-badge - SIEMPRE ejecutar (antes de early returns)
  // Usar el currencyId del data si existe, o un fallback basado en el symbol
  const currencyIdForChains = useMemo(() => {
    if (data?.meta?.id) return data.meta.id as CurrencyId;
    // Fallback: intentar mapear symbol a CurrencyId
    const symLower = tokenSymbol.toLowerCase();
    if (symLower.includes("usdc")) return "USDC.circle" as CurrencyId;
    if (symLower.includes("usdt")) return "USDT.tether" as CurrencyId;
    if (symLower.includes("sol")) return "SOL.native" as CurrencyId;
    if (symLower.includes("eth")) return "ETH.native" as CurrencyId;
    return "USDC.circle" as CurrencyId; // Default fallback
  }, [data?.meta?.id, tokenSymbol]);
  
  const tokenChainsFromPortfolio = useTokenChains(currencyIdForChains);
  
  // Obtener chains soportadas del catálogo (fallback si no hay posiciones)
  // IMPORTANTE: Siempre usar el catálogo como fuente principal para mostrar todos los networks disponibles
  const tokenChains = useMemo(() => {
    // Primero intentar del catálogo (más confiable para mostrar todos los networks)
    const catalogToken = TOKENS_CATALOG.find(t => t.id === currencyIdForChains);
    if (catalogToken?.supportedChains && catalogToken.supportedChains.length > 0) {
      return catalogToken.supportedChains as ChainId[];
    }
    
    // Si no está en el catálogo, usar chains del portfolio
    if (tokenChainsFromPortfolio.length > 0) {
      return tokenChainsFromPortfolio;
    }
    
    // Fallback: usar las chains del TOKEN_CHAINS si está disponible
    try {
      const { TOKEN_CHAINS } = require("@/lib/networks");
      const fallbackChains = (TOKEN_CHAINS[currencyIdForChains] || []) as ChainId[];
      if (fallbackChains.length > 0) {
        return fallbackChains;
      }
    } catch {
      // Ignorar error
    }
    
    return [];
  }, [tokenChainsFromPortfolio, currencyIdForChains]);

  // Mapear chains disponibles a NetworkKeys para el selector
  const availableNetworks = useMemo(() => {
    return tokenChains.map(chainId => ({
      chainId,
      networkKey: chainIdToNetworkKey(chainId),
      chainKey: CHAIN_ID_TO_KEY[chainId],
    }));
  }, [tokenChains]);

  // Obtener ChainId del network actual para ordenar los chains (el actual primero)
  const currentChainId = useMemo(() => {
    // Si hay network en el scope, usarlo
    if (scope.network) {
      const found = availableNetworks.find(n => n.networkKey === scope.network);
      if (found) return found.chainId;
    }
    
    // Si hay data, usar el network por defecto basado en contracts
    if (data) {
      const defaultNetwork = data.meta.contracts.solana ? "solana" : data.meta.contracts.base ? "base" : "ethereum";
      const found = availableNetworks.find(n => n.networkKey === defaultNetwork);
      if (found) return found.chainId;
    }
    
    // Si no hay data ni scope, usar el primer chain disponible (probablemente Solana para USDC)
    return tokenChains.length > 0 ? tokenChains[0] : null;
  }, [data, scope.network, availableNetworks, tokenChains]);

  // Ordenar chains para que el actual sea el primero (para que TokenIcon lo muestre como primary)
  const orderedTokenChains = useMemo(() => {
    if (!currentChainId || !tokenChains.includes(currentChainId)) {
      // Si no hay currentChainId, devolver los chains tal cual
      return tokenChains;
    }
    const others = tokenChains.filter(c => c !== currentChainId);
    return [currentChainId, ...others];
  }, [tokenChains, currentChainId]);

  // Sincronizar scope cuando cambie
  useEffect(() => {
    if (scope.kind !== persistedScope.kind || scope.network !== persistedScope.network) {
      setPersistedScope(scope);
    }
  }, [scope, persistedScope, setPersistedScope]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFollow = async () => {
    await Haptics.selectionAsync();
    setIsFollowing(!isFollowing);
  };

  const handleSend = () => {
    router.push("/(drawer)/(internal)/send");
  };

  const handleReceive = () => {
    router.push("/(drawer)/(internal)/receive");
  };

  const handleSwap = () => {
    router.push("/(drawer)/(tabs)/swap");
  };

  const handleBuy = () => {
    router.push("/(drawer)/(tabs)/swap");
  };

  const handleSell = () => {
    router.push("/(drawer)/(tabs)/swap");
  };

  const handleMore = () => {
    // TODO: Abrir menú de más opciones
  };

  const handleTransactionPress = (tx: TxItem) => {
    // Convertir TxItem a TxDetails
    const txDetails: TxDetails = {
      id: tx.id,
      dir: tx.type === "send" ? "out" : tx.type === "receive" ? "in" : "swap",
      when: new Date(tx.timestamp).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      peer: tx.counterpartyLabel,
      tokenSymbol: data?.meta?.symbol,
      tokenAmount: parseFloat(tx.amountToken.replace(/[+-]/g, "")) * (tx.amountToken.startsWith("-") ? -1 : 1),
      fiatAmount: tx.amountUsd ?? undefined,
      network: tx.network ? (tx.network as any) : undefined,
      status: "Succeeded", // Por defecto, puedes ajustar según tus datos
    };
    setSelectedTx(txDetails);
  };

  const handleViewAllTransactions = () => {
    router.push({
      pathname: "/(drawer)/(internal)/activity",
      params: { token: tokenSymbol },
    });
  };

  // ===== back inteligente =====
  const MAIN_CYCLE = [
    "/(drawer)/(tabs)/(home)",
    "/(drawer)/(tabs)/referral",
    "/(drawer)/(tabs)/swap",
    "/(drawer)/(tabs)/payments",
  ];
  const { goBackSmart, attachToNavigation } = useSmartBack({
    mainCycle: MAIN_CYCLE,
    fallback: { pathname: "/(drawer)/(tabs)/(home)" as any },
    drawerId: "app-drawer",
  });

  useEffect(() => {
    navigation.setOptions?.({ 
      gestureEnabled: true, 
      headerShown: false,
      headerBackButtonMenuEnabled: false,
    });
  }, [navigation]);

  useEffect(() => attachToNavigation(navigation), [attachToNavigation, navigation]);

  // Loading state
  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <ScreenBg account="Daily" />
        <GlassHeader
          scrolly={scrolly}
          blurTint="dark"
          overlayColor="rgba(7,16,22,0.45)"
          height={42}
          innerTopPad={6}
          sideWidth={45}
          centerWidthPct={70}
          leftSlot={
            <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
          }
          centerSlot={<Text style={styles.headerName}>Loading...</Text>}
          rightSlot={<View style={{ width: 34 }} />}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={styles.container}>
        <ScreenBg account="Daily" />
        <GlassHeader
          scrolly={scrolly}
          blurTint="dark"
          overlayColor="rgba(7,16,22,0.45)"
          height={42}
          innerTopPad={6}
          sideWidth={45}
          centerWidthPct={70}
          leftSlot={
            <Pressable
              onPress={goBackSmart}
              hitSlop={10}
              style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
          }
          centerSlot={<Text style={styles.headerName}>Error</Text>}
          rightSlot={<View style={{ width: 34 }} />}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "Failed to load token details"}
          </Text>
        </View>
      </View>
    );
  }

  const currentNetwork = scope.network || (data.meta.contracts.solana ? "solana" : data.meta.contracts.base ? "base" : "ethereum");
  
  // Network labels
  const networkLabel: Record<string, string> = {
    solana: "Solana",
    base: "Base",
    ethereum: "Ethereum",
    polygon: "Polygon",
  };

  // Handler para cambiar network
  const handleNetworkChange = (networkKey: string) => {
    Haptics.selectionAsync();
    setScope({
      ...scope,
      kind: "wallet-network",
      network: networkKey as any,
    });
    setShowNetworkSheet(false);
  };
  
  // Quick actions - solo Receive, Send, Swap (sin Cards)
  // Pasan token y network como params para filtrar
  const quickActions = [
    { 
      id: "receive", 
      label: "Receive", 
      icon: "qr-code-outline" as const, 
      onPress: () => router.push({
        pathname: "/(drawer)/(internal)/receive",
        params: { token: tokenSymbol, network: currentNetwork },
      }),
    },
    { 
      id: "send", 
      label: "Send", 
      icon: "paper-plane-outline" as const, 
      onPress: () => router.push({
        pathname: "/(drawer)/(internal)/send",
        params: { 
          tokenId: data.meta.id, 
          network: currentNetwork,
          initialStep: "search", // Ir directamente a selección de destinatario
        },
      }),
    },
    { 
      id: "swap", 
      label: "Swap", 
      icon: "swap-horizontal" as const, 
      onPress: () => router.push({
        pathname: "/(drawer)/(tabs)/swap",
        params: { currencyId: data.meta.id, network: currentNetwork },
      }),
    },
  ];

  // Calcular 24h return (mock)
  const return24h = data.price.change24hPct && data.balance.totalUsd
    ? (data.balance.totalUsd * data.price.change24hPct) / 100
    : null;

  const HEADER_TOTAL = insets.top + 6 + 42; // insets.top + innerTopPad + height

  return (
    <View style={styles.container}>
      <ScreenBg account="Daily" />
      
      {/* Glass Header */}
      <GlassHeader
        scrolly={scrolly}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={
        <Pressable
          onPress={goBackSmart}
          hitSlop={10}
            style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        }
        centerSlot={
          <View style={styles.headerTokenRow}>
            <TokenIcon currencyId={currencyIdForChains} chains={orderedTokenChains} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>{data.meta.name}</Text>
              <Text style={styles.headerSymbol}>{data.meta.symbol}</Text>
            </View>
          </View>
        }
        rightSlot={
          availableNetworks.length > 1 ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
                setShowNetworkSheet(true);
            }}
              hitSlop={10}
              style={styles.networkSwitchBtn}
            accessibilityRole="button"
              accessibilityLabel="Change network"
          >
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
          </Pressable>
          ) : (
            <View style={{ width: 34 }} />
          )
        }
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* BODY (scroll) */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.bodyContainer,
          { paddingTop: HEADER_TOTAL + 8, paddingBottom: 100 + insets.bottom }, // Espacio para header y Buy/Sell
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Price Section */}
        <TokenPriceSection
          meta={data.meta}
          price={data.price}
          testID="token-price"
        />

        {/* Quick Actions */}
        <TokenQuickActions
          actions={quickActions}
          testID="token-quick-actions"
        />

        {/* Position Card */}
        <TokenPositionCard
          meta={data.meta}
          balance={data.balance}
          return24h={return24h}
          chains={tokenChains}
          testID="token-position"
        />

        {/* Info Section */}
        <TokenInfoSection
          meta={data.meta}
          network={currentNetwork}
          testID="token-info"
        />

        {/* Transactions */}
        <TokenTransactions
          items={data.tx}
          enableFilterChips={false}
          onPressItem={handleTransactionPress}
          onPressViewAll={handleViewAllTransactions}
          testID="token-transactions"
        />
      </Animated.ScrollView>

      {/* Network Selector Sheet - Solo si hay múltiples networks */}
      {availableNetworks.length > 1 && (
        <BottomKeyboardModal
          visible={showNetworkSheet}
          onClose={() => setShowNetworkSheet(false)}
          scrimOpacity={0.85}
          blurIntensity={50}
          sheetTintRGBA="rgba(14,26,33,0.98)"
          minHeightPct={0.3}
          maxHeightPct={0.5}
          dismissOnScrimPress
          header={{
            height: 44,
            innerTopPad: 8,
            center: <Text style={styles.sheetTitle}>Choose network</Text>,
            right: (
              <Pressable
                onPress={() => setShowNetworkSheet(false)}
                hitSlop={10}
                style={{ width: 44, alignItems: "flex-end" }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            ),
          }}
        >
          <View style={styles.sheetContent}>
            {availableNetworks.map(({ chainId, networkKey }) => {
              const isActive = currentNetwork === networkKey;
              const ChainIcon = 
                chainId === "solana:mainnet" ? SolBadge :
                chainId === "eip155:1" ? EthBadge :
                chainId === "eip155:8453" ? BaseBadge :
                chainId === "eip155:137" ? PolyBadge :
                null;

              return (
                <Pressable
                  key={chainId}
                  onPress={() => handleNetworkChange(networkKey)}
                  style={[styles.networkOption, isActive && styles.networkOptionActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Select ${networkLabel[networkKey] || networkKey} network`}
                >
                  <View style={styles.networkOptionLeft}>
                    {ChainIcon && (
                      <View style={styles.networkOptionIcon}>
                        <ChainIcon width={24} height={24} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.networkOptionName}>
                        {networkLabel[networkKey] || networkKey.toUpperCase()}
                      </Text>
                      <Text style={styles.networkOptionHint}>
                        {chainId === "solana:mainnet" ? "Up to $0.0004" :
                         chainId === "eip155:1" ? "Varies" :
                         chainId === "eip155:8453" ? "Low fees" :
                         chainId === "eip155:137" ? "Low fees" : ""}
                      </Text>
                    </View>
                  </View>
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={20} color="#FFB703" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.4)" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </BottomKeyboardModal>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <TxDetailsModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.appBg,
  },
  scrollView: {
    flex: 1,
  },
  bodyContainer: {
    paddingHorizontal: 24, // Espacio generoso en los bordes
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space[20],
  },
  errorText: {
    color: "#ffff",
    fontSize: 14,
    textAlign: "center",
  },
  // Header styles
  headerTokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[12],
  },
  headerTextContainer: {
    alignItems: "flex-start",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  networkSwitchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  // Network Selector Sheet
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  networkOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  networkOptionActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,183,3,0.3)",
  },
  networkOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  networkOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  networkOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  networkOptionHint: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  headerSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
});
