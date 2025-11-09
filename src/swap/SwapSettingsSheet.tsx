import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import Row from "@/ui/Row";
import SegmentedPills, { type PillItem } from "@/ui/SegmentedPills";
import { legacy as legacyColors, glass as glassColors } from "@/theme/colors";
import { useSwapStore, type SettingsState } from "@/store/swap.store";

const TEXT = legacyColors.TEXT ?? "#fff";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const GLASS_BG = glassColors.cardOnSheet ?? "rgba(7,25,34,0.38)";
const GLASS_BORDER = glassColors.cardBorder ?? "rgba(255,255,255,0.10)";

type Props = { visible: boolean; onClose: () => void };

export default function SwapSettingsSheet({ visible, onClose }: Props) {
  const { t } = useTranslation(["swap"]); // 👈 namespace: swap.json
  const scrolly = useRef(new Animated.Value(0)).current;

  const settings = useSwapStore((s) => s.settings);
  const setSettings = useSwapStore((s) => s.setSettings);

  const [draft, setDraft] = useState<SettingsState>(settings);
  useEffect(() => {
    if (visible) setDraft(settings);
  }, [visible, settings]);

  const handleClose = () => {
    setSettings(draft);
    void Haptics.selectionAsync();
    onClose();
  };

  const slipItems = useMemo<PillItem[]>(
    () => [
      { id: "auto", label: t("swap:simple.auto", "Auto") },
      { id: "0.5", label: t("swap:simple.low", "Low (0.5%)") },
      { id: "1", label: t("swap:simple.standard", "Standard (1%)") },
      { id: "2", label: t("swap:simple.high", "High (2%)") },
    ],
    [t]
  );

  // Simplified settings: hide priority and tip for non-technical users

  const slipIndex =
    draft.slippage.mode === "auto"
      ? 0
      : Math.max(1, slipItems.findIndex((i) => Number(i.id) === draft.slippage.fixedPct));

  // Removed advanced sections (priority fee, tip)

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={handleClose}
      blurIntensity={64}
      scrimOpacity={0.55}
      glassTintRGBA="rgba(9,24,34,0.55)"
      minHeightPct={0.78}
      maxHeightPct={0.92}
      showHandle
      ignoreKeyboard
    >
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t("swap:title", "Swap Settings")}</Text>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 18 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrolly } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Price protection (Slippage) */}
        <View style={styles.card}>
          <Row leftSlot={<Text style={styles.groupLabel}>{t("swap:simple.priceProtection", "Price protection")}</Text>} rightIcon={null} />
          <SegmentedPills
            items={slipItems}
            activeIndex={slipIndex < 0 ? 0 : slipIndex}
            onPress={(_, item) => {
              setDraft((d) =>
                item.id === "auto"
                  ? { ...d, slippage: { mode: "auto" as const, fixedPct: d.slippage.fixedPct } }
                  : { ...d, slippage: { mode: "fixed" as const, fixedPct: Number(item.id) || 0.5 } }
              );
            }}
            height={36}
            pillMinWidth={64}
            pillHPad={12}
            wrapHPad={6}
            wrapBackground="rgba(255,255,255,0.06)"
            textStyle={{ color: "#C2D4DB", fontSize: 13, fontWeight: "800" }}
            activeTextStyle={{ color: "#fff" }}
            indicatorStyle={{
              backgroundColor: "rgba(0,0,0,0.45)",
              top: 4,
              bottom: 4,
              borderRadius: 12,
            }}
            animateMs={140}
          />
          <Text style={styles.help}>
            {t("swap:simple.help", "Auto keeps you safe from bad prices. You can make it stricter or more flexible if a token is very volatile.")}
          </Text>
        </View>
        {/* Advanced options hidden for simplicity */}
      </Animated.ScrollView>
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  titleWrap: { height: 48, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },

  groupLabel: { color: TEXT, fontSize: 14, fontWeight: "800" },
  valueNote: { color: SUB, fontSize: 12, fontWeight: "600" },
  help: { color: SUB, fontSize: 12, marginTop: 8 },
});