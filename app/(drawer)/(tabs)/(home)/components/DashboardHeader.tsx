// app/(drawer)/(tabs)/(home)/components/DashboardHeader.tsx
// Header del Dashboard con scroll effects

import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { HIT_SLOP, DASHBOARD_LAYOUT } from "@/constants/dashboard";
import type { Account } from "@/hooks/useAccount";

const HERO_HPAD = DASHBOARD_LAYOUT.HERO_HPAD;
const HEADER_PAD = DASHBOARD_LAYOUT.HEADER_PAD;

export const headerStyles = StyleSheet.create({
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7CC2D1",
  },
  handle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

interface DashboardHeaderProps {
  account: Account;
  profileAvatar: string;
  profileUsername: string | null;
  openScanner: () => void;
  goCards: () => void;
  scrolly: Animated.Value;
  insetsTop: number;
  tt: (key: string, defaultValue?: string) => string;
}

/**
 * Header fijo del Dashboard con efectos de scroll
 * Incluye blur y opacity animados según el scroll
 */
function DashboardHeader({
  account,
  profileAvatar,
  profileUsername,
  openScanner,
  goCards,
  scrolly,
  insetsTop,
  tt,
}: DashboardHeaderProps) {
  const HEADER_H = DASHBOARD_LAYOUT.HEADER_HEIGHT;
  const FIXED_H = insetsTop + HEADER_H + HEADER_PAD;

  // Blur: de 0 a 1 al empezar a bajar
  const headerBlurOpacity = scrolly.interpolate({
    inputRange: [0, 12, 60],
    outputRange: [0, 0.6, 1],
    extrapolate: "clamp",
  });

  // Sólido: aparece más tarde
  const headerSolidOpacity = scrolly.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [0, 0, 0.45],
    extrapolate: "clamp",
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: FIXED_H,
        zIndex: 20,
      }}
    >
      {/* 1) Capa de vidrio/blur: invisible en y=0, aparece al bajar */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: headerBlurOpacity }]}
      >
        <BlurView
          intensity={60}
          tint="dark"
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: FIXED_H }}
        />
        {/* Tinte para "ilegible por debajo" */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: FIXED_H,
            backgroundColor: "rgba(6,14,20,0.35)",
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />
      </Animated.View>

      {/* 2) Capa sólida: entra más tarde que el blur */}
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(7,16,22,0.86)",
          opacity: headerSolidOpacity,
        }}
      />

      {/* 3) Contenido del header */}
      <SafeAreaView edges={["top", "left", "right"]} style={{ paddingTop: 0 }}>
        <View style={{ paddingHorizontal: HERO_HPAD, paddingTop: HEADER_PAD }}>
          <View style={headerStyles.header}>
            {/* Avatar + username -> abre menú */}
            <Pressable
              style={headerStyles.headerLeft}
              onPress={() => router.push("/menu")}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={tt("a11y.openMenu", "Abrir menú")}
            >
              {/* Avatar circular con emoji */}
              <View style={headerStyles.avatar}>
                <Text style={{ fontSize: 18, textAlign: "center" }}>{profileAvatar}</Text>
              </View>
              <Text style={headerStyles.handle}>{profileUsername ?? "@username"}</Text>
            </Pressable>

            <View style={headerStyles.headerRight}>
              <Pressable
                style={headerStyles.iconBtn}
                onPress={openScanner}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={tt("a11y.openScanner", "Abrir escáner")}
              >
                <Ionicons name="scan-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default DashboardHeader;

