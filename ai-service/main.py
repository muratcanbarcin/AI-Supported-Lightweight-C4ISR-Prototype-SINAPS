"""
============================================================================
        C4ISR AI MICROSERVICE — DUAL-ENGINE TACTICAL DECISION SUPPORT
============================================================================
    ███████╗██╗███╗   ██╗ █████╗ ██████╗ ███████╗
    ██╔════╝██║████╗  ██║██╔══██╗██╔══██╗██╔════╝
    ███████╗██║██╔██╗ ██║███████║██████╔╝███████╗
    ╚════██║██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
    ███████║██║██║ ╚████║██║  ██║██║     ███████║
    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝

    ⚠️  SYSTEM RUNNING IN SECURE MODE — NO EXTERNAL CALLS PERMITTED  ⚠️
    
    SECURITY CLASSIFICATION: MILITARY DATA PRIVACY COMPLIANT
    NETWORK MODE: AIR-GAPPED / OFFLINE OPERATION
    MODEL SOURCE: LOCAL DIRECTORY ONLY (./local_models/)
    
    ARCHITECTURE: Dual-Engine + Polymorphic Discriminated Union + RAG Pipeline
    
    ENGINE 1 (Analysis): Gemma-2-9b-it (with LoRA adapter)
        → POST /analyze — JSON threat assessment from telemetry
        → DroneTelemetry | SoldierTelemetry | VehicleTelemetry
    
    ENGINE 2 (Chat): Meta-Llama-3.1-8B-Instruct
        → POST /chat — Turkish military assistant (RAG-augmented)
        → Free-text conversational responses

    HARDWARE: Single NVIDIA RTX 3080 (16GB VRAM)
    QUANTIZATION: Both models 4-bit NF4 (~10-12GB total VRAM)

============================================================================
"""
from __future__ import annotations

import asyncio
import re
import time
from contextlib import asynccontextmanager
from typing import Union

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import structlog

from config.settings import settings
from config.database import initialize_database, close_database, db_manager
from services.rag_engine import rag_engine
from model.model_engine import model_engine

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
    """
    Application lifespan — initialize and cleanup resources.
    
    Startup order:
        1. PostgreSQL database (pgvector for RAG)
        2. RAG engine (all-MiniLM-L6-v2 embedding model)
        3. Dual-Engine Model Engine:
           - Engine 1: Gemma-2-9b-it (Analysis + LoRA)
           - Engine 2: Llama-3.1-8B-Instruct (Chat)
    """
    logger.info("Starting C4ISR AI Microservice (Dual-Engine + RAG Pipeline)...")
    
    db_initialized = False
    rag_initialized = False
    model_initialized = False
    
    # Step 1: Initialize database connection (for pgvector RAG)
    try:
        initialize_database(use_docker_network=False)
        db_initialized = True
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️ Database init failed (RAG retrieval disabled): {e}")
    
    # Step 2: Initialize RAG engine embedding model
    try:
        rag_engine.initialize()
        rag_initialized = True
        logger.info("✅ RAG Engine (all-MiniLM-L6-v2) initialized")
    except Exception as e:
        logger.warning(f"⚠️ RAG Engine init failed: {e}")
    
    # Step 3: Initialize Dual-Engine Model Engine
    try:
        model_engine.initialize()
        model_initialized = True
        logger.info("✅ Dual-Engine Model Engine initialized")
        logger.info("   Engine 1: Gemma-2-9b-it (Analysis)")
        logger.info("   Engine 2: Llama-3.1-8B-Instruct (Chat)")
    except Exception as e:
        logger.warning(f"⚠️ Dual-Engine init failed (GPU required): {e}")
    
    # Startup summary
    logger.info(
        "Startup complete",
        database=db_initialized,
        rag=rag_initialized,
        model=model_initialized,
        architecture="dual-engine",
    )
    
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
## Dual-Engine Tactical Decision Support with RAG

### Architecture
```
Engine 1 (Gemma):  Telemetry → RAG → Gemma + LoRA → JSON Decision
Engine 2 (Llama):  Query → RAG → Llama-3.1-8B → Turkish Text Response
```

