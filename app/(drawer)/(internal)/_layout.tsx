// app/(internal)/_layout.tsx
import { Stack } from "expo-router";

export default function InternalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    </Stack>
  );
}