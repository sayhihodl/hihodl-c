// src/config/iconRegistry.ts
import React from "react";
import type { SvgProps } from "react-native-svg";
import type { ImageSourcePropType } from "react-native";
import { View, Text, Image } from "react-native";

import { TOKENS_CATALOG } from "@/config/tokensCatalog";

/* ======================= Overrides locales ======================= */
import ETHSvg       from "@assets/tokens/eth.svg";
import BitcoinSvg   from "@assets/tokens/BitcoinBadge.svg";
import SolanaSvg    from "@assets/tokens/SolanaBadge.svg";
import PolygonSvg   from "@assets/tokens/PolygonBadge.svg";
import PolkadotSvg  from "@assets/tokens/PolkadotBadge.svg";
import BinanceSvg   from "@assets/tokens/BinanceSmartChainBadge.svg";
import ChainlinkSvg from "@assets/tokens/Chainlink.svg";
import CardanoSvg   from "@assets/tokens/CardanoBadge.svg";
import AvalancheSvg from "@assets/tokens/AvalancheBadge.svg";
import AlgorandSvg  from "@assets/tokens/AlgorandBadge.svg";
import CosmosSvg    from "@assets/tokens/CosmosBadge.svg";
import TronSvg      from "@assets/tokens/TronBadge.svg";
import UniswapSvg   from "@assets/tokens/UniswapBadge.svg";
import TetherSvg    from "@assets/tokens/TetherBadge.svg";
import USDcoinSvg   from "@assets/tokens/Circle_USDC.svg";
import BaseSvg      from "@assets/chains/Base-chain.svg";

/* ============================ Tipos ============================= */
export type SvgComponent = React.FC<SvgProps>;
export type IconDef =
  | { kind: "svg"; Comp: SvgComponent }
  | { kind: "img"; src: ImageSourcePropType };

/* ================== Registro de iconos locales ================== */
export const TOKEN_ICONS: Record<string, IconDef> = {
  "ETH.native":   { kind: "svg", Comp: ETHSvg },
  "BTC.native":   { kind: "svg", Comp: BitcoinSvg },
  "SOL.native":   { kind: "svg", Comp: SolanaSvg },
  "POL.native":   { kind: "svg", Comp: PolygonSvg },
  "DOT.native":   { kind: "svg", Comp: PolkadotSvg },

  // Stables
  "USDC.circle":  { kind: "svg", Comp: USDcoinSvg },
  "USDT.tether":  { kind: "svg", Comp: TetherSvg },

  // Extras
  "BNB.native":   { kind: "svg", Comp: BinanceSvg },
  "LINK.native":  { kind: "svg", Comp: ChainlinkSvg },
  "ADA.native":   { kind: "svg", Comp: CardanoSvg },
  "AVAX.native":  { kind: "svg", Comp: AvalancheSvg },
  "ALGO.native":  { kind: "svg", Comp: AlgorandSvg },
  "ATOM.native":  { kind: "svg", Comp: CosmosSvg },
  "TRX.native":   { kind: "svg", Comp: TronSvg },
  "UNI.native":   { kind: "svg", Comp: UniswapSvg },

  // Si añades assets locales:
  // "JUP.token":  { kind: "img", src: require("@assets/tokens/jup.png") },
  // "BONK.token": { kind: "img", src: require("@assets/tokens/bonk.png") },
  // "WIF.token":  { kind: "img", src: require("@assets/tokens/wif.png") },
};

/** Fallback neutro por si no hay nada mejor */
export const DEFAULT_TOKEN_ICON: IconDef = { kind: "svg", Comp: USDcoinSvg };

/* ======================= Normalizadores ========================= */
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
const isSolMintLike = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s); // base58 32–44

export function normalizeIconKey(id?: string): string | undefined {
  const t = (id ?? "").toLowerCase();
  if (!t) return undefined;
  if (t === "usdc" || t === "usdc.circle" || t === "circle_usdc") return "USDC.circle";
  if (t === "usdt" || t === "tether" || t === "usdt.tether")      return "USDT.tether";
  if (t === "eth"  || t === "ethereum" || t === "eth.native")     return "ETH.native";
  if (t === "sol"  || t === "solana"   || t === "sol.native")     return "SOL.native";
  if (t === "matic"|| t === "polygon"  || t === "pol.native")     return "POL.native";
  return id; // ya viene namespaced o es un mint/url
}

