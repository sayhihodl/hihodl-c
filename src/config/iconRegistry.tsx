// src/config/iconRegistry.ts
import React from "react";
import type { SvgProps } from "react-native-svg";
import type { ImageSourcePropType } from "react-native";

/**
 * ⚠️ Nota:
 * He eliminado los requires a PNGs (usdc.png, tether.png) porque Metro rompe el bundle
 * si el archivo no existe exactamente ahí. Para que compile YA, mapeo USDC/USDT a SVGs
 * existentes como placeholder. Cuando tengas los PNG/SVG reales, sustitúyelos.
 */

// ====== IMPORTS (SVGs que ya tienes en assets/tokens/) ======
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
import TetherSvg   from "@assets/tokens/TetherBadge.svg";
import USDcoinSvg   from "@assets/tokens/Circle_USDC.svg";

export type SvgComponent = React.FC<SvgProps>;
export type IconDef =
  | { kind: "svg"; Comp: SvgComponent }
  | { kind: "img"; src: ImageSourcePropType }; // lo mantenemos por compatibilidad, aunque no lo usamos ahora

// ====== TOKEN ICONS (coincidir con tus CurrencyId) ======
// USDC/USDT apuntan provisionalmente a SVGs existentes para que el bundle no falle.
export const TOKEN_ICONS: Record<string, IconDef> = {
  "ETH.native":   { kind: "svg", Comp: ETHSvg },
  "BTC.native":   { kind: "svg", Comp: BitcoinSvg },
  "SOL.native":   { kind: "svg", Comp: SolanaSvg },
  "POL.native":   { kind: "svg", Comp: PolygonSvg },
  "DOT.native":   { kind: "svg", Comp: PolkadotSvg },

  // ⛳️ Placeholders hasta que añadas los assets reales:
  "USDC.circle":  { kind: "svg", Comp: USDcoinSvg }, // cámbialo por el logo de USDC cuando lo tengas
  "USDT.tether":  { kind: "svg", Comp: TetherSvg },   // cámbialo por el logo de USDT cuando lo tengas

  // extras disponibles:
  "BNB.native":   { kind: "svg", Comp: BinanceSvg },
  "LINK.native":  { kind: "svg", Comp: ChainlinkSvg },
  "ADA.native":   { kind: "svg", Comp: CardanoSvg },
  "AVAX.native":  { kind: "svg", Comp: AvalancheSvg },
  "ALGO.native":  { kind: "svg", Comp: AlgorandSvg },
  "ATOM.native":  { kind: "svg", Comp: CosmosSvg },
  "TRX.native":   { kind: "svg", Comp: TronSvg },
  "UNI.native":   { kind: "svg", Comp: UniswapSvg },
};

// ✅ Fallback default (SVG) — evita requerir PNG inexistente
export const DEFAULT_TOKEN_ICON: IconDef = { kind: "svg", Comp: PolygonSvg };

// ====== Badges por chain (mini chips) ======
export const CHAIN_BADGE_BY_ID: Record<string, { Comp: SvgComponent } | undefined> = {
  "eip155:1":       { Comp: ETHSvg },
  "solana:mainnet": { Comp: SolanaSvg },
  "eip155:137":     { Comp: PolygonSvg },
};

// (colores para fallback dots)
export const CHAIN_META_BY_ID: Record<string, { bg: string; label: string } | undefined> = {
  "eip155:1":       { bg: "#627EEA", label: "Ξ" },
  "solana:mainnet": { bg: "#14F195", label: "S" },
  "eip155:137":     { bg: "#8247E5", label: "P" },
};

export const TOKEN_ICON_FALLBACK_COLOR = "#2F9FB4";
export type IconDefT = IconDef;