### Endpoints
| Endpoint | Engine | Description |
|----------|--------|-------------|
| `POST /analyze` | Gemma-2-9b-it | Threat assessment from telemetry |
| `POST /chat` | Llama-3.1-8B | Military assistant chat |

### Supported Telemetry Types
| Type | Description | Key Fields |
|------|-------------|------------|
| `drone` | UAV operational data | altitude, speed, battery_level, mode |
| `soldier` | Personnel vitals | vitals (hr_bpm, spo2), status |
| `vehicle` | Ground assets | speed, fuel_pct, vehicle_type |
    """,
    version="5.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
#                           HEALTH & INFO
# ============================================================================

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "c4isr-ai-microservice",
        "version": "5.0.0",
        "architecture": "dual-engine-rag-pipeline",
    }


@app.get("/info", tags=["System"])
async def service_info():
    return {
        "service": settings.APP_NAME,
        "version": "5.0.0",
        "architecture": "Dual-Engine + RAG Pipeline",
        "engines": model_engine.get_model_info(),
        "rag_model": settings.EMBEDDING_MODEL,
        "supported_types": ["drone", "soldier", "vehicle"],
        "endpoint_docs": "/docs",
    }


# ============================================================================
#           CHAT ENDPOINT (Engine 2: Llama-3.1-8B-Instruct)
# ============================================================================

from pydantic import BaseModel as PydanticBaseModel, Field
from typing import Optional


class HistoryMessage(PydanticBaseModel):
    """A single message in the conversation history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(PydanticBaseModel):
    """Request body for the /chat endpoint."""
    query: str = Field(
        ..., min_length=1, max_length=2000,
        description="Commander's question (Turkish or English)"
    )
    history: Optional[list[HistoryMessage]] = Field(
        default=None,
        description="Previous conversation messages for multi-turn context"
    )


class ChatResponse(PydanticBaseModel):
    """Response body for the /chat endpoint."""
    response: str = Field(
        ..., description="AI-generated military assistant response (Turkish)"
    )
    cited_rule: str = Field(
        default="",
        description="Top retrieved doctrine/context used in the response"
    )
    rag_hits: int = Field(
        default=0, description="Number of RAG context items found"
    )
    processing_time_ms: float = Field(
        default=0.0, description="Total processing time in ms"
    )


# Minimum cosine similarity for RAG context to be considered "relevant"
# Must match rag_engine.SIMILARITY_THRESHOLD (Sniper: 0.65)
RAG_RELEVANCE_THRESHOLD = 0.65


# ── Domain keyword cross-check (fixes cross-category hallucinations) ──────
# The English embedding model (all-MiniLM-L6-v2) can't reliably distinguish
# Turkish military categories.  Shared template phrases like "TEHDİT SEVİYESİ
# YÜKSEK" cause fuel rules to score 0.70+ for IHA/IFF queries.
# This simple keyword check catches those domain mismatches.

_DOMAIN_KEYWORDS = {
    "air":     {"iha", "drone", "hava", "iff", "uçuş", "iniş", "radar", "tanımlanamayan", "uav", "sürü", "jamming", "rth"},
    "vehicle": {"araç", "yakıt", "motor", "konvoy", "lastik", "palet", "zırhlı", "ikmal", "depo"},
    "medical": {"kalp", "spo2", "yaralı", "medevac", "nabız", "oksijen", "vücut", "sağlık", "biyometri", "tansiy"},
    "cyber":   {"gps", "siber", "telsiz", "sinyal", "frekans", "spoofing", "şifre", "iletişim", "ağ"},
    "ground":  {"sivil", "roe", "çatışma", "pusu", "esir", "mevzi", "piyade", "devriye"},
}


def _detect_domain(text: str) -> str | None:
    """Return the best-matching domain key, or None if ambiguous."""
    text_lower = text.lower()
    best_domain = None
    best_count = 0
    for domain, keywords in _DOMAIN_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > best_count:
            best_count = count
            best_domain = domain
    return best_domain if best_count >= 1 else None


