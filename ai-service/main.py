"""
============================================================================
        C4ISR AI MICROSERVICE - TACTICAL DECISION SUPPORT SYSTEM
============================================================================
    ███████╗███████╗ ██████╗██╗   ██╗██████╗ ███████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
    ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔════╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
    ███████╗█████╗  ██║     ██║   ██║██████╔╝█████╗      ██╔████╔██║██║   ██║██║  ██║█████╗  
    ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝      ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  
    ███████║███████╗╚██████╗╚██████╔╝██║  ██║███████╗    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
    ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

    ⚠️  SYSTEM RUNNING IN SECURE MODE - NO EXTERNAL CALLS PERMITTED  ⚠️
    
    SECURITY CLASSIFICATION: MILITARY DATA PRIVACY COMPLIANT
    NETWORK MODE: AIR-GAPPED / OFFLINE OPERATION
    MODEL SOURCE: LOCAL DIRECTORY ONLY (./local_models/)
    
    SUPPORTED TELEMETRY TYPES:
    - Drone (UAV): Battery, Altitude, Speed, Flight Mode
    - Soldier (Watch): Heart Rate, SpO2, Vitals, Stress
    - Vehicle: Fuel, Speed, Engine Status, Health

============================================================================
"""
import time
import json
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import structlog

from config.settings import settings
from config.database import initialize_database, close_database
from services.rag_engine import rag_engine
from services.model_engine import model_engine
from schemas.telemetry import (
    AnalysisRequest, 
    AnalysisResponse, 
    ContextItem, 
    ThreatLevel,
    TelemetryType,
    FlexibleTelemetryInput
)
from schemas.memory import IngestRequest, IngestResponse, RetrieveRequest, RetrieveResponse
from schemas.training import TrainingRequest, TrainingResponse, TrainingStatus

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize and cleanup resources"""
    logger.info("Starting C4ISR AI Microservice...")
    
    # Initialize database connection
    use_docker = settings.DATABASE_URL_DOCKER.find("c4isr-db") > 0
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


app = FastAPI(
    title="C4ISR AI Microservice",
    description="""
## Tactical Decision Support with RAG and LLM

Supports multi-domain telemetry analysis:
- **Drone/UAV**: Battery, Altitude, Speed, Flight Mode
- **Soldier/Watch**: Heart Rate (HR), SpO2, Vitals, Stress Score
- **Vehicle**: Fuel, Speed, Engine Status, Health Percentage

### Example Request
```json
{
  "telemetry": {
    "domain": "drone",
    "type": "telemetry", 
    "id": "drone1",
    "payload": {
      "position": {"lat": 39.92, "lon": 32.84, "alt_m": 300},
      "battery": {"soc_pct": 80},
      "mode": "AUTO"
    }
  },
  "include_context": true
}
```
    """,
    version="2.0.0",
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
#                         PROMPT GENERATION FUNCTIONS
# ============================================================================

def _extract_telemetry_info(telemetry: FlexibleTelemetryInput) -> Dict[str, Any]:
    """
    Extract relevant information from flexible telemetry input.
    Returns a normalized dict with entity_type and key metrics.
    """
    entity_type = telemetry.get_entity_type()
    payload = telemetry.payload or {}
    
    # Get position if available
    position = payload.get("position", {})
    lat = position.get("lat")
    lon = position.get("lon")
    alt = position.get("alt_m")
    
    result = {
        "entity_type": entity_type.value,
        "entity_id": telemetry.id or payload.get("id") or payload.get("soldier_id") or "unknown",
        "latitude": lat,
        "longitude": lon,
        "altitude_m": alt,
        "alignment": payload.get("alignment", "UNKNOWN"),
        "threat_level": payload.get("threat_level", 0),
        "timestamp": telemetry.time
    }
    
    # Add domain-specific fields
    if entity_type == TelemetryType.DRONE:
        battery = payload.get("battery", {})
        result.update({
            "battery_pct": battery.get("soc_pct") if isinstance(battery, dict) else None,
            "speed_mps": payload.get("ground_speed_mps"),
            "mode": payload.get("mode", "AUTO"),
            "yaw_deg": payload.get("yaw_deg")
        })
    
    elif entity_type == TelemetryType.SOLDIER:
        vitals = payload.get("vitals", {})
        result.update({
            "soldier_id": payload.get("soldier_id"),
            "unit_id": payload.get("unit_id"),
            "hr_bpm": vitals.get("hr_bpm"),
            "spo2_pct": vitals.get("spo2_pct"),
            "stress_score": vitals.get("stress_score"),
            "resp_bpm": vitals.get("resp_bpm"),
            "skin_temp_c": vitals.get("skin_temp_c")
        })
    
    elif entity_type == TelemetryType.VEHICLE:
        result.update({
            "vehicle_type": payload.get("type", "APC"),
            "speed_kph": payload.get("speed_kph"),
            "fuel_pct": payload.get("fuel_pct"),
            "engine": payload.get("engine", "RUN"),
            "health_pct": payload.get("health_pct"),
            "heading_deg": payload.get("heading_deg")
        })
    
    return result


def _generate_context_aware_prompt(info: Dict[str, Any]) -> str:
    """
    Generate a natural language prompt based on entity type.
    Each entity type gets a specialized prompt focusing on relevant metrics.
    """
    entity_type = info.get("entity_type", "unknown")
    entity_id = info.get("entity_id", "unknown")
    alignment = info.get("alignment", "UNKNOWN")
    threat = info.get("threat_level", 0)
    
    # Common position info
    pos_parts = []
    if info.get("latitude") and info.get("longitude"):
        pos_parts.append(f"Position: ({info['latitude']:.4f}, {info['longitude']:.4f})")
    if info.get("altitude_m"):
        pos_parts.append(f"Altitude: {info['altitude_m']}m")
    position_str = ", ".join(pos_parts) if pos_parts else "Position unknown"
    
    # Entity-specific prompt
    if entity_type == "drone":
        battery = info.get("battery_pct")
        speed = info.get("speed_mps")
        mode = info.get("mode", "AUTO")
        
        battery_status = f"Battery: {battery:.1f}%" if battery else "Battery: Unknown"
        speed_status = f"Speed: {speed:.1f} m/s" if speed else "Speed: Unknown"
        
        # Battery warning logic
        battery_warning = ""
        if battery and battery < 20:
            battery_warning = "⚠️ CRITICAL: Low battery - RTH recommended. "
        elif battery and battery < 35:
            battery_warning = "⚠️ Warning: Battery below 35%. "
        
        prompt = f"""DRONE TELEMETRY ANALYSIS
