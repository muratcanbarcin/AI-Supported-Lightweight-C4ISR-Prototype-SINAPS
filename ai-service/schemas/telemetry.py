"""
Telemetry and Analysis Schemas
============================================================================
Polymorphic models for multi-domain C4ISR telemetry:
  - Drone (UAV): Battery, Altitude, Speed, Mode
  - Soldier (Watch): Heart Rate, SpO2, Stress, Vitals
  - Vehicle: Fuel, Speed, Engine Status, Vehicle Type
============================================================================
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union, Annotated
from datetime import datetime
from enum import Enum


class ThreatLevel(str, Enum):
    """Threat level classification"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    MINIMAL = "MINIMAL"
    UNKNOWN = "UNKNOWN"


class Alignment(str, Enum):
    """Friend/Foe alignment"""
    FRIEND = "FRIEND"
    FOE = "FOE"
    NEUTRAL = "NEUTRAL"
    UNKNOWN = "UNKNOWN"


class TelemetryType(str, Enum):
    """Types of telemetry sources"""
    DRONE = "drone"
    SOLDIER = "soldier"
    VEHICLE = "vehicle"
    WATCH = "watch"  # Alias for soldier
    UNKNOWN = "unknown"


# ============================================================================
#                           NESTED DATA MODELS
# ============================================================================

