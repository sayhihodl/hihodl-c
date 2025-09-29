import { Stack } from "expo-router";
import colors from "@/theme/colors";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 👇 fondo por defecto de TODA la app
        contentStyle: { backgroundColor: colors.navBg },
      }}
    />
  );
}