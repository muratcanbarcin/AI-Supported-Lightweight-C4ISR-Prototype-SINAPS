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
    
    This system is designed for deployment in environments with NO internet
    connectivity. All AI models are pre-loaded from local storage. No data
    leaves the internal network. No connection attempts to HuggingFace,
    external APIs, or any internet endpoints.
    
    For model updates: Use download_models.py on a separate internet-connected
    machine, then transfer the local_models folder via approved secure media.
============================================================================
"""
import time
import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import structlog

from config.settings import settings
from config.database import initialize_database, close_database
from services.rag_engine import rag_engine
from services.model_engine import model_engine
from schemas.telemetry import AnalysisRequest, AnalysisResponse, TelemetryData, ContextItem, ThreatLevel
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
    description="Tactical decision support with RAG and LoRA fine-tuning",
    version="1.0.0",
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


# ============ Health & Info Endpoints ============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "c4isr-ai-microservice"}


@app.get("/info")
async def service_info():
    """Get service information and status"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model": model_engine.get_model_info(),
        "rag_model": settings.EMBEDDING_MODEL
    }


# ============ Analysis Endpoint ============

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_telemetry(request: AnalysisRequest):
    """
    Analyze telemetry data and provide tactical decision
    
    Flow:
    1. Convert telemetry to text summary
    2. Retrieve similar historical events (RAG)
    3. Generate decision using LLM with context
    """
    start_time = time.time()
    
    # Convert telemetry to dict/text for processing
    telemetry_dict = request.telemetry.model_dump(exclude_none=True)
    
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
    
    # Step 2: Generate decision with LLM
    try:
        decision, threat_level, confidence, reasoning = model_engine.generate_decision(
            telemetry_json=telemetry_dict,
            retrieved_context=[c.model_dump() for c in context_items]
        )
    except Exception as e:
        logger.error(f"Model generation failed: {e}")
        # Fallback response
        decision = "Unable to generate decision - model unavailable"
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.0
        reasoning = str(e)
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    return AnalysisResponse(
        decision=decision,
        threat_level=threat_level,
        confidence=confidence,
        reasoning=reasoning,
        context_used=context_items,
        processing_time_ms=round(elapsed_ms, 2),
        model_version=settings.MODEL_NAME
    )


def _telemetry_to_text(telemetry: TelemetryData) -> str:
    """Convert telemetry data to natural language summary"""
    parts = [f"Platform {telemetry.platform_id} ({telemetry.platform_type.value})"]
    
    if telemetry.contact_bearing is not None:
        parts.append(f"detected contact at bearing {telemetry.contact_bearing}°")
    if telemetry.contact_range_nm is not None:
        parts.append(f"range {telemetry.contact_range_nm} nm")
    if telemetry.contact_altitude_m is not None:
        parts.append(f"altitude {telemetry.contact_altitude_m}m")
    if telemetry.contact_speed_knots is not None:
        parts.append(f"speed {telemetry.contact_speed_knots} knots")
    if telemetry.iff_response:
        parts.append(f"IFF: {telemetry.iff_response}")
    elif telemetry.iff_response is None:
        parts.append("no IFF response")
    if telemetry.classification:
        parts.append(f"classified as {telemetry.classification}")
    
    return ", ".join(parts)


# ============ Ingest Endpoint (RAG Memory) ============

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


# ============ Training Endpoint (LoRA) ============

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


# ============ Main Entry Point ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
