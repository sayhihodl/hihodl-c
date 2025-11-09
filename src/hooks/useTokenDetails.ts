// src/hooks/useTokenDetails.ts
// Hook para obtener datos de detalles de token

import { useState, useEffect, useCallback } from "react";
import type { NetworkKey } from "@/lib/format";
import { getCoinGeckoId, findTokenById, findTokenBySymbol, CHAIN_ID_BY_KEY } from "@/config/tokensCatalog";
import { getTokenDetailsFromCoinGecko, getContractAddressFromPlatforms, formatMarketCap } from "@/services/coingecko-details";
import { chainIdToNetworkKey } from "@/lib/format";

export type SubWalletKey = "daily" | "savings" | "social";

export interface TokenMeta {
  id: string; // 'usdc'
  symbol: string; // 'USDC'
  name: string; // 'USD Coin'
  isStablecoin: boolean;
  decimals: number;
  logos: Partial<Record<NetworkKey, string>>;
  contracts: Partial<Record<NetworkKey, string>>; // mint/contract
  swappable: boolean;
  marketCap?: string | null; // Market cap formateado desde CoinGecko
}

export interface PriceInfo {
  usd: number | null; // 1.00
  change24hPct: number | null; // e.g. 0.01
  sparkline7d: number[] | null; // normalized or absolute
  source: "coingecko" | "internal" | "none";
  pegDeviationPct?: number | null;
}

export interface BalanceBreakdown {
  totalToken: string; // "152.32"
  totalUsd: number | null;
  bySubWallet: Partial<Record<SubWalletKey, { token: string; usd: number | null }>>;
}

export interface TxItem {
  id: string;
  type: "send" | "receive" | "swap";
  amountToken: string; // "-12.00" / "+150.00"
  amountUsd: number | null;
  counterpartyLabel: string; // "@luis.hodl" or "0xabc…1234"
  network: NetworkKey;
  timestamp: string; // ISO
}

export interface TokenScope {
  kind: "wallet-network" | "wallet-all" | "all-wallets";
  walletId?: string;
  network?: NetworkKey;
}

export interface TokenDetails {
  meta: TokenMeta;
  scope: TokenScope;
  price: PriceInfo;
  balance: BalanceBreakdown;
  tx: TxItem[];
}

/**
 * Mock data para USDC
 */
