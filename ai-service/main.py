"""
============================================================================
        C4ISR AI MICROSERVICE - POLYMORPHIC TACTICAL DECISION SUPPORT
============================================================================
    ███████╗██╗███╗   ██╗ █████╗ ██████╗ ███████╗
    ██╔════╝██║████╗  ██║██╔══██╗██╔══██╗██╔════╝
    ███████╗██║██╔██╗ ██║███████║██████╔╝███████╗
    ╚════██║██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
    ███████║██║██║ ╚████║██║  ██║██║     ███████║
    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝

    ⚠️  SYSTEM RUNNING IN SECURE MODE - NO EXTERNAL CALLS PERMITTED  ⚠️
    
    SECURITY CLASSIFICATION: MILITARY DATA PRIVACY COMPLIANT
    NETWORK MODE: AIR-GAPPED / OFFLINE OPERATION
    MODEL SOURCE: LOCAL DIRECTORY ONLY (./local_models/)
    
    ARCHITECTURE: Polymorphic Discriminated Union
    - Automatic schema validation based on 'type' field
    - DroneTelemetry | SoldierTelemetry | VehicleTelemetry
    - Context-aware LLM analysis without hardcoded rules

============================================================================
"""
import time
from contextlib import asynccontextmanager
from typing import Union

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import structlog

from config.settings import settings
from config.database import initialize_database, close_database
from services.rag_engine import rag_engine
from services.model_engine import model_engine

from schemas.telemetry import (
    # Polymorphic Telemetry Models
    TelemetryInput,
    DroneTelemetry,
    SoldierTelemetry,
    VehicleTelemetry,
    # Request/Response Models
    AnalysisRequest,
    AnalysisResponse,
    ContextItem,
    ThreatLevel,
)
from schemas.memory import IngestRequest, IngestResponse
from schemas.training import TrainingRequest, TrainingResponse, TrainingStatus

logger = structlog.get_logger(__name__)


# ============================================================================
#                           APPLICATION LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize and cleanup resources"""
    logger.info("Starting C4ISR AI Microservice (Polymorphic Architecture)...")
    
    # Initialize database connection
    try:
        initialize_database(use_docker_network=False)
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init failed (may need to run init-vector.sql): {e}")
    
    # Initialize RAG engine
    try:
        rag_engine.initialize()
        logger.info("RAG Engine initialized")
    except Exception as e:
        logger.warning(f"RAG Engine init failed: {e}")
    
    # Initialize Model engine (optional - may require GPU)
    try:
        model_engine.initialize()
        logger.info("Model Engine initialized")
    except Exception as e:
        logger.warning(f"Model Engine init failed (GPU may be required): {e}")
    
    yield
    
    # Cleanup
    close_database()
    logger.info("C4ISR AI Microservice shutdown complete")


# ============================================================================
#                           FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="C4ISR AI Microservice",
    description="""
## Tactical Decision Support with Polymorphic Telemetry Analysis

This microservice provides AI-powered situational awareness for military C4ISR systems.

### Architecture
Uses **Discriminated Unions** for automatic schema validation:
- The `type` field determines which schema is used
- FastAPI automatically validates the correct model

### Supported Telemetry Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `drone` | UAV operational data | altitude, speed, battery_level, mode |
| `soldier` | Personnel vitals | vitals (hr_bpm, spo2), status |
| `vehicle` | Ground assets | speed, fuel_pct, vehicle_type |

### Example Requests

**Drone Telemetry:**
```json
{
    "type": "drone",
    "source_id": "UAV-ALPHA-01",
    "latitude": 39.92,
    "longitude": 32.85,
    "altitude": 150.0,
    "speed": 12.5,
    "battery_level": 78.5,
    "mode": "AUTO"
}
```

**Soldier Telemetry:**
```json
{
    "type": "soldier",
    "source_id": "ALPHA-2-ACTUAL",
    "latitude": 39.92,
    "longitude": 32.85,
    "vitals": {"hr_bpm": 85, "spo2": 97.5},
    "status": "ACTIVE"
}
```

**Vehicle Telemetry:**
```json
{
    "type": "vehicle",
    "source_id": "TANK-BRAVO-03",
    "latitude": 39.93,
    "longitude": 32.86,
    "speed": 35.0,
    "fuel_pct": 82.0,
    "vehicle_type": "TANK"
}
```
    """,
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
#                           HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for load balancers and monitoring"""
    return {
        "status": "healthy",
        "service": "c4isr-ai-microservice",
        "version": "3.0.0",
        "architecture": "polymorphic-discriminated-union"
    }


