// src/utils/crash-reporting.ts
// Sistema de crash reporting para producción
// Soporta Sentry (recomendado) y Firebase Crashlytics

import { logger } from "./logger";

// Para usar Sentry, descomentar e instalar: npm install @sentry/react-native
// import * as Sentry from "@sentry/react-native";

// Para usar Firebase Crashlytics, descomentar e instalar: npm install @react-native-firebase/crashlytics
// import crashlytics from "@react-native-firebase/crashlytics";

class CrashReporting {
  private enabled: boolean = false;

  /**
   * Inicializa crash reporting
   * @param options - Opciones de configuración
   */
  init(options: { enabled: boolean; dsn?: string }): void {
    if (!options.enabled) {
      logger.info("[CrashReporting] Disabled");
      return;
    }

    this.enabled = options.enabled;

    try {
      // Configurar Sentry
      // if (options.dsn) {
      //   Sentry.init({
      //     dsn: options.dsn,
      //     environment: __DEV__ ? "development" : "production",
      //     enableAutoSessionTracking: true,
      //     tracesSampleRate: 1.0, // En producción, reducir a 0.1
      //   });
      //   logger.info("[CrashReporting] Sentry initialized");
      // }

      // Configurar Firebase Crashlytics
      // crashlytics().setCrashlyticsCollectionEnabled(true);
      // logger.info("[CrashReporting] Firebase Crashlytics initialized");

      logger.info("[CrashReporting] Initialized");
    } catch (error) {
      logger.error("[CrashReporting] Initialization failed", error);
      this.enabled = false;
    }
  }

  /**
   * Reporta un error crítico
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.enabled) {
      logger.error("[CrashReporting] Exception (not reported):", error, context);
      return;
    }

    try {
      // Sentry
      // Sentry.captureException(error, {
      //   extra: context,
      // });

      // Firebase Crashlytics
      // crashlytics().recordError(error);
      // if (context) {
      //   Object.entries(context).forEach(([key, value]) => {
      //     crashlytics().setAttribute(key, String(value));
      //   });
      // }

      logger.error("[CrashReporting] Exception reported:", error, context);
    } catch (reportError) {
      logger.error("[CrashReporting] Failed to report exception:", reportError);
    }
  }

  /**
   * Reporta un mensaje de error
   */
  captureMessage(message: string, level: "error" | "warning" | "info" = "error"): void {
    if (!this.enabled) {
      logger[level === "error" ? "error" : "warn"]("[CrashReporting] Message (not reported):", message);
      return;
    }

    try {
      // Sentry
      // Sentry.captureMessage(message, level);

      // Firebase Crashlytics
      // crashlytics().log(message);

      logger[level === "error" ? "error" : "warn"]("[CrashReporting] Message reported:", message);
    } catch (reportError) {
      logger.error("[CrashReporting] Failed to report message:", reportError);
    }
  }

  /**
   * Establece contexto del usuario
   */
  setUser(userId: string, email?: string, username?: string): void {
    if (!this.enabled) return;

    try {
      // Sentry
      // Sentry.setUser({
      //   id: userId,
      //   email,
      //   username,
      // });

      // Firebase Crashlytics
      // crashlytics().setUserId(userId);
      // if (email) crashlytics().setAttribute("email", email);
      // if (username) crashlytics().setAttribute("username", username);

      logger.debug("[CrashReporting] User set", { userId, email, username });
    } catch (error) {
      logger.error("[CrashReporting] Failed to set user:", error);
    }
  }

  /**
   * Agrega breadcrumb (evento contextual)
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    try {
      // Sentry
      // Sentry.addBreadcrumb({
      //   message,
      //   category,
      //   data,
      //   level: "info",
      // });

      logger.debug("[CrashReporting] Breadcrumb added", { message, category, data });
    } catch (error) {
      logger.error("[CrashReporting] Failed to add breadcrumb:", error);
    }
  }

  /**
   * Deshabilita crash reporting
   */
  disable(): void {
    this.enabled = false;
    logger.info("[CrashReporting] Disabled");
  }

  /**
   * Habilita crash reporting
   */
  enable(): void {
    this.enabled = true;
    logger.info("[CrashReporting] Enabled");
  }
}

export const crashReporting = new CrashReporting();

/**
 * Helper para envolver funciones async y capturar errores
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      crashReporting.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context, function: fn.name }
      );
      throw error;
    }
  }) as T;
}

