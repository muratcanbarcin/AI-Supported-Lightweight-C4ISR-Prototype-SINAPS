/**
 * =============================================================================
 * SINAPS C4ISR Frontend Types
 * =============================================================================
 * 
 * Strictly aligned with:
 * - Backend DTOs (TelemetryResponseDTO.java)
 * - Backend Entities (Telemetry.java, AssetType.java)
 * - PostgreSQL Schema
 * 
 * Last sync: 2026-02-03
 */

// =============================================================================
// ENUMS - Match Backend AssetType.java
// =============================================================================

/** Backend AssetType enum - MUST match com.sinaps.c4isr_backend.model.AssetType */
export type AssetType = 'DRONE' | 'SOLDIER' | 'VEHICLE' | 'SENSOR';

/** Asset operational status */
export type AssetStatus = 'ONLINE' | 'WARNING' | 'OFFLINE';

/** Friend/Foe identification */
export type Alignment = 'FRIEND' | 'FOE' | 'UNKNOWN';

/** Alert severity levels */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Threat level classification */
export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL' | 'UNKNOWN';

// =============================================================================
// CORE ENTITIES - Match Backend DTOs
// =============================================================================

/**
 * Asset Entity
 * Represents a trackable field asset (drone, soldier, vehicle, sensor)
 */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastUpdate: string; // ISO 8601 timestamp
  alignment?: Alignment;
  batteryLevel?: number | null;
}

/**
 * Telemetry Entity
 * Matches TelemetryResponseDTO from Spring Boot backend
 * 
 * @see backend/src/main/java/com/sinaps/c4isr_backend/dto/TelemetryResponseDTO.java
 */
export interface Telemetry {
  id: number;
  sourceId: string;
  sourceType: AssetType;
  timestamp: string; // ISO 8601 format (LocalDateTime from backend)
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  speed: number | null;
  batteryLevel: number | null;
  alignment: Alignment;
  threatLevel: number;
  payload: Record<string, unknown> | null;
}

// Legacy alias for backward compatibility
export type TelemetryDTO = Telemetry;

// =============================================================================
// DISPLAY TYPES - Frontend UI Mapping
// =============================================================================

/** Frontend display asset type (for UI icons/labels) */
export type DisplayAssetType = 'UAV' | 'SOLDIER' | 'GROUND_VEHICLE' | 'WEARABLE';

/** Convert backend AssetType to frontend display type */
export function toDisplayAssetType(backendType: AssetType): DisplayAssetType {
  switch (backendType) {
    case 'DRONE': return 'UAV';
    case 'SOLDIER': return 'SOLDIER';
    case 'VEHICLE': return 'GROUND_VEHICLE';
    case 'SENSOR': return 'WEARABLE';
    default: return 'UAV';
  }
}

/** Convert Telemetry to Asset (for asset list views) */
export function telemetryToAsset(telemetry: Telemetry): Asset {
  return {
    id: telemetry.sourceId,
    name: telemetry.sourceId,
    type: telemetry.sourceType,
    status: telemetry.batteryLevel && telemetry.batteryLevel < 20 ? 'WARNING' : 'ONLINE',
    lastLatitude: telemetry.latitude,
    lastLongitude: telemetry.longitude,
    lastUpdate: telemetry.timestamp,
    alignment: telemetry.alignment,
    batteryLevel: telemetry.batteryLevel,
  };
}

// =============================================================================
// EXTENDED ASSET DETAILS - For Profile Pages
// =============================================================================

export interface BaseAssetDetails {
  batteryLevel?: number;
  signalQuality?: number;
  latency?: number;
}

export interface Operator {
  name: string;
  rank: string;
  id: string;
}

export interface UAVDetails extends BaseAssetDetails {
  altitude: number;
  speed: number;
  heading: number;
  verticalSpeed: number;
  pitch: number;
  roll: number;
  voltage: number;
  mode: string;
  operator?: Operator;
}

export interface SoldierDetails extends BaseAssetDetails {
  heartRate: number;
  spo2: number;
  status: string;
  steps: number;
  respirationRate: number;
  skinTemp: number;
  stressScore: number;
  bodyPosture: 'STANDING' | 'PRONE' | 'RUNNING';
  realName?: string;
  rank?: string;
}

export interface VehicleDetails extends BaseAssetDetails {
  fuelLevel: number;
  engineTemp: number;
  speed: number;
  odometer: number;
  health: number;
  oilPressure: number;
  transmissionTemp: number;
  vehicleModel: 'KIRPI' | 'COBRA' | 'AMBULANCE';
  operator?: Operator;
}

// =============================================================================
// ASSET SUMMARY - Combined View Model
// =============================================================================

export interface AssetSummary {
  id: string;
  name: string;
  type: DisplayAssetType;
  status: AssetStatus;
  lastSeen: string;
  coordinates?: string;
  latitude?: number;
  longitude?: number;
  details: UAVDetails | SoldierDetails | VehicleDetails;
  tasks?: AssetTask[];
  alignment?: Alignment;
  threatLevel?: number;
}

export interface AssetTask {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
}

/** Middleware anomaly classification */
export type MiddlewareClassification = 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';

/** Map position asset for map rendering */
export interface MapAsset {
  id: string;
  type: DisplayAssetType;
  position: [number, number]; // [lat, lon]
  name?: string;
  alignment?: Alignment;
  threatLevel?: number;
  classification?: MiddlewareClassification;
}

// =============================================================================
// ALERTS & ALARMS
// =============================================================================

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  timeAgo: string;
  relatedAssets: string[];
  timestamp?: string;
}

export interface AlarmDTO {
  id: string;
  threatType: string;
  sourceId: string;
  severity: Severity;
  detectedAt: string;
  isAck: boolean;
  snapshotUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// =============================================================================
// AUTH
// =============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roles?: string[];
  fullName?: string;
  rank?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
}

// =============================================================================
// AI ANALYSIS
// =============================================================================

export interface AIAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  telemetryData?: Telemetry[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIDetectionResult {
  objectClass: string;
  confidence: number;
  bbox: BoundingBox;
  status: string;
}

// =============================================================================
// CONNECTION STATUS
// =============================================================================

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  errorMessage?: string;
}

// =============================================================================
// API RESPONSE WRAPPERS
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
