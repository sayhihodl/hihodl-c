// src/config/iconRegistry.ts
import React from "react";
import type { SvgProps } from "react-native-svg";
import type { ImageSourcePropType } from "react-native";
import { View, Text, Image } from "react-native";

/**
 * Solo SVGs como componentes para evitar problemas de Metro con PNG ausentes.
 * USDC/USDT usan SVGs existentes como placeholder.
 */

// ====== IMPORTS (SVGs que ya tienes en @assets/tokens/) ======
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

export type SvgComponent = React.FC<SvgProps>;
export type IconDef =
  | { kind: "svg"; Comp: SvgComponent }
  | { kind: "img"; src: ImageSourcePropType }; // lo mantenemos por compatibilidad

// ====== TOKEN ICONS (coincidir con tus CurrencyId, p.ej. "USDC.circle") ======
export const TOKEN_ICONS: Record<string, IconDef> = {
  "ETH.native":   { kind: "svg", Comp: ETHSvg },
  "BTC.native":   { kind: "svg", Comp: BitcoinSvg },
  "SOL.native":   { kind: "svg", Comp: SolanaSvg },
  "POL.native":   { kind: "svg", Comp: PolygonSvg },
  "DOT.native":   { kind: "svg", Comp: PolkadotSvg },

  // Placeholders (ajusta cuando tengas los definitivos)
  "USDC.circle":  { kind: "svg", Comp: USDcoinSvg },
  "USDT.tether":  { kind: "svg", Comp: TetherSvg },

  // extras
  "BNB.native":   { kind: "svg", Comp: BinanceSvg },
  "LINK.native":  { kind: "svg", Comp: ChainlinkSvg },
  "ADA.native":   { kind: "svg", Comp: CardanoSvg },
  "AVAX.native":  { kind: "svg", Comp: AvalancheSvg },
  "ALGO.native":  { kind: "svg", Comp: AlgorandSvg },
  "ATOM.native":  { kind: "svg", Comp: CosmosSvg },
  "TRX.native":   { kind: "svg", Comp: TronSvg },
  "UNI.native":   { kind: "svg", Comp: UniswapSvg },
};

// ✅ Fallback por defecto
export const DEFAULT_TOKEN_ICON: IconDef = { kind: "svg", Comp: PolygonSvg };

// ====== Badges por chain (mini chips) ======
export const CHAIN_BADGE_BY_ID: Record<string, { Comp: SvgComponent } | undefined> = {
  "eip155:1":       { Comp: ETHSvg },
  "solana:mainnet": { Comp: SolanaSvg },
  "eip155:137":     { Comp: PolygonSvg },
  "eip155:8453":    { Comp: BaseSvg },
  // añade más si quieres chips con logo real:
  // "eip155:8453": { Comp: BaseSvg }, // p.ej. Base
};

// (colores/labels para fallback dots)
export const CHAIN_META_BY_ID: Record<string, { bg: string; label: string } | undefined> = {
  "eip155:1":       { bg: "#627EEA", label: "Ξ" },
  "solana:mainnet": { bg: "#14F195", label: "S" },
  "eip155:137":     { bg: "#8247E5", label: "P" },
  // fallbacks orientativos:
  "eip155:8453":    { bg: "#0052FF", label: "B" }, // Base
  "bsc:mainnet":    { bg: "#F3BA2F", label: "B" }, // BSC
};

export const TOKEN_ICON_FALLBACK_COLOR = "#2F9FB4";
export type IconDefT = IconDef;

/* ================= Helpers de render ================= */

export function renderTokenIcon(
  tokenId: string,
  {
    size = 40,         // diámetro del wrapper
    inner = 28,        // tamaño del SVG interno
    withCircle = true, // círculo blanco estilo dashboard
  }: { size?: number; inner?: number; withCircle?: boolean } = {}
): React.ReactNode {
  const def = TOKEN_ICONS[tokenId] ?? DEFAULT_TOKEN_ICON;

  let node: React.ReactNode = null;
  if (def.kind === "svg") {
    const Comp = def.Comp;
    node = <Comp width={inner} height={inner} />;
  } else if (def.kind === "img") {
    node = <Image source={def.src} style={{ width: inner, height: inner }} resizeMode="contain" />;
  }

  if (!withCircle) return node;

  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {node ?? (
        <Text style={{ color: "#0A1A24", fontWeight: "900", fontSize: Math.max(12, inner * 0.6) }}>
          {String(tokenId).slice(0, 1)}
        </Text>
      )}
    </View>
  );
}

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
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: meta?.bg ?? "rgba(255,255,255,0.35)",
          alignItems: "center", justifyContent: "center",
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
        alignItems: "center", justifyContent: "center",
        paddingHorizontal: chipPadding,
      }}
    >
      {icon}
    </View>
  );
}

/** Traductor de tu ChainKey → chainId usado por los badges */
export function mapChainKeyToChainId(chain?: string): string | undefined {
  switch (chain) {
    case "ethereum": return "eip155:1";
    case "polygon":  return "eip155:137";
    case "solana":   return "solana:mainnet";
    // extras comunes por si aparecen:
    case "base":     return "eip155:8453";
    case "bsc":      return "bsc:mainnet";
    default:         return undefined;
  }
}