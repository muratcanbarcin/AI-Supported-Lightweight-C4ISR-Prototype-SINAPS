"""Pydantic schemas for API request/response validation"""

from .telemetry import (
    # Core models
    AnalysisRequest, 
    AnalysisResponse,
    ContextItem,
    ThreatLevel,
    TelemetryType,
    Alignment,
    
    # Telemetry models
    FlexibleTelemetryInput,
    DroneTelemetry,
    SoldierTelemetry,
    VehicleTelemetry,
    
    # Payload models
    DronePayload,
    SoldierPayload,
    VehiclePayload,
    Position,
    Vitals,
    Battery,
    
    # Legacy compatibility
    LegacyTelemetryData,
    PlatformType
)
from .memory import IngestRequest, IngestResponse
from .training import TrainingRequest, TrainingResponse, TrainingExample

# Backwards compatibility alias
TelemetryData = LegacyTelemetryData

__all__ = [
    # Analysis
    "AnalysisRequest", 
    "AnalysisResponse",
    "ContextItem",
    "ThreatLevel",
    "TelemetryType",
    "Alignment",
    
    # Telemetry types
    "FlexibleTelemetryInput",
    "DroneTelemetry",
    "SoldierTelemetry", 
    "VehicleTelemetry",
    "DronePayload",
    "SoldierPayload",
    "VehiclePayload",
    "Position",
    "Vitals",
    "Battery",
    
    # Legacy
    "TelemetryData",
    "LegacyTelemetryData",
    "PlatformType",
    
    # Memory
    "IngestRequest",
    "IngestResponse",
    
    # Training
    "TrainingRequest",
    "TrainingResponse",
    "TrainingExample"
]
