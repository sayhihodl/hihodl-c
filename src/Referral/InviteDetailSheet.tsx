import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import { GlassCard, Divider as GlassDivider } from "@/ui/Glass";
import Row from "@/ui/Row";
import { legacy as legacyColors, glass as glassColors } from "@/theme/colors";
import { useTranslation } from "react-i18next";

const TEXT = legacyColors.TEXT ?? "#fff";
const SUB  = legacyColors.SUB  ?? "rgba(255,255,255,0.65)";

/** ⬇️ mismos tokens visuales que el SwapSettingsSheet */
const GLASS_BG     = glassColors.cardOnSheet ?? "rgba(7,25,34,0.38)";
const GLASS_BORDER = glassColors.cardBorder  ?? "rgba(255,255,255,0.10)";
const SHEET_TINT   = "rgba(9,24,34,0.55)"; // idéntico al de SwapSettingsSheet

type Status = "unlocked" | "expired" | "in_progress";

export type InviteDetailProps = {
  visible: boolean;
  onClose: () => void;
  invite: {
    name: string;
    stepsDone: number;
    status: Status;
    invitedAt?: string;
  };
};

const STEPS_IDS = ["link", "deposit", "txs", "card"] as const;

function computeDeadline(invitedAt?: string, windowDays = 7) {
  if (!invitedAt) return null;
  const start = new Date(invitedAt);
  return new Date(start.getTime() + windowDays * 86400000);
}

export default function InviteDetailSheet({ visible, onClose, invite }: InviteDetailProps) {
  const { t } = useTranslation(["referral"]);
  const { name, stepsDone, status, invitedAt } = invite;

  const deadline = computeDeadline(invitedAt);
  const headline = useMemo(() => {
    if (status === "expired")  return t("referral:status.expired",  "Offer ended");
    if (status === "unlocked") return t("referral:status.unlocked", "Reward unlocked");
    if (deadline) {
      const d = deadline.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return t("referral:invite.requiredBy", "Required by {{date}}", { date: d });
    }
    return t("referral:invite.completeAll", "Complete all steps to unlock");
  }, [status, deadline, t]);

  const initials = useMemo(
    () => name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase(),
    [name]
  );

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onClose}
      blurIntensity={64}
      scrimOpacity={0.55}
      glassTintRGBA={SHEET_TINT}
      minHeightPct={0.78}
      maxHeightPct={0.92}
      showHandle
      ignoreKeyboard
    >
      {/* Título del sheet (estilo swap) */}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t("referral:pastInvites.title", "Past invites")}</Text>
      </View>

      {/* Header card con avatar + textos (sin la X) */}
      <View style={[styles.card, { paddingHorizontal: 14, paddingVertical: 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{headline}</Text>
          </View>
          {/* espacio “mudo” para mantener balance si antes había un botón */}
          <View style={{ width: 22 }} />
        </View>
      </View>

      {/* Steps: misma card + mismos dividers/rows que swap */}
      <View style={styles.card}>
        {STEPS_IDS.map((id, i) => {
          const done = i < Math.max(0, Math.min(4, stepsDone));
          // TextStyle: objeto plano (no array condicional) para evitar TS errors
          const stepTitleStyle = done ? styles.stepTxt : { ...styles.stepTxt, ...styles.stepTxtDim };
          const stepLabel = t(`referral:steps.${i}.title`, [
            "Sign up with your link",
            "Add money to their account",
            "Make 3 purchases of $10+ each",
            "Order a physical card",
          ][i]);

        return (
          <View key={id}>
            <Row
              icon={done ? "checkmark-circle" : "ellipse-outline"}
              label={stepLabel}
              titleStyle={stepTitleStyle}
              rightIcon={null}
              containerStyle={{ paddingVertical: 14 }}
            />
            {i < STEPS_IDS.length - 1 && <GlassDivider />}
          </View>
        );})}
      </View>

      {/* Help (igual glass + row) */}
      <View style={styles.card}>
        <Row
          icon="help-circle-outline"
          label={t("referral:invite.getHelp", "Get help")}
          onPress={onClose}
        />
      </View>
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
    marginBottom: 12,
  },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: legacyColors.SEPARATOR, alignItems: "center", justifyContent: "center",
  },
  avatarTxt: { color: "#0A1A24", fontWeight: "900", fontSize: 20 },

  name: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#fff", opacity: 0.9, fontWeight: "600", fontSize: 13, marginTop: 4 },

  stepTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  stepTxtDim: { opacity: 0.6 },
});