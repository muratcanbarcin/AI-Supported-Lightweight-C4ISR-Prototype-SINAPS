import api, { isConnectionError } from './api';
import type { AlertItem, AlarmDTO, Severity } from '@/types';

/**
 * Alarm Service
 * 
 * Fetches active alarms/alerts from the Spring Boot backend.
 * Maps AlarmDTO to frontend AlertItem format.
 */

const ALARMS_ENDPOINT = '/alarms';

/**
 * Fetch active alarms from backend
 * Endpoint: GET /api/v1/alarms/active
 */
export async function getActiveAlarms(): Promise<AlarmDTO[]> {
  try {
    const response = await api.get<AlarmDTO[]>(`${ALARMS_ENDPOINT}/active`);
    return response.data;
  } catch (error) {
    if (isConnectionError(error)) {
      console.error('[AlarmService] Backend connection lost');
      throw new Error('CONNECTION_LOST');
    }
    
    // If endpoint not implemented, return empty (no fake data)
    console.warn('[AlarmService] Alarm endpoint not available, returning empty');
    return [];
  }
}

/**
 * Acknowledge an alarm
 * Endpoint: POST /api/v1/alarms/{id}/acknowledge
 */
export async function acknowledgeAlarm(alarmId: string): Promise<void> {
  await api.post(`${ALARMS_ENDPOINT}/${alarmId}/acknowledge`);
}

/**
 * Get alarm statistics
 * Endpoint: GET /api/v1/alarms/stats
 */
export async function getAlarmStats(): Promise<{ critical: number; warning: number; info: number }> {
  try {
    const response = await api.get<{ critical: number; warning: number; info: number }>(`${ALARMS_ENDPOINT}/stats`);
    return response.data;
  } catch {
    return { critical: 0, warning: 0, info: 0 };
  }
}

/**
 * Transform backend AlarmDTO to frontend AlertItem
 */
export function alarmToAlertItem(alarm: AlarmDTO): AlertItem {
  return {
    id: alarm.id,
    severity: mapSeverity(alarm.severity),
    title: formatAlarmTitle(alarm.threatType),
    description: formatAlarmDescription(alarm),
    timeAgo: formatTimeAgo(alarm.detectedAt),
    relatedAssets: alarm.sourceId ? [alarm.sourceId] : [],
    timestamp: alarm.detectedAt
  };
}

/**
 * Fetch and transform to frontend-ready AlertItem list
 */
export async function getAlerts(): Promise<AlertItem[]> {
  const alarms = await getActiveAlarms();
  return alarms.map(alarmToAlertItem);
}

// ============ HELPER FUNCTIONS ============

function mapSeverity(severity: Severity | string): Severity {
  const upper = severity.toUpperCase();
  if (upper === 'HIGH' || upper === 'CRITICAL') return 'HIGH';
  if (upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function formatAlarmTitle(threatType: string): string {
  // Map threat types to Turkish alert titles
  const titleMap: Record<string, string> = {
    'INTRUSION': 'SINIR İHLALİ TESPİTİ',
    'SIGNAL_LOSS': 'DÜŞÜK SİNYAL KALİTESİ',
    'HEALTH_ALERT': 'SAĞLIK DURUMU UYARISI',
    'MISSION_COMPLETE': 'GÖREV TAMAMLANDI',
    'UNAUTHORIZED_ACCESS': 'YETKİSİZ ERİŞİM TESPİTİ',
    'EQUIPMENT_FAILURE': 'EKİPMAN ARIZASI',
    'LOW_BATTERY': 'DÜŞÜK BATARYA',
    'HOSTILE_DETECTED': 'DÜŞMAN TESPİT EDİLDİ'
  };
  
  return titleMap[threatType] || threatType.replace(/_/g, ' ');
}

function formatAlarmDescription(alarm: AlarmDTO): string {
  const source = alarm.sourceId ? `${alarm.sourceId} birimi` : 'Bilinmeyen kaynak';
  
  switch (alarm.threatType) {
    case 'INTRUSION':
      return `${alarm.location ? 'Koordinat: ' + alarm.location.latitude.toFixed(3) + ', ' + alarm.location.longitude.toFixed(3) + ' - ' : ''}Tanımlanamayan aktivite tespit edildi.`;
    case 'SIGNAL_LOSS':
      return `${source} ile iletişimde paket kaybı yaşanıyor.`;
    case 'HEALTH_ALERT':
      return `${source} sağlık parametrelerinde anormallik tespit edildi.`;
    case 'LOW_BATTERY':
      return `${source} batarya seviyesi kritik düzeyde.`;
    default:
      return `${source} için ${alarm.threatType} durumu oluştu.`;
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'ŞİMDİ';
  if (diffMins === 1) return '1 DK ÖNCE';
  if (diffMins < 60) return `${diffMins} DK ÖNCE`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 SAAT ÖNCE';
  if (diffHours < 24) return `${diffHours} SAAT ÖNCE`;
  
  return 'ESKİ';
}



export default {
  getActiveAlarms,
  acknowledgeAlarm,
  getAlarmStats,
  getAlerts,
  alarmToAlertItem
};
