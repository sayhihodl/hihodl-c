// app/home.tsx
import React from "react";
import { View, Text } from "react-native";
import GlassNavBar from "@/components/Screen/GlassNavBar";
import '@/shims/node';

export default function HomeScreen() {
  return (
    <>
      <GlassNavBar
        forceGlass
        headerHeight={44}
        headerPad={8}
        tintOpacity={0.35}
        materialStyle={0}      // 0 ultraThin, 1 thin, 2 material, 3 chrome(iOS15+), 4 system
        useSystemTint={true}   // adapta el tinte a Light/Dark
      />
      <View
        style={{
          flex: 1,
          paddingTop: 44 + 8, // coincide con los props arriba
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f14", // opcional para ver el efecto del blur
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>HOME OK</Text>
      </View>
    </>
  );
}