// src/components/token/TokenAboutSection.tsx
// Sección About estilo Phantom

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/ui/Glass";
import { CTAButton } from "@/ui/CTAButton";
import { tokens } from "@/lib/layout";

interface TokenAboutSectionProps {
  description?: string;
  websiteUrl?: string;
  discordUrl?: string;
  testID?: string;
}

const DEFAULT_DESCRIPTION = "USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges. The technology behind USDC brings the stability of the dollar to the digital economy.";

export default function TokenAboutSection({
  description = DEFAULT_DESCRIPTION,
  websiteUrl,
  discordUrl,
  testID,
}: TokenAboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = description.length > 150;
  const displayText = expanded || !shouldTruncate ? description : `${description.slice(0, 150)}...`;

  const handleShowMore = () => {
    setExpanded(!expanded);
    Haptics.selectionAsync();
  };

  const handleWebsite = () => {
    if (websiteUrl) {
      Linking.openURL(websiteUrl);
    }
    Haptics.selectionAsync();
  };

  const handleDiscord = () => {
    if (discordUrl) {
      Linking.openURL(discordUrl);
    }
    Haptics.selectionAsync();
  };

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Text style={styles.sectionTitle}>About</Text>
      
      <Text style={styles.description}>{displayText}</Text>
      
      {shouldTruncate && (
        <Pressable onPress={handleShowMore} style={styles.showMore}>
          <Text style={styles.showMoreText}>
            {expanded ? "Show Less" : "Show More"}
          </Text>
        </Pressable>
      )}

      {(websiteUrl || discordUrl) && (
        <View style={styles.buttons}>
          {websiteUrl && (
            <CTAButton
              title="Website"
              onPress={handleWebsite}
              variant="secondary"
              leftIcon={<Ionicons name="globe-outline" size={18} color="#fff" />}
              fullWidth={false}
              style={styles.linkButton}
              size="md"
            />
          )}
          {discordUrl && (
            <CTAButton
              title="Discord"
              onPress={handleDiscord}
              variant="secondary"
              leftIcon={<Ionicons name="logo-discord" size={18} color="#fff" />}
              fullWidth={false}
              style={styles.linkButton}
              size="md"
            />
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space[16],
    padding: tokens.space[20],
    borderRadius: tokens.radius["2xl"],
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    marginBottom: tokens.space[12],
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    color: tokens.colors.textSecondary,
    lineHeight: 20,
  },
  showMore: {
    marginTop: tokens.space[8],
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFB703",
  },
  buttons: {
    flexDirection: "row",
    gap: tokens.space[12],
    marginTop: tokens.space[16],
  },
  linkButton: {
    flex: 1,
  },
});

