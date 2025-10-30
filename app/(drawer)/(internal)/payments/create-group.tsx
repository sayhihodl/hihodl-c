// app/(drawer)/(internal)/payments/create-group.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import GroupSplitBuilder from "@/payments/GroupSplitBuilder";

export default function CreateGroupScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={140} showTopSeam />
      <GlassHeader
        scrolly={undefined as any}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={42}
        innerTopPad={6}
        sideWidth={45}
        centerWidthPct={70}
        leftSlot={null}
        centerSlot={null}
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      <View style={{ flex: 1 }}>
        <GroupSplitBuilder
          initialMembers={[]}
          onCancel={() => router.back()}
          onConfirm={({ groupName }) => {
            const id = `grp_${Date.now()}`;
            router.replace({
              pathname: "/(internal)/payments/thread",
              params: { id, name: groupName, alias: groupName, isGroup: "1" },
            });
          }}
        />
      </View>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D1820" },
});


