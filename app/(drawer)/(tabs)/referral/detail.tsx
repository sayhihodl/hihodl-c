// app/(tabs)/referral/invite-detail.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import NativeModalCard from "@/components/BottomSheet/NativeModalCard";

const { BG, SUB, SEPARATOR } = legacy;
const GLASS_BG = "rgba(3, 12, 16, 0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

const STEPS = [
  { id: "link", title: "Sign up with your link" },
  { id: "deposit", title: "Add money to their account" },
  { id: "txs", title: "Make 3 purchases of $10+ each" },
  { id: "card", title: "Order a physical card" },
] as const;

type Status = "unlocked" | "expired" | "in_progress";

function computeDeadline(invitedAt?: string, windowDays = 7) {
  if (!invitedAt) return null;
  const start = new Date(invitedAt);
  return new Date(start.getTime() + windowDays * 86400000);
}

export default function ReferralInviteDetail() {
  const params = useLocalSearchParams<{
    id?: string; name?: string; stepsDone?: string; status?: Status; invitedAt?: string;
  }>();

  const name = params.name ?? "Invitee";
  const stepsDone = Math.max(0, Math.min(4, Number(params.stepsDone ?? 0) || 0));
  const status = (params.status as Status) ?? "in_progress";
  const deadline = computeDeadline(params.invitedAt);

  const headline = React.useMemo(() => {
    if (status === "expired") return "The deadline to earn reward has passed";
    if (status === "unlocked") return "Reward unlocked";
    if (deadline) {
      const d = deadline.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return `Required by ${d}`;
    }
    return "Complete all steps to unlock";
  }, [status, deadline]);

  const [helpOpen, setHelpOpen] = React.useState(false);
  const goBack = () => router.back();

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={goBack} style={s.iconBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={s.title}>Invite detail</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Avatar + name */}
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>
            {name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}
          </Text>
        </View>
        <Text style={s.name}>{name}</Text>
        <Text style={s.subtitle}>{headline}</Text>
      </View>

      {/* Steps */}
      <View style={s.card}>
        {STEPS.map((st, i) => {
          const done = i < stepsDone;
          return (
            <View key={st.id} style={s.stepRow}>
              <Ionicons
                name={done ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={done ? "#ffffff" : "#ffffff"}
              />
              <Text style={[s.stepTxt, !done && s.stepTxtDim]}>{st.title}</Text>
            </View>
          );
        })}
      </View>

      {/* Get help → abre modal nativo estilo "Request via link" */}
      <Pressable style={s.helpRow} onPress={() => setHelpOpen(true)}>
        <Text style={s.helpTxt}>Get help</Text>
        <Ionicons name="chevron-forward" size={18} color={SUB} />
      </Pressable>

      {/* Modal */}
      <NativeModalCard
        visible={helpOpen}
        title="Why haven't I received my reward?"
        onClose={() => setHelpOpen(false)}
        primary={{ label: "Open full FAQ", onPress: () => { setHelpOpen(false); router.push("/(drawer)/(tabs)/referral/help"); } }}
        secondary={{ label: "Close", onPress: () => setHelpOpen(false) }}
      >
        <Text style={s.p}>
          To qualify, your invitee must complete all required steps before the deadline.
          If the campaign ends, the reward won’t carry over to the next one.
        </Text>
        <View style={{ gap: 6, marginTop: 6 }}>
          <Bullet>Invitee didn’t complete all steps in time</Bullet>
          <Bullet>Invitee already had a HiHODL account</Bullet>
          <Bullet>Invitee didn’t use your unique link to sign up</Bullet>
          <Bullet>Some purchases didn’t meet the requirements</Bullet>
        </View>
      </NativeModalCard>
    </SafeAreaView>
  );
}

/* small bullet line */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff", marginTop: 7 }} />
      <Text style={{ color: "#fff", opacity: 0.9 }}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16, marginTop: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "900" },

  hero: { alignItems: "center", marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  avatar: {
    width: 76, height: 76, borderRadius: 22, backgroundColor: SEPARATOR,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  avatarTxt: { color: "#0A1A24", fontWeight: "900", fontSize: 24 },
  name: { color: "#fff", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#fff", opacity: 0.9, marginTop: 8, fontWeight: "800" },

  card: {
    marginHorizontal: 16, marginTop: 16, paddingVertical: 8,
    borderRadius: 18, backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  stepTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  stepTxtDim: { opacity: 0.6 },

  helpRow: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 18,
    backgroundColor: GLASS_BG, borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS_BORDER,
    paddingHorizontal: 14, paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  helpTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },

  p: { color: "#fff", opacity: 0.9, lineHeight: 20 },
});