@app.get("/info", tags=["System"])
async def service_info():
    """Get service information and current status"""
    return {
        "service": settings.APP_NAME,
        "version": "3.0.0",
        "architecture": "Polymorphic Discriminated Union",
        "model": model_engine.get_model_info(),
        "rag_model": settings.EMBEDDING_MODEL,
        "supported_types": ["drone", "soldier", "vehicle"],
        "endpoint_docs": "/docs"
    }


# ============================================================================
#                           ANALYSIS ENDPOINT (POLYMORPHIC)
# ============================================================================

@app.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_telemetry(request: AnalysisRequest):
    """
    Analyze telemetry data and provide tactical decision.
    
    This endpoint uses **Discriminated Unions** for automatic schema validation.
    The `type` field in the request body determines which schema is used:
    
    - `type: "drone"` → DroneTelemetry schema
    - `type: "soldier"` → SoldierTelemetry schema  
    - `type: "vehicle"` → VehicleTelemetry schema
    
    The AI analyzes the data for anomalies and threats based on:
    - Military operational norms
    - Physiological health indicators
    - Equipment operational parameters
    
    **No hardcoded rules** - relies on LLM contextual understanding.
    """
    start_time = time.time()
    
    # Extract telemetry from request
    telemetry = request.telemetry
    
    # Extract entity info from the validated model
    entity_type = telemetry.type
    entity_id = telemetry.source_id
    
    logger.info(
        f"Analyzing {entity_type} telemetry",
        entity_id=entity_id,
        entity_type=entity_type
    )
    
    # Step 1: Retrieve historical context from RAG (if enabled)
    context_items = []
    if request.include_context:
        try:
            # Create a text summary for similarity search
            telemetry_summary = _create_telemetry_summary(telemetry)
            
            raw_context = rag_engine.retrieve_context(
                query_text=telemetry_summary,
                limit=request.max_context_items
            )
            context_items = [
                ContextItem(
                    event_description=c['event_description'],
                    outcome=c['outcome'],
                    similarity_score=c['similarity_score'],
                    timestamp=c.get('timestamp')
                ) for c in raw_context
            ]
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")
    
    # Step 2: Generate AI decision
    try:
        # Pass the validated Pydantic model directly to model engine
        # The model_engine will use model_dump_json() for proper serialization
        decision, threat_level, confidence, reasoning = model_engine.generate_decision(
            telemetry_data=telemetry,
            retrieved_context=[c.model_dump() for c in context_items]
        )
    except Exception as e:
        logger.error(f"Model generation failed: {e}")
        # Fallback response
        decision = f"Unable to generate decision for {entity_type} - model unavailable"
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.0
        reasoning = str(e)
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    return AnalysisResponse(
        decision=decision,
        threat_level=threat_level,
        confidence=confidence,
        reasoning=reasoning,
        entity_type=entity_type,
        entity_id=entity_id,
        context_used=context_items,
        processing_time_ms=round(elapsed_ms, 2),
        model_version=settings.MODEL_NAME
    )


