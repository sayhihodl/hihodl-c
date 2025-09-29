import { Drawer } from "expo-router/drawer";
import { usePathname } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import colors from "@/theme/colors";

export default function DrawerLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const inToken = pathname?.startsWith("/(drawer)/(tabs)/token/");

  return (
    <View style={{ flex: 1, backgroundColor: colors.navBg }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: "front",
          overlayColor: "transparent",
          swipeEnabled: !inToken,
          swipeEdgeWidth: inToken ? 0 : 30,
          drawerStyle: {
            width: Math.min(width * 0.9, 340),
            backgroundColor: colors.navBg,
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
      </Drawer>
    </View>
  );
}