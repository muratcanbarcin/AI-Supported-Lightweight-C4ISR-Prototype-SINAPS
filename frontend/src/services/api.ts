import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * SINAPS C4ISR API Client
 * 
 * Centralized Axios instance configured to communicate with the
 * Spring Boot backend. Includes JWT token injection and error handling.
 */

// API Base URL - Can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Storage keys
export const AUTH_TOKEN_KEY = 'sinaps_auth_token';
export const AUTH_USER_KEY = 'sinaps_auth_user';

// Create the axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Injects JWT token from localStorage
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handles common errors
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and potentially redirect
          console.warn('[API] Unauthorized - Token may be expired');
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          // Emit event for auth state change
          window.dispatchEvent(new CustomEvent('auth:logout'));
          break;
        case 403:
          console.warn('[API] Forbidden - Insufficient permissions');
          break;
        case 404:
          console.warn('[API] Resource not found');
          break;
        case 500:
          console.error('[API] Server error');
          break;
        default:
          console.error(`[API] Error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] Network error - Backend may be offline');
      // Emit connection lost event
      window.dispatchEvent(new CustomEvent('api:connection_lost', {
        detail: { message: 'Backend bağlantısı kesildi' }
      }));
    }
    
    return Promise.reject(error);
  }
);

/**
 * Health check function to verify backend connectivity
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await api.get('/telemetry/latest', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to check if error is a network/connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
}

export default api;
