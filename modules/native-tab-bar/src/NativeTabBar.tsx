/**
 * Native iOS Tab Bar Component
 * Uses native Swift UITabBar following Apple's Human Interface Guidelines
 * https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { requireNativeViewManager } from "expo-modules-core";

const NativeTabBarView = requireNativeViewManager("NativeTabBar");

export interface TabBarItem {
  title: string;
  icon: string; // SF Symbol name
  routeName?: string;
}

interface NativeTabBarProps {
  items: TabBarItem[];
  selectedIndex?: number;
  blurIntensity?: number; // 0-100
  onTabSelected?: (index: number, item: TabBarItem) => void;
  style?: any;
}

export default function NativeTabBar({
  items,
  selectedIndex = 0,
  blurIntensity = 80,
  onTabSelected,
  style,
}: NativeTabBarProps) {
  const insets = useSafeAreaInsets();
  const nativeViewRef = useRef<any>(null);

  useEffect(() => {
    if (nativeViewRef.current) {
      // Set up event handler
      nativeViewRef.current.setOnTabSelected((event: any) => {
        const index = event.nativeEvent?.index ?? event.index;
        if (index >= 0 && index < items.length && onTabSelected) {
          onTabSelected(index, items[index]);
        }
      });
    }
  }, [items, onTabSelected]);

  if (Platform.OS !== "ios") {
    // Fallback for non-iOS platforms
    return null;
  }

  // Prepare items for native module
  const nativeItems = items.map((item) => ({
    title: item.title,
    icon: item.icon,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          height: 49 + Math.max(insets.bottom - 4, 0),
          paddingBottom: Math.max(insets.bottom - 4, 0),
        },
        style,
      ]}
    >
      <NativeTabBarView
        ref={nativeViewRef}
        items={nativeItems}
        selectedIndex={selectedIndex}
        blurIntensity={blurIntensity}
        onTabSelected={(event: any) => {
          const index = event.nativeEvent?.index ?? event.index;
          if (index >= 0 && index < items.length && onTabSelected) {
            onTabSelected(index, items[index]);
          }
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
});