def _validate_rag_relevance(query: str, rule_text: str) -> bool:
    """Return False if the query and rule clearly belong to different domains."""
    q_domain = _detect_domain(query)
    r_domain = _detect_domain(rule_text)

    if q_domain and r_domain and q_domain != r_domain:
        logger.warning(
            "RAG domain MISMATCH — cited_rule cleared",
            query_domain=q_domain,
            rule_domain=r_domain,
            query_preview=query[:60],
            rule_preview=rule_text[:60],
        )
        return False
    return True


# ── @Mention system — extract asset IDs and fetch real-time data ──────────

_MENTION_PATTERN = re.compile(r"@([A-Za-z0-9\-]+)")


def _extract_mentions(query: str) -> list[str]:
    """Extract all @ASSET-ID mentions from the query."""
    return _MENTION_PATTERN.findall(query)


def _fetch_mention_context(mention_ids: list[str]) -> str:
    """
    Query PostgreSQL for real-time status of mentioned assets.
    Joins assets + latest telemetry (including live lat/lng from
    the telemetry location column) to provide the LLM with live
    position, battery, speed, deployment status and payload data.

    Returns a formatted Turkish context block, or empty string.
    """
    if not mention_ids:
        return ""

    context_lines = []

    try:
        with db_manager.get_cursor(dict_cursor=True) as cur:
            for asset_id in mention_ids:
                cur.execute("""
                    SELECT
                        a.id, a.name, a.type, a.alignment,
                        a.last_latitude, a.last_longitude, a.last_altitude,
                        t.speed, t.battery_level, t.payload,
                        t.timestamp AS telemetry_time,
                        ST_Y(t.location::geometry) AS live_lat,
                        ST_X(t.location::geometry) AS live_lon,
                        t.altitude AS live_alt
                    FROM assets a
                    LEFT JOIN LATERAL (
                        SELECT speed, battery_level, payload, timestamp,
                               location, altitude
                        FROM telemetry
                        WHERE source_id = a.id
                        ORDER BY timestamp DESC
                        LIMIT 1
                    ) t ON true
                    WHERE UPPER(a.id) = UPPER(%s)
                    LIMIT 1;
                """, (asset_id,))

                row = cur.fetchone()
                if not row:
                    context_lines.append(
                        f"@{asset_id}: Sistemde bulunamadı (bilinmeyen birim ID)."
                    )
                    continue

                lat = row.get('live_lat') or row.get('last_latitude') or 0
                lon = row.get('live_lon') or row.get('last_longitude') or 0
                alt = row.get('live_alt') or row.get('last_altitude') or 0

                payload = row.get('payload') or {}
                if not isinstance(payload, dict):
                    payload = {}

                p_status = payload.get('status', '')
                _STATUS_TR = {
                    'EN_ROUTE': 'İNTİKAL HALİNDE (EN_ROUTE)',
                    'IN_MISSION': 'GÖREV BÖLGESİNDE (IN_MISSION)',
                    'STOPPED': 'DURDURULDU',
                    'ONLINE': 'AKTİF',
                    'IDLE': 'BEKLEMEDE',
                    'PATROL': 'DEVRIYE',
                    'COMBAT': 'MUHAREBE',
                }
                status_display = _STATUS_TR.get(p_status, p_status) if p_status else 'AKTİF'

                line = (
                    f"@{row['id']} ({row['name']}) | "
                    f"Tip: {row['type']} | "
                    f"★ RESMİ DURUM: {status_display} | "
                    f"Konum: {lat:.4f}°N, {lon:.4f}°E | "
                    f"İrtifa: {alt}m"
                )

                if row.get('speed') is not None:
                    line += f" | Hız: {row['speed']:.1f} m/s"
                if row.get('battery_level') is not None:
                    line += f" | Batarya: %{row['battery_level']}"

                if payload.get('deployment_zone'):
                    line += f" | Hedef Bölge: {payload['deployment_zone']}"
                dist_rem = payload.get('distance_remaining_m')
                if dist_rem is not None:
                    try:
                        dist_km = float(dist_rem) / 1000
                        line += f" | Kalan Mesafe: {dist_km:.1f} km"
                    except (ValueError, TypeError):
                        line += f" | Kalan Mesafe: {dist_rem}"
                if payload.get('arrived_at'):
                    line += f" | Varış Zamanı: {payload['arrived_at']}"
                if payload.get('heading') is not None:
                    line += f" | Yön: {payload['heading']}°"

                if 'fuel_level' in payload:
                    line += f" | Yakıt: %{payload['fuel_level']}"
                if 'engine_status' in payload:
                    line += f" | Motor: {payload['engine_status']}"
                if 'heart_rate' in payload:
                    line += f" | Nabız: {payload['heart_rate']} bpm"
                if 'spo2' in payload:
                    line += f" | SpO2: %{payload['spo2']}"

                context_lines.append(line)

    except Exception as e:
        logger.warning(f"@Mention DB lookup failed: {e}")
        return ""

    if not context_lines:
        return ""

    result = "\n".join(context_lines)
    logger.info("@Mention context built", mentioned_ids=mention_ids, lines=len(context_lines))
    return result


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_with_ai(request: ChatRequest):
    """
    RAG-augmented conversational AI endpoint.
    
    Engine: Llama-3.1-8B-Instruct (Turkish military assistant persona)

    Pipeline:
        1. Embed the commander's query
        2. Search pgvector tactical_memory for relevant doctrine / rules
        3. FILTER: Only keep RAG results above relevance threshold
        3b. CROSS-CHECK: Validate domain keyword relevance
        4. Build Llama prompt with [DOKTRIN] and [SORU] blocks
        5. Generate concise Turkish free-form response via Llama
        6. Return response + cited rule (if relevant)
    """
    start_time = time.time()

    query = request.query.strip()
    logger.info("Chat request received [Engine: Llama]", query=query[:80])

    # ── Step 1: RAG retrieval — search doctrine from pgvector ─────────
    raw_rag_results = []
    cited_rule = ""
    try:
        raw_rag_results = rag_engine.search(query_text=query, top_k=3)
    except Exception as e:
        logger.warning(f"RAG retrieval failed for chat (continuing without context): {e}")

    # ── Step 2: Smart RAG filtering — only keep genuinely relevant results
    relevant_rag = []
    rag_context_str = ""
    if raw_rag_results:
        top_score = raw_rag_results[0].get("score", 0)
        if top_score >= RAG_RELEVANCE_THRESHOLD:
            relevant_rag = [
                r for r in raw_rag_results
                if r.get("score", 0) >= RAG_RELEVANCE_THRESHOLD
            ]
            # Build flat doctrine string for Llama prompt
            doctrine_lines = []
            for r in relevant_rag:
                rule_text = r.get("context", r.get("event_description", ""))
                if rule_text:
                    doctrine_lines.append(f"- {rule_text}")
            rag_context_str = "\n".join(doctrine_lines)
            cited_rule = relevant_rag[0].get("context", "") if relevant_rag else ""

            # ── Step 2b: Domain keyword cross-check ──────────────────
            # If the top rule's domain doesn't match the query's domain,
            # clear cited_rule (don't show it), but still pass context to
            # LLM so it can make its own judgment via KURAL 2.
            if cited_rule and not _validate_rag_relevance(query, cited_rule):
                cited_rule = ""  # Don't display misleading rule
                rag_context_str = ""  # Don't confuse the LLM either

            logger.info(
                "RAG context RELEVANT for chat",
                raw_hits=len(raw_rag_results),
                relevant_hits=len(relevant_rag),
                top_score=round(top_score, 4),
                cited_rule_kept=bool(cited_rule),
            )
        else:
            logger.info(
                "RAG context DISCARDED (below threshold)",
                raw_hits=len(raw_rag_results),
                top_score=round(top_score, 4),
                threshold=RAG_RELEVANCE_THRESHOLD,
            )

    # ── Step 3: Build history list for multi-turn chat ────────────────
    history_dicts = None
    if request.history:
        history_dicts = [{"role": h.role, "content": h.content} for h in request.history]
        logger.info("Chat history provided", history_turns=len(history_dicts))

    # ── Step 3b: @Mention extraction — fetch real-time asset data ─────
    mention_ids = _extract_mentions(query)
    mention_ctx = ""
    if mention_ids:
        mention_ctx = _fetch_mention_context(mention_ids)

    # ── Step 4: Generate response (Groq primary, local Llama fallback) ──
    # NOTE: Run in a worker thread so the FastAPI event loop is NOT blocked
    # while Gemma is busy on the GPU. Without this offload, a long Gemma
    # /analyze (15-20s GPU sync) would force every concurrent /chat request
    # to queue behind it, masquerading as "Groq is slow".
    try:
        response_text = await asyncio.to_thread(
            model_engine.generate_chat,
            query,
            rag_context_str,
            history_dicts,
            mention_ctx,
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        response_text = (
            "AI modeli şu anda yanıt veremiyor. "
            "Lütfen daha sonra tekrar deneyin veya sistem yöneticisine başvurun."
        )

    elapsed_ms = (time.time() - start_time) * 1000

    return ChatResponse(
        response=response_text,
        cited_rule=cited_rule,
        rag_hits=len(relevant_rag),
        processing_time_ms=round(elapsed_ms, 2),
    )


# ============================================================================
#           ANALYZE ENDPOINT (Engine 1: Gemma-2-9b-it + LoRA)
# ============================================================================

@app.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_telemetry(request: AnalysisRequest):
    """
    RAG-augmented tactical analysis pipeline.
    
    Engine: Gemma-2-9b-it (with LoRA tactical adapter)

    Pipeline:
        1. Convert telemetry → natural-language summary
        2. pgvector cosine search → top-K engagement rules
        3. Build Gemma prompt: System + Context(rules) + Situation(telemetry)
        4. Parse JSON response → AnalysisResponse
    """
    start_time = time.time()

    telemetry = request.telemetry
    entity_type = telemetry.type
    entity_id = telemetry.source_id

    logger.info(
        f"Analyzing {entity_type} telemetry [Engine: Gemma]",
        entity_id=entity_id,
        entity_type=entity_type,
    )

    # ── Step 1: Create telemetry summary for RAG query ───────────────
    telemetry_summary = _create_telemetry_summary(telemetry)

    # ── Step 2: RAG retrieval — engagement rules from pgvector ───────
    context_items: list[ContextItem] = []
    if request.include_context:
        try:
            raw_context = rag_engine.search(
                query_text=telemetry_summary,
                top_k=request.max_context_items,
            )
            context_items = [
                ContextItem(
                    event_description=c["context"],
                    outcome=c.get("category", ""),
                    similarity_score=c["score"],
                    timestamp=None,
                )
                for c in raw_context
            ]
            logger.info(
                "RAG context retrieved",
                hits=len(context_items),
                top_score=context_items[0].similarity_score if context_items else 0,
            )
        except Exception as e:
            logger.warning(f"RAG retrieval failed (continuing without context): {e}")

    # ── Step 3: AI decision — Gemma with RAG context ─────────────────
    # Run on a worker thread; Gemma inference is GPU-sync (~15-20s) and would
    # otherwise block the event loop and stall every other request.
    try:
        decision, threat_level, confidence, reasoning = await asyncio.to_thread(
            model_engine.generate_analysis,
            telemetry,
            [c.model_dump() for c in context_items],
        )
    except Exception as e:
        logger.error(f"Gemma analysis generation failed: {e}")
        decision = f"Unable to generate decision for {entity_type} — model unavailable"
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
        model_version=settings.MODEL_NAME,
    )


