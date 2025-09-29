// app/menu/row-demo.tsx
import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import colors, { legacy as legacyColors } from "@/theme/colors";
import T from "@/ui/T";
import Row from "@/ui/Row";

const BG = colors.navBg ?? legacyColors.BG ?? "#0D1820";
const SUB = legacyColors.SUB ?? "rgba(255,255,255,0.65)";
const GLASS_BG = "rgba(3,12,16,0.35)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

export default function RowDemo() {
  const insets = useSafeAreaInsets();

  const Avatar = (
    <View style={s.avatar}>
      <Ionicons name="person-circle" size={28} color="#9CC6D1" />
    </View>
  );

const OnHHBadge = (
  <View style={s.badge}>
    <T kind="caption" style={{ color: "#9CC6D1", fontWeight: "700" }}>On HiHODL</T>
  </View>
);

const InviteBtn = (
  <View style={s.invite}>
    <T kind="caption" style={{ color: "#FFB703", fontWeight: "700" }}>Invite</T>
  </View>
);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <T kind="h3" style={{ marginBottom: 10 }}>Row — showcase</T>

        <Card>
          <T kind="title" style={{ marginBottom: 10 }}>Contact rows</T>

          {/* On HiHODL */}
          <Row
            leftSlot={Avatar}
            labelNode={
              <>
                <T kind="bodyStrong">@claudia</T>
                <T kind="caption" style={{ color: SUB, marginTop: 2 }}>+31643558874</T>
              </>
            }
            rightSlot={OnHHBadge}
            rightIcon="chevron-forward"
            containerStyle={s.row}
            onPress={() => {}}
          />

          <Spacer />

          {/* Invite */}
          <Row
            leftSlot={Avatar}
            labelNode={
              <>
                <T kind="bodyStrong">Gerard</T>
                <T kind="caption" style={{ color: SUB, marginTop: 2 }}>+31643558811</T>
              </>
            }
            rightSlot={InviteBtn}
            rightIcon="chevron-forward"
            containerStyle={s.row}
            onPress={() => {}}
          />

          <Spacer />

          {/* Sin chevron */}
          <Row
            leftSlot={Avatar}
            labelNode={
              <>
                <T kind="bodyStrong">@silvia</T>
                <T kind="caption" style={{ color: SUB, marginTop: 2 }}>+31644455874</T>
              </>
            }
            rightSlot={OnHHBadge}
            rightIcon={null}
            containerStyle={s.row}
          />
        </Card>

        <Spacer size={16} />

        <Card>
          <T kind="title" style={{ marginBottom: 10 }}>Menu-like rows</T>
          <Row
            icon="wallet-outline"
            label="Payment methods"
            value="Cards"
            rightIcon="chevron-forward"
            containerStyle={s.row}
          />
          <Spacer />
          <Row
            icon="settings-outline"
            label="Settings"
            value="Preferences"
            containerStyle={s.row}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children }: React.PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
function Spacer({ size = 8 }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 12,
  },
  row: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(0,194,255,0.20)",
  },
  invite: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "rgba(255,183,3,0.25)",
  },
});