export function iconKeyForTokenId(id?: string): string | undefined {
  return normalizeIconKey(id);
}

/* ===================== Logos remotos (URLs) ===================== */
function getAddressFromCatalog(id: string, chainId: string): string | undefined {
  const meta: any = TOKENS_CATALOG.find((t) => t.id === id);
  const addr = meta?.addresses?.[chainId];
  return typeof addr === "string" ? addr : undefined;
}

/**
 * Devuelve una URL de logo en este orden:
 * 1) URL directa si `tokenId` ya es http(s)
 * 2) Mint SPL → assets.jup.ag
 * 3) logoURI del catálogo
 * 4) TrustWallet (a partir de addresses del catálogo)
 */
function resolveRemoteLogo(tokenId: string): { uri: string } | undefined {
  const key = normalizeIconKey(tokenId) ?? tokenId;

  // 1) URL directa
  if (isHttpUrl(key)) return { uri: key };

  // 2) Mint SPL (Jupiter) - PRIORITARIO para tokens de Solana
  if (isSolMintLike(key)) {
    return { uri: `https://assets.jup.ag/icons/${key}.png` };
  }

  // 3) Catálogo - buscar por ID exacto PRIMERO (tokenId original), luego normalizado
  // IMPORTANTE: Buscar primero con el tokenId original porque los IDs en el catálogo son exactos (ej: "BONK.token")
  let meta: any = TOKENS_CATALOG.find((t) => 
    t.id === tokenId || 
    t.id?.toLowerCase() === tokenId?.toLowerCase()
  );
  // Si no se encuentra con el original, intentar con el key normalizado
  if (!meta) {
    meta = TOKENS_CATALOG.find((t) => 
      t.id === key || 
      t.id?.toLowerCase() === key?.toLowerCase()
    );
  }
  
  // Si encontramos metadata del catálogo, intentar múltiples fuentes en orden de confiabilidad:
  if (meta) {
    // 3a) Para tokens de Solana, usar Jupiter PRIMERO SIEMPRE (más confiable que CoinGecko)
    if (meta.nativeChainId === "solana:mainnet" || (meta.supportedChains as string[])?.includes("solana:mainnet")) {
      // Mapa de tokens conocidos de Solana en Jupiter (CON mint addresses)
      const symbolLower = (meta.symbol || "").toLowerCase();
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
      
      // Intentar obtener el mint address del catálogo primero
      const solAddr = getAddressFromCatalog(key, "solana:mainnet");
      if (solAddr) {
        return { uri: `https://assets.jup.ag/icons/${solAddr}.png` };
      }
      
      // Si no hay address pero el symbol está en el mapa, usar el mint address conocido
      if (symbolLower && jupiterKnown[symbolLower]) {
        const mintAddr = jupiterKnown[symbolLower];
        // Intentar múltiples fuentes para tokens de Solana
        // 1. Jupiter (primera opción)
        // 2. TrustWallet GitHub (fallback confiable)
        // Devolver ambas URLs y que el componente intente ambas
        return { 
          uri: `https://assets.jup.ag/icons/${mintAddr}.png`,
          // Agregar fallback alternativo en el componente
          _fallbackUri: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${mintAddr}/logo.png`
        };
      }
      
      // Si no hay ninguna de las anteriores, intentar TrustWallet como último recurso
      // (usando address del catálogo si existe - usar solAddr2 para evitar duplicado)
      const solAddr2 = getAddressFromCatalog(key, "solana:mainnet");
      if (solAddr2) {
        return { 
          uri: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${solAddr2}/logo.png`
        };
      }
      
      // Si todo falla, retornar undefined para que use el fallback inicial
      return undefined;
    }
    
    // 3b) Para tokens NO-Solana, usar logoURI del catálogo (CoinGecko)
    if (meta.logoURI && isHttpUrl(meta.logoURI)) {
      return { uri: String(meta.logoURI) };
    }
  }
  
  // 4) TrustWallet / Jupiter por addresses (para tokens no encontrados en catálogo)
  if (meta) {
    const prefer: string[] = [
      meta.nativeChainId,
      "solana:mainnet",  // Priorizar Solana para usar Jupiter
      "eip155:1",        // Ethereum
      "eip155:8453",     // Base
      "eip155:137",      // Polygon
    ].filter(Boolean);

    for (const cid of prefer) {
      const addr = getAddressFromCatalog(key, cid);
      if (!addr) continue;

      if (cid === "solana:mainnet") {
        // mejor cobertura para Solana - Jupiter es más confiable
        return { uri: `https://assets.jup.ag/icons/${addr}.png` };
      }

      if (cid.startsWith("eip155:")) {
        const chain =
          cid === "eip155:1"   ? "ethereum" :
          cid === "eip155:8453"? "base"     :
          cid === "eip155:137" ? "polygon"  :
          "ethereum";
        // Usar TrustWallet como fallback para EVM
        return {
          uri: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${addr}/logo.png`,
        };
      }
    }
  }

  return undefined;
}

/* ============================ Componente con múltiples fallbacks ============================ */
function ImageWithMultipleFallbacks({
  primaryUri,
  fallbackUri,
  size,
  onError,
}: {
  primaryUri: string;
  fallbackUri?: string;
  size: number;
  onError?: () => void;
}): React.ReactNode {
  const [currentUri, setCurrentUri] = React.useState(primaryUri);
  const [hasError, setHasError] = React.useState(false);

  const handleError = React.useCallback(() => {
    if (!hasError && fallbackUri && currentUri === primaryUri) {
      // Intentar fallback si existe
      setCurrentUri(fallbackUri);
      setHasError(false); // Resetear para intentar fallback
    } else {
      // Si el fallback también falló, llamar al onError del padre
      setHasError(true);
      onError?.();
    }
  }, [hasError, fallbackUri, currentUri, primaryUri, onError]);

  return (
    <Image
      source={{ uri: currentUri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
      onError={handleError}
    />
  );
}

function RemoteIconWithFallback({
  remote,
  tokenId,
  size,
  inner,
  withCircle,
}: {
  remote: { uri: string; _fallbackUri?: string };
  tokenId: string;
  size: number;
  inner: number;
  withCircle: boolean;
}): React.ReactNode {
  const [error, setError] = React.useState(false);
  const [fallbackUri, setFallbackUri] = React.useState<string | undefined>((remote as any)._fallbackUri);

  const handleError = React.useCallback(() => {
    if (!error) {
      setError(true);
      // Si hay fallbackUri en remote, usarlo
      if (!fallbackUri && (remote as any)._fallbackUri) {
        setFallbackUri((remote as any)._fallbackUri);
      } else if (!fallbackUri) {
        // Intentar fallback hardcodeado como último recurso
        const tokenLower = tokenId.toLowerCase();
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
        
        if (jupiterKnown[tokenLower]) {
          const mint = jupiterKnown[tokenLower];
          setFallbackUri(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${mint}/logo.png`);
        }
      }
    }
  }, [error, fallbackUri, tokenId]);

  const uriToUse = fallbackUri || remote.uri;

  // SIEMPRE mostrar algo: usar overlay con fallback garantizado
  return (
    <ImageWithGuaranteedFallback
      uri={uriToUse}
      fallbackUri={(remote as any)._fallbackUri}
      tokenId={tokenId}
      size={size}
      inner={inner}
      withCircle={withCircle}
    />
  );
}