# ============================================================================
#                     TELEMETRY → TEXT SUMMARY
# ============================================================================

def _create_telemetry_summary(telemetry: TelemetryInput) -> str:
    """
    Convert polymorphic telemetry to a natural-language summary
    optimised for cosine similarity against engagement rules.

    Examples:
        "Drone UAV-01 altitude 150m speed 12.5m/s battery 18% mode AUTO ..."
        "Soldier ALPHA-2 heart rate 185 BPM SpO2 88% status INJURED ..."
    """
    entity_type = telemetry.type
    entity_id = telemetry.source_id
    parts = [f"{entity_type.title()} {entity_id}"]

    if isinstance(telemetry, DroneTelemetry):
        parts.append(f"altitude {telemetry.altitude}m")
        parts.append(f"speed {telemetry.speed}m/s")
        parts.append(f"battery {telemetry.battery_level}%")
        mode_str = getattr(telemetry.mode, "value", telemetry.mode)
        parts.append(f"mode {mode_str}")

    elif isinstance(telemetry, SoldierTelemetry):
        parts.append(f"heart rate {telemetry.vitals.hr_bpm} BPM")
        parts.append(f"SpO2 {telemetry.vitals.spo2}%")
        parts.append(f"status {telemetry.status}")
        if telemetry.vitals.stress_index is not None:
            parts.append(f"stress {telemetry.vitals.stress_index:.2f}")

    elif isinstance(telemetry, VehicleTelemetry):
        vtype_str = getattr(telemetry.vehicle_type, "value", telemetry.vehicle_type)
        parts.append(f"type {vtype_str}")
        parts.append(f"speed {telemetry.speed} km/h")
        parts.append(f"fuel {telemetry.fuel_pct}%")
        if telemetry.health_pct is not None:
            parts.append(f"health {telemetry.health_pct}%")

    parts.append(f"at ({telemetry.latitude:.4f}, {telemetry.longitude:.4f})")
    return ", ".join(parts)


