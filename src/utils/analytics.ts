// src/utils/analytics.ts
// Sistema de analytics/tracking de eventos de usuario
// Soporta Google Analytics, Supabase Postgres, Mixpanel, Contentsquare y servicios custom

import { logger } from "./logger";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Mixpanel imports
let mixpanel: any = null;
if (Platform.OS === "web") {
  try {
    mixpanel = require("mixpanel-browser");
  } catch (e) {
    // mixpanel-browser no disponible
  }
} else {
  try {
    mixpanel = require("mixpanel-react-native");
  } catch (e) {
    // mixpanel-react-native no disponible
  }
}

type AnalyticsEvent = {
  name: string;
  parameters?: Record<string, string | number | boolean>;
};

type ScreenViewEvent = {
  screen_name: string;
  screen_class?: string;
};

class Analytics {
  private enabled: boolean = true;
  private userId: string | null = null;
  private userProperties: Record<string, string> = {};
  private sessionId: string = this.generateSessionId();
  private appVersion: string = this.getAppVersion();
  private platform: string = this.getPlatform();
  private mixpanelInitialized: boolean = false;
  private mixpanelToken: string | null = null;

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getAppVersion(): string {
    return Constants.expoConfig?.version ?? Constants.manifest2?.version ?? "1.0.0";
  }

  private getPlatform(): string {
    if (Platform.OS === "web") return "web";
    if (Platform.OS === "ios") return "ios";
    if (Platform.OS === "android") return "android";
    return Platform.OS;
  }

  /**
   * Inicializa analytics (llamar una vez al inicio de la app)
   */
  init(enabled = true, mixpanelToken?: string): void {
    this.enabled = enabled;
    this.mixpanelToken = mixpanelToken || process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || null;
    
    // Inicializar Mixpanel si está disponible y hay token
    if (mixpanel && this.mixpanelToken && !this.mixpanelInitialized) {
      try {
        if (Platform.OS === "web") {
          // Configuración para web con autocapture y session replay
          mixpanel.init(this.mixpanelToken, {
            debug: __DEV__,
            track_pageview: false, // Lo manejamos manualmente
            persistence: "localStorage",
            autocapture: true, // Captura automática de eventos
            record_sessions_percent: 100, // Grabar 100% de las sesiones
            api_host: "https://api-eu.mixpanel.com", // EU region
          });
        } else {
          // Configuración para móviles (iOS/Android)
          mixpanel.init(this.mixpanelToken, {
            debug: __DEV__,
            // Nota: autocapture y session replay pueden no estar disponibles en mobile SDK
            // Verificar documentación de mixpanel-react-native para opciones disponibles
          });
        }
        this.mixpanelInitialized = true;
        logger.info("[Analytics] Mixpanel initialized", {
          token: this.mixpanelToken.substring(0, 8) + "...",
          platform: Platform.OS,
        });
      } catch (error) {
        logger.warn("[Analytics] Failed to initialize Mixpanel", error);
      }
    }
    
    logger.info("[Analytics] Initialized", { 
      enabled, 
      supabase: isSupabaseConfigured(),
      mixpanel: this.mixpanelInitialized,
    });
    
    // Servicios configurados:
    // - Google Analytics (web, si está configurado)
    // - Supabase Postgres (todo)
    // - Mixpanel (si está configurado, funciona en web, iOS y Android)
    // - Contentsquare (web, si está configurado)
    // - Logger (desarrollo)
  }

  /**
   * Envía evento a Supabase Postgres
   */
  private async sendToSupabase(
    eventName: string,
    eventParams?: Record<string, string | number | boolean>
  ): Promise<void> {
    if (!isSupabaseConfigured() || !this.enabled) return;

    try {
      const { error } = await supabase.from("analytics_events").insert({
        user_id: this.userId,
        event_name: eventName,
        event_params: eventParams || {},
        user_properties: Object.keys(this.userProperties).length > 0 ? this.userProperties : null,
        platform: this.platform,
        app_version: this.appVersion,
        session_id: this.sessionId,
      });

      if (error) {
        logger.warn("[Analytics] Supabase insert error", error);
      }
    } catch (error) {
      // No lanzar error, solo loguear (analytics no debe romper la app)
      logger.warn("[Analytics] Failed to send to Supabase", error);
    }
  }

  /**
   * Establece el ID de usuario (cuando hace login)
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
    logger.debug("[Analytics] User ID set", { userId });
    
    // Enviar a servicios de analytics
    // Google Analytics (web)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "GA_MEASUREMENT_ID", { user_id: userId });
    }
    
    // Mixpanel
    if (mixpanel && this.mixpanelInitialized) {
      try {
        if (userId) {
          mixpanel.identify(userId);
        } else {
          mixpanel.reset();
        }
      } catch (error) {
        logger.warn("[Analytics] Failed to set Mixpanel user ID", error);
      }
    }
  }

  /**
   * Establece propiedades del usuario (ej: plan, país, etc.)
   */
  setUserProperties(properties: Record<string, string>): void {
    this.userProperties = { ...this.userProperties, ...properties };
    logger.debug("[Analytics] User properties set", properties);
    
    // Enviar a Mixpanel
    if (mixpanel && this.mixpanelInitialized) {
      try {
        mixpanel.people.set(properties);
      } catch (error) {
        logger.warn("[Analytics] Failed to set Mixpanel user properties", error);
      }
    }
  }

