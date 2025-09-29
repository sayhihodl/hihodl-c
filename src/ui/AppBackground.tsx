import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Paleta HiHODL
const Y = "#FFB703", O = "#FB8500", S = "#8ECAE6", B = "#219EBC", N = "#023047";

export default function AppBackground({ children }: React.PropsWithChildren) {
  return (
    <View style={{ flex: 1 }}>
      {/* capa base */}
      <LinearGradient
        colors={[N, "#0B1218"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* flare diagonal HiHODL */}
      <LinearGradient
        colors={["transparent", S, Y, O, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
      />
      {/* halo inferior */}
      <View
        style={{
          position: "absolute",
          bottom: -120, left: -40, right: -40, height: 320,
          borderRadius: 320, backgroundColor: B, opacity: 0.15,
          filter: "blur(80px)" as any,        // RN-web; en nativo ignora
        }}
      />
      {children}
    </View>
  );
}