class Position(BaseModel):
    """GPS Position data"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    alt_m: Optional[float] = Field(None, description="Altitude in meters")


class Vitals(BaseModel):
    """Soldier vital signs data"""
    hr_bpm: int = Field(..., ge=30, le=250, description="Heart rate BPM")
    spo2_pct: float = Field(98.0, ge=0, le=100, description="Blood oxygen %")
    resp_bpm: Optional[float] = Field(None, description="Respiration rate")
    skin_temp_c: Optional[float] = Field(None, description="Skin temperature")
    stress_score: Optional[float] = Field(None, ge=0, le=1, description="Stress level 0-1")


class Battery(BaseModel):
    """Battery/Power status"""
    soc_pct: float = Field(..., ge=0, le=100, description="State of charge %")


class Device(BaseModel):
    """Wearable device info"""
    device_id: str
    model: Optional[str] = None
    battery_pct: Optional[float] = None


# ============================================================================
#                           BASE TELEMETRY MODEL
# ============================================================================

class BaseTelemetry(BaseModel):
    """Base class for all telemetry types with common fields"""
    domain: str = Field(..., description="Telemetry domain (drone/watch/vehicle)")
    type: str = Field("telemetry", description="Message type")
    id: str = Field(..., description="Source entity ID")
    time: Optional[str] = Field(None, description="ISO timestamp")
    
    class Config:
        extra = "allow"  # Allow extra fields for flexibility


# ============================================================================
#                           DRONE TELEMETRY
# ============================================================================

class DronePayload(BaseModel):
    """Drone-specific telemetry payload"""
    position: Position
    yaw_deg: Optional[float] = Field(None, ge=0, lt=360)
    ground_speed_mps: Optional[float] = Field(None, ge=0)
    mode: Optional[str] = Field("AUTO", description="Flight mode: AUTO/MANUAL/RTH")
    battery: Optional[Battery] = None
    alignment: Optional[str] = Field("UNKNOWN")
    threat_level: Optional[int] = Field(0, ge=0, le=100)


class DroneTelemetry(BaseTelemetry):
    """Full drone telemetry message from simulator"""
    domain: str = "drone"
    payload: DronePayload


# ============================================================================
#                           SOLDIER/WATCH TELEMETRY
# ============================================================================

class SoldierPayload(BaseModel):
    """Soldier wearable telemetry payload"""
    soldier_id: str
    unit_id: Optional[str] = None
    collected_at: Optional[str] = None
    position: Position
    vitals: Vitals
    device: Optional[Device] = None
    alignment: Optional[str] = Field("FRIEND")
    threat_level: Optional[int] = Field(0)


class SoldierTelemetry(BaseTelemetry):
    """Full soldier/watch telemetry message"""
    domain: str = "watch"
    payload: SoldierPayload


# ============================================================================
#                           VEHICLE TELEMETRY
# ============================================================================

class VehiclePayload(BaseModel):
    """Ground vehicle telemetry payload"""
    id: str
    time: Optional[str] = None
    type: Optional[str] = Field("APC", description="Vehicle type: APC/Tank/Truck etc")
    position: Position
    heading_deg: Optional[float] = Field(None, ge=0, lt=360)
    speed_kph: Optional[float] = Field(None, ge=0)
    engine: Optional[str] = Field("RUN", description="Engine status: RUN/IDLE/OFF")
    fuel_pct: Optional[float] = Field(None, ge=0, le=100)
    health_pct: Optional[float] = Field(None, ge=0, le=100)
    alignment: Optional[str] = Field("UNKNOWN")
    threat_level: Optional[int] = Field(0, ge=0, le=100)


class VehicleTelemetry(BaseTelemetry):
    """Full vehicle telemetry message"""
    domain: str = "vehicle"
    payload: VehiclePayload


# ============================================================================
#                           UNIFIED TELEMETRY (DISCRIMINATED UNION)
# ============================================================================

# Use domain as discriminator for polymorphic parsing
UnifiedTelemetry = Annotated[
    Union[DroneTelemetry, SoldierTelemetry, VehicleTelemetry],
    Field(discriminator="domain")
]


# ============================================================================
#                           SIMPLIFIED INPUT MODELS
# ============================================================================

class SimpleDroneInput(BaseModel):
    """Simplified drone input for direct API calls"""
    source_id: str = Field(..., alias="id")
    latitude: float
    longitude: float
    altitude: Optional[float] = Field(None, alias="alt_m")
    speed: Optional[float] = Field(None, alias="ground_speed_mps")
    battery_level: Optional[float] = Field(None, alias="battery_pct")
    mode: Optional[str] = "AUTO"
    type: str = "drone"
    alignment: Optional[str] = "UNKNOWN"
    threat_level: Optional[int] = 0
    
    class Config:
        populate_by_name = True


class SimpleSoldierInput(BaseModel):
    """Simplified soldier input for direct API calls"""
    source_id: str = Field(..., alias="soldier_id")
    latitude: float
    longitude: float
    vitals: Vitals
    status: Optional[str] = Field("FRIEND", alias="alignment")
    type: str = "soldier"
    unit_id: Optional[str] = None
    threat_level: Optional[int] = 0
    
    class Config:
        populate_by_name = True


class SimpleVehicleInput(BaseModel):
    """Simplified vehicle input for direct API calls"""
    source_id: str = Field(..., alias="id")
    latitude: float
    longitude: float
    speed: Optional[float] = Field(None, alias="speed_kph")
    fuel_pct: Optional[float] = None
    vehicle_type: Optional[str] = Field("APC", alias="type")
    engine: Optional[str] = "RUN"
    health_pct: Optional[float] = 100.0
    type: str = "vehicle"
    alignment: Optional[str] = "UNKNOWN"
    threat_level: Optional[int] = 0
    
    class Config:
        populate_by_name = True


# Simple input union - discriminated by 'type' field
SimpleInput = Annotated[
    Union[SimpleDroneInput, SimpleSoldierInput, SimpleVehicleInput],
    Field(discriminator="type")
]


# ============================================================================
#                           GENERIC FLEXIBLE INPUT
# ============================================================================

class FlexibleTelemetryInput(BaseModel):
    """
    Flexible telemetry input that accepts any structure.
    Used for backwards compatibility and raw MQTT payloads.
    """
    domain: Optional[str] = Field(None, description="Domain: drone/watch/vehicle")
    type: Optional[str] = Field(None, description="Entity type for discrimination")
    id: Optional[str] = Field(None, description="Entity ID")
    time: Optional[str] = None
    payload: Optional[Dict[str, Any]] = Field(None, description="Raw payload data")
    
    # Allow any additional fields
    class Config:
        extra = "allow"
    
    def get_entity_type(self) -> TelemetryType:
        """Determine entity type from available fields"""
        domain = (self.domain or "").lower()
        type_field = (self.type or "").lower()
        
        if domain == "drone" or type_field == "drone":
            return TelemetryType.DRONE
        elif domain == "watch" or type_field in ("soldier", "watch"):
            return TelemetryType.SOLDIER
        elif domain == "vehicle" or type_field == "vehicle":
            return TelemetryType.VEHICLE
        return TelemetryType.UNKNOWN


# ============================================================================
#                           REQUEST/RESPONSE MODELS
# ============================================================================

class AnalysisRequest(BaseModel):
    """
    Request body for the /analyze endpoint.
    Accepts flexible telemetry from any source type.
    """
    telemetry: FlexibleTelemetryInput = Field(..., description="Telemetry data object")
    include_context: bool = Field(default=True, description="Include RAG context")
    max_context_items: int = Field(default=3, ge=1, le=10)
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "Drone Example",
                    "value": {
                        "telemetry": {
                            "domain": "drone",
                            "type": "telemetry",
                            "id": "drone1",
                            "payload": {
                                "position": {"lat": 39.92, "lon": 32.84, "alt_m": 300},
                                "ground_speed_mps": 14.0,
                                "battery": {"soc_pct": 80.0},
                                "mode": "AUTO"
                            }
                        },
                        "include_context": True
                    }
                },
                {
                    "name": "Soldier Example",
                    "value": {
                        "telemetry": {
                            "domain": "watch",
                            "type": "telemetry",
                            "id": "soldier1",
                            "payload": {
                                "soldier_id": "soldier1",
                                "position": {"lat": 39.92, "lon": 32.84, "alt_m": 900},
                                "vitals": {"hr_bpm": 75, "spo2_pct": 98}
                            }
                        },
                        "include_context": True
                    }
                },
                {
                    "name": "Vehicle Example",
                    "value": {
                        "telemetry": {
                            "domain": "vehicle",
                            "type": "telemetry",
                            "id": "vehicle1",
                            "payload": {
                                "id": "vehicle1",
                                "type": "APC",
                                "position": {"lat": 39.93, "lon": 32.85, "alt_m": 900},
                                "speed_kph": 40.0,
                                "fuel_pct": 95.0,
                                "engine": "RUN"
                            }
                        },
                        "include_context": True
                    }
                }
            ]
        }


class ContextItem(BaseModel):
    """A single historical context item from RAG retrieval"""
    event_description: str
    outcome: str
    similarity_score: float = Field(ge=0, le=1)
    timestamp: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    """Response from the AI analysis"""
    decision: str = Field(..., description="Recommended tactical decision")
    threat_level: ThreatLevel
    confidence: float = Field(ge=0, le=1, description="AI confidence in the decision")
    reasoning: str = Field(..., description="Explanation for the decision")
    entity_type: str = Field("unknown", description="Type of entity analyzed: drone/soldier/vehicle")
    entity_id: str = Field("", description="ID of the analyzed entity")
    context_used: List[ContextItem] = Field(default_factory=list)
    processing_time_ms: float = Field(..., description="Processing time in ms")
    model_version: str = Field(default="gemma-2-9b-it")
    
    class Config:
        json_schema_extra = {
            "example": {
                "decision": "Continue monitoring, no immediate action required",
                "threat_level": "LOW",
                "confidence": 0.85,
                "reasoning": "Drone battery at 80%, altitude stable, friendly alignment",
                "entity_type": "drone",
                "entity_id": "drone1",
                "context_used": [],
                "processing_time_ms": 156.3,
                "model_version": "gemma-2-9b-it"
            }
        }


# ============================================================================
#                      LEGACY COMPATIBILITY MODELS
# ============================================================================

class PlatformType(str, Enum):
    """Legacy platform types for backwards compatibility"""
    UAV = "UAV"
    AIRCRAFT = "AIRCRAFT"
    SHIP = "SHIP"
    SUBMARINE = "SUBMARINE"
    GROUND_VEHICLE = "GROUND_VEHICLE"
    RADAR_STATION = "RADAR_STATION"
    COMMUNICATION_NODE = "COMMUNICATION_NODE"
    SOLDIER = "SOLDIER"
    UNKNOWN = "UNKNOWN"


class LegacyTelemetryData(BaseModel):
    """
    Legacy telemetry format for backwards compatibility.
    Use FlexibleTelemetryInput for new implementations.
    """
    platform_id: str = Field(..., description="Unique identifier for the platform")
    platform_type: PlatformType = Field(default=PlatformType.UNKNOWN)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Position data
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    altitude_m: Optional[float] = Field(None, description="Altitude in meters")
    heading_deg: Optional[float] = Field(None, ge=0, lt=360)
    speed_knots: Optional[float] = Field(None, ge=0)
    
    # Detection data
    contact_bearing: Optional[float] = Field(None, ge=0, lt=360)
    contact_range_nm: Optional[float] = Field(None, ge=0)
    contact_altitude_m: Optional[float] = None
    contact_speed_knots: Optional[float] = None
    
    # IFF and Classification
    iff_response: Optional[str] = Field(None, description="IFF transponder response")
    classification: Optional[str] = Field(None, description="Friend/Foe classification")
    
    # Signal/Sensor data
    signal_strength_db: Optional[float] = None
    radar_cross_section: Optional[float] = None
    
    # Raw sensor data
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Additional raw sensor data")
