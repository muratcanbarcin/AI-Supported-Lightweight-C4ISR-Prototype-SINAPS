"""
Pydantic Schemas for C4ISR AI Microservice
============================================================================
Polymorphic telemetry models with discriminated unions for automatic
schema validation based on the 'type' field.
============================================================================
"""

from .telemetry import (
    # Enumerations
    ThreatLevel,
    TelemetryType,
    SoldierStatus,
    VehicleType,
    DroneMode,
    
    # Base Models
    BaseTelemetry,
    SoldierVitals,
    
    # Polymorphic Telemetry Models (Discriminated Union)
    TelemetryInput,
    DroneTelemetry,
    SoldierTelemetry,
    VehicleTelemetry,
    
    # Response Models
    AnalysisRequest,
    AnalysisResponse,
    AIAnalysisResult,
    ContextItem,
    
    # Legacy Compatibility
    FlexibleTelemetryInput,
)

from .memory import IngestRequest, IngestResponse

from .training import TrainingRequest, TrainingResponse, TrainingExample, TrainingStatus

__all__ = [
    # Enumerations
    "ThreatLevel",
    "TelemetryType",
    "SoldierStatus",
    "VehicleType",
    "DroneMode",
    
    # Base Models
    "BaseTelemetry",
    "SoldierVitals",
    
    # Polymorphic Telemetry (Discriminated Union)
    "TelemetryInput",
    "DroneTelemetry",
    "SoldierTelemetry",
    "VehicleTelemetry",
    
    # Request/Response
    "AnalysisRequest",
    "AnalysisResponse",
    "AIAnalysisResult",
    "ContextItem",
    
    # Legacy Compatibility
    "FlexibleTelemetryInput",
    
    # Memory
    "IngestRequest",
    "IngestResponse",
    
    # Training
    "TrainingRequest",
    "TrainingResponse",
    "TrainingExample",
    "TrainingStatus",
]
