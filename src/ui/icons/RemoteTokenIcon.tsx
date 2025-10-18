// src/ui/icons/RemoteTokenIcon.tsx
import React, { useMemo } from "react";
import { Image, View, Text } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";
import { TOKENS_CATALOG } from "@/config/tokensCatalog";

type Props = {
  currencyId: string;
  size?: number;
  rounded?: number;
  style?: StyleProp<ImageStyle>;
};

const PLACEHOLDER_BG = "#1B2A33";

export default function RemoteTokenIcon({
  currencyId,
  size = 36,
  rounded,
  style,
}: Props) {
  const { uri } = useMemo(() => {
    // 1) Busca el token en el catálogo
    const meta = TOKENS_CATALOG.find(t => t.id === currencyId);
    // 1.a) Si existe logoURI directo, úsalo
    const directLogo = (meta as any)?.logoURI as string | undefined;
    if (directLogo) return { uri: directLogo };

    // 2) Si hay addresses EVM -> TrustWallet (Ethereum por defecto si existe)
    const addresses = (meta as any)?.addresses as Record<string, string> | undefined;
    const pickEvmAddr = () => {
      if (!addresses) return undefined;
      // prioriza ETH -> Base -> Polygon
      const order = ["eip155:1", "eip155:8453", "eip155:137"];
      for (const c of order) {
        const a = addresses[c];
        if (a) return a;
      }
      // sino el primero que haya
      const first = Object.values(addresses)[0];
      return first;
    };

    const evmAddr = pickEvmAddr();
    if (evmAddr) {
      // Ethereum path (suele servir aunque sea otra EVM si assets existe)
      const trust = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${evmAddr}/logo.png`;
      return { uri: trust };
    }

    // 3) Si hay mint de Solana
    const solMint = addresses?.["solana:mainnet"];
    if (solMint) {
      const solLogo = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${solMint}/logo.png`;
      return { uri: solLogo };
    }

    return { uri: undefined };
  }, [currencyId]);

  // Si tenemos URI, pintamos imagen remota
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius: rounded ?? size / 2 },
          { resizeMode: "contain", backgroundColor: "transparent" },
          style,
        ]}
      />
    );
  }

  // Fallback: círculo con inicial
  const letter = (currencyId || "?").slice(0, 1).toUpperCase();
  return (
    <View
      style={{
        width: size, height: size,
        borderRadius: rounded ?? size / 2,
        backgroundColor: PLACEHOLDER_BG,
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ color: "#9DB4BF", fontWeight: "800", fontSize: size * 0.5 }}>
        {letter}
      </Text>
    </View>
  );
}