def _create_telemetry_summary(telemetry: TelemetryInput) -> str:
    """
    Create a natural language summary of telemetry for RAG similarity search.
    Handles each telemetry type appropriately.
    """
    entity_type = telemetry.type
    entity_id = telemetry.source_id
    
    parts = [f"{entity_type.title()} {entity_id}"]
    
    if isinstance(telemetry, DroneTelemetry):
        parts.append(f"altitude {telemetry.altitude}m")
        parts.append(f"speed {telemetry.speed}m/s")
        parts.append(f"battery {telemetry.battery_level}%")
        parts.append(f"mode {telemetry.mode.value}")
        
    elif isinstance(telemetry, SoldierTelemetry):
        parts.append(f"heart rate {telemetry.vitals.hr_bpm} BPM")
        parts.append(f"SpO2 {telemetry.vitals.spo2}%")
        parts.append(f"status {telemetry.status.value}")
        if telemetry.vitals.stress_index is not None:
            parts.append(f"stress {telemetry.vitals.stress_index:.2f}")
            
    elif isinstance(telemetry, VehicleTelemetry):
        parts.append(f"type {telemetry.vehicle_type.value}")
        parts.append(f"speed {telemetry.speed} km/h")
        parts.append(f"fuel {telemetry.fuel_pct}%")
        if telemetry.health_pct is not None:
            parts.append(f"health {telemetry.health_pct}%")
    
    # Add position info
    parts.append(f"at ({telemetry.latitude:.4f}, {telemetry.longitude:.4f})")
    
    return ", ".join(parts)


# ============================================================================
#                           INGEST ENDPOINT (RAG Memory)
# ============================================================================

@app.post("/ingest", response_model=IngestResponse, tags=["Memory"])
async def ingest_event(request: IngestRequest):
    """
    Ingest a confirmed tactical event into memory for future RAG retrieval.
    
    Events stored here will be used to provide historical context
    for future analyses, enabling pattern recognition and
    precedent-based decision support.
    """
    try:
        event_id = rag_engine.ingest_event(
            event_description=request.event_description,
            outcome=request.outcome,
            source_platform=request.source_platform,
            threat_category=request.threat_category,
            confidence_score=request.confidence_score
        )
        
        return IngestResponse(
            success=True,
            event_id=event_id,
            message="Event successfully ingested into tactical memory",
            embedding_generated=True
        )
    except Exception as e:
        logger.error(f"Ingest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/stats", tags=["Memory"])
async def get_memory_stats():
    """Get statistics about tactical memory (RAG database)"""
    try:
        return rag_engine.get_memory_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
#                           TRAINING ENDPOINT (LoRA)
# ============================================================================

def _run_training(request: TrainingRequest):
    """Background task for LoRA training"""
    examples = [e.model_dump() for e in request.training_examples]
    model_engine.train_lora(
        training_examples=examples,
        epochs=request.epochs,
        learning_rate=request.learning_rate,
        batch_size=request.batch_size,
        adapter_name=request.save_adapter_name
    )


@app.post("/train", response_model=TrainingResponse, tags=["Training"])
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Start LoRA fine-tuning as a background task.
    
    This enables domain-specific adaptation of the base model
    using tactical training examples from your operational environment.
    """
    from datetime import datetime
    
    job_id = f"train_{request.save_adapter_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Add training to background tasks
    background_tasks.add_task(_run_training, request)
    
    return TrainingResponse(
        job_id=job_id,
        status=TrainingStatus.PENDING,
        message=f"Training queued with {len(request.training_examples)} examples",
        started_at=datetime.utcnow(),
        estimated_duration_minutes=len(request.training_examples) * request.epochs * 0.5
    )


@app.get("/train/{job_id}", tags=["Training"])
async def get_training_status(job_id: str):
    """Get status of a training job"""
    status = model_engine.get_training_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Training job not found")
    return status


# ============================================================================
#                           DEBUG ENDPOINT
# ============================================================================

@app.post("/debug/validate", tags=["Debug"])
async def debug_validate_telemetry(request: AnalysisRequest):
    """
    Debug endpoint to validate telemetry parsing without running the AI model.
    
    Useful for testing:
    - Discriminated union schema validation
    - Field extraction and type detection
    - JSON serialization output
    """
    telemetry = request.telemetry
    return {
        "validated": True,
        "entity_type": telemetry.type,
        "entity_id": telemetry.source_id,
        "model_class": telemetry.__class__.__name__,
        "serialized_json": telemetry.model_dump_json(indent=2),
        "summary_for_rag": _create_telemetry_summary(telemetry)
    }


# ============================================================================
#                           MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
