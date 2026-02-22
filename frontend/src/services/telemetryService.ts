import api, { isConnectionError } from './api';
import type {
  TelemetryDTO,
  AssetSummary,
  MapAsset,
  DisplayAssetType,
  MiddlewareClassification,
  UAVDetails,
  SoldierDetails,
  VehicleDetails,
  toDisplayAssetType
} from '@/types';

/**
 * Telemetry Service
 * 
 * Fetches real-time telemetry data from the Spring Boot backend.
 * Maps TelemetryResponseDTO to frontend-compatible AssetSummary format.
 */

const TELEMETRY_ENDPOINT = '/telemetry';

// Type imports for conversion
import { toDisplayAssetType as convertType } from '@/types';

/**
 * Fetch latest telemetry data from all sources
 * Endpoint: GET /api/v1/telemetry/latest
 */
export async function getLatestTelemetry(): Promise<TelemetryDTO[]> {
  try {
    const response = await api.get<TelemetryDTO[]>(`${TELEMETRY_ENDPOINT}/latest`);
    return response.data;
  } catch (error) {
    if (isConnectionError(error)) {
      console.error('[TelemetryService] Backend connection lost');
      throw new Error('CONNECTION_LOST');
    }
    throw error;
  }
}

/**
 * Fetch telemetry history (for AI training, analytics, etc.)
 * Endpoint: GET /api/v1/telemetry/history
 */
export async function getTelemetryHistory(): Promise<TelemetryDTO[]> {
  const response = await api.get<TelemetryDTO[]>(`${TELEMETRY_ENDPOINT}/history`);
  return response.data;
}

/**
 * Transform backend TelemetryDTO to frontend AssetSummary
 * This bridges the gap between backend model and UI components
 */
export function telemetryToAssetSummary(telemetry: TelemetryDTO): AssetSummary {
  const displayType = convertType(telemetry.sourceType);
  
  // Determine status based on various factors
  let status: 'ONLINE' | 'WARNING' | 'OFFLINE' = 'ONLINE';
  
  // Low battery = WARNING
  if (telemetry.batteryLevel !== null && telemetry.batteryLevel < 20) {
    status = 'WARNING';
  }
  
  // High threat level = WARNING
  if (telemetry.threatLevel > 30) {
    status = 'WARNING';
  }
  
  // Format coordinates for display
  const coordString = telemetry.latitude && telemetry.longitude
    ? `${telemetry.latitude.toFixed(3)} N ${telemetry.longitude.toFixed(3)} E`
    : undefined;
  
  // Format timestamp as "X dk önce" or "Şimdi"
  const lastSeen = formatLastSeen(telemetry.timestamp);
  
  // Build details object based on asset type
  const details = buildAssetDetails(telemetry, displayType);
  
  return {
    id: telemetry.sourceId,
    name: formatAssetName(telemetry.sourceId, displayType),
    type: displayType,
    status,
    lastSeen,
    coordinates: coordString,
    latitude: telemetry.latitude ?? undefined,
    longitude: telemetry.longitude ?? undefined,
    details,
    alignment: telemetry.alignment,
    threatLevel: telemetry.threatLevel
  };
}

/**
 * Transform TelemetryDTO array to MapAsset array for map rendering
 */
export function telemetryToMapAssets(telemetryList: TelemetryDTO[]): MapAsset[] {
  return telemetryList
    .filter(t => t.latitude !== null && t.longitude !== null)
    .map(t => {
      // Extract middleware classification from payload if present
      const mw = t.payload?._middleware as { classification?: string } | undefined;
      const classification = (mw?.classification as MiddlewareClassification) || 'NORMAL';

      return {
        id: t.sourceId,
        type: convertType(t.sourceType),
        position: [t.latitude!, t.longitude!] as [number, number],
        name: formatAssetName(t.sourceId, convertType(t.sourceType)),
        alignment: t.alignment,
        threatLevel: t.threatLevel,
        classification,
      };
    });
}

/**
 * Fetch and transform to frontend-ready AssetSummary list
 */
