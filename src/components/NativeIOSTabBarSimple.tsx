/**
 * Simple Native iOS Tab Bar
 * Clean implementation following Apple's HIG for tab bars
 * Based on: https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */

import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { View, StyleSheet, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FEATURES } from "@/config/features";
import * as Haptics from "expo-haptics";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";

const ACTIVE = "#FFB703";
const INACTIVE = "rgba(255,255,255,0.78)";
const ICON_SIZE = 24; // iOS standard
const ICON_BOX = 28;
const LABEL_SIZE = 11; // iOS standard
const BAR_BASE_HEIGHT = 49; // iOS standard tab bar height
const BLUR_INTENSITY = 60;
const GLASS_OVERLAY = "rgba(6,14,20,0.4)";

function TabBarButton(props: BottomTabBarButtonProps) {
  const handlePress = () => {
    void Haptics.selectionAsync();
    props.onPress?.(undefined as any);
  };

  return (
    <PlatformPressable
      {...props}
      onPress={handlePress}
      style={({ pressed }) => [
        { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
        pressed && { opacity: 0.6 },
        props.style,
      ]}
    />
  );
}

const TabBarBackground = React.memo(function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView tint="dark" intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: GLASS_OVERLAY }]} />
      {/* Subtle top border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        }}
      />
    </View>
  );
});

export default function NativeIOSTabBarSimple() {
  const insets = useSafeAreaInsets();
  const barHeight = BAR_BASE_HEIGHT + Math.max(insets.bottom - 4, 0);

  const { t, i18n } = useTranslation("common", { keyPrefix: "tabs" });

  const Label = (key: "home" | "referral" | "swap" | "payments" | "discover") =>
    ({ color }: { color: string }) => (
      <Text
        style={{
          color,
          fontSize: LABEL_SIZE,
          fontWeight: "600",
          marginTop: 4,
        }}
      >
        {t(key, { defaultValue: key })}
      </Text>
    );

  return (
    <Tabs
      key={i18n.language}
      initialRouteName="(home)"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: LABEL_SIZE,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom - 4, 0),
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarButton: (props) => <TabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          tabBarLabel: Label("home"),
          tabBarIcon: ({ focused, color }) => (
            <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
              <Ionicons
                name={focused ? "ellipse" : "ellipse-outline"}
                size={ICON_SIZE}
                color={focused ? ACTIVE : INACTIVE}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="referral"
        options={{
          tabBarLabel: Label("referral"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person-add-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          tabBarLabel: Label("swap"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="swap-horizontal" size={ICON_SIZE} color={color ?? INACTIVE} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarLabel: Label("payments"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="list-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
            </View>
          ),
        }}
      />
      {FEATURES.DISCOVER ? (
        <Tabs.Screen
          name="discover"
          options={{
            tabBarLabel: Label("discover"),
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="search-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
              </View>
            ),
          }}
        />
      ) : (
        <Tabs.Screen name="discover" options={{ href: null, headerShown: false }} />
      )}
    </Tabs>
  );
}






