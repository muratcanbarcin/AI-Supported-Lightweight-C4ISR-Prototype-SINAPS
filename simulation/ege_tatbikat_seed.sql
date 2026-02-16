-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: 2026-02-16T15:07:50.710134
-- Total Assets: 30
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- CLEAN DATABASE (Drop all data)
-- ============================================================================

DROP TABLE IF EXISTS tactical_memory CASCADE;
DROP TABLE IF EXISTS tactical_analysis CASCADE;
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Assets table
CREATE TABLE assets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DRONE', 'SOLDIER', 'VEHICLE', 'SENSOR')),
    status VARCHAR(50) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'WARNING', 'OFFLINE', 'IDLE', 'EXERCISE', 'PATROL', 'COMBAT')),
    alignment VARCHAR(20) DEFAULT 'FRIEND' CHECK (alignment IN ('FRIEND', 'FOE', 'UNKNOWN')),
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    last_altitude DOUBLE PRECISION,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry table (stores ALL history)
CREATE TABLE telemetry (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL,
    source_type VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location geometry(Point, 4326),
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    battery_level INTEGER,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tactical Analysis table
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

-- Tactical Memory table (for AI)
CREATE TABLE tactical_memory (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    event_description TEXT,
    source_id VARCHAR(100),
    location geometry(Point, 4326),
    timestamp TIMESTAMP,
    outcome TEXT,
    lessons_learned TEXT,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_telemetry_source_id ON telemetry(source_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_source_timestamp ON telemetry(source_id, timestamp DESC);
CREATE INDEX idx_telemetry_location ON telemetry USING GIST(location);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_status ON assets(status);

-- ============================================================================
-- INSERT ASSETS (30 Total)
-- ============================================================================

INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-01', 'TB2 Bayraktar 1', 'DRONE', 'IDLE', 'FRIEND', 38.469133, 27.211455, 20.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-02', 'TB2 Bayraktar 2', 'DRONE', 'IDLE', 'FRIEND', 38.464982, 27.21637, 5.0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-03', 'TB2 Bayraktar 3', 'DRONE', 'IDLE', 'FRIEND', 38.464087, 27.214307, 17.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-01', 'ANKA-S 1', 'DRONE', 'IDLE', 'FRIEND', 38.463549, 27.210612, 34.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-02', 'ANKA-S 2', 'DRONE', 'IDLE', 'FRIEND', 38.469443, 27.217639, 31.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-03', 'ANKA-S 3', 'DRONE', 'EXERCISE', 'FRIEND', 38.307392, 27.007824, 1045.6, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-01', 'Aksungur 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.354994, 26.933055, 1651.0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-02', 'Aksungur 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.297461, 27.037877, 950.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-01', 'Mini IHA 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.384121, 26.965159, 1601.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-02', 'Mini IHA 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.35975, 26.970539, 1191.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-01', 'SAT Komando Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.46688, 27.213346, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-02', 'SAT Komando Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.46342, 27.215772, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-03', 'SAT Komando Tim 3', 'SOLDIER', 'IDLE', 'FRIEND', 38.464401, 27.214039, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-01', 'SAS Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.469201, 27.218096, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-02', 'SAS Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.468665, 27.217046, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-01', 'Dag Komando 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.356556, 26.992237, 477.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-02', 'Dag Komando 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.346073, 27.08824, 224.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-03', 'Dag Komando 3', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.216417, 26.91535, 391.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-01', 'Piyade Manga 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.269217, 27.051081, 430.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-02', 'Piyade Manga 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.245346, 27.041147, 487.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-01', 'Altay Tank 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.461319, 27.216604, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-02', 'Altay Tank 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.468813, 27.212597, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-01', 'Kirpi MRAP 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.460709, 27.215357, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-02', 'Kirpi MRAP 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.462446, 27.211729, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-03', 'Kirpi MRAP 3', 'VEHICLE', 'IDLE', 'FRIEND', 38.467913, 27.219446, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-01', 'Kobra Zirhli 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.252701, 27.014211, 138.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-02', 'Kobra Zirhli 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.280094, 26.967489, 143.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-01', 'Firtina Obus 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.308651, 27.073547, 98.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-02', 'Firtina Obus 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.347043, 27.075078, 256.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('EJDER-01', 'Ejder Yalcin 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.233897, 26.984247, 291.1, CURRENT_TIMESTAMP);

-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211455, 38.469133), 4326), 20.2, 0, 90, '{"heading": 358.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.21637, 38.464982), 4326), 5.0, 0, 90, '{"heading": 207.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214307, 38.464087), 4326), 17.8, 0, 93, '{"heading": 213.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.210612, 38.463549), 4326), 34.9, 0, 93, '{"heading": 246.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217639, 38.469443), 4326), 31.8, 0, 97, '{"heading": 13.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.007824, 38.307392), 4326), 1045.6, 89.2, 62, '{"heading": 209.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.933055, 38.354994), 4326), 1651.0, 90.1, 75, '{"heading": 352.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.037877, 38.297461), 4326), 950.2, 102.5, 83, '{"heading": 48.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.965159, 38.384121), 4326), 1601.8, 80.7, 72, '{"heading": 278.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.970539, 38.35975), 4326), 1191.5, 108.3, 78, '{"heading": 255.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.213346, 38.46688), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215772, 38.46342), 4326), 0, 0, 100, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214039, 38.464401), 4326), 0, 0, 97, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218096, 38.469201), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217046, 38.468665), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.992237, 38.356556), 4326), 477.7, 3.3, 92, '{"heart_rate": 102, "spo2": 98, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.08824, 38.346073), 4326), 224.9, 5.6, 81, '{"heart_rate": 107, "spo2": 98, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.91535, 38.216417), 4326), 391.5, 3.1, 93, '{"heart_rate": 92, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.051081, 38.269217), 4326), 430.5, 4.4, 74, '{"heart_rate": 86, "spo2": 99, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.041147, 38.245346), 4326), 487.2, 7.0, 83, '{"heart_rate": 110, "spo2": 98, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.216604, 38.461319), 4326), 0, 0, 97, '{"fuel_level": 97, "engine_temp": 79, "engine_status": "OFF", "heading": 289.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212597, 38.468813), 4326), 0, 0, 92, '{"fuel_level": 92, "engine_temp": 70, "engine_status": "OFF", "heading": 329.1, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215357, 38.460709), 4326), 0, 0, 99, '{"fuel_level": 99, "engine_temp": 77, "engine_status": "OFF", "heading": 157.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211729, 38.462446), 4326), 0, 0, 99, '{"fuel_level": 99, "engine_temp": 85, "engine_status": "OFF", "heading": 347.0, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.219446, 38.467913), 4326), 0, 0, 96, '{"fuel_level": 96, "engine_temp": 71, "engine_status": "OFF", "heading": 295.0, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.014211, 38.252701), 4326), 138.3, 30.7, 83, '{"fuel_level": 83, "engine_temp": 82, "engine_status": "RUNNING", "heading": 346.0, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.967489, 38.280094), 4326), 143.9, 54.1, 86, '{"fuel_level": 86, "engine_temp": 76, "engine_status": "RUNNING", "heading": 124.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.073547, 38.308651), 4326), 98.2, 21.6, 80, '{"fuel_level": 80, "engine_temp": 76, "engine_status": "RUNNING", "heading": 194.5, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.075078, 38.347043), 4326), 256.5, 48.2, 92, '{"fuel_level": 92, "engine_temp": 84, "engine_status": "RUNNING", "heading": 231.5, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('EJDER-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.984247, 38.233897), 4326), 291.1, 43.5, 78, '{"fuel_level": 78, "engine_temp": 76, "engine_status": "RUNNING", "heading": 87.0, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
    asset_count INTEGER;
    telemetry_count INTEGER;
    drone_count INTEGER;
    soldier_count INTEGER;
    vehicle_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO asset_count FROM assets;
    SELECT COUNT(*) INTO telemetry_count FROM telemetry;
    SELECT COUNT(*) INTO drone_count FROM assets WHERE type = 'DRONE';
    SELECT COUNT(*) INTO soldier_count FROM assets WHERE type = 'SOLDIER';
    SELECT COUNT(*) INTO vehicle_count FROM assets WHERE type = 'VEHICLE';
    
    RAISE NOTICE 'EGE TATBIKATI Database seeded!';
    RAISE NOTICE '   Total Assets: %', asset_count;
    RAISE NOTICE '   - Drones: %', drone_count;
    RAISE NOTICE '   - Soldiers: %', soldier_count;
    RAISE NOTICE '   - Vehicles: %', vehicle_count;
    RAISE NOTICE '   Initial Telemetry: %', telemetry_count;
END $$;
