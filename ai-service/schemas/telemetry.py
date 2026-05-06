"""
============================================================================
    C4ISR TACTICAL TELEMETRY SCHEMAS - POLYMORPHIC PYDANTIC MODELS
============================================================================
    Discriminated Union Architecture for Multi-Domain Telemetry:
    - DroneTelemetry: UAV operational data (battery, altitude, speed, mode)
    - SoldierTelemetry: Personnel vitals (heart rate, SpO2, stress indicators)
    - VehicleTelemetry: Ground asset data (fuel, speed, vehicle type)
    
    Uses Pydantic v2 Discriminated Unions with Literal type discriminators
    for automatic schema validation based on the `type` field.
============================================================================
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any, Union, Annotated, Literal
from datetime import datetime
from enum import Enum


# ============================================================================
#                           ENUMERATIONS
# ============================================================================

class ThreatLevel(str, Enum):
    """Standardized threat level classification"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    MINIMAL = "MINIMAL"
    UNKNOWN = "UNKNOWN"


class SoldierStatus(str, Enum):
    """Soldier operational status"""
    ACTIVE = "ACTIVE"
    RESTING = "RESTING"
    INJURED = "INJURED"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


class VehicleType(str, Enum):
    """Ground vehicle classification"""
    TANK = "TANK"
    APC = "APC"
    TRUCK = "TRUCK"
    HUMVEE = "HUMVEE"
    OTHER = "OTHER"


class DroneMode(str, Enum):
    """UAV flight mode"""
    AUTO = "AUTO"
    MANUAL = "MANUAL"
    RTH = "RTH"  # Return to Home
    LOITER = "LOITER"
    LANDING = "LANDING"


# ============================================================================
#                           NESTED DATA MODELS
# ============================================================================

class SoldierVitals(BaseModel):
    """Soldier physiological data from wearable sensors"""
    hr_bpm: int = Field(..., ge=30, le=250, description="Heart rate in beats per minute")
    spo2: float = Field(default=98.0, ge=0, le=100, description="Blood oxygen saturation percentage")
    resp_bpm: Optional[float] = Field(default=None, ge=5, le=60, description="Respiration rate BPM")
    skin_temp_c: Optional[float] = Field(default=None, ge=20, le=45, description="Skin temperature Celsius")
    stress_index: Optional[float] = Field(default=None, ge=0, le=1.0, description="Computed stress index 0-1")
    
    model_config = {
        "coerce_numbers_to_str": False,
        "strict": False,  # Allow coercion of float to int for hr_bpm
    }


# ============================================================================
#                           BASE TELEMETRY MODEL
# ============================================================================

class BaseTelemetry(BaseModel):
    """
    Base class for all telemetry types.
    Contains common geospatial and temporal fields.
    """
    source_id: str = Field(..., min_length=1, max_length=64, description="Unique identifier for the source entity")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="ISO 8601 timestamp of telemetry capture")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="WGS84 latitude in degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="WGS84 longitude in degrees")
    
    model_config = {
        "json_schema_extra": {
            "description": "Base telemetry model with common geospatial fields"
        }
    }


# ============================================================================
#                           DRONE TELEMETRY
# ============================================================================

class DroneTelemetry(BaseTelemetry):
    """
    UAV/Drone telemetry data.
    Discriminator: type = "drone"
    """
    type: Literal["drone"] = Field(default="drone", description="Telemetry type discriminator")
    
    # Drone-specific fields
    altitude: float = Field(..., ge=0, le=50000, description="Altitude above ground level in meters")
    speed: float = Field(default=0.0, ge=0, le=500, description="Ground speed in meters per second")
    battery_level: float = Field(..., ge=0, le=100, description="Battery state of charge percentage")
    mode: DroneMode = Field(default=DroneMode.AUTO, description="Current flight mode")
    heading_deg: Optional[float] = Field(default=None, ge=0, lt=360, description="Heading in degrees")
    vertical_speed: Optional[float] = Field(default=None, description="Vertical speed m/s (positive=climbing)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "drone",
                "source_id": "UAV-ALPHA-01",
                "timestamp": "2026-01-27T00:00:00Z",
                "latitude": 39.9208,
                "longitude": 32.8541,
                "altitude": 150.0,
                "speed": 12.5,
                "battery_level": 78.5,
                "mode": "AUTO"
            }
        }
    }


# ============================================================================
#                           SOLDIER TELEMETRY
# ============================================================================

class SoldierTelemetry(BaseTelemetry):
    """
    Soldier/Personnel telemetry from wearable devices.
    Discriminator: type = "soldier"
    """
    type: Literal["soldier"] = Field(default="soldier", description="Telemetry type discriminator")
    
    # Soldier-specific fields
    vitals: SoldierVitals = Field(..., description="Physiological data from wearable sensors")
    status: str = Field(default="ACTIVE", description="Operational status (ACTIVE, INJURED, ENGAGED, PANIC, etc.)")
    unit_id: Optional[str] = Field(default=None, description="Military unit identifier")
    callsign: Optional[str] = Field(default=None, description="Radio callsign")
    elevation: Optional[float] = Field(default=None, description="Elevation above sea level in meters")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "soldier",
                "source_id": "ALPHA-2-ACTUAL",
                "timestamp": "2026-01-27T00:00:00Z",
                "latitude": 39.9215,
                "longitude": 32.8550,
                "vitals": {
                    "hr_bpm": 85,
                    "spo2": 97.5
                },
                "status": "ACTIVE",
                "unit_id": "ALPHA-TEAM"
            }
        }
    }


