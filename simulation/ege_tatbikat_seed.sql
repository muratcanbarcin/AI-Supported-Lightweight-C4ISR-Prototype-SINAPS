-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: 2026-02-16T15:41:13.666504
-- Total Assets: 30
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
-- Note: pgvector extension is optional; tactical_memory.embedding uses TEXT fallback

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

-- Tactical Analysis table (matches backend TacticalAnalysis.java entity)
CREATE TABLE tactical_analysis (
    id BIGSERIAL PRIMARY KEY,
    telemetry_id BIGINT UNIQUE REFERENCES telemetry(id) ON DELETE CASCADE,
    threat_level VARCHAR(50),
    decision TEXT,
    reasoning TEXT,
    confidence DOUBLE PRECISION,
    raw_response TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tactical Memory table — CREATED BY init-vector.sql (Docker entrypoint)
-- Schema: id, context TEXT, embedding vector(384), category, source, created_at
-- Doctrine is seeded by: python seed_doctrine.py

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
VALUES ('TB2-ALFA-01', 'TB2 Bayraktar 1', 'DRONE', 'IDLE', 'FRIEND', 38.462286, 27.212572, 23.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-02', 'TB2 Bayraktar 2', 'DRONE', 'IDLE', 'FRIEND', 38.462177, 27.211879, 33.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-03', 'TB2 Bayraktar 3', 'DRONE', 'IDLE', 'FRIEND', 38.462063, 27.216264, 22.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-01', 'ANKA-S 1', 'DRONE', 'IDLE', 'FRIEND', 38.464622, 27.218699, 11.1, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-02', 'ANKA-S 2', 'DRONE', 'IDLE', 'FRIEND', 38.465265, 27.210874, 14.1, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-03', 'ANKA-S 3', 'DRONE', 'EXERCISE', 'FRIEND', 38.379365, 27.085279, 842.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-01', 'Aksungur 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.30825, 26.919268, 658.0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-02', 'Aksungur 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.331414, 26.957393, 1444.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-01', 'Mini IHA 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.316163, 26.967583, 1256.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-02', 'Mini IHA 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.354298, 27.070638, 1841.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-01', 'SAT Komando Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.464306, 27.219296, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-02', 'SAT Komando Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.465392, 27.214973, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-03', 'SAT Komando Tim 3', 'SOLDIER', 'IDLE', 'FRIEND', 38.462316, 27.21613, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-01', 'SAS Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.466762, 27.212934, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-02', 'SAS Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.465398, 27.214068, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-01', 'Dag Komando 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.388114, 26.981063, 257.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-02', 'Dag Komando 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.309276, 26.998766, 378.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-03', 'Dag Komando 3', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.26147, 26.945538, 293.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-01', 'Piyade Manga 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.301734, 27.045999, 227.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-02', 'Piyade Manga 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.212508, 27.054509, 162.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-01', 'Altay Tank 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.46575, 27.215083, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-02', 'Altay Tank 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.465735, 27.210861, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-01', 'Kirpi MRAP 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.46785, 27.215712, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-02', 'Kirpi MRAP 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.468565, 27.212695, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-03', 'Kirpi MRAP 3', 'VEHICLE', 'IDLE', 'FRIEND', 38.465639, 27.214544, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-01', 'Kobra Zirhli 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.215966, 26.957182, 204.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-02', 'Kobra Zirhli 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.244504, 27.083052, 173.6, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-01', 'Firtina Obus 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.364634, 27.013687, 172.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-02', 'Firtina Obus 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.264486, 26.950382, 105.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('EJDER-01', 'Ejder Yalcin 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.366903, 27.007049, 74.2, CURRENT_TIMESTAMP);

-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212572, 38.462286), 4326), 23.4, 0, 93, '{"heading": 151.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211879, 38.462177), 4326), 33.3, 0, 90, '{"heading": 268.3, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.216264, 38.462063), 4326), 22.5, 0, 94, '{"heading": 333.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218699, 38.464622), 4326), 11.1, 0, 94, '{"heading": 328.1, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.210874, 38.465265), 4326), 14.1, 0, 98, '{"heading": 264.5, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.085279, 38.379365), 4326), 842.8, 99.0, 73, '{"heading": 302.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.919268, 38.30825), 4326), 658.0, 138.5, 72, '{"heading": 31.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.957393, 38.331414), 4326), 1444.3, 133.6, 86, '{"heading": 221.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.967583, 38.316163), 4326), 1256.5, 130.2, 89, '{"heading": 189.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.070638, 38.354298), 4326), 1841.7, 89.4, 72, '{"heading": 320.5, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.219296, 38.464306), 4326), 0, 0, 99, '{"heart_rate": 70, "spo2": 98, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214973, 38.465392), 4326), 0, 0, 95, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.21613, 38.462316), 4326), 0, 0, 97, '{"heart_rate": 70, "spo2": 97, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212934, 38.466762), 4326), 0, 0, 94, '{"heart_rate": 70, "spo2": 96, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214068, 38.465398), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.981063, 38.388114), 4326), 257.3, 4.8, 94, '{"heart_rate": 88, "spo2": 96, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.998766, 38.309276), 4326), 378.9, 6.7, 84, '{"heart_rate": 88, "spo2": 98, "body_temp": 37.0, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.945538, 38.26147), 4326), 293.3, 2.5, 81, '{"heart_rate": 94, "spo2": 98, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.045999, 38.301734), 4326), 227.5, 5.9, 88, '{"heart_rate": 87, "spo2": 96, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.054509, 38.212508), 4326), 162.9, 5.7, 90, '{"heart_rate": 90, "spo2": 98, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215083, 38.46575), 4326), 0, 0, 99, '{"fuel_level": 99, "engine_temp": 78, "engine_status": "OFF", "heading": 21.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.210861, 38.465735), 4326), 0, 0, 94, '{"fuel_level": 94, "engine_temp": 72, "engine_status": "OFF", "heading": 238.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215712, 38.46785), 4326), 0, 0, 98, '{"fuel_level": 98, "engine_temp": 85, "engine_status": "OFF", "heading": 217.5, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212695, 38.468565), 4326), 0, 0, 92, '{"fuel_level": 92, "engine_temp": 75, "engine_status": "OFF", "heading": 215.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214544, 38.465639), 4326), 0, 0, 92, '{"fuel_level": 92, "engine_temp": 76, "engine_status": "OFF", "heading": 175.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.957182, 38.215966), 4326), 204.3, 33.7, 75, '{"fuel_level": 75, "engine_temp": 71, "engine_status": "RUNNING", "heading": 9.0, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.083052, 38.244504), 4326), 173.6, 37.5, 83, '{"fuel_level": 83, "engine_temp": 84, "engine_status": "RUNNING", "heading": 252.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.013687, 38.364634), 4326), 172.7, 49.5, 78, '{"fuel_level": 78, "engine_temp": 84, "engine_status": "RUNNING", "heading": 204.1, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.950382, 38.264486), 4326), 105.2, 51.6, 95, '{"fuel_level": 95, "engine_temp": 76, "engine_status": "RUNNING", "heading": 50.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('EJDER-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.007049, 38.366903), 4326), 74.2, 59.9, 75, '{"fuel_level": 75, "engine_temp": 79, "engine_status": "RUNNING", "heading": 107.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);

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
