// app/(overlays)/link-created.tsx
import React, { useMemo } from "react";
import {
  View, Text, Pressable, StyleSheet, Share, Platform, ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter, Href, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import colors, { legacy } from "@/theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { BG, TEXT, SUB } = legacy;

type Chain = "solana" | "base" | "ethereum" | "polygon" | "bitcoin" | "sui";
type Token = "usdc" | "usdt" | "sol" | "eth" | "btc" | "sui";

export default function LinkCreatedModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    url?: string;
    amount?: string;
    note?: string;
    token?: Token;
    chain?: Chain;
    expiresDays?: string;
  }>();

  const expiresLabel = useMemo(() => {
    const d = Number(params.expiresDays || 9);
    return `Expires in ${d} day${d === 1 ? "" : "s"}`;
  }, [params.expiresDays]);

  const prettyUrl = params.url ?? "";
  const amountLine =
    params.amount && params.token ? `${params.amount} ${params.token.toUpperCase()}` : undefined;
  const chainLine = params.chain ? params.chain[0].toUpperCase() + params.chain.slice(1) : undefined;

  const copy = async () => {
    if (prettyUrl) await Clipboard.setStringAsync(prettyUrl);
  };

  const share = async () => {
    if (!prettyUrl) return;
    try {
      await Share.share({
        message: prettyUrl,
        url: Platform.OS === "ios" ? prettyUrl : undefined,
        title: "Payment link",
      });
    } catch {
      await Clipboard.setStringAsync(prettyUrl);
    }
  };

const close = () => {
  // Back seguro: si no hay a dónde volver, ve al dashboard
  if (router.canGoBack?.()) {
    router.back();
  } else {
    const homeHref: Href = {
      pathname: "/(tabs)/(home)" as any,
    };
    router.replace(homeHref);
  }
};

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header modal */}
      <View style={styles.header}>
        <Pressable onPress={close} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="close" size={20} color={TEXT} />
        </Pressable>
        <Text style={styles.title}>Requested via Payment link</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card principal */}
        <View style={styles.card}>
          <View style={styles.avatar} />
          <Text style={styles.cardTitle}>Share your link to get paid</Text>
          <Text style={styles.cardSub}>
            Your friend needs to click on the payment link to send the money
          </Text>

          {/* Link + copiar */}
          <View style={styles.linkRow}>
            <Ionicons name="link-outline" size={16} color="#89D7FF" style={{ marginRight: 6 }} />
            <Text style={styles.linkTxt} numberOfLines={1}>{prettyUrl}</Text>
            <Pressable onPress={copy} hitSlop={8} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={16} color="#BFD7EA" />
            </Pressable>
          </View>
        </View>

        {/* Transfer tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfer tracking · 1 of 3</Text>

          <View style={styles.stepRow}>
            {/* barra activa -> brand */}
            <View style={[styles.stepBar, { backgroundColor: colors.primary, height: 28 }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepTitleActive}>Link created</Text>
                <Text style={styles.badge}>{expiresLabel}</Text>
              </View>
              {!!amountLine && (
                <Text style={styles.stepMeta}>
                  {amountLine}{chainLine ? ` · ${chainLine}` : ""}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepBar, { backgroundColor: "rgba(255,255,255,0.18)", height: 18 }]} />
            <Text style={styles.stepTitleIdle}>Paid</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepBar, { backgroundColor: "rgba(255,255,255,0.18)", height: 18 }]} />
            <Text style={styles.stepTitleIdle}>Received by my account</Text>
          </View>
        </View>

        {/* Recipient can send from (solo Wallet) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient can send from</Text>
          <View style={{ gap: 10 }}>
            <View style={styles.optionRow}>
              <Ionicons name="wallet-outline" size={18} color={TEXT} style={{ opacity: 0.9 }} />
              <Text style={styles.optionTxt}>Wallet · Arrives instantly</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        {!!params.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteTxt}>{params.note}</Text>
            </View>
          </View>
        )}

        {/* Report an issue (placeholder) */}
        <Pressable style={[styles.section, styles.issueRow]} onPress={() => {}}>
          <Text style={styles.issueTxt}>Report an issue</Text>
          <Ionicons name="chevron-forward" size={16} color={SUB} />
        </Pressable>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable onPress={close} style={[styles.cta, styles.ctaGhost]}>
          <Ionicons name="close" size={16} color="#0B0B0C" />
          <Text style={[styles.ctaGhostTxt]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={share} style={[styles.cta, styles.ctaPrimary]}>
          <Ionicons name="share-outline" size={16} color="#0B0B0C" />
          <Text style={styles.ctaPrimaryTxt}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16 },
  header: {
    height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 6,
  },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { color: TEXT, fontSize: 18, fontWeight: "700" },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 6,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "center", marginBottom: 10,
  },
  cardTitle: { color: TEXT, fontSize: 20, fontWeight: "800", textAlign: "center" },
  cardSub: { color: SUB, fontSize: 13, textAlign: "center", marginTop: 6 },

  linkRow: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.28)",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  linkTxt: {
    color: "#89D7FF", fontWeight: "700", flexShrink: 1,
  },
  copyBtn: {
    marginLeft: 8, width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  section: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sectionTitle: { color: SUB, fontSize: 14, fontWeight: "700", marginBottom: 8 },

  // steps
  stepRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  stepBar: { width: 4, borderRadius: 2, marginRight: 10 },
  stepHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitleActive: { color: TEXT, fontSize: 16, fontWeight: "800" },
  stepTitleIdle: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "700" },
  stepMeta: { color: "rgba(255,255,255,0.7)", marginTop: 2 },

  badge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    fontSize: 12,
  },

  optionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionTxt: { color: TEXT, fontSize: 15 },

  noteBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  noteTxt: { color: TEXT },

  issueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  issueTxt: { color: TEXT, fontWeight: "700" },

  bottomBar: {
    position: "absolute",
    left: 16, right: 16, bottom: 0,
    flexDirection: "row",
    gap: 10,
  },
  cta: {
    flex: 1, height: 48, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  ctaGhost: { backgroundColor: "#fff" },
  ctaGhostTxt: { color: "#0B0B0C", fontWeight: "800" },
  ctaPrimary: { backgroundColor: "#fff" },
  ctaPrimaryTxt: { color: "#0B0B0C", fontWeight: "800" },
});