Entity: {entity_id} | Alignment: {alignment} | Threat Level: {threat}
{position_str}
{battery_status} | {speed_status} | Mode: {mode}
{battery_warning}
Analyze this drone's operational status and provide tactical recommendation."""

    elif entity_type == "soldier":
        hr = info.get("hr_bpm")
        spo2 = info.get("spo2_pct")
        stress = info.get("stress_score")
        unit = info.get("unit_id", "Unknown Unit")
        
        hr_status = f"Heart Rate: {hr} BPM" if hr else "HR: Unknown"
        spo2_status = f"SpO2: {spo2}%" if spo2 else "SpO2: Unknown"
        stress_status = f"Stress Score: {stress:.2f}" if stress else ""
        
        # Health warnings
        health_warning = ""
        if hr and hr > 140:
            health_warning = "⚠️ HIGH STRESS: Elevated heart rate detected. "
        elif hr and hr > 120:
            health_warning = "⚠️ Warning: Heart rate elevated - monitor fatigue. "
        if spo2 and spo2 < 94:
            health_warning += "⚠️ LOW SpO2: Oxygen levels concerning. "
        
        prompt = f"""SOLDIER VITALS ANALYSIS
Soldier: {entity_id} | Unit: {unit} | Status: {alignment}
{position_str}
{hr_status} | {spo2_status} {stress_status}
{health_warning}
Assess soldier's physical condition and operational readiness."""

    elif entity_type == "vehicle":
        vehicle_type = info.get("vehicle_type", "APC")
        speed = info.get("speed_kph")
        fuel = info.get("fuel_pct")
        engine = info.get("engine", "RUN")
        health = info.get("health_pct")
        
        speed_status = f"Speed: {speed:.1f} km/h" if speed else "Speed: Unknown"
        fuel_status = f"Fuel: {fuel:.1f}%" if fuel else "Fuel: Unknown"
        health_status = f"Health: {health:.1f}%" if health else ""
        
        # Operational warnings
        op_warning = ""
        if fuel and fuel < 15:
            op_warning = "⚠️ CRITICAL: Low fuel - resupply needed. "
        elif fuel and fuel < 30:
            op_warning = "⚠️ Warning: Fuel below 30%. "
        if engine == "IDLE":
            op_warning += "⚠️ Engine IDLE - possible maintenance issue. "
        if health and health < 50:
            op_warning += f"⚠️ Vehicle damage detected ({health:.0f}% health). "
        
        prompt = f"""VEHICLE TELEMETRY ANALYSIS
Vehicle: {entity_id} | Type: {vehicle_type} | Alignment: {alignment} | Threat Level: {threat}
{position_str}
{speed_status} | {fuel_status} | Engine: {engine} {health_status}
{op_warning}
Analyze vehicle operational status and provide tactical assessment."""

    else:
        # Generic fallback
        prompt = f"""TELEMETRY ANALYSIS
Entity: {entity_id} | Type: {entity_type} | Alignment: {alignment}
{position_str}
Raw Data: {json.dumps(info, default=str)}
Provide tactical assessment based on available data."""
    
    return prompt


