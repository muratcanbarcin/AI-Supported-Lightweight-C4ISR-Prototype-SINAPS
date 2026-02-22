/**
 * Services Index - SINAPS C4ISR Frontend
 * 
 * Centralized exports for all API services
 */

export { default as api, checkBackendHealth, isConnectionError, AUTH_TOKEN_KEY, AUTH_USER_KEY } from './api';
export { fetchTasks, createTask, fetchTacticalAnalyses, fetchAlertAnalyses, fetchSystemLogs, sendAiChat, postEmergencyStop } from './api';
export type { TaskDTO, AiAnalysisDTO, SystemLogDTO, AiChatResponse } from './api';
export { default as authService } from './authService';
export { default as telemetryService } from './telemetryService';
export { default as alarmService } from './alarmService';

// Re-export mock data for fallback purposes
export { mockAssets, mockAlerts } from './mockData';
export type { 
  AssetType as MockAssetType, 
  AssetSummary as MockAssetSummary, 
  AlertItem as MockAlertItem 
} from './mockData';
