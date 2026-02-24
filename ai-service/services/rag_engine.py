"""
RAG Engine — Retrieval-Augmented Generation for C4ISR Tactical Memory
============================================================================
SECURITY: OFFLINE MODE — Embedding model loaded from local directory only.
           No external network calls permitted.
============================================================================

Pipeline:
    1. Convert tactical query to 384-dim embedding (all-MiniLM-L6-v2)
    2. Search PostgreSQL pgvector with cosine similarity (<=> operator)
    3. Return top-K engagement rules / historical context for Gemma prompt

Schema (tactical_memory) — supports two variants:
    Variant A (init-vector.sql):                  Variant B (tsk_seed.sql):
    ─────────────────────────────                 ──────────────────────────
    id          BIGSERIAL PK                      id          BIGSERIAL PK
    context     TEXT NOT NULL                     event_type  VARCHAR(100)
    embedding   vector(384)                       event_description TEXT
    category    VARCHAR(100)                      source_id   VARCHAR(100)
    source      VARCHAR(200)                      embedding   vector(384)
    created_at  TIMESTAMP                         created_at  TIMESTAMP

    The RAG engine uses COALESCE to handle both column layouts.
"""

import time
from typing import List, Optional
from pathlib import Path
from sentence_transformers import SentenceTransformer
import structlog

from config.settings import settings
from config.database import db_manager

logger = structlog.get_logger(__name__)

# ── Offline model path — NO INTERNET ACCESS ──────────────────────────
LOCAL_EMBEDDING_MODEL_PATH = Path("./local_models/embedding")


class RAGEngine:
    """
    Retrieval-Augmented Generation engine backed by PostgreSQL + pgvector.

    Usage:
        rag_engine.initialize()                      # load embedding model
        results = rag_engine.search("drone low battery", top_k=3)
        # → [{"context": "If UAV battery < 20% ...", "score": 0.87}, ...]
    """

    def __init__(self):
        self._model: Optional[SentenceTransformer] = None
        self._initialized: bool = False

    # ── Lifecycle ─────────────────────────────────────────────────────

    def initialize(self) -> None:
        """Load the embedding model from local directory (air-gapped mode)."""
        if self._initialized:
            logger.info("RAG Engine already initialized")
            return

        if not LOCAL_EMBEDDING_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"OFFLINE EMBEDDING MODEL NOT FOUND at {LOCAL_EMBEDDING_MODEL_PATH.absolute()}. "
                "Run 'python download_models.py' on a machine with internet, "
                "then transfer 'local_models/' to this secure environment."
            )

        logger.info(
            "Loading embedding model (OFFLINE)",
            path=str(LOCAL_EMBEDDING_MODEL_PATH.absolute()),
        )
        self._model = SentenceTransformer(str(LOCAL_EMBEDDING_MODEL_PATH))
        self._initialized = True
        logger.info(
            "✅ Embedding model loaded",
            dim=settings.EMBEDDING_DIMENSION,
        )

    def _ensure_ready(self) -> None:
        if not self._initialized or self._model is None:
            raise RuntimeError("RAG Engine not initialized. Call initialize() first.")

    # ── Core: embed ───────────────────────────────────────────────────

    def _embed(self, text: str) -> List[float]:
        """Generate 384-dim embedding vector for *text*."""
        self._ensure_ready()
        return self._model.encode(text, convert_to_numpy=True).tolist()

    # ── Core: search (pgvector cosine similarity) ────────────────────

    def search(
        self,
        query_text: str,
        top_k: int = 3,
        category_filter: Optional[str] = None,
    ) -> List[dict]:
        """
        Semantic search over tactical_memory using pgvector cosine distance.

        Args:
            query_text:       Natural language query
            top_k:            Maximum results to return
            category_filter:  Optional — restrict to a specific category

        Returns:
            List of dicts with keys: context, category, source, score
        """
        self._ensure_ready()

        # Graceful degradation when DB is not available
        if db_manager._pool is None:
            logger.debug("DB not available — returning empty context (demo mode)")
            return []

        t0 = time.time()
        query_vec = self._embed(query_text)

        # pgvector format: '[0.1, 0.2, ...]'
        vec_literal = "[" + ",".join(f"{v:.8f}" for v in query_vec) + "]"

        # ── Build SQL ────────────────────────────────────────────────
        # <=> = cosine distance   (lower = more similar)
        # score = 1 - distance    (higher = more similar, range 0–1)
        # COALESCE handles both schema variants (context vs event_description)
        sql = """
            SELECT
                id,
                COALESCE(context, event_description) AS context,
                COALESCE(category, event_type) AS category,
                COALESCE(source, source_id) AS source,
                1 - (embedding <=> %s::vector) AS score
            FROM tactical_memory
            WHERE embedding IS NOT NULL
        """
        params: list = [vec_literal]

        if category_filter:
            sql += " AND COALESCE(category, event_type) = %s"
            params.append(category_filter)

        sql += """
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """
        params.extend([vec_literal, top_k])

        # ── Execute ──────────────────────────────────────────────────
        results: List[dict] = []
        try:
            with db_manager.get_cursor() as cur:
                cur.execute(sql, params)
                for row in cur.fetchall():
                    results.append({
                        "context":  row["context"],
                        "category": row["category"],
                        "source":   row["source"],
                        "score":    round(float(row["score"]), 4),
                    })
        except Exception as exc:
            logger.warning(f"pgvector search failed — returning empty: {exc}")
            return []

        elapsed = (time.time() - t0) * 1000
        logger.info(
            "RAG search complete",
            query=query_text[:80],
            hits=len(results),
            top_score=results[0]["score"] if results else 0,
            elapsed_ms=round(elapsed, 1),
        )
        return results

    # ── Ingest (used by seed_doctrine.py & /ingest endpoint) ─────────

    def ingest(
        self,
        context: str,
        category: str = "ENGAGEMENT_RULE",
        source: str = "MANUAL",
    ) -> int:
        """
        Insert a single doctrine / event into tactical_memory with embedding.

        Returns:
            Inserted row ID
        """
        self._ensure_ready()

        vec = self._embed(context)
        vec_literal = "[" + ",".join(f"{v:.8f}" for v in vec) + "]"

        sql = """
            INSERT INTO tactical_memory (context, embedding, category, source)
            VALUES (%s, %s::vector, %s, %s)
            RETURNING id
        """
        with db_manager.get_cursor() as cur:
            cur.execute(sql, (context, vec_literal, category, source))
            row = cur.fetchone()
            return row["id"] if row else -1

    # ── Stats / Health ───────────────────────────────────────────────

    def get_memory_stats(self) -> dict:
        """Return counts and metadata about tactical_memory table."""
        if db_manager._pool is None:
            return {"status": "database_unavailable"}

        with db_manager.get_cursor() as cur:
            cur.execute("""
                SELECT
                    COUNT(*)                        AS total_rows,
                    COUNT(embedding)                AS rows_with_embedding,
                    COUNT(DISTINCT category)        AS unique_categories,
                    MIN(created_at)                 AS oldest,
                    MAX(created_at)                 AS newest
                FROM tactical_memory
            """)
            r = cur.fetchone()
            return {
                "total_rows":          r["total_rows"],
                "rows_with_embedding": r["rows_with_embedding"],
                "unique_categories":   r["unique_categories"],
                "oldest": r["oldest"].isoformat() if r["oldest"] else None,
                "newest": r["newest"].isoformat() if r["newest"] else None,
            }


# ── Global singleton ─────────────────────────────────────────────────
rag_engine = RAGEngine()
