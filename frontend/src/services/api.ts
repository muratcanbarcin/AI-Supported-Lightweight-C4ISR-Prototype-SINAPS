/**
 * =============================================================================
 * SINAPS C4ISR API Service
 * =============================================================================
 * 
 * Centralized API client for communicating with Spring Boot backend.
 * 
 * Backend Base URL: http://localhost:8080/api/v1
 * 
 * Features:
 * - Axios instance with JWT token injection
 * - Connection health checking
 * - Error handling with custom events
 * - Type-safe API methods
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Telemetry, Asset, telemetryToAsset } from '@/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** API Base URL - Spring Boot backend */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/** Storage keys for authentication */
export const AUTH_TOKEN_KEY = 'sinaps_auth_token';
export const AUTH_USER_KEY = 'sinaps_auth_user';

// Log API URL in development
if (import.meta.env.DEV) {
  console.log('[API] Base URL:', API_BASE_URL);
}

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// =============================================================================
// INTERCEPTORS
// =============================================================================

/**
 * Request Interceptor - Injects JWT token from localStorage
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handles common errors
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          console.warn('[API] Unauthorized - Token may be expired');
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          window.dispatchEvent(new CustomEvent('auth:logout'));
          break;
        case 403:
          console.warn('[API] Forbidden - Insufficient permissions');
          break;
        case 404:
          console.warn('[API] Resource not found:', error.config?.url);
          break;
        case 500:
          console.error('[API] Server error');
          break;
        default:
          console.error(`[API] Error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('[API] Network error - Backend may be offline');
      window.dispatchEvent(new CustomEvent('api:connection_lost', {
        detail: { message: 'Backend bağlantısı kesildi' }
      }));
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check backend connectivity
 * Pings the /telemetry/latest endpoint and returns true if successful
 * 
 * @returns Promise<boolean> - true if backend is reachable
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/telemetry/latest', { 
      timeout: 5000,
      // Don't throw on 4xx/5xx - we just want to know if server responds
      validateStatus: (status) => status < 500,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

/** Alias for backward compatibility */
export const checkBackendHealth = checkHealth;

// =============================================================================
// TELEMETRY API
// =============================================================================

/**
 * Fetch latest telemetry for all assets
 * 
 * @returns Promise<Telemetry[]> - Array of latest telemetry data
 */
export async function fetchLatestTelemetry(): Promise<Telemetry[]> {
  const response = await api.get<Telemetry[]>('/telemetry/latest');
  return response.data;
}

/**
 * Fetch telemetry history (all records)
 * WARNING: This can return a large dataset
 * 
 * @returns Promise<Telemetry[]> - Array of all telemetry records
 */
export async function fetchTelemetryHistory(): Promise<Telemetry[]> {
  const response = await api.get<Telemetry[]>('/telemetry/history');
  return response.data;
}

/**
 * Fetch telemetry for a specific asset by sourceId
 * 
 * @param sourceId - Asset identifier (e.g., "DRONE-001")
 * @returns Promise<Telemetry[]> - Array of telemetry for the asset
 */
export async function fetchAssetTelemetry(sourceId: string): Promise<Telemetry[]> {
  const response = await api.get<Telemetry[]>(`/telemetry/asset/${sourceId}`);
  return response.data;
}

// =============================================================================
// ASSETS API
// =============================================================================

/**
 * Fetch all assets derived from latest telemetry
 * Converts telemetry data to Asset format
 * 
 * @returns Promise<Asset[]> - Array of assets
 */
export async function fetchAssets(): Promise<Asset[]> {
  const telemetryList = await fetchLatestTelemetry();
  
  // Convert telemetry to assets
  return telemetryList.map((t): Asset => ({
    id: t.sourceId,
    name: t.sourceId,
    type: t.sourceType,
    status: t.batteryLevel !== null && t.batteryLevel < 20 ? 'WARNING' : 'ONLINE',
    lastLatitude: t.latitude,
    lastLongitude: t.longitude,
    lastUpdate: t.timestamp,
    alignment: t.alignment,
    batteryLevel: t.batteryLevel,
  }));
}

/**
 * Fetch a single asset by ID
 * 
 * @param assetId - Asset identifier
 * @returns Promise<Asset | null> - Asset or null if not found
 */
export async function fetchAssetById(assetId: string): Promise<Asset | null> {
  try {
    const assets = await fetchAssets();
    return assets.find(a => a.id === assetId) || null;
  } catch {
    return null;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if error is a network/connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
}

/**
 * Get human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.';
    }
    switch (error.response.status) {
      case 401: return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
      case 403: return 'Bu işlem için yetkiniz bulunmuyor.';
      case 404: return 'İstenen kaynak bulunamadı.';
      case 500: return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      default: return `Hata: ${error.response.status}`;
    }
  }
  return 'Beklenmeyen bir hata oluştu.';
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default api;
