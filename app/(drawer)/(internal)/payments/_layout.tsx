// app/(drawer)/(internal)/payments/_layout.tsx
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { isLockEnabled } from "@/lib/lock";

function PaymentsGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (async () => {
      try {
        const locked = await isLockEnabled();
        if (locked) router.replace("/auth/faceidpin");
      } catch {}
    })();
  }, []);
  return <>{children}</>;
}

export default function PaymentsLayout() {
  return (
    <PaymentsGuard>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="thread" />
      {/* Modal transparente */}
      <Stack.Screen
        name="tx-details"
        options={{
          presentation: "transparentModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="tx-confirm"
        options={{
          presentation: "card",
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
    </PaymentsGuard>
  );
}