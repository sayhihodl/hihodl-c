// src/components/token/TokenInfoSection.tsx
// Sección de información estilo Phantom

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { GlassCard } from "@/ui/Glass";
import Row from "@/ui/Row";
import SimpleNetworkBadge from "@/components/token/SimpleNetworkBadge";
import type { TokenMeta, NetworkKey } from "@/hooks/useTokenDetails";
import { shortAddr } from "@/lib/format";
import { tokens } from "@/lib/layout";

interface TokenInfoSectionProps {
  meta: TokenMeta;
  network?: NetworkKey;
  testID?: string;
}

export default function TokenInfoSection({ meta, network, testID }: TokenInfoSectionProps) {
  const networkKey = network || (meta.contracts.solana ? "solana" : meta.contracts.base ? "base" : "ethereum");
  const contractAddress = meta.contracts[networkKey];

  const handleCopyContract = async () => {
    if (!contractAddress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(contractAddress);
  };

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Text style={styles.sectionTitle}>Info</Text>
      
      <View style={styles.infoList}>
        <Row
          label="Name"
          value={meta.name}
          icon={null}
          rightIcon={null}
          disabled
        />
        <Row
          label="Symbol"
          value={meta.symbol}
          icon={null}
          rightIcon={null}
          disabled
        />
        <View style={styles.networkRow}>
          <Text style={styles.networkLabel}>Network</Text>
          <SimpleNetworkBadge network={networkKey} />
        </View>
        {contractAddress && (
          <Pressable onPress={handleCopyContract}>
            <Row
              label="Contract"
              value={shortAddr(contractAddress, 8)}
              icon={null}
              rightIcon="copy-outline"
              disabled={false}
            />
          </Pressable>
        )}
        {meta.marketCap && (
          <Row
            label="Market Cap"
            value={meta.marketCap}
            icon={null}
            rightIcon={null}
            disabled
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space[16],
    paddingVertical: tokens.space[20],
    paddingHorizontal: tokens.space[12],
    borderRadius: tokens.radius["2xl"],
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    marginBottom: tokens.space[20],
  },
  infoList: {
    gap: 0,
  },
  networkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: tokens.space[12],
    paddingHorizontal: tokens.space[12], // Mismo padding que Row para alineación
  },
  networkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: tokens.colors.textSecondary || "rgba(255,255,255,0.7)",
  },
  networkBadgeContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
});

