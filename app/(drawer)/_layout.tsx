// app/(drawer)/_layout.tsx
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SendFlowProvider } from "@/send/SendFlowProvider";
import SendFlowHost from "@/send/SendFlowHost";

export default function DrawerLayout() {
  return (
    <SendFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: "horizontal",
          // amplia el borde izquierdo para el swipe-back (iOS)
          gestureResponseDistance: { start: 40 },
        }}
      >
        {/* Pilar con TabBar */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Pilar sin TabBar (cards, receive, send, menu, tokens, account, etc.) */}
        <Stack.Screen name="(internal)" options={{ headerShown: false }} />
      </Stack>

      {/* Overlay global sin bloquear el borde */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <SendFlowHost />
      </View>
    </SendFlowProvider>
  );
}