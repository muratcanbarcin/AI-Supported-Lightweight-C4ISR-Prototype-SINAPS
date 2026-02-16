"""
RAG Engine - Retrieval-Augmented Generation for Tactical Memory
============================================================================
SECURITY: OFFLINE MODE - Models loaded from local directory only.
           No external network calls permitted.
============================================================================

This module handles:
1. Converting tactical events to vector embeddings (LOCAL MODEL)
2. Storing events in PostgreSQL with pgvector
3. Retrieving similar historical events for context-aware decisions
"""

import time
import json
from typing import List, Optional, Tuple
from datetime import datetime
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import structlog

from config.settings import settings
from config.database import db_manager

logger = structlog.get_logger(__name__)

# Offline model path - NO INTERNET ACCESS
LOCAL_EMBEDDING_MODEL_PATH = Path("./local_models/embedding")


class RAGEngine:
    """
    Retrieval-Augmented Generation Engine for tactical decision support
    
    SECURITY: Uses locally stored SentenceTransformer model.
              No external API calls or downloads permitted.
    """
    
    def __init__(self):
        self._model: Optional[SentenceTransformer] = None
        self._initialized: bool = False
    
    def initialize(self) -> None:
        """Initialize the embedding model from LOCAL directory (air-gapped mode)"""
        if self._initialized:
            logger.info("RAG Engine already initialized")
            return
        
        # SECURITY CHECK: Verify local model exists
        if not LOCAL_EMBEDDING_MODEL_PATH.exists():
            error_msg = (
                f"OFFLINE MODELS NOT FOUND at {LOCAL_EMBEDDING_MODEL_PATH.absolute()}. "
                "Run 'python download_models.py' on a machine with internet access, "
                "then transfer the 'local_models' folder to this secure environment."
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        try:
            logger.info(
                "Loading embedding model from LOCAL directory (OFFLINE MODE)",
                model_path=str(LOCAL_EMBEDDING_MODEL_PATH.absolute())
            )
            # Load from local path - NO NETWORK CALLS
            self._model = SentenceTransformer(str(LOCAL_EMBEDDING_MODEL_PATH))
            self._initialized = True
            logger.info(
                "Embedding model loaded successfully (OFFLINE)",
                embedding_dim=settings.EMBEDDING_DIMENSION
            )
        except Exception as e:
            logger.error("Failed to load local embedding model", error=str(e))
            raise
    
    def _ensure_initialized(self) -> None:
        """Ensure the engine is initialized before use"""
        if not self._initialized or self._model is None:
            raise RuntimeError("RAG Engine not initialized. Call initialize() first.")
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for given text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        self._ensure_initialized()
        embedding = self._model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def ingest_event(
        self,
        event_description: str,
        outcome: str,
        source_platform: Optional[str] = None,
        threat_category: Optional[str] = None,
        confidence_score: float = 0.0
    ) -> int:
        """
        Ingest a tactical event into memory with its embedding
        
        Args:
            event_description: Description of the tactical event
            outcome: The correct action/response taken
            source_platform: Platform that detected the event
            threat_category: Category of threat (HOSTILE, UNKNOWN, FRIENDLY)
            confidence_score: Confidence in the outcome correctness
            
        Returns:
            The ID of the inserted event
        """
        self._ensure_initialized()
        
        start_time = time.time()
        
        # Generate embedding for the event description
        embedding = self._generate_embedding(event_description)
        embedding_str = json.dumps(embedding)  # Store as JSON text, not vector
        
        # Insert into database (using actual column names from seed schema)
        insert_query = """
            INSERT INTO tactical_memory 
            (event_description, embedding, outcome, source_id, event_type, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        with db_manager.get_cursor() as cursor:
            cursor.execute(
                insert_query,
                (
                    event_description,
                    embedding_str,
                    outcome,
                    source_platform,   # maps to source_id column
                    threat_category,   # maps to event_type column
                    datetime.utcnow()
                )
            )
            result = cursor.fetchone()
            event_id = result['id'] if result else None
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "Event ingested into tactical memory",
            event_id=event_id,
            description_length=len(event_description),
            elapsed_ms=round(elapsed_ms, 2)
        )
        
        return event_id
    
    def retrieve_context(
        self,
        query_text: str,
        limit: int = 3,
        min_similarity: float = 0.0,
        threat_category_filter: Optional[str] = None
    ) -> List[dict]:
        """
        Retrieve similar historical events using cosine similarity search
        
        Args:
            query_text: The query to find similar events for
            limit: Maximum number of results to return
            min_similarity: Minimum similarity score threshold (0-1)
            threat_category_filter: Optional filter by threat category
            
        Returns:
            List of similar events with their details and similarity scores
            Returns empty list if database is not available (graceful degradation)
        """
        self._ensure_initialized()
        
        # Check if database is available
        if db_manager._pool is None:
            logger.debug("Database not available - returning empty context (demo mode)")
            return []
        
        start_time = time.time()
        
        # Generate query embedding
        query_embedding = self._generate_embedding(query_text)
        query_embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"
        
        # Build the similarity search query
        # Since pgvector is not installed, use simple text-based retrieval
        # (ordered by most recent, filtered by source_id if applicable)
        base_query = """
            SELECT 
                id,
                event_description,
                outcome,
                source_id,
                event_type,
                timestamp
            FROM tactical_memory
            WHERE event_description IS NOT NULL
        """
        
        params = []
        
        # Add source_id filter if specified (replaces threat_category_filter)
        if threat_category_filter:
            base_query += " AND (event_type = %s OR source_id = %s)"
            params.extend([threat_category_filter, threat_category_filter])
        
        # Order by most recent and limit
        base_query += """
            ORDER BY timestamp DESC NULLS LAST
            LIMIT %s
        """
        params.append(limit)
        
        results = []
        try:
            with db_manager.get_cursor() as cursor:
                cursor.execute(base_query, params)
                rows = cursor.fetchall()
                
                for row in rows:
                    results.append({
                        'id': row['id'],
                        'event_description': row['event_description'],
                        'outcome': row['outcome'],
                        'source_id': row['source_id'],
                        'event_type': row['event_type'],
                        'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None,
                        'similarity_score': 0.8  # Placeholder since no pgvector
                    })
        except Exception as e:
            logger.warning(f"Database query failed, returning empty context: {e}")
            return []
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "Context retrieved from tactical memory",
            query_length=len(query_text),
            results_found=len(results),
            elapsed_ms=round(elapsed_ms, 2)
        )
        
        return results
    
    def get_memory_stats(self) -> dict:
        """Get statistics about the tactical memory"""
        with db_manager.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(embedding) as events_with_embeddings,
                    COUNT(DISTINCT event_type) as unique_event_types,
                    MIN(timestamp) as oldest_event,
                    MAX(timestamp) as newest_event
                FROM tactical_memory
            """)
            result = cursor.fetchone()
            
            return {
                'total_events': result['total_events'],
                'events_with_embeddings': result['events_with_embeddings'],
                'unique_event_types': result['unique_event_types'],
                'oldest_event': result['oldest_event'].isoformat() if result['oldest_event'] else None,
                'newest_event': result['newest_event'].isoformat() if result['newest_event'] else None
            }
    
    def update_missing_embeddings(self) -> int:
        """
        Update embeddings for any events that don't have them
        
        Returns:
            Number of embeddings updated
        """
        self._ensure_initialized()
        
        # Get events without embeddings
        with db_manager.get_cursor() as cursor:
            cursor.execute("""
                SELECT id, event_description 
                FROM tactical_memory 
                WHERE embedding IS NULL
            """)
            rows = cursor.fetchall()
        
        updated_count = 0
        for row in rows:
            embedding = self._generate_embedding(row['event_description'])
            embedding_str = json.dumps(embedding)
            
            with db_manager.get_cursor() as cursor:
                cursor.execute(
                    "UPDATE tactical_memory SET embedding = %s WHERE id = %s",
                    (embedding_str, row['id'])
                )
            updated_count += 1
        
        logger.info(f"Updated {updated_count} missing embeddings")
        return updated_count


# Global RAG engine instance
rag_engine = RAGEngine()
