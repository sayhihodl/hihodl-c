// src/lib/chainBadges.ts
import React from "react";
import { View, Text } from "react-native";
import Solana from "@assets/chains/Solana-chain.svg";
import Sui from "@assets/chains/Sui-chain.svg";
import Tron from "@assets/chains/TRX-chain.svg";
import Uniswap from "@assets/chains/Uniswap-chain.svg";
import Ethereum from "@assets/chains/ETH-chain.svg";
import Chainlink from "@assets/chains/ChainlinkBadge copy.svg";
import BSC from "@assets/chains/BinanceSmartChainBadge copy.svg";
import Base from "@assets/chains/Base-chain.svg";
import Avalanche from "@assets/chains/Avalanche-chain.svg";
import Algorand from "@assets/chains/Algorand-chain.svg";
import Polygon from "@assets/chains/Polygon-chain.svg";

// Si tienes un badge de HiHODL, úsalo aquí. Si no, deja null y pintamos un pill de texto.
let HiHODLBadge: any = null; 

export type ChainKey =
  | "solana" | "ethereum" | "polygon" | "bsc" | "base" | "avalanche"
  | "tron" | "algorand" | "sui" | "uniswap" | "chainlink" | "hihodl";

export const BADGE_COMPONENT: Record<ChainKey, any> = {
  solana: Solana,
  ethereum: Ethereum,
  polygon: Polygon,
  bsc: BSC,
  base: Base,
  avalanche: Avalanche,
  tron: Tron,
  algorand: Algorand,
  sui: Sui,
  uniswap: Uniswap,
  chainlink: Chainlink,
  hihodl: HiHODLBadge, // si no hay, caerá al fallback
};

// Fallback visual por si alguna cadena no tiene SVG:
export function ChainBadge({ chain, size = 22 }: { chain: ChainKey; size?: number }) {
  const Icon = BADGE_COMPONENT[chain];
  if (!Icon) {
    return (
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
          {chain.toUpperCase()}
        </Text>
      </View>
    );
  }
  return <Icon width={size} height={size} />;
}