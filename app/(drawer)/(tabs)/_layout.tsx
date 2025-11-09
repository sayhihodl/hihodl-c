// app/(drawer)/(tabs)/_layout.tsx
import React from "react";
import DefaultTabBar from "@/components/DefaultTabBar";

/**
 * Tabs Layout - Uses the stable DefaultTabBar for all platforms
 * This provides consistent behavior across iOS and Android
 */
export default function TabsLayout() {
  return <DefaultTabBar />;
}