# ============================================================================
#                  INGEST ENDPOINT (Add Rules / Events to Memory)
# ============================================================================

@app.post("/ingest", response_model=IngestResponse, tags=["Memory"])
async def ingest_event(request: IngestRequest):
    """
    Ingest a new engagement rule or tactical event into pgvector memory.
    The text is embedded automatically and stored for future RAG retrieval.
    """
    try:
        event_id = rag_engine.ingest(
            context=request.event_description,
            category=request.threat_category or "ENGAGEMENT_RULE",
            source=request.source_platform or "API",
        )
        return IngestResponse(
            success=True,
            event_id=event_id,
            message="Event ingested into tactical memory (pgvector)",
            embedding_generated=True,
        )
    except Exception as e:
        logger.error(f"Ingest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/stats", tags=["Memory"])
async def get_memory_stats():
    """Get statistics about the tactical memory (pgvector RAG store)."""
    try:
        return rag_engine.get_memory_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
#                           TRAINING ENDPOINT (LoRA — Gemma Only)
# ============================================================================

def _run_training(request: TrainingRequest):
    """Background task for LoRA training (Gemma engine only)."""
    examples = [e.model_dump() for e in request.training_examples]
    model_engine.train_lora(
        training_examples=examples,
        epochs=request.epochs,
        learning_rate=request.learning_rate,
        batch_size=request.batch_size,
        adapter_name=request.save_adapter_name,
    )


