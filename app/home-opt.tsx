// app/home-opt.tsx
// Dev helper route: quickly jump to the optimized Home without altering originals
import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";

export default function HomeOptRedirect() {
  useEffect(() => {
    router.replace("/(drawer)/(tabs)/(home)/optimized");
  }, []);
  return <View />;
}


