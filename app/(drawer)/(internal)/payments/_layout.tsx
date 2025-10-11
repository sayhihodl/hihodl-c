import { Stack } from "expo-router";

export default function PaymentsInternalStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="thread" />
      {/* quita tx-details si no existe */}
    </Stack>
  );
}