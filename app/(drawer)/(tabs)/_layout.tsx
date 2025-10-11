// app/(drawer)/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { View, StyleSheet, Image, Platform, type ViewStyle, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FEATURES } from "@/config/features";

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
const NOISE_SRC = { uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAALUlEQVQ4jWNgGAWjYBQj4T8mGBgY/8+QGJgYzGgGmCwYwzEoGg0H+Q8gP8QAAKPGC6e1g1y5AAAAABJRU5ErkJggg==" };

function WithActiveTick({ focused, children, style }: { focused: boolean; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.iconWrap, style]}>
      <View style={[styles.activeTick, focused && styles.activeTickOn]} />
      {children}
    </View>
  );
}
const IconBox = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>{children}</View>
);

const TabBarBackground = React.memo(function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView tint="dark" intensity={BLUR_INTENSITY || 60} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: GLASS_OVERLAY }]} />
      <Image source={NOISE_SRC} style={[StyleSheet.absoluteFillObject, { opacity: 0.08 }]} resizeMode="repeat" />
    </View>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const barHeight = BAR_BASE_HEIGHT + Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 12);

  // 👇 usa keyPrefix="tabs" (mirará dentro de common.tabs.*)
  const { t, i18n } = useTranslation("common", { keyPrefix: "tabs" });

  const Label = (key: "home" | "referral" | "swap" | "payments" | "discover") =>
    ({ color }: { color: string }) => (
      <Text style={{ color, fontSize: LABEL_SIZE, fontWeight: "800", marginTop: LABEL_MARGIN_TOP }}>
        {t(key, { defaultValue: key }) /* fallback visible pero sin 'tabs.' */}
      </Text>
    );

  return (
    <Tabs
      key={i18n.language} // remonta el layout al cambiar idioma
      initialRouteName="(home)"
      backBehavior="initialRoute"
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
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          tabBarLabel: Label("home"),
          tabBarIcon: ({ focused }) => (
            <WithActiveTick focused={focused}>
              <IconBox>
                <Ionicons name={focused ? "ellipse" : "ellipse-outline"} size={ICON_SIZE} color={focused ? ACTIVE : INACTIVE} />
              </IconBox>
            </WithActiveTick>
          ),
        }}
      />
      <Tabs.Screen
        name="referral"
        options={{
          tabBarLabel: Label("referral"),
          tabBarIcon: ({ color, focused }) => (
            <WithActiveTick focused={focused}>
              <IconBox>
                <Ionicons name="person-add-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
              </IconBox>
            </WithActiveTick>
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          tabBarLabel: Label("swap"),
          tabBarIcon: ({ color, focused }) => (
            <WithActiveTick focused={focused}>
              <IconBox>
                <Ionicons name="swap-horizontal" size={ICON_SIZE} color={color ?? INACTIVE} />
              </IconBox>
            </WithActiveTick>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarLabel: Label("payments"),
          tabBarIcon: ({ color, focused }) => (
            <WithActiveTick focused={focused}>
              <IconBox>
                <Ionicons name="list-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
              </IconBox>
            </WithActiveTick>
          ),
        }}
      />
      {FEATURES.DISCOVER ? (
        <Tabs.Screen
          name="discover"
          options={{
            tabBarLabel: Label("discover"),
            tabBarIcon: ({ color, focused }) => (
              <WithActiveTick focused={focused}>
                <IconBox>
                  <Ionicons name="search-outline" size={ICON_SIZE} color={color ?? INACTIVE} />
                </IconBox>
              </WithActiveTick>
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
  appRoot: { flex: 1, backgroundColor: BG },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  activeTick: { position: "absolute", top: -10, width: 28, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  activeTickOn: { backgroundColor: ACTIVE },
});