function createMockUSDC(symbol: string, scope: TokenScope): TokenDetails {
  return {
    meta: {
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      name: symbol === "usdc" ? "USD Coin" : "Tether USD",
      isStablecoin: true,
      decimals: 6,
      logos: {},
      contracts: {
        solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      },
      swappable: true,
    },
    scope,
    price: {
      usd: 1.0,
      change24hPct: 0.01,
      sparkline7d: Array(7).fill(1.0), // flat for stablecoin
      source: "coingecko",
      pegDeviationPct: 0.02,
    },
    balance: {
      totalToken: "152.32",
      totalUsd: 152.32,
      bySubWallet: {
        daily: { token: "50.00", usd: 50.0 },
        savings: { token: "100.00", usd: 100.0 },
        social: { token: "2.32", usd: 2.32 },
      },
    },
    tx: [
      {
        id: "tx1",
        type: "send",
        amountToken: "-12.00",
        amountUsd: -12.0,
        counterpartyLabel: "@luis.hodl",
        network: "base",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "tx2",
        type: "receive",
        amountToken: "+150.00",
        amountUsd: 150.0,
        counterpartyLabel: "@payroll.sol",
        network: "solana",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "tx3",
        type: "swap",
        amountToken: "-25.00",
        amountUsd: -25.0,
        counterpartyLabel: "Swap → SOL",
        network: "ethereum",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

/**
 * Mock data para SOL (no stablecoin)
 */
function createMockSOL(scope: TokenScope): TokenDetails {
  const now = Date.now();
  const price = 145.5;
  const change24h = -2.3;
  // Sparkline con variación
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    const base = price + (Math.random() - 0.5) * 10;
    return Math.max(140, Math.min(150, base));
  });

  return {
    meta: {
      id: "sol",
      symbol: "SOL",
      name: "Solana",
      isStablecoin: false,
      decimals: 9,
      logos: {},
      contracts: {
        solana: "So11111111111111111111111111111111111111112", // native
      },
      swappable: true,
    },
    scope,
    price: {
      usd: price,
      change24hPct: change24h,
      sparkline7d: sparkline,
      source: "coingecko",
    },
    balance: {
      totalToken: "12.5",
      totalUsd: 1818.75,
      bySubWallet: {
        savings: { token: "12.5", usd: 1818.75 },
      },
    },
    tx: [
      {
        id: "sol_tx1",
        type: "receive",
        amountToken: "+12.5",
        amountUsd: 1818.75,
        counterpartyLabel: "@exchange.sol",
        network: "solana",
        timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

/**
 * Hook principal
 */
export function useTokenDetails(symbol: string, initialScope: TokenScope) {
  const [data, setData] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [scope, setScope] = useState<TokenScope>(initialScope);

  useEffect(() => {
    let cancelled = false;

    async function loadTokenDetails() {
      setIsLoading(true);
      setError(null);

      try {
        // Normalizar el symbol: puede venir como "USDC.circle", "usdc.circle", "USDC", etc.
        const sym = symbol.toLowerCase().trim();
        
        // Obtener metadata del catálogo
        const catalogToken = findTokenById(sym) || findTokenBySymbol(sym);
        
        // Obtener CoinGecko ID
        const coingeckoId = getCoinGeckoId(sym);
        
        // Si no hay coingeckoId, usar datos mock como fallback
        if (!coingeckoId) {
          // Fallback a mocks existentes
          let mockData: TokenDetails;
          if (sym === "sol" || sym === "sol.native" || sym.includes("sol")) {
            mockData = createMockSOL(scope);
          } else if (sym === "usdc" || sym === "usdc.circle" || sym.includes("usdc")) {
            mockData = createMockUSDC("usdc", scope);
          } else if (sym === "usdt" || sym === "usdt.tether" || sym.includes("usdt")) {
            mockData = createMockUSDC("usdt", scope);
          } else if (sym === "eth" || sym === "eth.native" || sym.includes("eth")) {
            mockData = createMockSOL(scope);
            mockData.meta = {
              ...mockData.meta,
              id: "eth",
              symbol: "ETH",
              name: "Ethereum",
              contracts: { ethereum: "native" },
            };
          } else {
            mockData = createMockUSDC(sym, scope);
          }
          
          if (!cancelled) {
            setData(mockData);
            setIsLoading(false);
          }
          return;
        }

        // Obtener detalles desde CoinGecko
        const cgDetails = await getTokenDetailsFromCoinGecko(coingeckoId);
        
        if (cancelled) return;

        if (!cgDetails) {
          throw new Error("Failed to fetch token details from CoinGecko");
        }

        // Construir contracts desde platforms de CoinGecko
        const contracts: Partial<Record<NetworkKey, string>> = {};
        if (cgDetails.platforms) {
          const networks: NetworkKey[] = ["solana", "ethereum", "base", "polygon"];
          for (const network of networks) {
            const address = getContractAddressFromPlatforms(cgDetails.platforms, network);
            if (address) {
              contracts[network] = address;
            }
          }
        }

        // Si no hay contracts desde CoinGecko, usar los del catálogo o mocks
        if (Object.keys(contracts).length === 0 && catalogToken?.supportedChains) {
          // Mapear ChainId a NetworkKey y usar addresses del catálogo si existen
          for (const chainId of catalogToken.supportedChains) {
            const networkKey = chainIdToNetworkKey(chainId);
            if (catalogToken.addresses?.[chainId]) {
              contracts[networkKey] = catalogToken.addresses[chainId];
            }
          }
        }

        // Fallback: usar mocks si no hay contracts
        if (Object.keys(contracts).length === 0) {
          if (sym.includes("sol")) {
            contracts.solana = "So11111111111111111111111111111111111111112";
          } else if (sym.includes("usdc")) {
            contracts.solana = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
            contracts.base = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
            contracts.ethereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
            contracts.polygon = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
          }
        }

        // Determinar networkKey para mock transactions (usar el primero disponible o scope)
        const availableNetworks = Object.keys(contracts) as NetworkKey[];
        const defaultNetworkKey: NetworkKey = scope.network || 
          (availableNetworks.length > 0 ? availableNetworks[0] : 
           (sym.includes("sol") ? "solana" : 
            sym.includes("eth") ? "ethereum" : 
            sym.includes("base") ? "base" : "solana"));

        // Determinar si es stablecoin
        const isStablecoin = sym.includes("usdc") || sym.includes("usdt") || sym.includes("dai") || 
                           (cgDetails.current_price && cgDetails.current_price >= 0.99 && cgDetails.current_price <= 1.01);

        // Construir TokenDetails
        const tokenDetails: TokenDetails = {
          meta: {
            id: sym,
            symbol: cgDetails.symbol || catalogToken?.symbol || sym.toUpperCase(),
            name: cgDetails.name || catalogToken?.name || sym,
            isStablecoin,
            decimals: catalogToken?.decimals || (isStablecoin ? 6 : 18),
            logos: catalogToken?.logoURI ? { 
              solana: catalogToken.logoURI,
              ethereum: catalogToken.logoURI,
              base: catalogToken.logoURI,
              polygon: catalogToken.logoURI,
            } : {},
            contracts,
            swappable: true,
            marketCap: formatMarketCap(cgDetails.market_cap),
          },
          scope,
          price: {
            usd: cgDetails.current_price || null,
            change24hPct: cgDetails.price_change_percentage_24h || null,
            sparkline7d: cgDetails.sparkline_7d || null,
            source: "coingecko",
          },
          balance: {
            totalToken: "0.00", // Esto debería venir de balances reales
            totalUsd: null,
            bySubWallet: {},
          },
          // Mock data para transacciones (para seguir trabajando en la pantalla)
          tx: [
            {
              id: "tx1",
              type: "send",
              amountToken: "-12.00",
              amountUsd: -12.0,
              counterpartyLabel: "@luis.hodl",
              network: defaultNetworkKey,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "tx2",
              type: "receive",
              amountToken: "+150.00",
              amountUsd: 150.0,
              counterpartyLabel: "@payroll.sol",
              network: defaultNetworkKey,
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        };

        setData(tokenDetails);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load token details"));
          setIsLoading(false);
        }
      }
    }

    loadTokenDetails();

    return () => {
      cancelled = true;
    };
  }, [symbol, scope]);

  const updateScope = useCallback((newScope: TokenScope) => {
    setScope(newScope);
  }, []);

  return {
    data,
    isLoading,
    error,
    scope,
    setScope: updateScope,
  };
}

