/**
 * Central Types for SINAPS C4ISR Frontend
 * Aligned with Backend DTO structures (TelemetryResponseDTO, etc.)
 */

// ============ ASSET TYPES ============

/** Backend AssetType enum mapping */
export type AssetType = "DRONE" | "SOLDIER" | "VEHICLE" | "SENSOR";

/** Frontend display asset type (for UI compatibility) */
export type DisplayAssetType = "UAV" | "SOLDIER" | "GROUND_VEHICLE" | "WEARABLE";

/** Convert backend type to frontend display type */
export function toDisplayAssetType(backendType: AssetType): DisplayAssetType {
  switch (backendType) {
    case "DRONE": return "UAV";
    case "SOLDIER": return "SOLDIER";
    case "VEHICLE": return "GROUND_VEHICLE";
    case "SENSOR": return "WEARABLE";
    default: return "UAV";
  }
}

/** Asset status */
export type AssetStatus = "ONLINE" | "WARNING" | "OFFLINE";

/** Alignment type for friend/foe identification */
export type Alignment = "FRIEND" | "FOE" | "UNKNOWN";

/** Severity levels */
export type Severity = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

// ============ TELEMETRY (from Backend) ============

/** Matches TelemetryResponseDTO from Spring Boot backend */
export interface TelemetryDTO {
  id: number;
  sourceId: string;
  sourceType: AssetType;
  timestamp: string; // ISO 8601 format
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  speed: number | null;
  batteryLevel: number | null;
  alignment: Alignment;
  threatLevel: number;
  payload: Record<string, unknown> | null;
}

// ============ OPERATOR / PERSONNEL ============

export interface Operator {
  name: string;
  rank: string;
  id: string;
}

// ============ ASSET DETAILS (Extended) ============

export interface BaseAssetDetails {
  batteryLevel?: number;
  signalQuality?: number;
  latency?: number;
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
  bodyPosture: "STANDING" | "PRONE" | "RUNNING";
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
  vehicleModel: "KIRPI" | "COBRA" | "AMBULANCE";
  operator?: Operator;
}

// ============ ASSET TASK ============

export interface AssetTask {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
}

// ============ ASSET SUMMARY (Frontend Model) ============

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

/** Map position asset for map rendering */
export interface MapAsset {
  id: string;
  type: DisplayAssetType;
  position: [number, number]; // [lat, lon]
  name?: string;
  alignment?: Alignment;
  threatLevel?: number;
}

// ============ ALERTS / ALARMS ============

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  timeAgo: string;
  relatedAssets: string[];
  timestamp?: string;
}

/** Backend Alarm DTO mapping */
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

// ============ AUTH ============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
}

// ============ AI ANALYSIS ============

export interface AIAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  telemetryData?: TelemetryDTO[];
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

// ============ CONNECTION STATUS ============

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  errorMessage?: string;
}
