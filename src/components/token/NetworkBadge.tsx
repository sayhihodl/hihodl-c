// src/components/token/NetworkBadge.tsx
// Badge de red para el header

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import Row from "@/ui/Row";
import { CTAButton } from "@/ui/CTAButton";
import type { NetworkKey } from "@/hooks/useTokenDetails";
import { getExplorerUrl, shortAddr, type NetworkKey as FormatNetworkKey } from "@/lib/format";
import { sheetTintRGBA } from "@/theme/colors";

interface NetworkBadgeProps {
  network: NetworkKey;
  contractAddress?: string;
  onPress?: () => void;
  testID?: string;
}

const networkLabel: Record<NetworkKey, string> = {
  solana: "Solana",
  base: "Base",
  ethereum: "Ethereum",
  polygon: "Polygon",
};

export default function NetworkBadge({ network, contractAddress, onPress, testID }: NetworkBadgeProps) {
  const [showSheet, setShowSheet] = useState(false);

  const handlePress = async () => {
    await Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else {
      setShowSheet(true);
    }
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
    setShowSheet(false);
  };

  const handleViewExplorer = () => {
    const url = getExplorerUrl(network as FormatNetworkKey, contractAddress);
    if (url) {
      Linking.openURL(url);
    }
    setShowSheet(false);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={styles.badge}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Network: ${networkLabel[network]}`}
      >
        <Text style={styles.label}>Network:</Text>
        <Text style={styles.value}>{networkLabel[network]}</Text>
        <Ionicons name="chevron-down" size={12} color="#fff" style={{ marginLeft: 4 }} />
      </Pressable>

      <BottomKeyboardModal
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        scrimOpacity={0.85}
        blurIntensity={50}
        sheetTintRGBA={sheetTintRGBA}
        minHeightPct={0.3}
        maxHeightPct={0.4}
        dismissOnScrimPress
        header={{
          height: 44,
          innerTopPad: 8,
          centerSlot: <Text style={styles.sheetTitle}>{networkLabel[network]} Network</Text>,
          rightSlot: (
            <Pressable
              onPress={() => setShowSheet(false)}
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
            value={networkLabel[network]}
            icon={null}
            rightIcon={null}
            disabled
          />
          {contractAddress && (
            <Pressable onLongPress={handleLongPressContract} style={styles.contractRow}>
              <Row
                label="Contract"
                value={shortAddr(contractAddress, 8)}
                icon={null}
                rightIcon="copy-outline"
                onPress={handleCopyContract}
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
              />
            </View>
          )}
        </View>
      </BottomKeyboardModal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginRight: 4,
  },
  value: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  sheetContent: {
    padding: 16,
    gap: 12,
  },
  buttonContainer: {
    marginTop: 8,
  },
  contractRow: {
    borderRadius: 12,
    overflow: "hidden",
  },
});


