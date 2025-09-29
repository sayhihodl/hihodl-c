// src/components/Screen/GlassScaffold.tsx
import React from "react";
import {
  View, Text, StyleSheet, Pressable, ViewStyle, ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";
import { router } from "expo-router";

// 👇 vidrio compartido (mismo look que el menú)
import { GlassCard } from "@/ui/Glass";

const { BG, TEXT } = legacy;
export type Account = "Daily" | "Savings" | "Social";

const ACCOUNT_GRADS: Record<Account, readonly [string, string]> = {
  Daily:   ["rgba(0,194,255,0.45)", "rgba(54,224,255,0.00)"],
  Savings: ["rgba(84,242,165,0.35)", "rgba(84,242,165,0.00)"],
  Social:  ["rgba(111,91,255,0.40)", "rgba(255,115,179,0.00)"],
};

type Props = {
  title: string;
  account?: Account;
  right?: React.ReactNode;
  children?: React.ReactNode;

  // Layout
  heroHeight?: number;
  headerMarginTop?: number;
  headerHorizontalPadding?: number;
  headerButtonSize?: number;
  closeIconSize?: number;
  titleSize?: number;
  titleWeight?: "700" | "800" | "900";
  centerTitle?: boolean;

  // Content
  contentPaddingHorizontal?: number;
  contentPaddingTop?: number;
  contentStyle?: ViewStyle;
  /** Si true, envuelve children con ScrollView */
  useScroll?: boolean;
  /** Si true, envuelve children con <GlassCard> (igual que menú) */
  wrapInGlass?: boolean;
  /** Estilo extra para el GlassCard cuando wrapInGlass=true */
  glassCardStyle?: ViewStyle;

  // Footer / CTA
  footer?: React.ReactNode;
  footerSticky?: boolean;
  footerPaddingHorizontal?: number;
  footerPaddingVertical?: number;

  // Callbacks
  onClose?: () => void;
};

export default function GlassScaffold({
  title,
  account = "Daily",
  right,
  children = null,

  heroHeight = 330,
  headerMarginTop = 12,
  headerHorizontalPadding = 16,
  headerButtonSize = 36,
  closeIconSize = 22,
  titleSize = 20,
  titleWeight = "800",
  centerTitle = false,

  contentPaddingHorizontal = 16,
  contentPaddingTop = 50,
  contentStyle,
  useScroll = true,
  wrapInGlass = false,
  glassCardStyle,

  footer,
  footerSticky = false,
  footerPaddingHorizontal = 16,
  footerPaddingVertical = 8,

  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  const safeAccount: Account =
    account === "Savings" || account === "Social" || account === "Daily"
      ? account
      : "Daily";
  const heroColors = ACCOUNT_GRADS[safeAccount] ?? ACCOUNT_GRADS.Daily;

  // ------- contenido render, con wrappers opcionales -------
const ContentInner = (
  <>
    {wrapInGlass ? (
      <GlassCard style={[{ marginTop: 0 }, ...(glassCardStyle ? [glassCardStyle] : [])]}>
        {children}
      </GlassCard>
    ) : (
      children
    )}
  </>
);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Gradiente superior: cubre notch y baja sobre el hero */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0, // cubre notch completo
          left: 0,
          right: 0,
          height: heroHeight + insets.top,
          zIndex: 0,
        }}
        pointerEvents="none"
      />
      {/* Velo global sutil */}
      <LinearGradient
        colors={["rgba(255,255,255,0.03)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View
        style={[
          styles.headerRow,
          {
            marginTop: insets.top + headerMarginTop,
            paddingHorizontal: headerHorizontalPadding,
          },
        ]}
      >
        <Pressable
          onPress={onClose ?? (() => router.back())}
          hitSlop={10}
          style={[
            styles.headerBtn,
            {
              width: headerButtonSize,
              height: headerButtonSize,
              borderRadius: headerButtonSize / 2,
            },
          ]}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={closeIconSize} color={TEXT} />
        </Pressable>

        <Text
          style={{
            flex: 1,
            color: TEXT,
            fontSize: titleSize,
            fontWeight: titleWeight,
            textAlign: centerTitle ? "center" : "left",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* slot derecho (reserva ancho del botón) */}
        <View
          style={{
            width: headerButtonSize,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {right}
        </View>
      </View>

      {/* Contenido (scroll o view) */}
      {useScroll ? (
        <ScrollView
          bounces
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: contentPaddingTop,
            paddingHorizontal: contentPaddingHorizontal,
          }}
          style={[{ flex: 1 }, contentStyle]}
        >
          {ContentInner}
        </ScrollView>
      ) : (
        <View
          style={[
            {
              flex: 1,
              paddingTop: contentPaddingTop,
              paddingHorizontal: contentPaddingHorizontal,
            },
            contentStyle,
          ]}
        >
          {ContentInner}
        </View>
      )}

      {/* Footer */}
      {footer ? (
        footerSticky ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: footerPaddingHorizontal,
              paddingTop: footerPaddingVertical,
              paddingBottom: insets.bottom + footerPaddingVertical,
            }}
          >
            {footer}
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: footerPaddingHorizontal,
              paddingTop: footerPaddingVertical,
              paddingBottom: insets.bottom + footerPaddingVertical,
            }}
          >
            {footer}
          </View>
        )
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});