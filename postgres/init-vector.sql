-- ============================================================
-- C4ISR DATABASE INITIALIZATION
-- Purpose: Enable pgvector + PostGIS, create tactical_memory
-- Run Order: 02 (after default PG init)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;    -- pgvector for similarity search
CREATE EXTENSION IF NOT EXISTS postgis;   -- PostGIS for geospatial

-- ============================================================
-- tactical_memory: RAG Vector Store for Engagement Rules
-- Stores military doctrine, historical events, and lessons learned
-- with 384-dimensional embeddings (all-MiniLM-L6-v2)
-- ============================================================
CREATE TABLE IF NOT EXISTS tactical_memory (
    id          BIGSERIAL PRIMARY KEY,
    context     TEXT NOT NULL,              -- Rule/doctrine/event description
    embedding   vector(384),               -- all-MiniLM-L6-v2 = 384 dimensions
    category    VARCHAR(100),              -- ENGAGEMENT_RULE, HISTORICAL_EVENT, SOP, etc.
    source      VARCHAR(200),              -- Origin document / platform
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast cosine similarity search
-- cosine_ops = 1 - cosine_similarity (lower = more similar)
CREATE INDEX IF NOT EXISTS tactical_memory_embedding_idx
ON tactical_memory
USING hnsw (embedding vector_cosine_ops);

-- Auxiliary indexes
CREATE INDEX IF NOT EXISTS tactical_memory_category_idx
ON tactical_memory (category);

CREATE INDEX IF NOT EXISTS tactical_memory_created_idx
ON tactical_memory (created_at DESC);

-- Permissions
GRANT ALL PRIVILEGES ON TABLE tactical_memory TO admin;
GRANT USAGE, SELECT ON SEQUENCE tactical_memory_id_seq TO admin;

-- Metadata
COMMENT ON TABLE  tactical_memory            IS 'RAG vector store — engagement rules, doctrine, historical events';
COMMENT ON COLUMN tactical_memory.context    IS 'Natural language description (embedded for similarity search)';
COMMENT ON COLUMN tactical_memory.embedding  IS '384-dim vector from all-MiniLM-L6-v2 sentence transformer';
COMMENT ON COLUMN tactical_memory.category   IS 'Rule category: ENGAGEMENT_RULE, SOP, HISTORICAL_EVENT, MEDICAL_RULE';