@app.post("/train", response_model=TrainingResponse, tags=["Training"])
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Start LoRA fine-tuning as a background task (Gemma engine only)."""
    from datetime import datetime

    job_id = f"train_{request.save_adapter_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    background_tasks.add_task(_run_training, request)

    return TrainingResponse(
        job_id=job_id,
        status=TrainingStatus.PENDING,
        message=f"Training queued with {len(request.training_examples)} examples",
        started_at=datetime.utcnow(),
        estimated_duration_minutes=len(request.training_examples) * request.epochs * 0.5,
    )


@app.get("/train/{job_id}", tags=["Training"])
async def get_training_status(job_id: str):
    """Get status of a training job."""
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
    Debug: validate telemetry parsing + show RAG search results
    without running the LLM.
    """
    telemetry = request.telemetry
    summary = _create_telemetry_summary(telemetry)

    # Run RAG search for debugging
    rag_results = []
    try:
        rag_results = rag_engine.search(summary, top_k=3)
    except Exception:
        pass

    return {
        "validated": True,
        "entity_type": telemetry.type,
        "entity_id": telemetry.source_id,
        "model_class": telemetry.__class__.__name__,
        "serialized_json": telemetry.model_dump_json(indent=2),
        "summary_for_rag": summary,
        "rag_search_results": rag_results,
        "engine_info": model_engine.get_model_info(),
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
        reload=settings.DEBUG,
    )
