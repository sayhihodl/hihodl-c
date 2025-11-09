// src/lib/api.ts
import { logger } from "@/utils/logger";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string,
    public responseText?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });
      
      if (!res.ok) {
        let responseText: string | undefined;
        try {
          responseText = await res.text();
        } catch {
          // Ignore text extraction errors
        }
        
        const error = new ApiError(
          `GET ${url} failed: ${res.status} ${res.statusText}`,
          res.status,
          url,
          responseText
        );
        logger.apiError('GET', error, { url, status: res.status });
        throw error;
      }
      
      return res.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.apiError('GET', error, { url });
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        url
      );
    }
  },

  async post<T>(url: string, body: unknown, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify(body),
        ...options,
      });
      
      if (!res.ok) {
        let responseText: string | undefined;
        try {
          responseText = await res.text();
        } catch {
          // Ignore text extraction errors
        }
        
        const error = new ApiError(
          `POST ${url} failed: ${res.status} ${res.statusText}`,
          res.status,
          url,
          responseText
        );
        logger.apiError('POST', error, { url, status: res.status });
        throw error;
      }
      
      return res.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.apiError('POST', error, { url });
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        url
      );
    }
  },
};