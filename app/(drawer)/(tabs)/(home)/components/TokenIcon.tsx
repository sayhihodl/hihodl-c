// app/(drawer)/(tabs)/(home)/components/TokenIcon.tsx
// Componente de icono de token con badges de chain

import React, { memo } from "react";
import { View, Text, Image } from "react-native";
import type { ChainId, CurrencyId } from "@/store/portfolio.store";
import { DEFAULT_TOKEN_ICON, TOKEN_ICONS } from "@/config/iconRegistry";
import BaseBadge from "@assets/chains/Base-chain.svg";
import EthBadge from "@assets/chains/ETH-chain.svg";
import PolyBadge from "@assets/chains/Polygon-chain.svg";
import SolBadge from "@assets/chains/Solana-chain.svg";
import ExtraBadge from "@assets/chains/extra-chain.svg";
import { styles } from "../_lib/_dashboardShared";

const MINI_BADGE_SIZE = 18;
const MINI_BADGE_RADIUS = MINI_BADGE_SIZE / 2;
const PREFERRED_ORDER: ChainId[] = ["solana:mainnet", "eip155:1", "eip155:8453", "eip155:137"];
const CURRENCY_NATIVE_CHAIN: Partial<Record<CurrencyId, ChainId>> = {
  "ETH.native": "eip155:1",
  "SOL.native": "solana:mainnet",
  "POL.native": "eip155:137",
};

const CHAIN_BADGE: Record<ChainId, { Icon: React.ComponentType<any> }> = {
  "eip155:1": { Icon: EthBadge },
  "solana:mainnet": { Icon: SolBadge },
  "eip155:8453": { Icon: BaseBadge },
  "eip155:137": { Icon: PolyBadge },
};

let ICON_USDC: any, ICON_USDT: any, ICON_BTC: any;
try {
  ICON_USDC = require("@assets/tokens/usdc.png");
} catch {}
try {
  ICON_USDT = require("@assets/tokens/usdt.png");
} catch {}
try {
  ICON_BTC = require("@assets/tokens/btc.png");
} catch {}

const TOKEN_ICON_OVERRIDES: Partial<Record<CurrencyId | "BTC.native" | "DAI.maker", { kind: "png"; src: any }>> = {
  "USDC.circle": ICON_USDC ? { kind: "png", src: ICON_USDC } : undefined,
  "USDT.tether": ICON_USDT ? { kind: "png", src: ICON_USDT } : undefined,
  "BTC.native": ICON_BTC ? { kind: "png", src: ICON_BTC } : undefined,
};

function orderChainsForBadge(list: ChainId[], max = 3): ChainId[] {
  const seen = new Set<ChainId>();
  const out: ChainId[] = [];
  for (const id of PREFERRED_ORDER) if (list.includes(id) && !seen.has(id)) {
    seen.add(id);
    out.push(id);
  }
  for (const id of list) if (!seen.has(id)) {
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, max);
}

const ChainCountMini = memo(function ChainCountMini({
  count,
  size = MINI_BADGE_SIZE,
}: {
  count: number;
  size?: number;
}) {
  return (
    <View
      style={{
        width: 14,
        height: 12,
        borderRadius: MINI_BADGE_RADIUS,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <ExtraBadge width={size} height={size} />
      <Text
        style={{
          position: "absolute",
          color: "#000",
          fontSize: size * 0.55,
          fontWeight: "800",
        }}
      >
        {count}
      </Text>
    </View>
  );
});

const ChainMini = memo(function ChainMini({
  chainId,
  size = MINI_BADGE_SIZE,
}: {
  chainId: ChainId;
  size?: number;
}) {
  const meta = CHAIN_BADGE[chainId];
  if (!meta) return null;
  const { Icon } = meta;
  const inner = Math.max(8, size - 4);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 6,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon width={inner} height={inner} />
    </View>
  );
});

const TokenIcon = memo(function TokenIcon({
  currencyId,
  chains = [] as ChainId[],
}: {
  currencyId: CurrencyId | "BTC.native" | "DAI.maker";
  chains?: ChainId[];
}) {
  const def =
    TOKEN_ICON_OVERRIDES?.[currencyId] ??
    TOKEN_ICONS[currencyId as CurrencyId] ??
    DEFAULT_TOKEN_ICON;
  const isNative =
    !!CURRENCY_NATIVE_CHAIN[currencyId as CurrencyId] || currencyId === "BTC.native";
  const baseChains: ChainId[] = isNative ? [] : Array.isArray(chains) ? chains : [];
  const ordered = orderChainsForBadge(baseChains, 99);
  const primary = ordered[0];
  const extraCount = Math.max(0, ordered.length - (primary ? 1 : 0));

  return (
    <View style={styles.tokenIconWrap}>
      {(def as any)?.kind === "svg" ? (
        // @ts-ignore
        <def.Comp width={36} height={36} />
      ) : (
        <Image source={(def as any).src} style={styles.tokenIconImg} resizeMode="contain" />
      )}

      {(primary || extraCount > 0) && (
        <View style={styles.chainBadges}>
          {extraCount > 0 && (
            <View
              style={[
                styles.chainBadgeItem,
                {
                  left: 10,
                  bottom: -4, // Mover más arriba para alinearse con token selector
                  width: MINI_BADGE_SIZE,
                  height: MINI_BADGE_SIZE,
                  zIndex: 1,
                },
              ]}
            >
              <ChainCountMini count={extraCount} size={MINI_BADGE_SIZE} />
            </View>
          )}

          {primary && (
            <View
              style={[
                styles.chainBadgeItem,
                {
                  left: 22,
                  bottom: -4, // Mover más arriba para alinearse con token selector
                  width: MINI_BADGE_SIZE + 4,
                  height: MINI_BADGE_SIZE,
                  zIndex: 2,
                },
              ]}
            >
              <ChainMini chainId={primary} size={MINI_BADGE_SIZE} />
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default TokenIcon;

