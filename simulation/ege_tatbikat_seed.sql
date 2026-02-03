-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: 2026-02-04T01:19:51.365474
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
VALUES ('TB2-ALFA-01', 'TB2 Bayraktar 1', 'DRONE', 'IDLE', 'FRIEND', 38.461719, 27.219484, 30.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-02', 'TB2 Bayraktar 2', 'DRONE', 'IDLE', 'FRIEND', 38.460704, 27.211662, 35.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-03', 'TB2 Bayraktar 3', 'DRONE', 'IDLE', 'FRIEND', 38.468223, 27.213686, 18.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-01', 'ANKA-S 1', 'DRONE', 'IDLE', 'FRIEND', 38.469486, 27.218275, 40.0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-02', 'ANKA-S 2', 'DRONE', 'IDLE', 'FRIEND', 38.466496, 27.210938, 0.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-03', 'ANKA-S 3', 'DRONE', 'EXERCISE', 'FRIEND', 38.210699, 26.940031, 1652.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-01', 'Aksungur 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.225663, 26.929179, 671.0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-02', 'Aksungur 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.358911, 26.98911, 603.6, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-01', 'Mini IHA 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.36743, 27.005093, 1509.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-02', 'Mini IHA 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.227588, 26.984272, 1376.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-01', 'SAT Komando Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.461801, 27.215148, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-02', 'SAT Komando Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.469273, 27.211518, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-03', 'SAT Komando Tim 3', 'SOLDIER', 'IDLE', 'FRIEND', 38.461748, 27.218407, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-01', 'SAS Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.46777, 27.213547, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-02', 'SAS Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.465734, 27.218902, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-01', 'Dag Komando 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.33041, 27.085776, 450.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-02', 'Dag Komando 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.36831, 27.0295, 224.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-03', 'Dag Komando 3', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.380637, 26.950419, 475.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-01', 'Piyade Manga 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.343065, 27.007546, 264.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-02', 'Piyade Manga 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.212909, 27.031924, 488.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-01', 'Altay Tank 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.463314, 27.217908, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-02', 'Altay Tank 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.460852, 27.212994, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-01', 'Kirpi MRAP 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.465996, 27.214269, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-02', 'Kirpi MRAP 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.465221, 27.211191, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-03', 'Kirpi MRAP 3', 'VEHICLE', 'IDLE', 'FRIEND', 38.466546, 27.217086, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-01', 'Kobra Zirhli 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.37561, 26.996658, 156.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-02', 'Kobra Zirhli 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.3571, 26.993342, 153.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-01', 'Firtina Obus 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.339835, 27.049658, 73.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-02', 'Firtina Obus 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.300432, 27.034386, 272.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('EJDER-01', 'Ejder Yalcin 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.289285, 26.952433, 274.5, CURRENT_TIMESTAMP);

-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.219484, 38.461719), 4326), 30.4, 0, 96, '{"heading": 130.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211662, 38.460704), 4326), 35.4, 0, 93, '{"heading": 175.9, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.213686, 38.468223), 4326), 18.5, 0, 100, '{"heading": 116.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218275, 38.469486), 4326), 40.0, 0, 95, '{"heading": 345.8, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.210938, 38.466496), 4326), 0.7, 0, 93, '{"heading": 341.1, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.940031, 38.210699), 4326), 1652.4, 89.2, 71, '{"heading": 280.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.929179, 38.225663), 4326), 671.0, 140.8, 60, '{"heading": 352.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.98911, 38.358911), 4326), 603.6, 143.9, 85, '{"heading": 288.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.005093, 38.36743), 4326), 1509.4, 136.2, 54, '{"heading": 97.8, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.984272, 38.227588), 4326), 1376.7, 139.5, 56, '{"heading": 341.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215148, 38.461801), 4326), 0, 0, 91, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211518, 38.469273), 4326), 0, 0, 90, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.5, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218407, 38.461748), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.8, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.213547, 38.46777), 4326), 0, 0, 98, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218902, 38.465734), 4326), 0, 0, 96, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.6, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.085776, 38.33041), 4326), 450.2, 7.5, 70, '{"heart_rate": 90, "spo2": 99, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.0295, 38.36831), 4326), 224.8, 4.8, 81, '{"heart_rate": 99, "spo2": 99, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.950419, 38.380637), 4326), 475.7, 2.0, 84, '{"heart_rate": 107, "spo2": 99, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.007546, 38.343065), 4326), 264.5, 6.0, 61, '{"heart_rate": 88, "spo2": 99, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.031924, 38.212909), 4326), 488.3, 6.2, 68, '{"heart_rate": 109, "spo2": 99, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217908, 38.463314), 4326), 0, 0, 90, '{"fuel_level": 90, "engine_temp": 76, "engine_status": "OFF", "heading": 17.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212994, 38.460852), 4326), 0, 0, 97, '{"fuel_level": 97, "engine_temp": 76, "engine_status": "OFF", "heading": 142.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214269, 38.465996), 4326), 0, 0, 95, '{"fuel_level": 95, "engine_temp": 70, "engine_status": "OFF", "heading": 26.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211191, 38.465221), 4326), 0, 0, 93, '{"fuel_level": 93, "engine_temp": 81, "engine_status": "OFF", "heading": 152.2, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217086, 38.466546), 4326), 0, 0, 99, '{"fuel_level": 99, "engine_temp": 73, "engine_status": "OFF", "heading": 212.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.996658, 38.37561), 4326), 156.3, 41.2, 70, '{"fuel_level": 70, "engine_temp": 81, "engine_status": "RUNNING", "heading": 169.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.993342, 38.3571), 4326), 153.3, 32.7, 74, '{"fuel_level": 74, "engine_temp": 77, "engine_status": "RUNNING", "heading": 153.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.049658, 38.339835), 4326), 73.2, 54.1, 90, '{"fuel_level": 90, "engine_temp": 84, "engine_status": "RUNNING", "heading": 194.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.034386, 38.300432), 4326), 272.2, 29.5, 76, '{"fuel_level": 76, "engine_temp": 76, "engine_status": "RUNNING", "heading": 78.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('EJDER-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.952433, 38.289285), 4326), 274.5, 21.4, 79, '{"fuel_level": 79, "engine_temp": 77, "engine_status": "RUNNING", "heading": 90.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);

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