export async function getAssetSummaries(): Promise<AssetSummary[]> {
  const telemetryData = await getLatestTelemetry();
  return telemetryData.map(telemetryToAssetSummary);
}

/**
 * Fetch and transform to MapAsset list for map rendering
 */
export async function getMapAssets(): Promise<MapAsset[]> {
  const telemetryData = await getLatestTelemetry();
  return telemetryToMapAssets(telemetryData);
}

// ============ HELPER FUNCTIONS ============

function formatLastSeen(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Şimdi';
  if (diffMins === 1) return '1 dk önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 saat önce';
  if (diffHours < 24) return `${diffHours} saat önce`;
  
  return 'Eski veri';
}

function formatAssetName(sourceId: string, _type: DisplayAssetType): string {
  // Return the real DB source_id as the display name.
  // DB has proper names like TB2-ALFA-01, SAT-TIM-01, ALTAY-01, etc.
  return sourceId;
}

function buildAssetDetails(
  telemetry: TelemetryDTO, 
  type: DisplayAssetType
): UAVDetails | SoldierDetails | VehicleDetails {
  const payload = telemetry.payload || {};
  
  const baseDetails = {
    batteryLevel: telemetry.batteryLevel ?? 85,
    signalQuality: extractNumber(payload, 'signal_quality', 95),
    latency: extractNumber(payload, 'latency', 20)
  };
  
  switch (type) {
    case 'UAV':
      return {
        ...baseDetails,
        altitude: telemetry.altitude ?? 0,
        speed: telemetry.speed ?? 0,
        heading: extractNumber(payload, 'heading', 0),
        verticalSpeed: extractNumber(payload, 'vertical_speed', 0),
        pitch: extractNumber(payload, 'pitch', 0),
        roll: extractNumber(payload, 'roll', 0),
        voltage: extractNumber(payload, 'voltage', 24.0),
        mode: extractString(payload, 'mode', 'AUTO')
      } as UAVDetails;
      
    case 'SOLDIER':
      return {
        ...baseDetails,
        heartRate: extractNumber(payload, 'heart_rate', 72),
        spo2: extractNumber(payload, 'spo2', 98),
        status: extractString(payload, 'status', 'Hareketli'),
        steps: extractNumber(payload, 'steps', 0),
        respirationRate: extractNumber(payload, 'respiration_rate', 14),
        skinTemp: extractNumber(payload, 'skin_temp', 36.5),
        stressScore: extractNumber(payload, 'stress_score', 0.2),
        bodyPosture: extractString(payload, 'body_posture', 'STANDING') as 'STANDING' | 'PRONE' | 'RUNNING',
        realName: extractString(payload, 'real_name', undefined),
        rank: extractString(payload, 'rank', undefined)
      } as SoldierDetails;
      
    case 'GROUND_VEHICLE':
      return {
        ...baseDetails,
        fuelLevel: extractNumber(payload, 'fuel_level', 80),
        engineTemp: extractNumber(payload, 'engine_temp', 90),
        speed: telemetry.speed ?? 0,
        odometer: extractNumber(payload, 'odometer', 0),
        health: extractNumber(payload, 'health', 95),
        oilPressure: extractNumber(payload, 'oil_pressure', 45),
        transmissionTemp: extractNumber(payload, 'transmission_temp', 85),
        vehicleModel: extractString(payload, 'vehicle_model', 'KIRPI') as 'KIRPI' | 'COBRA' | 'AMBULANCE'
      } as VehicleDetails;
      
    default:
      return baseDetails as any;
  }
}

function extractNumber(payload: Record<string, unknown>, key: string, defaultValue: number): number {
  const value = payload[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

function extractString(payload: Record<string, unknown>, key: string, defaultValue?: string): string | undefined {
  const value = payload[key];
  if (typeof value === 'string') return value;
  return defaultValue;
}

export default {
  getLatestTelemetry,
  getTelemetryHistory,
  getAssetSummaries,
  getMapAssets,
  telemetryToAssetSummary,
  telemetryToMapAssets
};
