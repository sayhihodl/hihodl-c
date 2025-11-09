// src/components/token/TokenDetailsHeader.tsx
// Header limpio para la pantalla de detalles de token usando GlassHeader

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassHeader from "@/ui/GlassHeader";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import TokenIcon from "@app/(drawer)/(tabs)/(home)/components/TokenIcon";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import type { TokenMeta, NetworkKey } from "@/hooks/useTokenDetails";
import { getExplorerUrl, shortAddr, type NetworkKey as FormatNetworkKey } from "@/lib/format";
import type { CurrencyId } from "@/store/portfolio.store";
import { sheetTintRGBA } from "@/theme/colors";

interface TokenDetailsHeaderProps {
  meta: TokenMeta;
  network?: NetworkKey;
  onBack?: () => void;
  testID?: string;
}

export default function TokenDetailsHeader({ meta, network, onBack, testID }: TokenDetailsHeaderProps) {
  const insets = useSafeAreaInsets();
  const [showNetworkSheet, setShowNetworkSheet] = useState(false);
  const networkKey = network || (meta.contracts.solana ? "solana" : meta.contracts.base ? "base" : "ethereum");
  const contractAddress = meta.contracts[networkKey];

  const handleNetworkPress = async () => {
    await Haptics.selectionAsync();
    setShowNetworkSheet(true);
  };

  const handleCopyContract = async () => {
    if (!contractAddress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(contractAddress);
  };

  const handleLongPressContract = async () => {
    if (!contractAddress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(contractAddress);
    setShowNetworkSheet(false);
  };

  const handleViewExplorer = () => {
    const url = getExplorerUrl(networkKey as FormatNetworkKey, contractAddress);
    if (url) {
      Linking.openURL(url);
    }
    setShowNetworkSheet(false);
  };

  const networkLabel: Record<NetworkKey, string> = {
    solana: "Solana",
    base: "Base",
    ethereum: "Ethereum",
    polygon: "Polygon",
  };

  return (
    <>
      <GlassHeader
        height={44}
        innerTopPad={8}
        leftSlot={
          onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          ) : null
        }
        centerSlot={
          <View style={styles.centerContent}>
            <View style={styles.tokenInfo}>
              <TokenIcon currencyId={meta.id as CurrencyId} chains={[]} />
              <View style={styles.tokenText}>
                <Text style={styles.tokenName}>{meta.name}</Text>
                <Text style={styles.tokenSymbol}>({meta.symbol})</Text>
              </View>
            </View>
            <Pressable
              onPress={handleNetworkPress}
              style={styles.networkBadge}
              testID={`${testID}-network-badge`}
            >
              <Text style={styles.networkLabel}>Network:</Text>
              <Text style={styles.networkValue}>{networkLabel[networkKey]}</Text>
              <Ionicons name="chevron-down" size={12} color="#fff" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        }
        rightSlot={null}
        sideWidth={44}
        centerWidthPct={100}
        contentStyle={{ paddingHorizontal: 16 }}
        showBottomHairline
      />

      {/* Network Details Bottom Sheet */}
      <BottomKeyboardModal
        visible={showNetworkSheet}
        onClose={() => setShowNetworkSheet(false)}
        scrimOpacity={0.85}
        blurIntensity={50}
        sheetTintRGBA={sheetTintRGBA}
        minHeightPct={0.3}
        maxHeightPct={0.4}
        dismissOnScrimPress
        header={{
          height: 44,
          innerTopPad: 8,
          centerSlot: (
            <Text style={styles.sheetTitle}>{networkLabel[networkKey]} Network</Text>
          ),
          rightSlot: (
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
          <Row
            label="Network"
            value={networkLabel[networkKey]}
            icon={null}
            rightIcon={null}
            disabled
            testID={`${testID}-network-row`}
          />
          {contractAddress && (
            <Pressable
              onLongPress={handleLongPressContract}
              style={styles.contractRow}
            >
              <Row
                label="Contract"
                value={shortAddr(contractAddress, 8)}
                icon={null}
                rightIcon="copy-outline"
                onPress={handleCopyContract}
                testID={`${testID}-contract-row`}
              />
            </Pressable>
          )}
          {contractAddress && (
            <View style={styles.buttonContainer}>
              <CTAButton
                title="View on Explorer"
                onPress={handleViewExplorer}
                variant="primary"
                leftIcon={<Ionicons name="open-outline" size={18} color="#fff" />}
                fullWidth
                size="md"
                testID={`${testID}-explorer-button`}
              />
            </View>
          )}
        </View>
      </BottomKeyboardModal>
    </>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    width: "100%",
    alignItems: "center",
    gap: 6,
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  tokenText: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  networkLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginRight: 4,
  },
  networkValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  sheetContent: {
    padding: 16,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  buttonContainer: {
    marginTop: 8,
  },
  contractRow: {
    borderRadius: 12,
    overflow: "hidden",
  },
});