// Componente que GARANTIZA mostrar algo - si la URL falla, muestra renderTokenIcon con inicial
function ImageWithGuaranteedFallback({
  uri,
  fallbackUri,
  tokenId,
  size,
  inner,
  withCircle,
}: {
  uri: string;
  fallbackUri?: string;
  tokenId: string;
  size: number;
  inner: number;
  withCircle: boolean;
}): React.ReactNode {
  const [imageError, setImageError] = React.useState(false);
  const [fallbackError, setFallbackError] = React.useState(false);
  const [currentUri, setCurrentUri] = React.useState(uri);

  // Intentar fallback si la primera URI falla
  React.useEffect(() => {
    if (imageError && !fallbackError && fallbackUri && currentUri === uri) {
      setCurrentUri(fallbackUri);
      setImageError(false); // Resetear para intentar fallback
    }
  }, [imageError, fallbackError, fallbackUri, currentUri, uri]);

  // Si ambas URLs fallaron, mostrar fallback con inicial
  if (imageError && fallbackError) {
    const ch = String(tokenId).replace(/\W+/g, "").slice(0, 1).toUpperCase() || "•";
    const bubble = (
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
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: inner * 0.55 }}>{ch}</Text>
      </View>
    );
    if (!withCircle) return bubble;
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {bubble}
      </View>
    );
  }

  // Intentar cargar la imagen
  const node = (
    <Image
      source={{ uri: currentUri }}
      style={{ width: inner, height: inner, borderRadius: inner / 2 }}
      resizeMode="cover"
      onError={() => {
        if (currentUri === uri && fallbackUri) {
          // Intentar fallback
          setCurrentUri(fallbackUri);
        } else {
          // Ambas fallaron
          setImageError(true);
          setFallbackError(true);
        }
      }}
    />
  );

  if (!withCircle) return node;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {node}
    </View>
  );
}

