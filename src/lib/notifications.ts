// src/lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let setupDone = false;

export async function ensureNotificationsSetup(): Promise<boolean> {
  try {
    if (!setupDone) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
      setupDone = true;
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      status = asked;
    }
    return status === "granted";
  } catch {
    return false;
  }
}

export async function notifyPaymentSent(params: { amount?: number | string; token?: string; to?: string }) {
  const ok = await ensureNotificationsSetup();
  if (!ok) return;
  const amountTxt = params.amount ? String(params.amount) : "";
  const token = params.token ?? "";
  const peer = params.to ?? "recipient";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Payment sent",
      body: [amountTxt && token ? `${amountTxt} ${token}` : undefined, peer && `to ${peer}`].filter(Boolean).join(" "),
    },
    trigger: null,
  });
}

export async function notifyPaymentReceived(params: { amount?: number | string; token?: string; from?: string }) {
  const ok = await ensureNotificationsSetup();
  if (!ok) return;
  const amountTxt = params.amount ? String(params.amount) : "";
  const token = params.token ?? "";
  const peer = params.from ?? "sender";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Payment received",
      body: [amountTxt && token ? `${amountTxt} ${token}` : undefined, peer && `from ${peer}`].filter(Boolean).join(" "),
    },
    trigger: null,
  });
}


