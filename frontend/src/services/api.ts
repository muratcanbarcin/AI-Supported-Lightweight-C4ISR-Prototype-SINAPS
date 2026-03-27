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
export const AUTH_ROLES_KEY = 'sinaps_auth_roles';

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
          localStorage.removeItem(AUTH_ROLES_KEY);
          window.dispatchEvent(new CustomEvent('auth:logout'));
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
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
// TASKS API
// =============================================================================

export interface TaskDTO {
  id: number;
  assetId: string | null;
  title: string;
  description: string | null;
  status: string;
  taskType: string | null;
  zoneId: string | null;
  zoneName: string | null;
  createdAt: string;
}

/**
 * Fetch all tasks (most recent first).
 * GET /api/v1/tasks
 */
export async function fetchTasks(): Promise<TaskDTO[]> {
  const response = await api.get<TaskDTO[]>('/tasks');
  return response.data;
}

/**
 * Create a new task.
 * POST /api/v1/tasks
 */
export async function createTask(task: { assetId?: string; title: string; description?: string }): Promise<TaskDTO> {
  const response = await api.post<TaskDTO>('/tasks', task);
  return response.data;
}

// =============================================================================
// AI ANALYSES API
// =============================================================================

export interface AiAnalysisDTO {
  id: number;
  assetId: string;
  threatLevel: string;
  recommendation: string;
  isAlert: boolean;
  createdAt: string;
}

/**
 * Fetch tactical AI analyses.
 * GET /api/v1/ai-analyses/tactical
 */
export async function fetchTacticalAnalyses(): Promise<AiAnalysisDTO[]> {
  const response = await api.get<AiAnalysisDTO[]>('/ai-analyses/tactical');
  return response.data;
}

/**
 * Fetch alerts (AI analyses flagged as alerts).
 * GET /api/v1/ai-analyses?isAlert=true
 */
export async function fetchAlertAnalyses(): Promise<AiAnalysisDTO[]> {
  const response = await api.get<AiAnalysisDTO[]>('/ai-analyses', { params: { isAlert: true } });
  return response.data;
}

// =============================================================================
// SYSTEM LOGS API
// =============================================================================

export interface SystemLogDTO {
  id: number;
  assetId: string;
  eventType: string;
  message: string;
  createdAt: string;
}

/**
 * Fetch ALL system logs (most recent first).
 * GET /api/v1/system-logs
 */
export async function fetchAllSystemLogs(): Promise<SystemLogDTO[]> {
  const response = await api.get<SystemLogDTO[]>('/system-logs');
  return response.data;
}

/**
 * Fetch system logs for a specific asset.
 * GET /api/v1/system-logs/{assetId}
 */
export async function fetchSystemLogs(assetId: string): Promise<SystemLogDTO[]> {
  const response = await api.get<SystemLogDTO[]>(`/system-logs/${assetId}`);
  return response.data;
}

// =============================================================================
// AI CHAT API (RAG-augmented) — Legacy single-shot
// =============================================================================

export interface AiChatResponse {
  response: string;
  cited_rule?: string;
  rag_hits?: number;
  processing_time_ms?: number;
}

/**
 * Send a conversational chat query to the AI assistant (legacy stateless).
 * POST /api/v1/ai/chat
 * Timeout: 120s (Gemma-2 9B inference typically takes 40-80s with 384 max tokens)
 */
export async function sendAiChat(query: string): Promise<AiChatResponse> {
  const response = await api.post<AiChatResponse>('/ai/chat', { query }, { timeout: 120000 });
  return response.data;
}

// =============================================================================
// PERSISTENT CHAT SESSIONS API
// =============================================================================

export interface ChatSessionDTO {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDTO {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  citedRule: string;
  createdAt: string;
}

/** Create a new empty chat session. POST /api/v1/chats */
export async function createChatSession(): Promise<ChatSessionDTO> {
  const response = await api.post<ChatSessionDTO>('/chats');
  return response.data;
}

/** Fetch all chat sessions (most recent first). GET /api/v1/chats */
export async function fetchChatSessions(): Promise<ChatSessionDTO[]> {
  const response = await api.get<ChatSessionDTO[]>('/chats');
  return response.data;
}

/** Delete a chat session. DELETE /api/v1/chats/{id} */
export async function deleteChatSession(sessionId: number): Promise<void> {
  await api.delete(`/chats/${sessionId}`);
}

/** Fetch all messages for a session. GET /api/v1/chats/{id}/messages */
export async function fetchSessionMessages(sessionId: number): Promise<ChatMessageDTO[]> {
  const response = await api.get<ChatMessageDTO[]>(`/chats/${sessionId}/messages`);
  return response.data;
}

/**
 * Send a message in a session (user→AI round-trip, both saved to DB).
 * POST /api/v1/chats/{id}/messages
 * Timeout: 120s (RAG + LLM inference)
 */
export async function sendSessionMessage(sessionId: number, content: string): Promise<ChatMessageDTO> {
  const response = await api.post<ChatMessageDTO>(
    `/chats/${sessionId}/messages`,
    { content },
    { timeout: 120000 }
  );
  return response.data;
}

// =============================================================================
// TACTICAL ZONES API
// =============================================================================

import type { TacticalZone } from '@/types';

export async function fetchZones(): Promise<TacticalZone[]> {
  const response = await api.get<TacticalZone[]>('/zones');
  return response.data;
}

export async function createZone(zone: Omit<TacticalZone, 'id' | 'createdAt'>): Promise<TacticalZone> {
  const response = await api.post<TacticalZone>('/zones', zone);
  return response.data;
}

export async function deleteZone(zoneId: string): Promise<void> {
  await api.delete(`/zones/${zoneId}`);
}

// =============================================================================
// DEPLOYMENT API
// =============================================================================

export interface DeployTaskResponse {
  id: number;
  assetId: string;
  title: string;
  description: string;
  status: string;
  taskType: string;
  zoneId: string;
  zoneName: string;
  createdAt: string;
}

export async function deployAsset(assetId: string, zoneId: string): Promise<DeployTaskResponse> {
  const response = await api.post<DeployTaskResponse>('/tasks/deploy', { assetId, zoneId });
  return response.data;
}

// =============================================================================
// ASSET ACTIONS API
// =============================================================================

/**
 * Initiate emergency stop for an asset.
 * POST /api/v1/assets/{id}/emergency-stop
 */
export async function postEmergencyStop(assetId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(`/assets/${assetId}/emergency-stop`);
  return response.data;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default api;

