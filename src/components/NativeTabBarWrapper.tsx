/**
 * Native Tab Bar Wrapper for Expo Router
 * Integrates native Swift UITabBar with expo-router Tabs
 */

import React, { useState, useCallback } from "react";
import { Platform } from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import DefaultTabBar from "@/app/(drawer)/(tabs)/DefaultTabBar";
// Native module - uncomment when development build is ready
// import { NativeTabBar, type TabBarItem } from "@/modules/native-tab-bar/src/NativeTabBar";
import { FEATURES } from "@/config/features";

// Icon mapping for SF Symbols
const ICON_MAP: Record<string, string> = {
  home: "house.fill",
  referral: "person.2.fill",
  swap: "arrow.left.arrow.right",
  payments: "list.bullet",
  discover: "magnifyingglass",
};

function NativeTabBarLayout() {
  const { t, i18n } = useTranslation("common", { keyPrefix: "tabs" });
  const router = useRouter();
  const segments = useSegments();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Determine current route
  const getCurrentIndex = useCallback(() => {
    const route = segments[segments.length - 1] || "home";
    const routes = ["home", "referral", "swap", "payments", "discover"];
    const index = routes.indexOf(route);
    return index >= 0 ? index : 0;
  }, [segments]);

  // Tab items configuration
  const tabItems: TabBarItem[] = [
    {
      title: t("home", { defaultValue: "Home" }),
      icon: ICON_MAP.home,
      routeName: "/(drawer)/(tabs)/(home)",
    },
    {
      title: t("referral", { defaultValue: "Referral" }),
      icon: ICON_MAP.referral,
      routeName: "/(drawer)/(tabs)/referral",
    },
    {
      title: t("swap", { defaultValue: "Swap" }),
      icon: ICON_MAP.swap,
      routeName: "/(drawer)/(tabs)/swap",
    },
    {
      title: t("payments", { defaultValue: "Payments" }),
      icon: ICON_MAP.payments,
      routeName: "/(drawer)/(tabs)/payments",
    },
    ...(FEATURES.DISCOVER
      ? [
          {
            title: t("discover", { defaultValue: "Discover" }),
            icon: ICON_MAP.discover,
            routeName: "/(drawer)/(tabs)/discover",
          },
        ]
      : []),
  ];

  const handleTabSelected = useCallback(
    (index: number, item: TabBarItem) => {
      setSelectedIndex(index);
      if (item.routeName) {
        router.push(item.routeName as any);
      }
    },
    [router]
  );

  // Update selected index when route changes
  React.useEffect(() => {
    const currentIndex = getCurrentIndex();
    setSelectedIndex(currentIndex);
  }, [segments, getCurrentIndex]);

  if (Platform.OS !== "ios") {
    return <DefaultTabBar />;
  }

  return (
    <>
      <Tabs
        key={i18n.language}
        initialRouteName="(home)"
        backBehavior="initialRoute"
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" }, // Hide default tab bar
        }}
      >
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="referral" />
        <Tabs.Screen name="swap" />
        <Tabs.Screen name="payments" />
        {FEATURES.DISCOVER ? (
          <Tabs.Screen name="discover" />
        ) : (
          <Tabs.Screen name="discover" options={{ href: null }} />
        )}
      </Tabs>
      <NativeTabBar
        items={tabItems}
        selectedIndex={selectedIndex}
        blurIntensity={80}
        onTabSelected={handleTabSelected}
      />
    </>
  );
}

export default NativeTabBarLayout;