# ============================================================================
#                           VEHICLE TELEMETRY
# ============================================================================

class VehicleTelemetry(BaseTelemetry):
    """
    Ground vehicle telemetry data.
    Discriminator: type = "vehicle"
    """
    type: Literal["vehicle"] = Field(default="vehicle", description="Telemetry type discriminator")
    
    # Vehicle-specific fields
    speed: float = Field(default=0.0, ge=0, le=200, description="Ground speed in km/h")
    fuel_pct: float = Field(..., ge=0, le=100, description="Fuel level percentage")
    vehicle_type: VehicleType = Field(default=VehicleType.APC, description="Vehicle classification")
    heading_deg: Optional[float] = Field(default=None, ge=0, lt=360, description="Heading in degrees")
    engine_status: Optional[str] = Field(default="RUNNING", description="Engine operational status")
    health_pct: Optional[float] = Field(default=100.0, ge=0, le=100, description="Vehicle health/damage status")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "vehicle",
                "source_id": "TANK-BRAVO-03",
                "timestamp": "2026-01-27T00:00:00Z",
                "latitude": 39.9300,
                "longitude": 32.8600,
                "speed": 35.0,
                "fuel_pct": 82.0,
                "vehicle_type": "TANK"
            }
        }
    }


# ============================================================================
#                           DISCRIMINATED UNION TYPE
# ============================================================================

# Polymorphic telemetry input using discriminated union
# FastAPI automatically validates the correct schema based on the "type" field
TelemetryInput = Annotated[
    Union[DroneTelemetry, SoldierTelemetry, VehicleTelemetry],
    Field(discriminator="type")
]


# ============================================================================
#                           CONTEXT ITEM (RAG)
# ============================================================================

class ContextItem(BaseModel):
    """Historical context item retrieved from RAG memory"""
    event_description: str = Field(..., description="Description of the historical event")
    outcome: str = Field(..., description="Outcome or resolution of the event")
    similarity_score: float = Field(ge=0, le=1, description="Semantic similarity score")
    timestamp: Optional[datetime] = Field(default=None, description="When the event occurred")


# ============================================================================
#                           AI ANALYSIS RESPONSE
# ============================================================================

class AIAnalysisResult(BaseModel):
    """
    Structured response from the AI tactical analysis.
    Matches the expected LLM JSON output format.
    """
    threat_level: ThreatLevel = Field(..., description="Assessed threat level")
    decision: str = Field(..., description="Recommended tactical action")
    reasoning: str = Field(..., description="Explanation of the analysis")


class AnalysisResponse(BaseModel):
    """Complete response from the /analyze endpoint"""
    # AI Analysis Results
    decision: str = Field(..., description="Recommended tactical decision")
    threat_level: ThreatLevel = Field(..., description="Assessed threat level")
    confidence: float = Field(ge=0, le=1, description="AI confidence in the analysis")
    reasoning: str = Field(..., description="Explanation for the decision")
    
    # Metadata
    entity_type: str = Field(..., description="Type of entity analyzed: drone/soldier/vehicle")
    entity_id: str = Field(..., description="Source ID of the analyzed entity")
    context_used: List[ContextItem] = Field(default_factory=list, description="RAG context used")
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds")
    model_version: str = Field(default="gemma-2-9b-it", description="LLM model version")

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "decision": "Continue monitoring. Asset operating within normal parameters.",
                "threat_level": "LOW",
                "confidence": 0.87,
                "reasoning": "Drone battery at 78%, stable flight pattern, no anomalies detected.",
                "entity_type": "drone",
                "entity_id": "UAV-ALPHA-01",
                "context_used": [],
                "processing_time_ms": 245.6,
                "model_version": "gemma-2-9b-it",
            }
        },
    )


# ============================================================================
#                           REQUEST MODEL
# ============================================================================

class AnalysisRequest(BaseModel):
    """
    Request body for the /analyze endpoint.
    Uses discriminated union for automatic schema validation.
    """
    telemetry: TelemetryInput = Field(..., description="Polymorphic telemetry data")
    include_context: bool = Field(default=True, description="Include RAG historical context")
    max_context_items: int = Field(default=3, ge=1, le=10, description="Maximum context items to retrieve")


# ============================================================================
#                           LEGACY COMPATIBILITY EXPORTS
# ============================================================================

# Re-export for backwards compatibility with existing code
class TelemetryType(str, Enum):
    """Legacy telemetry type enum"""
    DRONE = "drone"
    SOLDIER = "soldier"
    VEHICLE = "vehicle"
    WATCH = "watch"  # Alias for soldier
    UNKNOWN = "unknown"


# Flexible input for legacy endpoints (if needed)
class FlexibleTelemetryInput(BaseModel):
    """Legacy flexible input for backwards compatibility"""
    domain: Optional[str] = None
    type: Optional[str] = None
    id: Optional[str] = None
    time: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    
    model_config = {"extra": "allow"}
    
    def get_entity_type(self) -> TelemetryType:
        domain = (self.domain or "").lower()
        type_field = (self.type or "").lower()
        
        if domain == "drone" or type_field == "drone":
            return TelemetryType.DRONE
        elif domain == "watch" or type_field in ("soldier", "watch"):
            return TelemetryType.SOLDIER
        elif domain == "vehicle" or type_field == "vehicle":
            return TelemetryType.VEHICLE
        return TelemetryType.UNKNOWN