/* ============================ Render ============================ */
export function renderTokenIcon(
  tokenId: string,
  {
    size = 40,
    inner = 28,
    withCircle = false,
  }: { size?: number; inner?: number; withCircle?: boolean } = {}
): React.ReactNode {
  const key = normalizeIconKey(tokenId) ?? tokenId;

  // 1) override local
  const def = TOKEN_ICONS[key];
  if (def?.kind === "svg") {
    const Comp = def.Comp;
    return <Comp width={inner} height={inner} />;
  }
  if (def?.kind === "img") {
    return <Image source={def.src} style={{ width: inner, height: inner }} resizeMode="contain" />;
  }

  // 2) remoto (URL / mint / catálogo) - con mejor manejo de errores y múltiples fallbacks
  const remote = resolveRemoteLogo(key);
  if (remote) {
    // Usar componente con fallback automático
    return (
      <RemoteIconWithFallback
        remote={remote}
        tokenId={tokenId}
        key={key}
        size={size}
        inner={inner}
        withCircle={withCircle}
      />
    );
  }

  // 3) fallback: inicial
  const ch = String(tokenId).replace(/\W+/g, "").slice(0, 1).toUpperCase() || "•";
  const bubble = (
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
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: inner * 0.55 }}>{ch}</Text>
    </View>
  );
  if (!withCircle) return bubble;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {bubble}
    </View>
  );
}

/* ======================= Badges de chain ======================== */
export const CHAIN_BADGE_BY_ID: Record<string, { Comp: SvgComponent } | undefined> = {
  "eip155:1":       { Comp: ETHSvg },
  "solana:mainnet": { Comp: SolanaSvg },
  "eip155:137":     { Comp: PolygonSvg },
  "eip155:8453":    { Comp: BaseSvg },
};

export const CHAIN_META_BY_ID: Record<string, { bg: string; label: string } | undefined> = {
  "eip155:1":       { bg: "#627EEA", label: "Ξ" },
  "solana:mainnet": { bg: "#14F195", label: "S" },
  "eip155:137":     { bg: "#8247E5", label: "P" },
  "eip155:8453":    { bg: "#0052FF", label: "B" },
  "bsc:mainnet":    { bg: "#F3BA2F", label: "B" },
};

export function renderChainBadge(
  chainId: string | undefined,
  {
    size = 18,
    chip = true,
    chipPadding = 6,
  }: { size?: number; chip?: boolean; chipPadding?: number } = {}
): React.ReactNode {
  if (!chainId) return null;
  const entry = CHAIN_BADGE_BY_ID[chainId];
  const meta  = CHAIN_META_BY_ID[chainId];

  const icon = entry?.Comp
    ? <entry.Comp width={size} height={size} />
    : (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta?.bg ?? "rgba(255,255,255,0.35)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#0A1A24", fontWeight: "800", fontSize: size * 0.55 }}>
          {meta?.label ?? "•"}
        </Text>
      </View>
    );

  if (!chip) return icon;

  return (
    <View
      style={{
        height: size + chipPadding * 2,
        minWidth: size + chipPadding * 2,
        borderRadius: (size + chipPadding * 2) / 2,
        backgroundColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: chipPadding,
      }}
    >
      {icon}
    </View>
  );
}

/* =========== Utilidad opcional ChainKey → ChainId =========== */
export function mapChainKeyToChainId(chain?: string): string | undefined {
  switch ((chain ?? "").toLowerCase()) {
    case "ethereum": return "eip155:1";
    case "polygon":  return "eip155:137";
    case "solana":   return "solana:mainnet";
    case "base":     return "eip155:8453";
    case "bsc":      return "bsc:mainnet";
    default:         return undefined;
  }
}