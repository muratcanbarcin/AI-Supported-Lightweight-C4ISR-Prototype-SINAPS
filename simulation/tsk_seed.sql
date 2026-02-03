-- ============================================================================
-- TSK WARGAME SIMULATION - DATABASE SEED
-- Generated: 2026-02-03T13:13:00.405789
-- Total Assets: 321
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- DROP EXISTING TABLES (Clean slate)
-- ============================================================================

DROP TABLE IF EXISTS tactical_memory CASCADE;
DROP TABLE IF EXISTS tactical_analysis CASCADE;
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Assets table: Stores all trackable field assets
CREATE TABLE assets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DRONE', 'SOLDIER', 'VEHICLE', 'SENSOR')),
    variant VARCHAR(100),
    unit_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'WARNING', 'OFFLINE', 'IDLE', 'PATROL', 'COMBAT')),
    alignment VARCHAR(20) DEFAULT 'FRIEND' CHECK (alignment IN ('FRIEND', 'FOE', 'UNKNOWN')),
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    last_altitude DOUBLE PRECISION,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry table: Time-series data from assets
CREATE TABLE telemetry (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    source_type VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location geometry(Point, 4326),
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    battery_level INTEGER,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tactical Analysis table: AI-generated threat assessments
CREATE TABLE tactical_analysis (
    id BIGSERIAL PRIMARY KEY,
    telemetry_id BIGINT REFERENCES telemetry(id) ON DELETE CASCADE,
    threat_level VARCHAR(20),
    decision TEXT,
    reasoning TEXT,
    confidence DOUBLE PRECISION,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tactical Memory table: For AI RAG (Retrieval-Augmented Generation)
CREATE TABLE tactical_memory (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    event_description TEXT,
    source_id VARCHAR(100),
    location geometry(Point, 4326),
    timestamp TIMESTAMP,
    outcome TEXT,
    lessons_learned TEXT,
    embedding vector(384),  -- Matches all-MiniLM-L6-v2 embedding dimension
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Telemetry indexes for fast queries
CREATE INDEX idx_telemetry_source_id ON telemetry(source_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_source_timestamp ON telemetry(source_id, timestamp DESC);
CREATE INDEX idx_telemetry_location ON telemetry USING GIST(location);

-- Tactical memory vector search index
CREATE INDEX idx_tactical_memory_embedding ON tactical_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Assets index
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_status ON assets(status);

-- ============================================================================
-- INSERT ASSETS
-- ============================================================================


INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-01', 'TB2 #1', 'DRONE', 'TB2', '341. Filo', 'COMBAT', 'FRIEND', 36.23419, 36.827384, 2316.1145923627464, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-02', 'TB2 #2', 'DRONE', 'TB2', '341. Filo', 'COMBAT', 'FRIEND', 36.12831, 37.121519, 594.2504241800074, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-Akıncı-03', 'Akıncı #3', 'DRONE', 'Akıncı', '341. Filo', 'IDLE', 'FRIEND', 39.935399, 32.627716, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-Akıncı-04', 'Akıncı #4', 'DRONE', 'Akıncı', '341. Filo', 'PATROL', 'FRIEND', 36.521236, 36.41618, 1587.6296314343958, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-Akıncı-05', 'Akıncı #5', 'DRONE', 'Akıncı', '341. Filo', 'IDLE', 'FRIEND', 39.9816, 32.557409, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-Akıncı-06', 'Akıncı #6', 'DRONE', 'Akıncı', '341. Filo', 'IDLE', 'FRIEND', 39.985141, 32.607936, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-07', 'TB2 #7', 'DRONE', 'TB2', '341. Filo', 'COMBAT', 'FRIEND', 36.334333, 36.952562, 1348.7799266118163, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-08', 'TB2 #8', 'DRONE', 'TB2', '341. Filo', 'PATROL', 'FRIEND', 36.682766, 36.615024, 2932.0043352759726, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-09', 'TB2 #9', 'DRONE', 'TB2', '341. Filo', 'COMBAT', 'FRIEND', 36.228474, 37.152519, 913.7909022474814, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-Akıncı-10', 'Akıncı #10', 'DRONE', 'Akıncı', '341. Filo', 'IDLE', 'FRIEND', 39.944317, 32.604346, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-11', 'TB2 #11', 'DRONE', 'TB2', '341. Filo', 'PATROL', 'FRIEND', 36.526679, 36.454814, 2936.1554406613877, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('341. Filo-TB2-12', 'TB2 #12', 'DRONE', 'TB2', '341. Filo', 'COMBAT', 'FRIEND', 36.132289, 37.139956, 1996.5862430658533, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-01', 'ANKA-S #1', 'DRONE', 'ANKA-S', '342. Filo', 'IDLE', 'FRIEND', 39.989437, 32.606056, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-02', 'TB2 #2', 'DRONE', 'TB2', '342. Filo', 'PATROL', 'FRIEND', 36.488561, 36.46462, 2133.5899043071295, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-03', 'TB2 #3', 'DRONE', 'TB2', '342. Filo', 'PATROL', 'FRIEND', 36.629024, 36.577661, 2493.768015863329, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-04', 'TB2 #4', 'DRONE', 'TB2', '342. Filo', 'IDLE', 'FRIEND', 39.974437, 32.641549, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-05', 'ANKA-S #5', 'DRONE', 'ANKA-S', '342. Filo', 'COMBAT', 'FRIEND', 36.025011, 36.862545, 1416.448294718446, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-06', 'ANKA-S #6', 'DRONE', 'ANKA-S', '342. Filo', 'PATROL', 'FRIEND', 36.616882, 36.52508, 1217.7974242511932, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-07', 'TB2 #7', 'DRONE', 'TB2', '342. Filo', 'PATROL', 'FRIEND', 36.552667, 36.501323, 2845.940605927578, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-08', 'ANKA-S #8', 'DRONE', 'ANKA-S', '342. Filo', 'IDLE', 'FRIEND', 39.977337, 32.564112, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-09', 'ANKA-S #9', 'DRONE', 'ANKA-S', '342. Filo', 'PATROL', 'FRIEND', 36.487689, 36.581375, 2615.3302391987045, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-10', 'ANKA-S #10', 'DRONE', 'ANKA-S', '342. Filo', 'PATROL', 'FRIEND', 36.525086, 36.574151, 2582.543090270408, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-11', 'TB2 #11', 'DRONE', 'TB2', '342. Filo', 'COMBAT', 'FRIEND', 36.249894, 36.845547, 2449.5750034633666, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-12', 'TB2 #12', 'DRONE', 'TB2', '342. Filo', 'IDLE', 'FRIEND', 39.970276, 32.56217, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-ANKA-S-13', 'ANKA-S #13', 'DRONE', 'ANKA-S', '342. Filo', 'COMBAT', 'FRIEND', 36.12144, 36.986186, 1346.9197541758626, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-14', 'TB2 #14', 'DRONE', 'TB2', '342. Filo', 'IDLE', 'FRIEND', 39.987819, 32.58954, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('342. Filo-TB2-15', 'TB2 #15', 'DRONE', 'TB2', '342. Filo', 'PATROL', 'FRIEND', 36.578581, 36.61639, 2250.735774829048, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-01', 'TB2 #1', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.700619, 36.632538, 1383.0693319579796, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-02', 'TB2 #2', 'DRONE', 'TB2', '343. Filo', 'COMBAT', 'FRIEND', 36.359527, 37.111164, 2243.8998996677515, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-03', 'TB2 #3', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.669767, 36.447585, 2526.872358627571, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-04', 'TB2 #4', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.589619, 36.39889, 964.8611375921946, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-05', 'TB2 #5', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.511738, 36.37554, 1336.6011031835783, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-06', 'TB2 #6', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.493304, 36.612498, 1201.6001695846367, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-07', 'TB2 #7', 'DRONE', 'TB2', '343. Filo', 'COMBAT', 'FRIEND', 36.259504, 37.07925, 2787.742832787354, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-08', 'TB2 #8', 'DRONE', 'TB2', '343. Filo', 'PATROL', 'FRIEND', 36.651553, 36.565475, 2879.348077642967, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-09', 'TB2 #9', 'DRONE', 'TB2', '343. Filo', 'COMBAT', 'FRIEND', 36.093348, 36.925119, 2333.2572575502404, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('343. Filo-TB2-10', 'TB2 #10', 'DRONE', 'TB2', '343. Filo', 'COMBAT', 'FRIEND', 36.151491, 36.977355, 1330.6478325531011, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-01', 'ANKA-S #1', 'DRONE', 'ANKA-S', '344. Filo', 'PATROL', 'FRIEND', 36.632901, 36.394153, 1613.8006055950793, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-02', 'ANKA-S #2', 'DRONE', 'ANKA-S', '344. Filo', 'IDLE', 'FRIEND', 39.973436, 32.624857, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-TB2-03', 'TB2 #3', 'DRONE', 'TB2', '344. Filo', 'PATROL', 'FRIEND', 36.472682, 36.535235, 1113.9547315135583, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-TB2-04', 'TB2 #4', 'DRONE', 'TB2', '344. Filo', 'PATROL', 'FRIEND', 36.477795, 36.603322, 2531.207462240993, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-TB2-05', 'TB2 #5', 'DRONE', 'TB2', '344. Filo', 'COMBAT', 'FRIEND', 36.242326, 36.858896, 2542.4370087150414, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-06', 'ANKA-S #6', 'DRONE', 'ANKA-S', '344. Filo', 'COMBAT', 'FRIEND', 36.031093, 36.849114, 1951.4927729870096, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-TB2-07', 'TB2 #7', 'DRONE', 'TB2', '344. Filo', 'COMBAT', 'FRIEND', 36.314335, 36.91652, 751.6936086846849, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-08', 'ANKA-S #8', 'DRONE', 'ANKA-S', '344. Filo', 'PATROL', 'FRIEND', 36.705762, 36.373231, 2603.48076907396, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-09', 'ANKA-S #9', 'DRONE', 'ANKA-S', '344. Filo', 'COMBAT', 'FRIEND', 36.268195, 37.042962, 1771.6474285888771, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-10', 'ANKA-S #10', 'DRONE', 'ANKA-S', '344. Filo', 'IDLE', 'FRIEND', 39.907731, 32.57182, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-11', 'ANKA-S #11', 'DRONE', 'ANKA-S', '344. Filo', 'IDLE', 'FRIEND', 39.957035, 32.555584, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-12', 'ANKA-S #12', 'DRONE', 'ANKA-S', '344. Filo', 'PATROL', 'FRIEND', 36.687555, 36.461355, 2417.562785215527, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-13', 'ANKA-S #13', 'DRONE', 'ANKA-S', '344. Filo', 'IDLE', 'FRIEND', 39.990741, 32.625118, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('344. Filo-ANKA-S-14', 'ANKA-S #14', 'DRONE', 'ANKA-S', '344. Filo', 'PATROL', 'FRIEND', 36.465962, 36.59733, 1623.9556284187736, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-ANKA-S-01', 'ANKA-S #1', 'DRONE', 'ANKA-S', '345. Filo', 'COMBAT', 'FRIEND', 36.037536, 37.102344, 2557.250947395027, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-ANKA-S-02', 'ANKA-S #2', 'DRONE', 'ANKA-S', '345. Filo', 'COMBAT', 'FRIEND', 36.219503, 37.035425, 1740.951529883222, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-03', 'Akıncı #3', 'DRONE', 'Akıncı', '345. Filo', 'PATROL', 'FRIEND', 36.729714, 36.431175, 672.9761489668352, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-04', 'Akıncı #4', 'DRONE', 'Akıncı', '345. Filo', 'COMBAT', 'FRIEND', 36.229168, 36.867779, 2332.9132270768964, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-05', 'Akıncı #5', 'DRONE', 'Akıncı', '345. Filo', 'PATROL', 'FRIEND', 36.568872, 36.435334, 1621.219393068576, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-06', 'Akıncı #6', 'DRONE', 'Akıncı', '345. Filo', 'IDLE', 'FRIEND', 39.912413, 32.640807, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-ANKA-S-07', 'ANKA-S #7', 'DRONE', 'ANKA-S', '345. Filo', 'COMBAT', 'FRIEND', 36.310144, 36.929773, 2730.346564731618, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-08', 'Akıncı #8', 'DRONE', 'Akıncı', '345. Filo', 'PATROL', 'FRIEND', 36.68753, 36.630228, 2761.0419599391053, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-09', 'Akıncı #9', 'DRONE', 'Akıncı', '345. Filo', 'PATROL', 'FRIEND', 36.654498, 36.634641, 2983.921873997543, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-ANKA-S-10', 'ANKA-S #10', 'DRONE', 'ANKA-S', '345. Filo', 'IDLE', 'FRIEND', 39.937479, 32.631671, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('345. Filo-Akıncı-11', 'Akıncı #11', 'DRONE', 'Akıncı', '345. Filo', 'IDLE', 'FRIEND', 39.913663, 32.633785, 0, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-01', 'Bordo Bereli Personel #1', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.086496, 37.018807, 32.97346590511422, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-02', 'Bordo Bereli Personel #2', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.662024, 36.47113, 37.33078550724764, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-03', 'Bordo Bereli Personel #3', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.327752, 37.031329, 0.9660524807439286, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-04', 'Bordo Bereli Personel #4', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.236757, 36.856379, 42.23164269797976, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-05', 'Bordo Bereli Personel #5', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.670697, 36.560685, 26.52179118487265, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-06', 'Bordo Bereli Personel #6', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'IDLE', 'FRIEND', 39.907208, 32.636823, 23.97222092392377, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-07', 'Bordo Bereli Personel #7', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.305235, 37.149644, 11.427504825833152, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-08', 'Bordo Bereli Personel #8', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.053193, 37.11625, 39.86272821544825, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-09', 'Bordo Bereli Personel #9', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'IDLE', 'FRIEND', 39.958062, 32.581177, 43.9559446150252, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-10', 'Bordo Bereli Personel #10', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.527391, 36.519313, 8.61694235756289, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-11', 'Bordo Bereli Personel #11', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.153155, 37.090762, 39.45285123232447, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-12', 'Bordo Bereli Personel #12', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.510343, 36.558834, 36.336037941468504, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-13', 'Bordo Bereli Personel #13', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.326414, 37.0739, 47.79316080116832, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-14', 'Bordo Bereli Personel #14', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'IDLE', 'FRIEND', 39.923125, 32.564857, 22.86609500896824, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-15', 'Bordo Bereli Personel #15', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.505518, 36.564807, 29.634945674932684, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-16', 'Bordo Bereli Personel #16', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.548337, 36.42273, 3.6062842431231035, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-17', 'Bordo Bereli Personel #17', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.118228, 36.88675, 45.5106328083934, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-18', 'Bordo Bereli Personel #18', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'IDLE', 'FRIEND', 39.990026, 32.565301, 42.13241120705004, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-19', 'Bordo Bereli Personel #19', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'IDLE', 'FRIEND', 39.943293, 32.558366, 38.11464585037758, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-20', 'Bordo Bereli Personel #20', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.66479, 36.387857, 47.5384821897968, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-21', 'Bordo Bereli Personel #21', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'PATROL', 'FRIEND', 36.469943, 36.510037, 25.25451736488978, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Alpha-22', 'Bordo Bereli Personel #22', 'SOLDIER', 'Bordo Bereli', 'OKK-Alpha', 'COMBAT', 'FRIEND', 36.33209, 36.951143, 17.447866808339118, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-01', 'Bordo Bereli Personel #1', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.722431, 36.485121, 5.880961573714588, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-02', 'Bordo Bereli Personel #2', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.471502, 36.396657, 11.943871458355664, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-03', 'Bordo Bereli Personel #3', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'IDLE', 'FRIEND', 39.96275, 32.606353, 7.817183592768185, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-04', 'Bordo Bereli Personel #4', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.597841, 36.533811, 27.769618595684086, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-05', 'Bordo Bereli Personel #5', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.555076, 36.535118, 24.400198475468976, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-06', 'Bordo Bereli Personel #6', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.350359, 37.005045, 38.113394492171636, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-07', 'Bordo Bereli Personel #7', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.709972, 36.614107, 30.07816756027239, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-08', 'Bordo Bereli Personel #8', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.09955, 37.04441, 33.569067113458026, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-09', 'Bordo Bereli Personel #9', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.280794, 37.077748, 28.064114361567157, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-10', 'Bordo Bereli Personel #10', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.333587, 36.853438, 27.393178969631133, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-11', 'Bordo Bereli Personel #11', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.490297, 36.457892, 31.024771045650496, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-12', 'Bordo Bereli Personel #12', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'IDLE', 'FRIEND', 39.936293, 32.588557, 3.1966937451665456, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-13', 'Bordo Bereli Personel #13', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.321556, 37.044787, 11.780902060893506, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-14', 'Bordo Bereli Personel #14', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.023807, 37.010324, 17.53178409034276, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-15', 'Bordo Bereli Personel #15', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.695701, 36.440144, 29.00752040871253, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-16', 'Bordo Bereli Personel #16', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'IDLE', 'FRIEND', 39.953217, 32.573091, 43.72111627911778, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-17', 'Bordo Bereli Personel #17', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'COMBAT', 'FRIEND', 36.034238, 36.944467, 29.455887566742767, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-18', 'Bordo Bereli Personel #18', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.722986, 36.449017, 23.32385580415667, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-19', 'Bordo Bereli Personel #19', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'IDLE', 'FRIEND', 39.98423, 32.614095, 6.090580872858658, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('OKK-Bravo-20', 'Bordo Bereli Personel #20', 'SOLDIER', 'Bordo Bereli', 'OKK-Bravo', 'PATROL', 'FRIEND', 36.61845, 36.388245, 5.335256778840359, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-01', 'JÖH Personel #1', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.254619, 36.98863, 36.60472767585763, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-02', 'JÖH Personel #2', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.70778, 36.408837, 28.68316659001815, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-03', 'JÖH Personel #3', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.585258, 36.556825, 29.476531358506797, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-04', 'JÖH Personel #4', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.577092, 36.597851, 43.69096638044865, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-05', 'JÖH Personel #5', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.927077, 32.555077, 44.05261157436352, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-06', 'JÖH Personel #6', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.25104, 36.823224, 14.18704242582865, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-07', 'JÖH Personel #7', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.30712, 36.94283, 2.093528877455131, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-08', 'JÖH Personel #8', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.254397, 37.120171, 47.29377023035184, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-09', 'JÖH Personel #9', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.560535, 36.521526, 42.98166857000169, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-10', 'JÖH Personel #10', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.277355, 37.099032, 40.285106549664526, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-11', 'JÖH Personel #11', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.338498, 36.921233, 39.084710190142616, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-12', 'JÖH Personel #12', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.23814, 37.070337, 24.818934085760013, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-13', 'JÖH Personel #13', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.498747, 36.614539, 8.01209893952819, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-14', 'JÖH Personel #14', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.965801, 32.578092, 38.91844710182112, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-15', 'JÖH Personel #15', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.504111, 36.536742, 29.116185660658335, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-16', 'JÖH Personel #16', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.269804, 37.112486, 4.068161605357407, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-17', 'JÖH Personel #17', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.53219, 36.417563, 28.164232133012145, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-18', 'JÖH Personel #18', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.955113, 32.587373, 13.279153478266531, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-19', 'JÖH Personel #19', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.971823, 32.615403, 1.046229951598332, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-20', 'JÖH Personel #20', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.340632, 37.044322, 4.525253505839966, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-21', 'JÖH Personel #21', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.959307, 32.573727, 15.424616104317451, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-22', 'JÖH Personel #22', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'IDLE', 'FRIEND', 39.91445, 32.570977, 4.150215896192616, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-23', 'JÖH Personel #23', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'PATROL', 'FRIEND', 36.534323, 36.597431, 45.83119763263358, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-24', 'JÖH Personel #24', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.036712, 37.108533, 31.27162374222135, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Mardin-25', 'JÖH Personel #25', 'SOLDIER', 'JÖH', 'JÖH-Mardin', 'COMBAT', 'FRIEND', 36.231376, 37.063393, 48.33652577416539, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-01', 'JÖH Personel #1', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.716123, 36.427509, 48.24355343242494, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-02', 'JÖH Personel #2', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.954518, 32.608349, 32.20761433891746, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-03', 'JÖH Personel #3', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.989617, 32.566223, 15.577018976571082, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-04', 'JÖH Personel #4', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.674214, 36.508195, 43.42013470368519, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-05', 'JÖH Personel #5', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.088762, 36.924035, 41.044488716474056, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-06', 'JÖH Personel #6', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.222652, 37.019561, 13.957031234642125, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-07', 'JÖH Personel #7', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.526715, 36.366108, 40.03823759664116, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-08', 'JÖH Personel #8', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.486301, 36.454547, 41.805402491549195, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-09', 'JÖH Personel #9', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.639518, 36.417663, 45.429082926705135, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-10', 'JÖH Personel #10', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.564572, 36.42154, 3.355750939310853, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-11', 'JÖH Personel #11', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.155469, 36.996328, 17.254172037494037, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-12', 'JÖH Personel #12', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.240612, 36.958469, 5.1433112946554, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-13', 'JÖH Personel #13', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.941981, 32.623748, 31.129722885390088, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-14', 'JÖH Personel #14', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.093473, 37.126313, 28.927051402886622, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-15', 'JÖH Personel #15', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.131237, 37.058033, 49.12393608379077, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-16', 'JÖH Personel #16', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.724975, 36.576294, 9.723949850002683, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-17', 'JÖH Personel #17', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.344843, 36.829339, 49.35701615269977, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-18', 'JÖH Personel #18', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'COMBAT', 'FRIEND', 36.056005, 36.986244, 11.834133421404259, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-19', 'JÖH Personel #19', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.965839, 32.621162, 28.90611382128127, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-20', 'JÖH Personel #20', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.94793, 32.624859, 3.521656195392875, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-21', 'JÖH Personel #21', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.465567, 36.613368, 10.992136539540793, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-22', 'JÖH Personel #22', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'PATROL', 'FRIEND', 36.640705, 36.454181, 25.330777448246884, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-23', 'JÖH Personel #23', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.989367, 32.563064, 40.162644028484486, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Şırnak-24', 'JÖH Personel #24', 'SOLDIER', 'JÖH', 'JÖH-Şırnak', 'IDLE', 'FRIEND', 39.970512, 32.59971, 34.6342009954122, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-01', 'JÖH Personel #1', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.245633, 36.870514, 46.52865111784933, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-02', 'JÖH Personel #2', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'IDLE', 'FRIEND', 39.949142, 32.62712, 48.870729962466555, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-03', 'JÖH Personel #3', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.714409, 36.549, 9.356097789618566, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-04', 'JÖH Personel #4', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.247585, 37.168641, 4.4311594758478625, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-05', 'JÖH Personel #5', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'IDLE', 'FRIEND', 39.950678, 32.576525, 37.394059983474065, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-06', 'JÖH Personel #6', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.051643, 37.058207, 10.620829367133622, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-07', 'JÖH Personel #7', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.592074, 36.474793, 22.527452882863326, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-08', 'JÖH Personel #8', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.094175, 37.078463, 15.715303030938593, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-09', 'JÖH Personel #9', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.619392, 36.580947, 5.752345898620492, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-10', 'JÖH Personel #10', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'IDLE', 'FRIEND', 39.946688, 32.600037, 44.7463881517583, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-11', 'JÖH Personel #11', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.25179, 37.069335, 11.23992275465956, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-12', 'JÖH Personel #12', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.22579, 37.141814, 7.358280279087798, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-13', 'JÖH Personel #13', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'IDLE', 'FRIEND', 39.913415, 32.621119, 16.714689776592156, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-14', 'JÖH Personel #14', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.360941, 36.972624, 13.483302389710344, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-15', 'JÖH Personel #15', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.521264, 36.389514, 26.827822663844973, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-16', 'JÖH Personel #16', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.21775, 37.047061, 5.403804178006771, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-17', 'JÖH Personel #17', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.697165, 36.400541, 49.584097716692, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-18', 'JÖH Personel #18', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'IDLE', 'FRIEND', 39.961759, 32.644047, 6.042081267511063, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-19', 'JÖH Personel #19', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.362904, 36.947826, 11.191916460095674, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-20', 'JÖH Personel #20', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.235385, 37.111019, 5.373146282066715, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-21', 'JÖH Personel #21', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.683289, 36.528154, 8.11266928924067, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-22', 'JÖH Personel #22', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'COMBAT', 'FRIEND', 36.342689, 36.947942, 28.69032019655614, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('JÖH-Hakkari-23', 'JÖH Personel #23', 'SOLDIER', 'JÖH', 'JÖH-Hakkari', 'PATROL', 'FRIEND', 36.475614, 36.372738, 8.436507281752508, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-01', 'Dağ Komando Personel #1', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.642864, 36.565343, 12.671454497376889, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-02', 'Dağ Komando Personel #2', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'IDLE', 'FRIEND', 39.908234, 32.556711, 29.26089244619044, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-03', 'Dağ Komando Personel #3', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.477283, 36.561165, 38.05093842927965, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-04', 'Dağ Komando Personel #4', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.331664, 37.136196, 18.359043629878887, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-05', 'Dağ Komando Personel #5', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.619393, 36.516141, 20.506249176824564, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-06', 'Dağ Komando Personel #6', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.718893, 36.50851, 13.69116782204009, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-07', 'Dağ Komando Personel #7', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.479827, 36.379884, 29.97074545570059, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-08', 'Dağ Komando Personel #8', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.528081, 36.46196, 36.25604618714247, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-09', 'Dağ Komando Personel #9', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.472325, 36.535915, 43.24231099289893, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-10', 'Dağ Komando Personel #10', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'IDLE', 'FRIEND', 39.934902, 32.587006, 39.91543758243224, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-11', 'Dağ Komando Personel #11', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'IDLE', 'FRIEND', 39.975232, 32.563933, 39.31519066635203, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-12', 'Dağ Komando Personel #12', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.102155, 36.907864, 10.997117131811624, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-13', 'Dağ Komando Personel #13', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'IDLE', 'FRIEND', 39.961716, 32.63922, 42.02416527095344, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-14', 'Dağ Komando Personel #14', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.082461, 36.975853, 26.612696531888613, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-15', 'Dağ Komando Personel #15', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.127331, 36.972539, 21.186478121637432, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-16', 'Dağ Komando Personel #16', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'IDLE', 'FRIEND', 39.950541, 32.618543, 2.371176956905774, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-17', 'Dağ Komando Personel #17', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.175691, 37.082641, 40.79057459361254, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-18', 'Dağ Komando Personel #18', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.146762, 36.97452, 9.065382781547122, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-19', 'Dağ Komando Personel #19', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.61756, 36.391167, 49.35749838525582, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-20', 'Dağ Komando Personel #20', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'COMBAT', 'FRIEND', 36.170382, 36.968236, 10.780353750849647, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-1.Tb-21', 'Dağ Komando Personel #21', 'SOLDIER', 'Dağ Komando', 'Komando-1.Tb', 'PATROL', 'FRIEND', 36.484988, 36.483336, 35.18607914055948, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-01', 'Amfibi Komando Personel #1', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.964531, 32.558071, 33.436393616692264, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-02', 'Amfibi Komando Personel #2', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.125947, 36.924743, 10.59253494349618, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-03', 'Amfibi Komando Personel #3', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.947201, 32.602012, 4.7245220422112935, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-04', 'Amfibi Komando Personel #4', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.079959, 36.856062, 42.8675571528102, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-05', 'Amfibi Komando Personel #5', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.086175, 36.95986, 43.06126348788188, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-06', 'Amfibi Komando Personel #6', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.647696, 36.615694, 10.08710599173851, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-07', 'Amfibi Komando Personel #7', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.120252, 36.842595, 29.315225680567025, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-08', 'Amfibi Komando Personel #8', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.936378, 32.564625, 16.460359005332155, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-09', 'Amfibi Komando Personel #9', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.563157, 36.439179, 20.641109754218746, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-10', 'Amfibi Komando Personel #10', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.576051, 36.523504, 48.76401636463957, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-11', 'Amfibi Komando Personel #11', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.671877, 36.461008, 16.593195363644796, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-12', 'Amfibi Komando Personel #12', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.733464, 36.606979, 26.943631616127917, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-13', 'Amfibi Komando Personel #13', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.953506, 32.595202, 27.14888872803932, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-14', 'Amfibi Komando Personel #14', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.273881, 37.119547, 11.220815485632718, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-15', 'Amfibi Komando Personel #15', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.269112, 37.166261, 22.62581592361807, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-16', 'Amfibi Komando Personel #16', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.949542, 32.623623, 10.17868220343856, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-17', 'Amfibi Komando Personel #17', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.068186, 37.121657, 36.86329437418552, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-18', 'Amfibi Komando Personel #18', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'IDLE', 'FRIEND', 39.9231, 32.63665, 21.158796297939404, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-19', 'Amfibi Komando Personel #19', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'COMBAT', 'FRIEND', 36.083263, 36.878342, 39.453523125989435, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-2.Tb-20', 'Amfibi Komando Personel #20', 'SOLDIER', 'Amfibi Komando', 'Komando-2.Tb', 'PATROL', 'FRIEND', 36.623036, 36.464437, 0.24199552991559514, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-01', 'SAT Personel #1', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'IDLE', 'FRIEND', 39.911101, 32.613869, 0.229234171077497, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-02', 'SAT Personel #2', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.084469, 37.162481, 42.08883712017673, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-03', 'SAT Personel #3', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.70272, 36.608418, 7.503652886515638, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-04', 'SAT Personel #4', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.067171, 37.144678, 14.403584470311026, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-05', 'SAT Personel #5', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'IDLE', 'FRIEND', 39.985525, 32.598764, 28.504370490194468, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-06', 'SAT Personel #6', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.035271, 37.174065, 33.75810178981506, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-07', 'SAT Personel #7', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.029441, 37.044561, 46.07702648973861, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-08', 'SAT Personel #8', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'IDLE', 'FRIEND', 39.912608, 32.608322, 41.23330029745888, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-09', 'SAT Personel #9', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.024801, 36.986062, 6.254961992501812, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-10', 'SAT Personel #10', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'IDLE', 'FRIEND', 39.962886, 32.563722, 33.27809365361645, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-11', 'SAT Personel #11', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.681732, 36.407873, 0.8030844418934646, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-12', 'SAT Personel #12', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.551362, 36.391383, 18.837386159270856, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-13', 'SAT Personel #13', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.306916, 36.942042, 8.37156960183066, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-14', 'SAT Personel #14', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.67687, 36.626195, 16.322354151719438, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-15', 'SAT Personel #15', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.715225, 36.55394, 18.14070219058525, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-16', 'SAT Personel #16', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.729546, 36.498973, 14.49340206210174, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-17', 'SAT Personel #17', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'COMBAT', 'FRIEND', 36.080924, 37.107674, 25.555980546475165, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-3.Tb-18', 'SAT Personel #18', 'SOLDIER', 'SAT', 'Komando-3.Tb', 'PATROL', 'FRIEND', 36.559121, 36.548939, 24.223164262345335, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-01', 'SAS Personel #1', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.515478, 36.405375, 34.38922293821942, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-02', 'SAS Personel #2', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.335903, 37.107435, 33.41923135154311, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-03', 'SAS Personel #3', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'IDLE', 'FRIEND', 39.923083, 32.637199, 5.0359137986424605, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-04', 'SAS Personel #4', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.537531, 36.528163, 16.822872677954347, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-05', 'SAS Personel #5', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.20679, 37.015623, 30.553977398634025, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-06', 'SAS Personel #6', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.322745, 37.169451, 32.40340333767352, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-07', 'SAS Personel #7', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.629746, 36.62532, 43.62952984998314, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-08', 'SAS Personel #8', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.035255, 37.003966, 30.779852172187372, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-09', 'SAS Personel #9', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.496465, 36.435002, 28.42421945273478, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-10', 'SAS Personel #10', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.468933, 36.575015, 9.283518142171859, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-11', 'SAS Personel #11', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.482874, 36.624783, 40.68576849774602, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-12', 'SAS Personel #12', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.605712, 36.42545, 31.381028231646884, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-13', 'SAS Personel #13', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.552021, 36.400314, 16.13174830082046, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-14', 'SAS Personel #14', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.613089, 36.489051, 48.11402504151606, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-15', 'SAS Personel #15', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'PATROL', 'FRIEND', 36.643647, 36.548026, 8.229926686559551, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-16', 'SAS Personel #16', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.244897, 36.880351, 12.652337289880627, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-17', 'SAS Personel #17', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.119056, 36.93339, 15.324604791273533, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-18', 'SAS Personel #18', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'COMBAT', 'FRIEND', 36.198455, 37.070425, 29.925008026449518, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-4.Tb-19', 'SAS Personel #19', 'SOLDIER', 'SAS', 'Komando-4.Tb', 'IDLE', 'FRIEND', 39.979669, 32.568409, 0.9434472084681456, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-01', 'MAK Personel #1', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.569411, 36.377306, 4.535468371495815, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-02', 'MAK Personel #2', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.300643, 36.958422, 39.102891896943284, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-03', 'MAK Personel #3', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.712272, 36.567878, 2.62323393442202, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-04', 'MAK Personel #4', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'IDLE', 'FRIEND', 39.928219, 32.555045, 49.431682565837384, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-05', 'MAK Personel #5', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.355341, 36.942833, 36.380511189604825, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-06', 'MAK Personel #6', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.512944, 36.483729, 26.077646640077667, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-07', 'MAK Personel #7', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.537483, 36.566207, 8.544798228387556, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-08', 'MAK Personel #8', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.518583, 36.534907, 44.19071449890399, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-09', 'MAK Personel #9', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.270707, 36.914002, 34.62761995307266, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-10', 'MAK Personel #10', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.541548, 36.386662, 8.236209308750164, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-11', 'MAK Personel #11', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.467504, 36.604758, 49.98953121200254, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-12', 'MAK Personel #12', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.605485, 36.538529, 18.825882854347604, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-13', 'MAK Personel #13', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.648887, 36.454433, 13.533084959088681, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-14', 'MAK Personel #14', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.715253, 36.534509, 14.889048632163703, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-15', 'MAK Personel #15', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'IDLE', 'FRIEND', 39.955257, 32.600414, 9.36309467661675, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-16', 'MAK Personel #16', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.189194, 37.048359, 12.843126658145598, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-17', 'MAK Personel #17', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.281469, 37.169951, 1.4627886341046448, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-18', 'MAK Personel #18', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.616372, 36.630287, 39.68966964944732, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-19', 'MAK Personel #19', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'IDLE', 'FRIEND', 39.909544, 32.615346, 49.20264360246222, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-20', 'MAK Personel #20', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'PATROL', 'FRIEND', 36.630826, 36.372068, 46.30236770828155, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-21', 'MAK Personel #21', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'COMBAT', 'FRIEND', 36.143135, 36.944831, 48.17938189366316, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Komando-5.Tb-22', 'MAK Personel #22', 'SOLDIER', 'MAK', 'Komando-5.Tb', 'IDLE', 'FRIEND', 39.910984, 32.55909, 39.80931289706987, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-Altay-Tank-01', 'Altay Tank #1', 'VEHICLE', 'Altay Tank', '1. ZPT Alayı', 'PATROL', 'FRIEND', 36.653197, 36.566489, 0.11844994942008524, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-Altay-Tank-02', 'Altay Tank #2', 'VEHICLE', 'Altay Tank', '1. ZPT Alayı', 'IDLE', 'FRIEND', 39.923004, 32.608631, 37.51714914506292, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-M60T-03', 'M60T #3', 'VEHICLE', 'M60T', '1. ZPT Alayı', 'PATROL', 'FRIEND', 36.59928, 36.584631, 33.15981947665077, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-M60T-04', 'M60T #4', 'VEHICLE', 'M60T', '1. ZPT Alayı', 'IDLE', 'FRIEND', 39.959991, 32.585643, 75.05324271644301, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-M60T-05', 'M60T #5', 'VEHICLE', 'M60T', '1. ZPT Alayı', 'IDLE', 'FRIEND', 39.949716, 32.583894, 51.28108825807081, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-Altay-Tank-06', 'Altay Tank #6', 'VEHICLE', 'Altay Tank', '1. ZPT Alayı', 'COMBAT', 'FRIEND', 36.276472, 37.03469, 5.664744977066228, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-M60T-07', 'M60T #7', 'VEHICLE', 'M60T', '1. ZPT Alayı', 'COMBAT', 'FRIEND', 36.035563, 36.940081, 10.041135846843963, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('1-ZPT-Alayı-Altay-Tank-08', 'Altay Tank #8', 'VEHICLE', 'Altay Tank', '1. ZPT Alayı', 'COMBAT', 'FRIEND', 36.031145, 36.986914, 8.340420445639907, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Altay-Tank-01', 'Altay Tank #1', 'VEHICLE', 'Altay Tank', '2. ZPT Alayı', 'COMBAT', 'FRIEND', 36.071604, 37.151384, 97.73483102664153, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Leopard-2A4-02', 'Leopard 2A4 #2', 'VEHICLE', 'Leopard 2A4', '2. ZPT Alayı', 'COMBAT', 'FRIEND', 36.363323, 36.890778, 73.5897039854648, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Altay-Tank-03', 'Altay Tank #3', 'VEHICLE', 'Altay Tank', '2. ZPT Alayı', 'IDLE', 'FRIEND', 39.928201, 32.57325, 90.2275706858646, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Leopard-2A4-04', 'Leopard 2A4 #4', 'VEHICLE', 'Leopard 2A4', '2. ZPT Alayı', 'PATROL', 'FRIEND', 36.606618, 36.480608, 88.03186186570426, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Altay-Tank-05', 'Altay Tank #5', 'VEHICLE', 'Altay Tank', '2. ZPT Alayı', 'COMBAT', 'FRIEND', 36.13142, 36.889627, 62.97457692852553, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Leopard-2A4-06', 'Leopard 2A4 #6', 'VEHICLE', 'Leopard 2A4', '2. ZPT Alayı', 'PATROL', 'FRIEND', 36.692719, 36.599531, 24.515166853795222, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Leopard-2A4-07', 'Leopard 2A4 #7', 'VEHICLE', 'Leopard 2A4', '2. ZPT Alayı', 'IDLE', 'FRIEND', 39.992949, 32.607469, 79.99184142539426, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Altay-Tank-08', 'Altay Tank #8', 'VEHICLE', 'Altay Tank', '2. ZPT Alayı', 'PATROL', 'FRIEND', 36.539705, 36.455397, 69.60369435483805, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Altay-Tank-09', 'Altay Tank #9', 'VEHICLE', 'Altay Tank', '2. ZPT Alayı', 'IDLE', 'FRIEND', 39.935673, 32.623302, 82.82636504320521, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('2-ZPT-Alayı-Leopard-2A4-10', 'Leopard 2A4 #10', 'VEHICLE', 'Leopard 2A4', '2. ZPT Alayı', 'IDLE', 'FRIEND', 39.922463, 32.605928, 16.628773361023853, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kirpi-II-01', 'Kirpi II #1', 'VEHICLE', 'Kirpi II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.726145, 36.573928, 52.65951112900357, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kirpi-II-02', 'Kirpi II #2', 'VEHICLE', 'Kirpi II', '3. Mekanize Bl.', 'COMBAT', 'FRIEND', 36.299371, 37.128876, 31.884410635821826, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-03', 'Kobra II #3', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'IDLE', 'FRIEND', 39.961532, 32.558593, 68.38396611673251, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-04', 'Kobra II #4', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.555837, 36.372294, 66.25386102467269, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kirpi-II-05', 'Kirpi II #5', 'VEHICLE', 'Kirpi II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.493256, 36.550149, 16.865766710448284, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-06', 'Kobra II #6', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.622284, 36.455854, 17.24266327243361, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kirpi-II-07', 'Kirpi II #7', 'VEHICLE', 'Kirpi II', '3. Mekanize Bl.', 'IDLE', 'FRIEND', 39.992091, 32.609427, 21.560454000024453, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-08', 'Kobra II #8', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'IDLE', 'FRIEND', 39.98772, 32.580004, 85.3921066386102, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-09', 'Kobra II #9', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.696109, 36.523152, 24.2603463894851, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-10', 'Kobra II #10', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'COMBAT', 'FRIEND', 36.338454, 36.862476, 87.79739631753849, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-11', 'Kobra II #11', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.72817, 36.434502, 50.64307667050023, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('3-Mekanize-Bl-Kobra-II-12', 'Kobra II #12', 'VEHICLE', 'Kobra II', '3. Mekanize Bl.', 'PATROL', 'FRIEND', 36.68415, 36.385341, 77.40383902588228, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-01', 'Ejder Yalçın #1', 'VEHICLE', 'Ejder Yalçın', '4. Mekanize Bl.', 'PATROL', 'FRIEND', 36.6564, 36.605111, 14.337460153791316, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Kirpi-II-02', 'Kirpi II #2', 'VEHICLE', 'Kirpi II', '4. Mekanize Bl.', 'IDLE', 'FRIEND', 39.928013, 32.611898, 2.2944053103165496, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Kirpi-II-03', 'Kirpi II #3', 'VEHICLE', 'Kirpi II', '4. Mekanize Bl.', 'IDLE', 'FRIEND', 39.977344, 32.561971, 62.81805371621817, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-04', 'Ejder Yalçın #4', 'VEHICLE', 'Ejder Yalçın', '4. Mekanize Bl.', 'PATROL', 'FRIEND', 36.687962, 36.4189, 87.53975792706147, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Kirpi-II-05', 'Kirpi II #5', 'VEHICLE', 'Kirpi II', '4. Mekanize Bl.', 'COMBAT', 'FRIEND', 36.309166, 37.168187, 23.75981314529585, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-06', 'Ejder Yalçın #6', 'VEHICLE', 'Ejder Yalçın', '4. Mekanize Bl.', 'COMBAT', 'FRIEND', 36.214031, 36.976975, 50.95752609763292, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Kirpi-II-07', 'Kirpi II #7', 'VEHICLE', 'Kirpi II', '4. Mekanize Bl.', 'COMBAT', 'FRIEND', 36.146114, 36.976555, 39.860227678553905, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-08', 'Ejder Yalçın #8', 'VEHICLE', 'Ejder Yalçın', '4. Mekanize Bl.', 'PATROL', 'FRIEND', 36.582052, 36.491004, 87.98968301357839, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('4-Mekanize-Bl-Kirpi-II-09', 'Kirpi II #9', 'VEHICLE', 'Kirpi II', '4. Mekanize Bl.', 'IDLE', 'FRIEND', 39.960842, 32.573139, 15.929643517104196, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-Fırtına-Obüs-01', 'Fırtına Obüs #1', 'VEHICLE', 'Fırtına Obüs', 'Topçu Taburu', 'COMBAT', 'FRIEND', 36.116836, 37.139255, 65.54477372547194, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-T-155-02', 'T-155 #2', 'VEHICLE', 'T-155', 'Topçu Taburu', 'IDLE', 'FRIEND', 39.969175, 32.568532, 14.213660365712045, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-Fırtına-Obüs-03', 'Fırtına Obüs #3', 'VEHICLE', 'Fırtına Obüs', 'Topçu Taburu', 'COMBAT', 'FRIEND', 36.264259, 36.967206, 44.236501065372266, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-Fırtına-Obüs-04', 'Fırtına Obüs #4', 'VEHICLE', 'Fırtına Obüs', 'Topçu Taburu', 'IDLE', 'FRIEND', 39.947099, 32.64431, 62.66643912283417, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-Fırtına-Obüs-05', 'Fırtına Obüs #5', 'VEHICLE', 'Fırtına Obüs', 'Topçu Taburu', 'IDLE', 'FRIEND', 39.917933, 32.570236, 2.189981536374519, CURRENT_TIMESTAMP);

INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('Topçu-Taburu-Fırtına-Obüs-06', 'Fırtına Obüs #6', 'VEHICLE', 'Fırtına Obüs', 'Topçu Taburu', 'COMBAT', 'FRIEND', 36.371602, 37.126771, 65.53967989988723, CURRENT_TIMESTAMP);


-- ============================================================================
-- INSERT INITIAL TELEMETRY (One record per asset)
-- ============================================================================


INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.827384, 36.23419), 4326), 2316.1145923627464, 101.54513721147603, 38, '{"heading": 10.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.121519, 36.12831), 4326), 594.2504241800074, 131.47709293140994, 46, '{"heading": 116.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 0.9}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-Akıncı-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.627716, 39.935399), 4326), 0, 0, 67, '{"heading": 322.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 1.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-Akıncı-04', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.41618, 36.521236), 4326), 1587.6296314343958, 131.15954756676913, 75, '{"heading": 191.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 2.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-Akıncı-05', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.557409, 39.9816), 4326), 0, 0, 78, '{"heading": 124.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-Akıncı-06', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.607936, 39.985141), 4326), 0, 0, 80, '{"heading": 97.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 0.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-07', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.952562, 36.334333), 4326), 1348.7799266118163, 111.56934801168165, 58, '{"heading": 13.2, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-08', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.615024, 36.682766), 4326), 2932.0043352759726, 133.13191303243576, 80, '{"heading": 285.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.9}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-09', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.152519, 36.228474), 4326), 913.7909022474814, 116.89223539869573, 51, '{"heading": 204.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.4}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-Akıncı-10', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.604346, 39.944317), 4326), 0, 0, 79, '{"heading": 135.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.9}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-11', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.454814, 36.526679), 4326), 2936.1554406613877, 105.47664216614469, 49, '{"heading": 275.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.4}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('341. Filo-TB2-12', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.139956, 36.132289), 4326), 1996.5862430658533, 118.56710069880276, 68, '{"heading": 139.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.606056, 39.989437), 4326), 0, 0, 66, '{"heading": 291.5, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.46462, 36.488561), 4326), 2133.5899043071295, 133.55362922183053, 67, '{"heading": 210.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.577661, 36.629024), 4326), 2493.768015863329, 101.30713720915112, 42, '{"heading": 174.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 4.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-04', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.641549, 39.974437), 4326), 0, 0, 66, '{"heading": 306.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-05', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.862545, 36.025011), 4326), 1416.448294718446, 144.1674491214833, 50, '{"heading": 168.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -1.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-06', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.52508, 36.616882), 4326), 1217.7974242511932, 129.85448400563752, 58, '{"heading": 135.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-07', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.501323, 36.552667), 4326), 2845.940605927578, 106.25161788115432, 73, '{"heading": 51.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -1.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-08', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.564112, 39.977337), 4326), 0, 0, 62, '{"heading": 303.8, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-09', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.581375, 36.487689), 4326), 2615.3302391987045, 132.57763254804223, 60, '{"heading": 111.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 2.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-10', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.574151, 36.525086), 4326), 2582.543090270408, 140.8969309215508, 44, '{"heading": 84.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -1.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-11', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.845547, 36.249894), 4326), 2449.5750034633666, 142.45579978704134, 32, '{"heading": 291.2, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-12', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.56217, 39.970276), 4326), 0, 0, 89, '{"heading": 55.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 1.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-ANKA-S-13', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.986186, 36.12144), 4326), 1346.9197541758626, 142.72467666325156, 78, '{"heading": 343.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-14', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.58954, 39.987819), 4326), 0, 0, 83, '{"heading": 314.8, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('342. Filo-TB2-15', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.61639, 36.578581), 4326), 2250.735774829048, 143.70324740867653, 69, '{"heading": 56.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.632538, 36.700619), 4326), 1383.0693319579796, 119.11782100524732, 72, '{"heading": 222.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 2.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.111164, 36.359527), 4326), 2243.8998996677515, 88.77106950156204, 38, '{"heading": 66.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 0.4}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.447585, 36.669767), 4326), 2526.872358627571, 116.85113672682999, 65, '{"heading": 248.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-04', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.39889, 36.589619), 4326), 964.8611375921946, 88.37627747722973, 59, '{"heading": 277.5, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.9}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-05', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.37554, 36.511738), 4326), 1336.6011031835783, 141.99887190154368, 39, '{"heading": 113.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-06', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.612498, 36.493304), 4326), 1201.6001695846367, 98.29606730963428, 64, '{"heading": 63.4, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 1.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-07', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.07925, 36.259504), 4326), 2787.742832787354, 106.27372107523728, 40, '{"heading": 260.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-08', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.565475, 36.651553), 4326), 2879.348077642967, 117.98359124280285, 59, '{"heading": 162.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 1.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-09', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.925119, 36.093348), 4326), 2333.2572575502404, 89.06070222139451, 55, '{"heading": 334.2, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('343. Filo-TB2-10', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.977355, 36.151491), 4326), 1330.6478325531011, 138.52090534302735, 30, '{"heading": 114.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 2.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.394153, 36.632901), 4326), 1613.8006055950793, 115.90864084262263, 46, '{"heading": 125.2, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.624857, 39.973436), 4326), 0, 0, 88, '{"heading": 343.5, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 4.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-TB2-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.535235, 36.472682), 4326), 1113.9547315135583, 136.7919442443671, 69, '{"heading": 115.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -0.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-TB2-04', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.603322, 36.477795), 4326), 2531.207462240993, 118.97163124088729, 56, '{"heading": 91.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-TB2-05', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.858896, 36.242326), 4326), 2542.4370087150414, 107.95781363705203, 67, '{"heading": 208.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-06', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.849114, 36.031093), 4326), 1951.4927729870096, 139.2742101686395, 41, '{"heading": 236.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 2.0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-TB2-07', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.91652, 36.314335), 4326), 751.6936086846849, 144.2107459698725, 63, '{"heading": 17.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-08', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.373231, 36.705762), 4326), 2603.48076907396, 141.18437949699117, 53, '{"heading": 256.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.3}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-09', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.042962, 36.268195), 4326), 1771.6474285888771, 147.37750154562627, 59, '{"heading": 4.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -1.6}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-10', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.57182, 39.907731), 4326), 0, 0, 75, '{"heading": 260.9, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 4.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-11', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.555584, 39.957035), 4326), 0, 0, 76, '{"heading": 86.3, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-12', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.461355, 36.687555), 4326), 2417.562785215527, 86.61981689387288, 39, '{"heading": 167.2, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -3.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-13', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.625118, 39.990741), 4326), 0, 0, 96, '{"heading": 9.0, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('344. Filo-ANKA-S-14', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.59733, 36.465962), 4326), 1623.9556284187736, 85.01603602389356, 72, '{"heading": 60.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-ANKA-S-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.102344, 36.037536), 4326), 2557.250947395027, 126.8502443294615, 32, '{"heading": 237.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -1.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-ANKA-S-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.035425, 36.219503), 4326), 1740.951529883222, 126.37929382523689, 63, '{"heading": 231.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 4.0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.431175, 36.729714), 4326), 672.9761489668352, 85.21879909014311, 79, '{"heading": 58.4, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.5}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-04', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.867779, 36.229168), 4326), 2332.9132270768964, 130.14094580185707, 61, '{"heading": 280.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 0.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-05', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.435334, 36.568872), 4326), 1621.219393068576, 138.13822134815842, 46, '{"heading": 17.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 1.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-06', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.640807, 39.912413), 4326), 0, 0, 84, '{"heading": 173.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 0.2}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-ANKA-S-07', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.929773, 36.310144), 4326), 2730.346564731618, 145.7929976140864, 32, '{"heading": 183.4, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 3.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-08', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.630228, 36.68753), 4326), 2761.0419599391053, 84.2209445265118, 44, '{"heading": 46.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-09', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.634641, 36.654498), 4326), 2983.921873997543, 82.25629606678538, 74, '{"heading": 160.5, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -2.7}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-ANKA-S-10', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.631671, 39.937479), 4326), 0, 0, 74, '{"heading": 20.8, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": 4.1}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('345. Filo-Akıncı-11', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.633785, 39.913663), 4326), 0, 0, 78, '{"heading": 23.3, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "vertical_speed": -4.8}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.018807, 36.086496), 4326), 32.97346590511422, 3.7604469997486483, 87, '{"heart_rate": 158, "spo2": 95, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.47113, 36.662024), 4326), 37.33078550724764, 7.123546566977662, 77, '{"heart_rate": 119, "spo2": 97, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.031329, 36.327752), 4326), 0.9660524807439286, 3.2444804992296765, 98, '{"heart_rate": 144, "spo2": 94, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.856379, 36.236757), 4326), 42.23164269797976, 4.991753168057688, 70, '{"heart_rate": 122, "spo2": 94, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.560685, 36.670697), 4326), 26.52179118487265, 7.7666665839977975, 79, '{"heart_rate": 102, "spo2": 94, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.636823, 39.907208), 4326), 23.97222092392377, 0, 76, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.149644, 36.305235), 4326), 11.427504825833152, 6.7392600035347145, 88, '{"heart_rate": 120, "spo2": 95, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.11625, 36.053193), 4326), 39.86272821544825, 1.945106994420433, 78, '{"heart_rate": 145, "spo2": 95, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.581177, 39.958062), 4326), 43.9559446150252, 0, 81, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.8, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.519313, 36.527391), 4326), 8.61694235756289, 1.2238096906665556, 91, '{"heart_rate": 107, "spo2": 98, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.090762, 36.153155), 4326), 39.45285123232447, 3.623505500311419, 92, '{"heart_rate": 129, "spo2": 94, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.558834, 36.510343), 4326), 36.336037941468504, 3.413001210238936, 98, '{"heart_rate": 95, "spo2": 96, "body_temp": 36.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.0739, 36.326414), 4326), 47.79316080116832, 7.246803063180289, 87, '{"heart_rate": 149, "spo2": 95, "body_temp": 36.3, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.564857, 39.923125), 4326), 22.86609500896824, 0, 77, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.564807, 36.505518), 4326), 29.634945674932684, 3.7438034613438917, 77, '{"heart_rate": 118, "spo2": 99, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.42273, 36.548337), 4326), 3.6062842431231035, 1.0452151447622335, 86, '{"heart_rate": 113, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.88675, 36.118228), 4326), 45.5106328083934, 3.8000718811161533, 74, '{"heart_rate": 120, "spo2": 97, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.565301, 39.990026), 4326), 42.13241120705004, 0, 77, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.558366, 39.943293), 4326), 38.11464585037758, 0, 71, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.8, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.387857, 36.66479), 4326), 47.5384821897968, 3.824564886248439, 85, '{"heart_rate": 102, "spo2": 98, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.510037, 36.469943), 4326), 25.25451736488978, 1.1040206211438326, 72, '{"heart_rate": 94, "spo2": 98, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Alpha-22', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.951143, 36.33209), 4326), 17.447866808339118, 3.014651439877259, 90, '{"heart_rate": 129, "spo2": 94, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.485121, 36.722431), 4326), 5.880961573714588, 6.627970606292916, 74, '{"heart_rate": 97, "spo2": 99, "body_temp": 37.1, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.396657, 36.471502), 4326), 11.943871458355664, 1.273375332640923, 75, '{"heart_rate": 106, "spo2": 94, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.606353, 39.96275), 4326), 7.817183592768185, 0, 74, '{"heart_rate": 70, "spo2": 95, "body_temp": 37.2, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.533811, 36.597841), 4326), 27.769618595684086, 4.0569711435084574, 96, '{"heart_rate": 99, "spo2": 97, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.535118, 36.555076), 4326), 24.400198475468976, 7.643740869883107, 84, '{"heart_rate": 116, "spo2": 94, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.005045, 36.350359), 4326), 38.113394492171636, 6.755265956485051, 96, '{"heart_rate": 130, "spo2": 95, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.614107, 36.709972), 4326), 30.07816756027239, 5.014045928987423, 87, '{"heart_rate": 90, "spo2": 98, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.04441, 36.09955), 4326), 33.569067113458026, 4.35671973591076, 73, '{"heart_rate": 140, "spo2": 99, "body_temp": 36.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.077748, 36.280794), 4326), 28.064114361567157, 4.012059738807496, 79, '{"heart_rate": 127, "spo2": 96, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.853438, 36.333587), 4326), 27.393178969631133, 4.510102626276515, 96, '{"heart_rate": 153, "spo2": 96, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.457892, 36.490297), 4326), 31.024771045650496, 5.217320556824807, 97, '{"heart_rate": 101, "spo2": 98, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.588557, 39.936293), 4326), 3.1966937451665456, 0, 82, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.044787, 36.321556), 4326), 11.780902060893506, 2.17963719029604, 70, '{"heart_rate": 157, "spo2": 95, "body_temp": 37.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.010324, 36.023807), 4326), 17.53178409034276, 2.6376851788399316, 96, '{"heart_rate": 145, "spo2": 97, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.440144, 36.695701), 4326), 29.00752040871253, 7.37407325520666, 70, '{"heart_rate": 117, "spo2": 95, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.573091, 39.953217), 4326), 43.72111627911778, 0, 100, '{"heart_rate": 70, "spo2": 96, "body_temp": 37.2, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.944467, 36.034238), 4326), 29.455887566742767, 5.9227699659434325, 81, '{"heart_rate": 142, "spo2": 94, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.449017, 36.722986), 4326), 23.32385580415667, 6.655040332906403, 84, '{"heart_rate": 112, "spo2": 99, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.614095, 39.98423), 4326), 6.090580872858658, 0, 71, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('OKK-Bravo-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.388245, 36.61845), 4326), 5.335256778840359, 5.343891353731641, 89, '{"heart_rate": 111, "spo2": 97, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.98863, 36.254619), 4326), 36.60472767585763, 6.830314164092957, 79, '{"heart_rate": 120, "spo2": 98, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.408837, 36.70778), 4326), 28.68316659001815, 2.282690588573211, 70, '{"heart_rate": 119, "spo2": 98, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.556825, 36.585258), 4326), 29.476531358506797, 5.522928180701742, 90, '{"heart_rate": 117, "spo2": 96, "body_temp": 37.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.597851, 36.577092), 4326), 43.69096638044865, 1.80788482803694, 74, '{"heart_rate": 93, "spo2": 94, "body_temp": 36.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.555077, 39.927077), 4326), 44.05261157436352, 0, 91, '{"heart_rate": 70, "spo2": 98, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.823224, 36.25104), 4326), 14.18704242582865, 3.1157877901453843, 99, '{"heart_rate": 135, "spo2": 97, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.94283, 36.30712), 4326), 2.093528877455131, 1.889103047202397, 88, '{"heart_rate": 152, "spo2": 98, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.120171, 36.254397), 4326), 47.29377023035184, 4.086000322499588, 93, '{"heart_rate": 133, "spo2": 96, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.521526, 36.560535), 4326), 42.98166857000169, 4.980277562744037, 80, '{"heart_rate": 96, "spo2": 94, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.099032, 36.277355), 4326), 40.285106549664526, 2.1190610493461124, 77, '{"heart_rate": 147, "spo2": 96, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.921233, 36.338498), 4326), 39.084710190142616, 1.5881132299558882, 86, '{"heart_rate": 156, "spo2": 97, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.070337, 36.23814), 4326), 24.818934085760013, 5.604118881202164, 79, '{"heart_rate": 147, "spo2": 98, "body_temp": 36.3, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.614539, 36.498747), 4326), 8.01209893952819, 4.305714593079796, 99, '{"heart_rate": 101, "spo2": 95, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.578092, 39.965801), 4326), 38.91844710182112, 0, 81, '{"heart_rate": 70, "spo2": 94, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.536742, 36.504111), 4326), 29.116185660658335, 7.849976805629996, 97, '{"heart_rate": 112, "spo2": 96, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.112486, 36.269804), 4326), 4.068161605357407, 7.313675205093352, 91, '{"heart_rate": 148, "spo2": 96, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.417563, 36.53219), 4326), 28.164232133012145, 3.5852137007013383, 88, '{"heart_rate": 116, "spo2": 96, "body_temp": 37.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.587373, 39.955113), 4326), 13.279153478266531, 0, 94, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.615403, 39.971823), 4326), 1.046229951598332, 0, 80, '{"heart_rate": 70, "spo2": 96, "body_temp": 37.1, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.044322, 36.340632), 4326), 4.525253505839966, 3.0605990578070994, 78, '{"heart_rate": 141, "spo2": 95, "body_temp": 36.3, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.573727, 39.959307), 4326), 15.424616104317451, 0, 70, '{"heart_rate": 70, "spo2": 94, "body_temp": 37.2, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-22', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.570977, 39.91445), 4326), 4.150215896192616, 0, 82, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-23', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.597431, 36.534323), 4326), 45.83119763263358, 3.990082070423449, 88, '{"heart_rate": 97, "spo2": 95, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-24', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.108533, 36.036712), 4326), 31.27162374222135, 3.320511960157961, 74, '{"heart_rate": 131, "spo2": 96, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Mardin-25', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.063393, 36.231376), 4326), 48.33652577416539, 5.696631857889472, 95, '{"heart_rate": 156, "spo2": 99, "body_temp": 36.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.427509, 36.716123), 4326), 48.24355343242494, 1.0490627403584574, 89, '{"heart_rate": 116, "spo2": 97, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.608349, 39.954518), 4326), 32.20761433891746, 0, 86, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.566223, 39.989617), 4326), 15.577018976571082, 0, 92, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.508195, 36.674214), 4326), 43.42013470368519, 3.1998803746098528, 79, '{"heart_rate": 119, "spo2": 99, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.924035, 36.088762), 4326), 41.044488716474056, 7.691069939274527, 85, '{"heart_rate": 124, "spo2": 97, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.019561, 36.222652), 4326), 13.957031234642125, 6.004609793660458, 86, '{"heart_rate": 125, "spo2": 96, "body_temp": 37.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.366108, 36.526715), 4326), 40.03823759664116, 7.594078737883693, 76, '{"heart_rate": 90, "spo2": 96, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.454547, 36.486301), 4326), 41.805402491549195, 5.2949729735314985, 90, '{"heart_rate": 95, "spo2": 99, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.417663, 36.639518), 4326), 45.429082926705135, 1.5882190339368536, 91, '{"heart_rate": 120, "spo2": 95, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.42154, 36.564572), 4326), 3.355750939310853, 5.206886052945313, 91, '{"heart_rate": 97, "spo2": 99, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.996328, 36.155469), 4326), 17.254172037494037, 1.2377082684150946, 73, '{"heart_rate": 130, "spo2": 98, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.958469, 36.240612), 4326), 5.1433112946554, 1.0711945593529064, 82, '{"heart_rate": 134, "spo2": 97, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.623748, 39.941981), 4326), 31.129722885390088, 0, 70, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.126313, 36.093473), 4326), 28.927051402886622, 2.4223593440409887, 77, '{"heart_rate": 121, "spo2": 98, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.058033, 36.131237), 4326), 49.12393608379077, 2.7773471443433397, 93, '{"heart_rate": 132, "spo2": 99, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.576294, 36.724975), 4326), 9.723949850002683, 6.706582873835519, 73, '{"heart_rate": 110, "spo2": 98, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.829339, 36.344843), 4326), 49.35701615269977, 3.4991637386772103, 78, '{"heart_rate": 153, "spo2": 96, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.986244, 36.056005), 4326), 11.834133421404259, 4.385245469073618, 86, '{"heart_rate": 120, "spo2": 99, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.621162, 39.965839), 4326), 28.90611382128127, 0, 82, '{"heart_rate": 70, "spo2": 94, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.624859, 39.94793), 4326), 3.521656195392875, 0, 71, '{"heart_rate": 70, "spo2": 99, "body_temp": 37.1, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.613368, 36.465567), 4326), 10.992136539540793, 4.033873845535753, 92, '{"heart_rate": 107, "spo2": 97, "body_temp": 37.1, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-22', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.454181, 36.640705), 4326), 25.330777448246884, 7.691030975875699, 97, '{"heart_rate": 114, "spo2": 98, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-23', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.563064, 39.989367), 4326), 40.162644028484486, 0, 100, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.8, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Şırnak-24', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.59971, 39.970512), 4326), 34.6342009954122, 0, 90, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.870514, 36.245633), 4326), 46.52865111784933, 5.921069709176469, 76, '{"heart_rate": 154, "spo2": 97, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.62712, 39.949142), 4326), 48.870729962466555, 0, 84, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.549, 36.714409), 4326), 9.356097789618566, 7.665908386609782, 83, '{"heart_rate": 115, "spo2": 98, "body_temp": 37.1, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.168641, 36.247585), 4326), 4.4311594758478625, 2.6844227356068027, 72, '{"heart_rate": 134, "spo2": 99, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.576525, 39.950678), 4326), 37.394059983474065, 0, 94, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.058207, 36.051643), 4326), 10.620829367133622, 4.148856843689132, 83, '{"heart_rate": 146, "spo2": 98, "body_temp": 37.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.474793, 36.592074), 4326), 22.527452882863326, 7.203445813183593, 87, '{"heart_rate": 117, "spo2": 94, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.078463, 36.094175), 4326), 15.715303030938593, 5.82392983366043, 98, '{"heart_rate": 153, "spo2": 98, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.580947, 36.619392), 4326), 5.752345898620492, 3.899919993402965, 77, '{"heart_rate": 94, "spo2": 98, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.600037, 39.946688), 4326), 44.7463881517583, 0, 97, '{"heart_rate": 70, "spo2": 94, "body_temp": 37.1, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.069335, 36.25179), 4326), 11.23992275465956, 3.004890879812464, 75, '{"heart_rate": 146, "spo2": 97, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.141814, 36.22579), 4326), 7.358280279087798, 1.6679213358846514, 73, '{"heart_rate": 132, "spo2": 94, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.621119, 39.913415), 4326), 16.714689776592156, 0, 93, '{"heart_rate": 70, "spo2": 96, "body_temp": 37.1, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.972624, 36.360941), 4326), 13.483302389710344, 3.09412304437067, 85, '{"heart_rate": 148, "spo2": 97, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.389514, 36.521264), 4326), 26.827822663844973, 1.439875495041524, 73, '{"heart_rate": 118, "spo2": 97, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.047061, 36.21775), 4326), 5.403804178006771, 3.5128460260348358, 94, '{"heart_rate": 147, "spo2": 97, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.400541, 36.697165), 4326), 49.584097716692, 1.0847295085356161, 91, '{"heart_rate": 120, "spo2": 99, "body_temp": 37.1, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.644047, 39.961759), 4326), 6.042081267511063, 0, 80, '{"heart_rate": 70, "spo2": 95, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.947826, 36.362904), 4326), 11.191916460095674, 2.0072464468418554, 76, '{"heart_rate": 135, "spo2": 97, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.111019, 36.235385), 4326), 5.373146282066715, 7.732760795245287, 88, '{"heart_rate": 145, "spo2": 99, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.528154, 36.683289), 4326), 8.11266928924067, 7.694186965208589, 71, '{"heart_rate": 95, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-22', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.947942, 36.342689), 4326), 28.69032019655614, 2.589904781798764, 70, '{"heart_rate": 136, "spo2": 98, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('JÖH-Hakkari-23', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.372738, 36.475614), 4326), 8.436507281752508, 3.4913076580440103, 87, '{"heart_rate": 114, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.565343, 36.642864), 4326), 12.671454497376889, 3.560557900492617, 99, '{"heart_rate": 107, "spo2": 95, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.556711, 39.908234), 4326), 29.26089244619044, 0, 93, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.561165, 36.477283), 4326), 38.05093842927965, 7.004451843166109, 90, '{"heart_rate": 101, "spo2": 99, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.136196, 36.331664), 4326), 18.359043629878887, 1.9310520222708734, 96, '{"heart_rate": 159, "spo2": 96, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.516141, 36.619393), 4326), 20.506249176824564, 7.576923682767629, 84, '{"heart_rate": 116, "spo2": 94, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.50851, 36.718893), 4326), 13.69116782204009, 1.9113879071501378, 78, '{"heart_rate": 117, "spo2": 94, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.379884, 36.479827), 4326), 29.97074545570059, 6.793359586228959, 98, '{"heart_rate": 101, "spo2": 97, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.46196, 36.528081), 4326), 36.25604618714247, 5.370197324648527, 91, '{"heart_rate": 107, "spo2": 95, "body_temp": 37.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.535915, 36.472325), 4326), 43.24231099289893, 3.475560456640909, 75, '{"heart_rate": 119, "spo2": 96, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.587006, 39.934902), 4326), 39.91543758243224, 0, 94, '{"heart_rate": 70, "spo2": 94, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.563933, 39.975232), 4326), 39.31519066635203, 0, 87, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.907864, 36.102155), 4326), 10.997117131811624, 1.525244847100256, 84, '{"heart_rate": 142, "spo2": 98, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.63922, 39.961716), 4326), 42.02416527095344, 0, 86, '{"heart_rate": 70, "spo2": 98, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.975853, 36.082461), 4326), 26.612696531888613, 5.0062955125841615, 73, '{"heart_rate": 134, "spo2": 96, "body_temp": 36.5, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.972539, 36.127331), 4326), 21.186478121637432, 5.163148652944435, 84, '{"heart_rate": 127, "spo2": 98, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.618543, 39.950541), 4326), 2.371176956905774, 0, 93, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.082641, 36.175691), 4326), 40.79057459361254, 5.993146253981516, 76, '{"heart_rate": 133, "spo2": 98, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.97452, 36.146762), 4326), 9.065382781547122, 2.6316557505781577, 84, '{"heart_rate": 135, "spo2": 94, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.391167, 36.61756), 4326), 49.35749838525582, 5.127416815052034, 83, '{"heart_rate": 102, "spo2": 95, "body_temp": 37.1, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.968236, 36.170382), 4326), 10.780353750849647, 5.793155108356979, 88, '{"heart_rate": 155, "spo2": 99, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-1.Tb-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.483336, 36.484988), 4326), 35.18607914055948, 2.5112915994568112, 93, '{"heart_rate": 115, "spo2": 98, "body_temp": 36.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.558071, 39.964531), 4326), 33.436393616692264, 0, 83, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.924743, 36.125947), 4326), 10.59253494349618, 7.235857985113252, 78, '{"heart_rate": 158, "spo2": 98, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.602012, 39.947201), 4326), 4.7245220422112935, 0, 74, '{"heart_rate": 70, "spo2": 94, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.856062, 36.079959), 4326), 42.8675571528102, 6.854639321472227, 95, '{"heart_rate": 151, "spo2": 99, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.95986, 36.086175), 4326), 43.06126348788188, 5.916281220269367, 82, '{"heart_rate": 158, "spo2": 97, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.615694, 36.647696), 4326), 10.08710599173851, 2.5803473154194054, 74, '{"heart_rate": 98, "spo2": 97, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.842595, 36.120252), 4326), 29.315225680567025, 5.7396674359548925, 92, '{"heart_rate": 132, "spo2": 95, "body_temp": 37.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.564625, 39.936378), 4326), 16.460359005332155, 0, 81, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.439179, 36.563157), 4326), 20.641109754218746, 2.6133296437270017, 76, '{"heart_rate": 118, "spo2": 98, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.523504, 36.576051), 4326), 48.76401636463957, 7.991452632814568, 71, '{"heart_rate": 116, "spo2": 95, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.461008, 36.671877), 4326), 16.593195363644796, 5.019000590542137, 93, '{"heart_rate": 108, "spo2": 97, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.606979, 36.733464), 4326), 26.943631616127917, 6.0140370917799535, 86, '{"heart_rate": 103, "spo2": 97, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.595202, 39.953506), 4326), 27.14888872803932, 0, 100, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.119547, 36.273881), 4326), 11.220815485632718, 4.755395585631874, 77, '{"heart_rate": 123, "spo2": 98, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.166261, 36.269112), 4326), 22.62581592361807, 2.010451586944873, 100, '{"heart_rate": 139, "spo2": 98, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.623623, 39.949542), 4326), 10.17868220343856, 0, 74, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.121657, 36.068186), 4326), 36.86329437418552, 5.038133872690997, 71, '{"heart_rate": 126, "spo2": 97, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.63665, 39.9231), 4326), 21.158796297939404, 0, 94, '{"heart_rate": 70, "spo2": 95, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.878342, 36.083263), 4326), 39.453523125989435, 7.7943045870226575, 81, '{"heart_rate": 159, "spo2": 98, "body_temp": 36.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-2.Tb-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.464437, 36.623036), 4326), 0.24199552991559514, 2.1616135084096832, 96, '{"heart_rate": 116, "spo2": 95, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.613869, 39.911101), 4326), 0.229234171077497, 0, 98, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.162481, 36.084469), 4326), 42.08883712017673, 3.1679892356410653, 73, '{"heart_rate": 123, "spo2": 97, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.608418, 36.70272), 4326), 7.503652886515638, 4.563862270084277, 84, '{"heart_rate": 100, "spo2": 96, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.144678, 36.067171), 4326), 14.403584470311026, 7.153322830581094, 81, '{"heart_rate": 148, "spo2": 99, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.598764, 39.985525), 4326), 28.504370490194468, 0, 78, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.174065, 36.035271), 4326), 33.75810178981506, 2.8380832505783053, 97, '{"heart_rate": 151, "spo2": 95, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.044561, 36.029441), 4326), 46.07702648973861, 5.171352126088633, 86, '{"heart_rate": 158, "spo2": 96, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.608322, 39.912608), 4326), 41.23330029745888, 0, 98, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.986062, 36.024801), 4326), 6.254961992501812, 2.7113836382868954, 100, '{"heart_rate": 130, "spo2": 99, "body_temp": 36.2, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.563722, 39.962886), 4326), 33.27809365361645, 0, 82, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.407873, 36.681732), 4326), 0.8030844418934646, 3.884333373492362, 86, '{"heart_rate": 92, "spo2": 94, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.391383, 36.551362), 4326), 18.837386159270856, 5.254058331568099, 70, '{"heart_rate": 107, "spo2": 98, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.942042, 36.306916), 4326), 8.37156960183066, 1.482585178138187, 85, '{"heart_rate": 147, "spo2": 98, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.626195, 36.67687), 4326), 16.322354151719438, 4.352531437280004, 94, '{"heart_rate": 120, "spo2": 96, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.55394, 36.715225), 4326), 18.14070219058525, 1.3161819339008087, 77, '{"heart_rate": 106, "spo2": 94, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.498973, 36.729546), 4326), 14.49340206210174, 6.946917307930743, 92, '{"heart_rate": 95, "spo2": 98, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.107674, 36.080924), 4326), 25.555980546475165, 7.786886358151517, 90, '{"heart_rate": 122, "spo2": 99, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-3.Tb-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.548939, 36.559121), 4326), 24.223164262345335, 2.628204682662345, 85, '{"heart_rate": 100, "spo2": 95, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.405375, 36.515478), 4326), 34.38922293821942, 1.1160631836097232, 85, '{"heart_rate": 119, "spo2": 94, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.107435, 36.335903), 4326), 33.41923135154311, 4.778916484129776, 88, '{"heart_rate": 141, "spo2": 96, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.637199, 39.923083), 4326), 5.0359137986424605, 0, 87, '{"heart_rate": 70, "spo2": 97, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.528163, 36.537531), 4326), 16.822872677954347, 3.8277463719245297, 96, '{"heart_rate": 107, "spo2": 96, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.015623, 36.20679), 4326), 30.553977398634025, 2.5586200628295637, 70, '{"heart_rate": 138, "spo2": 97, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.169451, 36.322745), 4326), 32.40340333767352, 6.151788406517839, 83, '{"heart_rate": 149, "spo2": 98, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.62532, 36.629746), 4326), 43.62952984998314, 3.0680835508729456, 96, '{"heart_rate": 120, "spo2": 96, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.003966, 36.035255), 4326), 30.779852172187372, 6.203125442665326, 94, '{"heart_rate": 131, "spo2": 94, "body_temp": 36.4, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.435002, 36.496465), 4326), 28.42421945273478, 4.6135635458663655, 82, '{"heart_rate": 117, "spo2": 95, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.575015, 36.468933), 4326), 9.283518142171859, 6.454112534513526, 72, '{"heart_rate": 97, "spo2": 97, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.624783, 36.482874), 4326), 40.68576849774602, 4.1998364614518495, 91, '{"heart_rate": 107, "spo2": 94, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.42545, 36.605712), 4326), 31.381028231646884, 4.770462771959605, 93, '{"heart_rate": 102, "spo2": 95, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.400314, 36.552021), 4326), 16.13174830082046, 7.350663551658974, 97, '{"heart_rate": 119, "spo2": 96, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.489051, 36.613089), 4326), 48.11402504151606, 5.516731643368181, 85, '{"heart_rate": 95, "spo2": 95, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.548026, 36.643647), 4326), 8.229926686559551, 7.1253184252332495, 88, '{"heart_rate": 94, "spo2": 97, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.880351, 36.244897), 4326), 12.652337289880627, 6.47954791274749, 99, '{"heart_rate": 126, "spo2": 97, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.93339, 36.119056), 4326), 15.324604791273533, 5.282047557284797, 83, '{"heart_rate": 152, "spo2": 99, "body_temp": 36.3, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.070425, 36.198455), 4326), 29.925008026449518, 7.42009956400278, 74, '{"heart_rate": 124, "spo2": 94, "body_temp": 36.8, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-4.Tb-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.568409, 39.979669), 4326), 0.9434472084681456, 0, 71, '{"heart_rate": 70, "spo2": 99, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.377306, 36.569411), 4326), 4.535468371495815, 2.093159365708647, 89, '{"heart_rate": 118, "spo2": 96, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.958422, 36.300643), 4326), 39.102891896943284, 5.675973025135904, 86, '{"heart_rate": 143, "spo2": 97, "body_temp": 36.6, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.567878, 36.712272), 4326), 2.62323393442202, 5.5652860535703415, 99, '{"heart_rate": 119, "spo2": 94, "body_temp": 37.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-04', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.555045, 39.928219), 4326), 49.431682565837384, 0, 71, '{"heart_rate": 70, "spo2": 98, "body_temp": 37.1, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-05', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.942833, 36.355341), 4326), 36.380511189604825, 5.8398782949967885, 83, '{"heart_rate": 129, "spo2": 98, "body_temp": 37.1, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-06', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.483729, 36.512944), 4326), 26.077646640077667, 1.9155147117042284, 80, '{"heart_rate": 94, "spo2": 99, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-07', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.566207, 36.537483), 4326), 8.544798228387556, 3.6151603260235525, 82, '{"heart_rate": 98, "spo2": 97, "body_temp": 36.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-08', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.534907, 36.518583), 4326), 44.19071449890399, 2.9495508565942403, 88, '{"heart_rate": 117, "spo2": 94, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-09', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.914002, 36.270707), 4326), 34.62761995307266, 6.580566263662805, 85, '{"heart_rate": 130, "spo2": 97, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-10', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.386662, 36.541548), 4326), 8.236209308750164, 2.3167349125974575, 86, '{"heart_rate": 99, "spo2": 96, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-11', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.604758, 36.467504), 4326), 49.98953121200254, 4.016233591342337, 79, '{"heart_rate": 107, "spo2": 94, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-12', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.538529, 36.605485), 4326), 18.825882854347604, 2.805562683384948, 74, '{"heart_rate": 95, "spo2": 94, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-13', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.454433, 36.648887), 4326), 13.533084959088681, 2.1485420807668962, 86, '{"heart_rate": 103, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-14', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.534509, 36.715253), 4326), 14.889048632163703, 5.164018919927219, 70, '{"heart_rate": 92, "spo2": 96, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-15', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.600414, 39.955257), 4326), 9.36309467661675, 0, 93, '{"heart_rate": 70, "spo2": 99, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-16', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.048359, 36.189194), 4326), 12.843126658145598, 5.907690550474889, 87, '{"heart_rate": 153, "spo2": 94, "body_temp": 36.7, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-17', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.169951, 36.281469), 4326), 1.4627886341046448, 2.4972500674174674, 83, '{"heart_rate": 149, "spo2": 97, "body_temp": 36.9, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-18', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.630287, 36.616372), 4326), 39.68966964944732, 4.292405120256393, 99, '{"heart_rate": 111, "spo2": 99, "body_temp": 36.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-19', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.615346, 39.909544), 4326), 49.20264360246222, 0, 88, '{"heart_rate": 70, "spo2": 94, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-20', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.372068, 36.630826), 4326), 46.30236770828155, 5.5040949510672075, 79, '{"heart_rate": 97, "spo2": 96, "body_temp": 37.2, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-21', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.944831, 36.143135), 4326), 48.17938189366316, 7.450410755411834, 80, '{"heart_rate": 153, "spo2": 95, "body_temp": 37.0, "stress_level": "HIGH", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Komando-5.Tb-22', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.55909, 39.910984), 4326), 39.80931289706987, 0, 75, '{"heart_rate": 70, "spo2": 94, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-Altay-Tank-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.566489, 36.653197), 4326), 0.11844994942008524, 36.730349331515725, 68, '{"fuel_level": 68, "engine_temp": 81, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-Altay-Tank-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.608631, 39.923004), 4326), 37.51714914506292, 0, 83, '{"fuel_level": 83, "engine_temp": 75, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-M60T-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.584631, 36.59928), 4326), 33.15981947665077, 39.06680160943013, 76, '{"fuel_level": 76, "engine_temp": 72, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-M60T-04', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.585643, 39.959991), 4326), 75.05324271644301, 0, 80, '{"fuel_level": 80, "engine_temp": 81, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-M60T-05', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.583894, 39.949716), 4326), 51.28108825807081, 0, 62, '{"fuel_level": 62, "engine_temp": 73, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-Altay-Tank-06', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.03469, 36.276472), 4326), 5.664744977066228, 43.95946443041597, 93, '{"fuel_level": 93, "engine_temp": 75, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-M60T-07', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.940081, 36.035563), 4326), 10.041135846843963, 14.477546512200682, 100, '{"fuel_level": 100, "engine_temp": 84, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('1-ZPT-Alayı-Altay-Tank-08', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.986914, 36.031145), 4326), 8.340420445639907, 34.30377265576362, 98, '{"fuel_level": 98, "engine_temp": 80, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Altay-Tank-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.151384, 36.071604), 4326), 97.73483102664153, 22.47917355938368, 81, '{"fuel_level": 81, "engine_temp": 73, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Leopard-2A4-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.890778, 36.363323), 4326), 73.5897039854648, 47.861275707894926, 96, '{"fuel_level": 96, "engine_temp": 78, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Altay-Tank-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.57325, 39.928201), 4326), 90.2275706858646, 0, 90, '{"fuel_level": 90, "engine_temp": 83, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Leopard-2A4-04', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.480608, 36.606618), 4326), 88.03186186570426, 35.54615101764526, 95, '{"fuel_level": 95, "engine_temp": 73, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Altay-Tank-05', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.889627, 36.13142), 4326), 62.97457692852553, 37.9079711473302, 73, '{"fuel_level": 73, "engine_temp": 71, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Leopard-2A4-06', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.599531, 36.692719), 4326), 24.515166853795222, 46.0603502712614, 63, '{"fuel_level": 63, "engine_temp": 75, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Leopard-2A4-07', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.607469, 39.992949), 4326), 79.99184142539426, 0, 90, '{"fuel_level": 90, "engine_temp": 95, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Altay-Tank-08', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.455397, 36.539705), 4326), 69.60369435483805, 22.962996867269474, 61, '{"fuel_level": 61, "engine_temp": 79, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Altay-Tank-09', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.623302, 39.935673), 4326), 82.82636504320521, 0, 91, '{"fuel_level": 91, "engine_temp": 86, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('2-ZPT-Alayı-Leopard-2A4-10', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.605928, 39.922463), 4326), 16.628773361023853, 0, 72, '{"fuel_level": 72, "engine_temp": 85, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kirpi-II-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.573928, 36.726145), 4326), 52.65951112900357, 39.81313072043297, 74, '{"fuel_level": 74, "engine_temp": 71, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kirpi-II-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.128876, 36.299371), 4326), 31.884410635821826, 49.714073424724404, 94, '{"fuel_level": 94, "engine_temp": 82, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.558593, 39.961532), 4326), 68.38396611673251, 0, 72, '{"fuel_level": 72, "engine_temp": 92, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-04', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.372294, 36.555837), 4326), 66.25386102467269, 31.63113014869717, 67, '{"fuel_level": 67, "engine_temp": 75, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kirpi-II-05', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.550149, 36.493256), 4326), 16.865766710448284, 47.94223773739298, 92, '{"fuel_level": 92, "engine_temp": 81, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-06', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.455854, 36.622284), 4326), 17.24266327243361, 30.547884569906007, 63, '{"fuel_level": 63, "engine_temp": 73, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kirpi-II-07', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.609427, 39.992091), 4326), 21.560454000024453, 0, 95, '{"fuel_level": 95, "engine_temp": 93, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-08', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.580004, 39.98772), 4326), 85.3921066386102, 0, 80, '{"fuel_level": 80, "engine_temp": 88, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-09', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.523152, 36.696109), 4326), 24.2603463894851, 38.03494245772553, 96, '{"fuel_level": 96, "engine_temp": 87, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-10', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.862476, 36.338454), 4326), 87.79739631753849, 21.262767037554834, 79, '{"fuel_level": 79, "engine_temp": 77, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-11', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.434502, 36.72817), 4326), 50.64307667050023, 25.197371604525536, 69, '{"fuel_level": 69, "engine_temp": 89, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('3-Mekanize-Bl-Kobra-II-12', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.385341, 36.68415), 4326), 77.40383902588228, 28.487177015773334, 86, '{"fuel_level": 86, "engine_temp": 78, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.605111, 36.6564), 4326), 14.337460153791316, 25.712060081270206, 67, '{"fuel_level": 67, "engine_temp": 85, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Kirpi-II-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.611898, 39.928013), 4326), 2.2944053103165496, 0, 98, '{"fuel_level": 98, "engine_temp": 71, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Kirpi-II-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.561971, 39.977344), 4326), 62.81805371621817, 0, 98, '{"fuel_level": 98, "engine_temp": 95, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-04', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.4189, 36.687962), 4326), 87.53975792706147, 39.71245512982301, 72, '{"fuel_level": 72, "engine_temp": 86, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Kirpi-II-05', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.168187, 36.309166), 4326), 23.75981314529585, 31.169218051851622, 62, '{"fuel_level": 62, "engine_temp": 83, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-06', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.976975, 36.214031), 4326), 50.95752609763292, 45.633675314008315, 82, '{"fuel_level": 82, "engine_temp": 73, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Kirpi-II-07', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.976555, 36.146114), 4326), 39.860227678553905, 42.01953922710104, 71, '{"fuel_level": 71, "engine_temp": 90, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Ejder-Yalçın-08', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.491004, 36.582052), 4326), 87.98968301357839, 48.38505074005408, 87, '{"fuel_level": 87, "engine_temp": 74, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('4-Mekanize-Bl-Kirpi-II-09', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.573139, 39.960842), 4326), 15.929643517104196, 0, 78, '{"fuel_level": 78, "engine_temp": 75, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-Fırtına-Obüs-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.139255, 36.116836), 4326), 65.54477372547194, 49.4460200849791, 70, '{"fuel_level": 70, "engine_temp": 83, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-T-155-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.568532, 39.969175), 4326), 14.213660365712045, 0, 85, '{"fuel_level": 85, "engine_temp": 83, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-Fırtına-Obüs-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(36.967206, 36.264259), 4326), 44.236501065372266, 23.12911684836481, 91, '{"fuel_level": 91, "engine_temp": 77, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-Fırtına-Obüs-04', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.64431, 39.947099), 4326), 62.66643912283417, 0, 96, '{"fuel_level": 96, "engine_temp": 74, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-Fırtına-Obüs-05', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(32.570236, 39.917933), 4326), 2.189981536374519, 0, 69, '{"fuel_level": 69, "engine_temp": 90, "engine_status": "OFF", "alignment": "FRIEND", "threat_level": 0}'::jsonb);

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('Topçu-Taburu-Fırtına-Obüs-06', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(37.126771, 36.371602), 4326), 65.53967989988723, 25.28500057298991, 84, '{"fuel_level": 84, "engine_temp": 71, "engine_status": "RUNNING", "alignment": "FRIEND", "threat_level": 0}'::jsonb);


