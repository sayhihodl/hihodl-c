// src/utils/logger.ts
// Sistema de logging centralizado que puede ser deshabilitado en producción
// ⚠️ NOTA: Este es para logs técnicos/debugging. Para tracking de usuarios,
// usa el sistema de analytics en @/utils/analytics

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;
const isTest = process.env.NODE_ENV === 'test';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isTest) return false;
    if (!isDev && level === 'debug') return false;
    return true;
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error('[ERROR]', ...args);
    }
  }

  // Helper para errores de API con contexto
  apiError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : String(error);
    this.error(`[API:${context}]`, message, metadata || '');
  }
}

export const logger = new Logger();
export default logger;
