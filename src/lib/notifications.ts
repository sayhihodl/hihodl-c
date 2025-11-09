// src/lib/notifications.ts
import { Platform } from "react-native";
import { analytics } from "@/utils/analytics";
import { isExpoGo } from "./runtime";

// Lazy import de expo-notifications para evitar errores en Expo Go
let Notifications: typeof import("expo-notifications") | null = null;

async function getNotificationsModule() {
  if (Notifications) return Notifications;
  
  // Si estamos en Expo Go, no intentar cargar el módulo
  if (isExpoGo) {
    return null;
  }
  
  try {
    Notifications = await import("expo-notifications");
    return Notifications;
  } catch (error) {
    console.warn("[Notifications] Module not available:", error);
    return null;
  }
}

let setupDone = false;

export async function ensureNotificationsSetup(): Promise<boolean> {
  // En Expo Go, las notificaciones no están disponibles
  if (isExpoGo) {
    return false;
  }
  
  try {
    const NotificationsModule = await getNotificationsModule();
    if (!NotificationsModule) {
      return false;
    }
    
    if (!setupDone) {
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
      setupDone = true;
    }
    const { status: existing } = await NotificationsModule.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const { status: asked } = await NotificationsModule.requestPermissionsAsync();
      status = asked;
    }
    return status === "granted";
  } catch (error) {
    console.warn("[Notifications] Setup failed:", error);
    return false;
  }
}

export async function notifyPaymentSent(params: { amount?: number | string; token?: string; to?: string }) {
  if (isExpoGo) {
    return;
  }
  
  try {
    const ok = await ensureNotificationsSetup();
    if (!ok) return;
    
    const NotificationsModule = await getNotificationsModule();
    if (!NotificationsModule) {
      return;
    }
    
    const amountTxt = params.amount ? String(params.amount) : "";
    const token = params.token ?? "";
    const peer = params.to ?? "recipient";
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: "Payment sent",
        body: [amountTxt && token ? `${amountTxt} ${token}` : undefined, peer && `to ${peer}`].filter(Boolean).join(" "),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn("[Notifications] Failed to send notification:", error);
  }
}

export async function notifyPaymentReceived(params: { amount?: number | string; token?: string; from?: string }) {
  if (isExpoGo) {
    // Aún trackear el evento de analytics aunque no mostremos notificación en Expo Go
    const amountNum = typeof params.amount === 'number' 
      ? params.amount 
      : typeof params.amount === 'string' 
      ? parseFloat(params.amount) 
      : 0;
    const token = params.token ?? "";
    const peer = params.from ?? "sender";
    
    try {
      analytics.trackPaymentReceived({
        amount: amountNum,
        token,
        from: peer,
      });
    } catch (error) {
      console.warn("[Notifications] Failed to track analytics:", error);
    }
    return;
  }
  
  try {
    const ok = await ensureNotificationsSetup();
    if (!ok) return;
    
    const NotificationsModule = await getNotificationsModule();
    if (!NotificationsModule) {
      return;
    }
    
    const amountTxt = params.amount ? String(params.amount) : "";
    const token = params.token ?? "";
    const peer = params.from ?? "sender";
    
    // Trackear pago recibido
    const amountNum = typeof params.amount === 'number' 
      ? params.amount 
      : typeof params.amount === 'string' 
      ? parseFloat(params.amount) 
      : 0;
      
    analytics.trackPaymentReceived({
      amount: amountNum,
      token,
      from: peer,
    });
    
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: "Payment received",
        body: [amountTxt && token ? `${amountTxt} ${token}` : undefined, peer && `from ${peer}`].filter(Boolean).join(" "),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn("[Notifications] Failed to send notification:", error);
  }
}


