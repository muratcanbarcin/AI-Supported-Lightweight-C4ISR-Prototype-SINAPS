-- ============================================================
-- SQL Script: Enable pgvector and Create tactical_memory Table
-- Purpose: Support RAG-based tactical decision memory for C4ISR
-- ============================================================

-- Enable the vector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the tactical_memory table for storing historical events
CREATE TABLE IF NOT EXISTS tactical_memory (
    id SERIAL PRIMARY KEY,
    event_description TEXT NOT NULL,
    embedding vector(384),  -- Matches all-MiniLM-L6-v2 output dimension
    outcome TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata for future analysis
    source_platform VARCHAR(100),  -- e.g., "UAV-001", "RADAR-STATION-A"
    threat_category VARCHAR(50),   -- e.g., "HOSTILE", "UNKNOWN", "FRIENDLY"
    confidence_score FLOAT DEFAULT 0.0
);

-- Create an index for fast vector similarity search using HNSW
-- HNSW (Hierarchical Navigable Small World) provides fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS tactical_memory_embedding_idx 
ON tactical_memory 
USING hnsw (embedding vector_cosine_ops);

-- Create index on timestamp for temporal queries
CREATE INDEX IF NOT EXISTS tactical_memory_timestamp_idx 
ON tactical_memory (timestamp DESC);

-- Create index on threat_category for filtering
CREATE INDEX IF NOT EXISTS tactical_memory_threat_idx 
ON tactical_memory (threat_category);

-- Insert sample tactical events for testing
INSERT INTO tactical_memory (event_description, outcome, source_platform, threat_category, confidence_score) VALUES
(
    'Unidentified aerial contact detected at bearing 045, altitude 5000m, speed 450 knots, no IFF response',
    'Escalate to DEFCON 3, scramble interceptors, establish communication on guard frequency',
    'RADAR-STATION-ALPHA',
    'UNKNOWN',
    0.85
),
(
    'Maritime vessel approaching restricted zone at 15 knots, not responding to radio hails',
    'Deploy patrol boat for visual identification, prepare warning shots if continues approach',
    'COASTAL-RADAR-01',
    'UNKNOWN',
    0.72
),
(
    'Electronic warfare signature detected, possible jamming attempt on communication frequencies',
    'Switch to backup communication channels, activate anti-jamming protocols, alert cyber defense',
    'EW-STATION-BRAVO',
    'HOSTILE',
    0.91
);

-- Grant necessary permissions (adjust as needed for your deployment)
GRANT ALL PRIVILEGES ON TABLE tactical_memory TO admin;
GRANT USAGE, SELECT ON SEQUENCE tactical_memory_id_seq TO admin;

COMMENT ON TABLE tactical_memory IS 'Stores historical tactical events with vector embeddings for RAG-based decision support';
COMMENT ON COLUMN tactical_memory.embedding IS 'Vector embedding (384-dim) from all-MiniLM-L6-v2 for semantic similarity search';
COMMENT ON COLUMN tactical_memory.outcome IS 'The confirmed correct response/action taken for this event';