  /**
   * Trackea un evento personalizado
   * Ejemplo: trackEvent({ name: 'payment_sent', parameters: { amount: 100, currency: 'USDC' } })
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    const eventData = {
      ...event.parameters,
      userId: this.userId,
      timestamp: Date.now(),
      ...this.userProperties,
    };

    logger.debug("[Analytics] Event tracked", { name: event.name, parameters: eventData });

    // Enviar a Supabase Postgres (async, no bloquea)
    this.sendToSupabase(event.name, event.parameters).catch(() => {
      // Error ya manejado en sendToSupabase
    });

    // Enviar a Google Analytics (si está configurado, solo web)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event.name, event.parameters);
    }

    // Enviar a Mixpanel
    if (mixpanel && this.mixpanelInitialized) {
      try {
        const mixpanelProps: Record<string, any> = {
          ...event.parameters,
          platform: this.platform,
          app_version: this.appVersion,
          session_id: this.sessionId,
        };
        mixpanel.track(event.name, mixpanelProps);
      } catch (error) {
        logger.warn("[Analytics] Failed to track event in Mixpanel", error);
      }
    }
  }

  /**
   * Trackea vista de pantalla (screen view)
   * Ejemplo: trackScreenView({ screen_name: 'Home', screen_class: 'Dashboard' })
   */
  trackScreenView(screen: ScreenViewEvent): void {
    if (!this.enabled) return;

    logger.debug("[Analytics] Screen viewed", screen);

    const screenParams = {
      screen_name: screen.screen_name,
      screen_class: screen.screen_class || screen.screen_name,
    };

    // Enviar a Supabase como evento screen_view
    this.sendToSupabase("screen_view", screenParams).catch(() => {
      // Error ya manejado
    });

    // Google Analytics (solo web)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "screen_view", screenParams);
    }

    // Mixpanel (screen view)
    if (mixpanel && this.mixpanelInitialized) {
      try {
        mixpanel.track("Screen Viewed", {
          screen_name: screen.screen_name,
          screen_class: screen.screen_class || screen.screen_name,
          platform: this.platform,
          app_version: this.appVersion,
        });
      } catch (error) {
        logger.warn("[Analytics] Failed to track screen view in Mixpanel", error);
      }
    }
  }

  /**
   * Trackea eventos comunes de la app
   */
  trackPaymentSent(params: { amount: number; token: string; to?: string }): void {
    this.trackEvent({
      name: "payment_sent",
      parameters: {
        amount: params.amount,
        currency: params.token,
        recipient: params.to || "unknown",
      },
    });
  }

  trackPaymentReceived(params: { amount: number; token: string; from?: string }): void {
    this.trackEvent({
      name: "payment_received",
      parameters: {
        amount: params.amount,
        currency: params.token,
        sender: params.from || "unknown",
      },
    });
  }

  trackTokenSwapped(params: { from: string; to: string; amount: number }): void {
    this.trackEvent({
      name: "token_swapped",
      parameters: {
        from_token: params.from,
        to_token: params.to,
        amount: params.amount,
      },
    });
  }

  trackLogin(method: "google" | "apple"): void {
    this.trackEvent({
      name: "user_login",
      parameters: {
        method,
      },
    });
  }

  trackSignup(method: "google" | "apple"): void {
    this.trackEvent({
      name: "user_signup",
      parameters: {
        method,
      },
    });
  }

  trackOnboardingStep(step: string): void {
    this.trackEvent({
      name: "onboarding_step_completed",
      parameters: {
        step,
      },
    });
  }

  /**
   * Trackea métricas de onboarding
   */
  trackOnboardingStarted(): void {
    this.trackEvent({
      name: "onboarding_started",
      parameters: {
        timestamp: Date.now(),
      },
    });
  }

  trackOnboardingTime(durationSeconds: number): void {
    this.trackEvent({
      name: "onboarding_completed_time",
      parameters: {
        duration_seconds: durationSeconds,
        duration_minutes: Math.round(durationSeconds / 60 * 10) / 10, // Redondeado a 0.1 min
      },
    });
  }

  trackFirstAccountCreationTime(durationSeconds: number): void {
    this.trackEvent({
      name: "first_account_creation_time",
      parameters: {
        duration_seconds: durationSeconds,
        duration_minutes: Math.round(durationSeconds / 60 * 10) / 10,
        source: "dashboard",
      },
    });
  }

  /**
   * Deshabilita analytics (útil para desarrollo/testing o si el usuario opta out)
   */
  disable(): void {
    this.enabled = false;
    logger.info("[Analytics] Disabled");
  }

  /**
   * Habilita analytics
   */
  enable(): void {
    this.enabled = true;
    logger.info("[Analytics] Enabled");
  }
}

export const analytics = new Analytics();
export default analytics;

