"""
Telemetry and Analysis Schemas
Defines the data structures for incoming telemetry and AI analysis responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
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


class PlatformType(str, Enum):
    """Types of platforms that can generate telemetry"""
    UAV = "UAV"
    AIRCRAFT = "AIRCRAFT"
    SHIP = "SHIP"
    SUBMARINE = "SUBMARINE"
    GROUND_VEHICLE = "GROUND_VEHICLE"
    RADAR_STATION = "RADAR_STATION"
    COMMUNICATION_NODE = "COMMUNICATION_NODE"
    UNKNOWN = "UNKNOWN"


class TelemetryData(BaseModel):
    """
    Telemetry data from various C4ISR sensors and platforms
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
    
    class Config:
        json_schema_extra = {
            "example": {
                "platform_id": "RADAR-ALPHA-01",
                "platform_type": "RADAR_STATION",
                "latitude": 39.9334,
                "longitude": 32.8597,
                "contact_bearing": 45.0,
                "contact_range_nm": 50.0,
                "contact_altitude_m": 5000,
                "contact_speed_knots": 450,
                "iff_response": None,
                "classification": "UNKNOWN"
            }
        }


class AnalysisRequest(BaseModel):
    """Request body for the /analyze endpoint"""
    telemetry: TelemetryData
    include_context: bool = Field(default=True, description="Include RAG context in response")
    max_context_items: int = Field(default=3, ge=1, le=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "telemetry": {
                    "platform_id": "COASTAL-RADAR-01",
                    "platform_type": "RADAR_STATION",
                    "contact_bearing": 270,
                    "contact_range_nm": 25,
                    "contact_speed_knots": 15,
                    "classification": "UNKNOWN"
                },
                "include_context": True,
                "max_context_items": 3
            }
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
    context_used: List[ContextItem] = Field(default_factory=list)
    processing_time_ms: float = Field(..., description="Time taken to process request")
    model_version: str = Field(default="gemma-2-2b-it")
    
    class Config:
        json_schema_extra = {
            "example": {
                "decision": "Deploy patrol boat for visual identification, maintain safe distance, prepare for potential escalation",
                "threat_level": "MEDIUM",
                "confidence": 0.82,
                "reasoning": "Historical context shows similar unidentified maritime contacts...",
                "context_used": [
                    {
                        "event_description": "Maritime vessel approaching restricted zone...",
                        "outcome": "Deploy patrol boat for visual identification...",
                        "similarity_score": 0.87
                    }
                ],
                "processing_time_ms": 234.5,
                "model_version": "gemma-2-2b-it"
            }
        }