def _telemetry_to_text(telemetry: FlexibleTelemetryInput) -> str:
    """
    Convert telemetry data to natural language summary for RAG query.
    This is a shorter version for similarity search.
    """
    info = _extract_telemetry_info(telemetry)
    entity_type = info.get("entity_type", "unknown")
    entity_id = info.get("entity_id", "unknown")
    
    parts = [f"{entity_type.title()} {entity_id}"]
    
    if entity_type == "drone":
        if info.get("battery_pct"):
            parts.append(f"battery {info['battery_pct']:.0f}%")
        if info.get("altitude_m"):
            parts.append(f"altitude {info['altitude_m']}m")
        if info.get("speed_mps"):
            parts.append(f"speed {info['speed_mps']:.1f}m/s")
        if info.get("mode"):
            parts.append(f"mode {info['mode']}")
            
    elif entity_type == "soldier":
        if info.get("hr_bpm"):
            parts.append(f"heart rate {info['hr_bpm']} BPM")
        if info.get("spo2_pct"):
            parts.append(f"SpO2 {info['spo2_pct']}%")
        if info.get("stress_score"):
            parts.append(f"stress {info['stress_score']:.2f}")
            
    elif entity_type == "vehicle":
        if info.get("vehicle_type"):
            parts.append(f"type {info['vehicle_type']}")
        if info.get("fuel_pct"):
            parts.append(f"fuel {info['fuel_pct']:.0f}%")
        if info.get("speed_kph"):
            parts.append(f"speed {info['speed_kph']:.0f}km/h")
        if info.get("engine"):
            parts.append(f"engine {info['engine']}")
    
    # Add alignment and threat if relevant
    alignment = info.get("alignment", "UNKNOWN")
    threat = info.get("threat_level", 0)
    if alignment != "UNKNOWN":
        parts.append(f"alignment {alignment}")
    if threat > 0:
        parts.append(f"threat level {threat}")
    
    return ", ".join(parts)


# ============================================================================
#                           HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "c4isr-ai-microservice", "version": "2.0.0"}


@app.get("/info")
async def service_info():
    """Get service information and status"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model": model_engine.get_model_info(),
        "rag_model": settings.EMBEDDING_MODEL,
        "supported_domains": ["drone", "soldier", "vehicle"],
        "endpoint_docs": "/docs"
    }


# ============================================================================
#                           ANALYSIS ENDPOINT
# ============================================================================

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_telemetry(request: AnalysisRequest):
    """
    Analyze telemetry data and provide tactical decision.
    
    Supports three telemetry domains:
    - **drone**: Battery, Altitude, Speed, Mode analysis
    - **soldier/watch**: Heart Rate, SpO2, Vitals, Stress analysis
    - **vehicle**: Fuel, Speed, Engine, Health analysis
    
    The AI generates context-aware prompts based on entity type.
    """
    start_time = time.time()
    
    # Extract normalized info from flexible input
    info = _extract_telemetry_info(request.telemetry)
    entity_type = info.get("entity_type", "unknown")
    entity_id = info.get("entity_id", "unknown")
    
    logger.info(f"Analyzing {entity_type} telemetry", entity_id=entity_id)
    
    # Create text summary for RAG query
    telemetry_summary = _telemetry_to_text(request.telemetry)
    
    # Step 1: Retrieve context from RAG
    context_items = []
    if request.include_context:
        try:
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
    
    # Step 2: Generate context-aware prompt
    prompt = _generate_context_aware_prompt(info)
    
    # Step 3: Generate decision with LLM
    try:
        # Pass the structured info and context to model engine
        decision, threat_level, confidence, reasoning = model_engine.generate_decision(
            telemetry_json=info,
            retrieved_context=[c.model_dump() for c in context_items]
        )
    except Exception as e:
        logger.error(f"Model generation failed: {e}")
        # Fallback response based on entity type
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


# ============================================================================
#                           INGEST ENDPOINT (RAG Memory)
# ============================================================================

@app.post("/ingest", response_model=IngestResponse)
async def ingest_event(request: IngestRequest):
    """
    Ingest a confirmed tactical event into memory for future RAG retrieval
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


@app.get("/memory/stats")
async def get_memory_stats():
    """Get statistics about tactical memory"""
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


@app.post("/train", response_model=TrainingResponse)
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Start LoRA fine-tuning as a background task
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


@app.get("/train/{job_id}")
async def get_training_status(job_id: str):
    """Get status of a training job"""
    status = model_engine.get_training_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Training job not found")
    return status


# ============================================================================
#                           DEBUG ENDPOINT
# ============================================================================

@app.post("/debug/parse-telemetry")
async def debug_parse_telemetry(request: AnalysisRequest):
    """
    Debug endpoint to see how telemetry is parsed without running the model.
    Useful for testing payload structure compatibility.
    """
    info = _extract_telemetry_info(request.telemetry)
    prompt = _generate_context_aware_prompt(info)
    summary = _telemetry_to_text(request.telemetry)
    
    return {
        "parsed_info": info,
        "generated_prompt": prompt,
        "rag_query_summary": summary,
        "entity_type": info.get("entity_type"),
        "entity_id": info.get("entity_id")
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
