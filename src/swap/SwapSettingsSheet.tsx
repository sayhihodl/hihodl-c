import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import Row from "@/ui/Row";
import SegmentedPills from "@/ui/SegmentedPills";
import { legacy as legacyColors, glass as glassColors } from "@/theme/colors";
import { useSwapStore } from "@/store/swap.store";

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

  const [draft, setDraft] = useState(settings);
  useEffect(() => {
    if (visible) setDraft(settings);
  }, [visible, settings]);

  const handleClose = () => {
    setSettings(draft);
    void Haptics.selectionAsync();
    onClose();
  };

  const slipItems = useMemo(
    () => [
      { id: "auto", label: t("swap:slippage.auto", "Auto") },
      { id: "0.5", label: "0.5%" },
      { id: "1", label: "1%" },
      { id: "2", label: "2%" },
      { id: "3", label: "3%" },
    ],
    [t]
  );

  const prioItems = useMemo(
    () => [
      { id: "auto", label: t("swap:priority.auto", "Auto") },
      { id: "0", label: "0 SOL" },
      { id: "0.01", label: "0.01 SOL" },
      { id: "0.02", label: "0.02 SOL" },
      { id: "0.05", label: "0.05 SOL" },
    ],
    [t]
  );

  const tipItems = useMemo(
    () => [
      { id: "auto", label: t("swap:tip.auto", "Auto (0.05%)") },
      { id: "0.05", label: "0.05%" },
      { id: "0.1", label: "0.1%" },
      { id: "0.2", label: "0.2%" },
      { id: "0.5", label: "0.5%" },
    ],
    [t]
  );

  const slipIndex =
    draft.slippage.mode === "auto"
      ? 0
      : Math.max(1, slipItems.findIndex((i) => Number(i.id) === draft.slippage.fixedPct));

  const prioIndex =
    draft.priority.mode === "auto"
      ? 0
      : Math.max(1, prioItems.findIndex((i) => Number(i.id) === draft.priority.customSol));

  const tipIndex =
    draft.tip.mode === "auto"
      ? 0
      : Math.max(1, tipItems.findIndex((i) => Number(i.id) === draft.tip.pct));

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
        {/* Slippage */}
        <View style={styles.card}>
          <Row leftSlot={<Text style={styles.groupLabel}>{t("swap:slippage.title", "Slippage")}</Text>} rightIcon={null} />
          <SegmentedPills
            items={slipItems as any}
            activeIndex={slipIndex < 0 ? 0 : slipIndex}
            onPress={(_, item) => {
              setDraft((d) =>
                item.id === "auto"
                  ? { ...d, slippage: { mode: "auto" } as any }
                  : { ...d, slippage: { mode: "fixed", fixedPct: Number(item.id) } as any }
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
            {t("swap:slippage.help", "Recommended: 0.5–1% for majors, 2–3% for volatile pairs.")}
          </Text>
        </View>

        {/* Priority Fee */}
        <View style={styles.card}>
          <Row
            leftSlot={<Text style={styles.groupLabel}>{t("swap:priority.title", "Priority Fee")}</Text>}
            value={
              <Text style={styles.valueNote}>
                {draft.priority.mode === "auto"
                  ? t("swap:priority.auto", "Auto")
                  : `${draft.priority.customSol} SOL`}
              </Text>
            }
            rightIcon={null}
          />
          <SegmentedPills
            items={prioItems as any}
            activeIndex={prioIndex < 0 ? 0 : prioIndex}
            onPress={(_, item) => {
              setDraft((d) =>
                item.id === "auto"
                  ? { ...d, priority: { mode: "auto" } as any }
                  : { ...d, priority: { mode: "custom", customSol: Number(item.id) } as any }
              );
            }}
            height={36}
            pillMinWidth={74}
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
            {t("swap:priority.help", "Higher priority speeds up confirmation during congestion.")}
          </Text>
        </View>

        {/* Tip */}
        <View style={styles.card}>
          <Row
            leftSlot={<Text style={styles.groupLabel}>{t("swap:tip.title", "Tip")}</Text>}
            value={
              <Text style={styles.valueNote}>
                {draft.tip.mode === "auto"
                  ? t("swap:tip.auto", "Auto (0.05%)")
                  : `${draft.tip.pct}%`}
              </Text>
            }
            rightIcon={null}
          />
          <SegmentedPills
            items={tipItems as any}
            activeIndex={tipIndex < 0 ? 0 : tipIndex}
            onPress={(_, item) => {
              setDraft((d) =>
                item.id === "auto"
                  ? { ...d, tip: { mode: "auto" } as any }
                  : { ...d, tip: { mode: "custom", pct: Number(item.id) } as any }
              );
            }}
            height={36}
            pillMinWidth={84}
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
            {t("swap:tip.help", "Tiny tip supports relayer/liquidity routing.")}
          </Text>
        </View>
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