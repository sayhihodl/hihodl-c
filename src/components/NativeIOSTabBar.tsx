/**
 * Native iOS Tab Bar Component - Revolut Style
 * Floating navigation bar with premium glassmorphism effect
 * Implements the latest iOS UX/UI patterns with native blur, shadows, and floating design
 */

import React, { useCallback } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  View,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FEATURES } from "@/config/features";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import FluidGlassTabBarLite from "./FluidGlassTabBarLite";

// iOS Native Colors - Revolut Style
const ACTIVE_GLOW = "#007AFF"; // iOS Blue for active state
const ACTIVE_ICON = "#FFB703"; // Your brand active color
const INACTIVE_ICON = "rgba(255, 255, 255, 0.65)";
const ICON_SIZE = 24;
const ICON_BOX = 32;
const LABEL_SIZE = 11;
const BAR_BASE_HEIGHT = 64;
const BLUR_INTENSITY_IOS = 100; // Stronger blur for premium feel
const GLASS_OVERLAY_IOS = "rgba(13, 24, 32, 0.75)"; // Deeper overlay for Revolut style

// Floating effect constants
const HORIZONTAL_PADDING = 16; // Padding from screen edges (Revolut style)
const BORDER_RADIUS = 24; // Pronounced rounded corners
const ELEVATION_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8, // Android
};

// Spring animation config (iOS native feel)
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

interface AnimatedTabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  color?: string;
  activeGlow?: boolean;
}

const AnimatedTabIcon = React.memo(function AnimatedTabIcon({
  focused,
  iconName,
  color,
  activeGlow = false,
}: AnimatedTabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.85);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.85, SPRING_CONFIG);
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 200 });
  }, [focused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      {activeGlow && focused && (
        <View style={styles.activeGlowContainer}>
          <View style={styles.activeGlow} />
        </View>
      )}
      <View style={styles.iconBox}>
        <Ionicons
          name={iconName}
          size={ICON_SIZE}
          color={focused ? color || ACTIVE_ICON : INACTIVE_ICON}
        />
      </View>
    </Animated.View>
  );
});

interface AnimatedTabLabelProps {
  focused: boolean;
  label: string;
}

const AnimatedTabLabel = React.memo(function AnimatedTabLabel({
  focused,
  label,
}: AnimatedTabLabelProps) {
  const opacity = useSharedValue(focused ? 1 : 0.7);

  React.useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 200 });
  }, [focused, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        styles.label,
        animatedStyle,
        focused && styles.labelActive,
      ]}
    >
      {label}
    </Animated.Text>
  );
});

// Enhanced Tab Bar Background with premium Revolut-style blur
const RevolutTabBarBackground = React.memo(function RevolutTabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Premium blur effect */}
      <BlurView
        tint="dark"
        intensity={BLUR_INTENSITY_IOS}
        style={StyleSheet.absoluteFill}
      />
      {/* Overlay for depth - Revolut style */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: GLASS_OVERLAY_IOS },
        ]}
      />
      {/* Subtle top border for separation */}
      <View style={styles.topBorder} />
    </View>
  );
});

// Custom Tab Button with haptic feedback
const NativeIOSTabButton = React.memo(function NativeIOSTabButton(
  props: BottomTabBarButtonProps
) {
  const handlePressIn = useCallback(
    (ev: any) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      props.onPressIn?.(ev);
    },
    [props.onPressIn]
  );

  const handlePress = useCallback(
    (ev: any) => {
      void Haptics.selectionAsync();
      props.onPress?.(ev);
    },
    [props.onPress]
  );

  return (
    <PlatformPressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.tabButtonPressed,
        props.style,
      ]}
    />
  );
});

// Custom Floating Tab Bar Component
function FloatingTabBar(props: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          paddingBottom: Math.max(insets.bottom - 8, 0), // Adjust for floating effect
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.floatingBar,
          {
            marginHorizontal: HORIZONTAL_PADDING,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <FluidGlassTabBarLite intensity={BLUR_INTENSITY_IOS} tint="dark">
          <BottomTabBar {...props} />
        </FluidGlassTabBarLite>
      </View>
    </View>
  );
}

export default function NativeIOSTabBar() {
  const insets = useSafeAreaInsets();
  const barHeight = BAR_BASE_HEIGHT + insets.bottom;

  const { t, i18n } = useTranslation("common", { keyPrefix: "tabs" });

  const Label =
    (key: "home" | "referral" | "swap" | "payments" | "discover") =>
    ({ color, focused }: { color: string; focused?: boolean }) => (
      <AnimatedTabLabel
        focused={focused ?? false}
        label={t(key, { defaultValue: key })}
      />
    );

  return (
    <Tabs
      key={i18n.language}
      initialRouteName="(home)"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_ICON,
        tabBarInactiveTintColor: INACTIVE_ICON,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarStyle: {
          position: "relative",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: BAR_BASE_HEIGHT,
          paddingTop: 10,
          paddingHorizontal: 16,
          paddingBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => null, // Background handled by FloatingTabBar
        tabBarButton: (props) => <NativeIOSTabButton {...props} />,
        tabBar: (props) => <FloatingTabBar {...props} />,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          tabBarLabel: Label("home"),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName={focused ? "ellipse" : "ellipse-outline"}
              activeGlow={true}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="referral"
        options={{
          tabBarLabel: Label("referral"),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName={focused ? "person-add" : "person-add-outline"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          tabBarLabel: Label("swap"),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName={focused ? "swap-horizontal" : "swap-horizontal-outline"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarLabel: Label("payments"),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName={focused ? "list" : "list-outline"}
            />
          ),
        }}
      />
      {FEATURES.DISCOVER ? (
        <Tabs.Screen
          name="discover"
          options={{
            tabBarLabel: Label("discover"),
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon
                focused={focused}
                iconName={focused ? "search" : "search-outline"}
              />
            ),
          }}
        />
      ) : (
        <Tabs.Screen name="discover" options={{ href: null, headerShown: false }} />
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Floating container wrapper
  floatingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  // Floating bar with rounded corners and shadow
  floatingBar: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "transparent",
    minHeight: BAR_BASE_HEIGHT,
    ...ELEVATION_SHADOW,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: "center",
    justifyContent: "center",
  },
  activeGlowContainer: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    marginLeft: -16,
    width: 32,
    height: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activeGlow: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_GLOW,
    shadowColor: ACTIVE_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  label: {
    fontSize: LABEL_SIZE,
    fontWeight: "600",
    marginTop: 4,
    color: INACTIVE_ICON,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: ACTIVE_ICON,
    fontWeight: "700",
  },
  tabBarLabelStyle: {
    fontSize: LABEL_SIZE,
    fontWeight: "600",
    marginTop: 4,
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
});
