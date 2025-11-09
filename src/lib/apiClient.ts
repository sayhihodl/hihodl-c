// src/lib/apiClient.ts
// Enhanced API client for Backend API with standard response format
import { API_URL } from '@/config/runtime';
import { getAuthHeadersAsync } from '@/lib/apiAuth';
import { logger } from '@/utils/logger';
import type { ApiError, ApiErrorCode } from '@/types/api';

/**
 * Enhanced API Error with backend error format support
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: ApiErrorCode,
    public status: number,
    public url: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Generate Idempotency Key for mutating requests
 */
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Enhanced API Client that handles backend standard format:
 * { success: true, data: T } or { success: false, error: { code, message, details } }
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    // Remove trailing slashes
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Base request method that handles:
   * - URL construction with base URL
   * - Authentication headers
   * - Standard response format parsing
   * - Error handling
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit & { 
      idempotencyKey?: boolean | string;
      skipAuth?: boolean;
    } = {}
  ): Promise<T> {
    // Construct full URL
    const url = path.startsWith('http') 
      ? path 
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    // Get headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication (unless skipped)
    if (!options.skipAuth) {
      const authHeaders = await getAuthHeadersAsync();
      Object.assign(headers, authHeaders);
    }

    // Add Idempotency-Key for mutating requests if requested
    if (options.idempotencyKey !== false && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const idempotencyKey = typeof options.idempotencyKey === 'string' 
        ? options.idempotencyKey 
        : generateIdempotencyKey();
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // Merge any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      ...options,
    };

    // Add body for methods that need it
    if (body !== undefined && ['POST', 'PATCH', 'PUT'].includes(method)) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Parse response as JSON
      let jsonResponse: unknown;
      try {
        jsonResponse = await response.json();
      } catch (parseError) {
        // If response is not JSON, handle as text error
        const textResponse = await response.text().catch(() => 'Unable to read response');
        throw new ApiClientError(
          `Invalid JSON response: ${textResponse}`,
          'INTERNAL_ERROR',
          response.status,
          url,
          { rawResponse: textResponse }
        );
      }

      // Handle backend standard format
      if (typeof jsonResponse === 'object' && jsonResponse !== null) {
        const apiResponse = jsonResponse as { success?: boolean; data?: unknown; error?: ApiError };

        // Check for success/error format
        if ('success' in apiResponse) {
          if (apiResponse.success === true) {
            // Extract data from { success: true, data: T }
            return (apiResponse.data ?? jsonResponse) as T;
          } else if (apiResponse.success === false && apiResponse.error) {
            // Handle { success: false, error: {...} }
            const error = apiResponse.error;
            throw new ApiClientError(
              error.message,
              error.code as ApiErrorCode,
              response.status,
              url,
              error.details
            );
          }
        }
      }

      // If response format is not standard, check HTTP status
      if (!response.ok) {
        const errorMessage = typeof jsonResponse === 'object' && jsonResponse !== null && 'error' in jsonResponse
          ? (jsonResponse as { error?: { message?: string } }).error?.message || 'Request failed'
          : `Request failed: ${response.status} ${response.statusText}`;

        throw new ApiClientError(
          errorMessage,
          this.mapStatusCodeToErrorCode(response.status),
          response.status,
          url,
          jsonResponse
        );
      }

      // Return response as-is if not standard format (for backward compatibility)
      return jsonResponse as T;
    } catch (error) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        // Silently handle 401 on /me endpoint (expected when user is not authenticated)
        if (error.status === 401 && url.includes('/me')) {
          // Don't log 401 errors for /me endpoint - it's expected when user is not authenticated
          throw error;
        }
        
        // Reduce logging for backend setup errors (table doesn't exist, pool issues)
        // These are infrastructure issues, not user-facing errors
        const errorMessage = error.message.toLowerCase();
        const isBackendSetupError = 
          error.status >= 500 && (
            (errorMessage.includes('stable_cards') && errorMessage.includes('does not exist')) ||
            (errorMessage.includes('relation') && errorMessage.includes('does not exist')) ||
            (errorMessage.includes('pool') && errorMessage.includes('after calling end'))
          );
        
        if (!isBackendSetupError) {
          logger.apiError(method, error, { url, status: error.status });
        } else if (__DEV__) {
          // Only log in dev mode for debugging
          logger.warn(`[API:${method}] Backend setup issue (reduced logging):`, error.message, { url, status: error.status });
        }
        
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.apiError(method, error, { url });
        throw new ApiClientError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR',
          0,
          url
        );
      }

      // Handle other errors
      logger.apiError(method, error, { url });
      throw new ApiClientError(
        error instanceof Error ? error.message : String(error),
        'INTERNAL_ERROR',
        0,
        url
      );
    }
  }

  /**
   * Map HTTP status code to API error code
   */
  private mapStatusCodeToErrorCode(status: number): ApiErrorCode {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 400:
        return 'VALIDATION_ERROR';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'INTERNAL_ERROR';
      default:
        return 'BAD_REQUEST';
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(
    path: string, 
    body?: unknown, 
    options?: RequestInit & { idempotencyKey?: boolean | string; skipAuth?: boolean }
  ): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string, 
    body?: unknown, 
    options?: RequestInit & { idempotencyKey?: boolean | string; skipAuth?: boolean }
  ): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string, 
    body?: unknown, 
    options?: RequestInit & { idempotencyKey?: boolean | string; skipAuth?: boolean }
  ): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    path: string, 
    options?: RequestInit & { skipAuth?: boolean }
  ): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

/**
 * Default API client instance
 * Uses API_URL from environment or empty string (will use full URLs)
 */
export const apiClient = new ApiClient();

/**
 * Export for convenience
 */
export default apiClient;

