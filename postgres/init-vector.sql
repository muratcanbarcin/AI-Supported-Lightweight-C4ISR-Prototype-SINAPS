-- ============================================================
-- SQL Script: Enable Extensions and Create Tables for C4ISR
-- Purpose: Support geospatial data (PostGIS) and tactical memory
-- ============================================================

-- Enable PostGIS extension for geospatial data (geometry types, spatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Note: pgvector is NOT required. Embedding stored as TEXT (JSON array).
-- If pgvector becomes available, migrate embedding column to vector(384).

-- Create the tactical_memory table for storing historical events
CREATE TABLE IF NOT EXISTS tactical_memory (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    event_description TEXT,
    source_id VARCHAR(100),
    location geometry(Point, 4326),
    timestamp TIMESTAMP,
    outcome TEXT,
    lessons_learned TEXT,
    embedding TEXT,  -- JSON array of floats (pgvector not required)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for temporal queries
CREATE INDEX IF NOT EXISTS tactical_memory_timestamp_idx 
ON tactical_memory (timestamp DESC);

-- Create index on source_id for filtering
CREATE INDEX IF NOT EXISTS tactical_memory_source_idx 
ON tactical_memory (source_id);

-- Create index on event_type for filtering
CREATE INDEX IF NOT EXISTS tactical_memory_event_type_idx 
ON tactical_memory (event_type);

-- Insert sample tactical events for testing
INSERT INTO tactical_memory (event_description, outcome, source_id, event_type) VALUES
(
    'Unidentified aerial contact detected at bearing 045, altitude 5000m, speed 450 knots, no IFF response',
    'Escalate to DEFCON 3, scramble interceptors, establish communication on guard frequency',
    'RADAR-STATION-ALPHA',
    'UNKNOWN_CONTACT'
),
(
    'Maritime vessel approaching restricted zone at 15 knots, not responding to radio hails',
    'Deploy patrol boat for visual identification, prepare warning shots if continues approach',
    'COASTAL-RADAR-01',
    'UNKNOWN_CONTACT'
),
(
    'Electronic warfare signature detected, possible jamming attempt on communication frequencies',
    'Switch to backup communication channels, activate anti-jamming protocols, alert cyber defense',
    'EW-STATION-BRAVO',
    'HOSTILE_ACTION'
);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE tactical_memory TO admin;
GRANT USAGE, SELECT ON SEQUENCE tactical_memory_id_seq TO admin;

COMMENT ON TABLE tactical_memory IS 'Stores historical tactical events with embeddings for RAG-based decision support';
COMMENT ON COLUMN tactical_memory.embedding IS 'Vector embedding stored as JSON text array (384-dim from all-MiniLM-L6-v2)';
COMMENT ON COLUMN tactical_memory.outcome IS 'The confirmed correct response/action taken for this event';