-- ============================================================================
-- INSERT SAMPLE TACTICAL MEMORIES (For AI RAG)
-- ============================================================================

INSERT INTO tactical_memory (event_type, event_description, source_id, timestamp, outcome, lessons_learned)
VALUES 
('DRONE_LOW_BATTERY', 'TB2 bataryası kritik seviyeye düştü, acil iniş yapıldı', '341. Filo-TB2-01', NOW() - INTERVAL '7 days', 'Başarılı acil iniş, varlık kurtarıldı', 'Batarya %20 altına düşmeden RTH başlatılmalı'),
('SOLDIER_HIGH_STRESS', 'JÖH personelinde yüksek stres tespit edildi, taktik değişikliği yapıldı', 'JÖH-Mardin-05', NOW() - INTERVAL '3 days', 'Personel güvenli bölgeye çekildi', 'HR > 140 durumunda personel değişikliği düşünülmeli'),
('VEHICLE_AMBUSH', 'Kirpi II konvoyuna saldırı girişimi', '3. Mekanize Bl.-Kirpi II-03', NOW() - INTERVAL '14 days', 'Saldırı püskürtüldü, kayıp yok', 'Dar geçitlerde hava desteği kritik'),
('DRONE_TARGET_ACQUIRED', 'Akıncı ile düşman mevzisi tespit edildi', '341. Filo-Akıncı-01', NOW() - INTERVAL '5 days', 'Hedef koordinatları iletildi', 'Termal görüntüleme gece operasyonlarında etkili'),
('BORDER_INFILTRATION', 'Sınırda şüpheli hareket tespit edildi', 'JÖH-Şırnak-12', NOW() - INTERVAL '1 day', 'Olay araştırıldı, yanlış alarm', 'Termal drone desteği ile doğrulama yapılmalı');

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Print summary
DO $$
DECLARE
    asset_count INTEGER;
    telemetry_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO asset_count FROM assets;
    SELECT COUNT(*) INTO telemetry_count FROM telemetry;
    RAISE NOTICE '✅ Database seeded successfully!';
    RAISE NOTICE '   Assets: %', asset_count;
    RAISE NOTICE '   Telemetry records: %', telemetry_count;
END $$;
