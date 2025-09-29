import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { View, StyleSheet, Image, Platform, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0D1820";
const ACTIVE = "#FFB703";
const INACTIVE = "rgba(255,255,255,0.78)";

const ICON_SIZE = 18;
const ICON_BOX = 28;
const LABEL_SIZE = 10;
const LABEL_MARGIN_TOP = 4;
const BAR_BASE_HEIGHT = 56;

const BLUR_INTENSITY = Platform.select({ ios: 60, android: 80, default: 60 });
const GLASS_OVERLAY = "rgba(6,14,20,0.35)";
const HAIRLINE = "rgba(255,255,255,0.08)";

const NOISE_SRC = {
  uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAALUlEQVQ4jWNgGAWjYBQj4T8mGBgY/8+QGJgYzGgGmCwYwzEoGg0H+Q8gP8QAAKPGC6e1g1y5AAAAABJRU5ErkJggg==",
};

function WithActiveTick({ focused, children, style }: { focused: boolean; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.iconWrap, style]}>
      <View style={[styles.activeTick, focused && styles.activeTickOn]} />
      {children}
    </View>
  );
}
function HomePortal({ focused }: { focused: boolean }) {
  return (
    <WithActiveTick focused={focused}>
      <View style={styles.iconBox}>
        <Ionicons name={focused ? "ellipse" : "ellipse-outline"} size={ICON_SIZE} color={focused ? ACTIVE : INACTIVE} />
      </View>
    </WithActiveTick>
  );
}
function SwapIcon({ focused, color }: { focused: boolean; color: string }) {
  if (!focused) {
    return (
      <WithActiveTick focused={false}>
        <View style={styles.iconBox}>
          <Ionicons name="swap-horizontal" size={ICON_SIZE} color={color} />
        </View>
      </WithActiveTick>
    );
  }
  return (
    <WithActiveTick focused>
      <View style={styles.swapBadge}>
        <Ionicons name="swap-horizontal" size={ICON_SIZE} color={BG} />
      </View>
    </WithActiveTick>
  );
}

const TabBarBackground = React.memo(function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView tint="dark" intensity={BLUR_INTENSITY!} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: GLASS_OVERLAY }]} />
      <Image source={NOISE_SRC} style={[StyleSheet.absoluteFillObject, { opacity: 0.08 }]} resizeMode="repeat" />
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />
      </View>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: HAIRLINE }} />
    </View>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const barHeight = BAR_BASE_HEIGHT + Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 12);

  return (
    // ✅ Fondo sólido de toda la escena de Tabs (evita “blancos”)
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Tabs
        initialRouteName="(home)"
        backBehavior="initialRoute"
        // ❌ NADA de sceneContainerStyle aquí
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: LABEL_SIZE, fontWeight: "800", marginTop: LABEL_MARGIN_TOP },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            height: barHeight,
            paddingTop: 4,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: { paddingTop: 0, paddingBottom: 0, marginTop: -2 },
          tabBarBackground: () => <TabBarBackground />,
        }}
      >
        {/* Tabs visibles */}
        <Tabs.Screen
          name="(home)"
          options={{ title: "Home", tabBarIcon: ({ focused }) => <HomePortal focused={focused} /> }}
        />
        <Tabs.Screen
          name="referral"
          options={{
            title: "Referral",
            tabBarIcon: ({ color, focused }) => (
              <WithActiveTick focused={focused}>
                <View style={styles.iconBox}>
                  <Ionicons name="person-add-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
                </View>
              </WithActiveTick>
            ),
          }}
        />
        <Tabs.Screen
          name="swap"
          options={{ title: "Swap", tabBarIcon: ({ focused, color }) => <SwapIcon focused={focused} color={color ?? INACTIVE} /> }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: "Payments",
            tabBarIcon: ({ color, focused }) => (
              <WithActiveTick focused={focused}>
                <View style={styles.iconBox}>
                  <Ionicons name="list-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
                </View>
              </WithActiveTick>
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: "Discover",
            tabBarIcon: ({ color, focused }) => (
              <WithActiveTick focused={focused}>
                <View style={styles.iconBox}>
                  <Ionicons name="search-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
                </View>
              </WithActiveTick>
            ),
          }}
        />

        {/* Internas ocultas */}
        <Tabs.Screen name="token" options={{ href: null }} />
        <Tabs.Screen name="cards/[id]" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="tokens/index" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="tokens/[chain]/index" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="send" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="receive" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="addtoken" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="search" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="account/[accountId]/index" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="account/[accountId]/all" options={{ href: null, headerShown: false }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  iconBox: { width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" },
  activeTick: { position: "absolute", top: -10, width: 28, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  activeTickOn: { backgroundColor: ACTIVE },
  swapBadge: {
    width: ICON_BOX + 8,
    height: ICON_BOX + 8,
    borderRadius: (ICON_BOX + 8) / 2,
    backgroundColor: ACTIVE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  vignetteTop: { position: "absolute", top: 0, left: 0, right: 0, height: 22, backgroundColor: "rgba(0,0,0,0.10)" },
  vignetteBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 20, backgroundColor: "rgba(0,0,0,0.10)" },
});