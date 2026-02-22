-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: 2026-02-23T00:13:34.276136
-- Total Assets: 30
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- CLEAN DATABASE (Drop all data)
-- ============================================================================

DROP TABLE IF EXISTS ai_analyses CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
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
    status VARCHAR(50) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'WARNING', 'OFFLINE', 'IDLE', 'EXERCISE', 'PATROL', 'COMBAT', 'STOPPED')),
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

-- Tasks table (v2)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Logs table (v2)
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50),
    event_type VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Analyses table (v2)
CREATE TABLE ai_analyses (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50),
    threat_level VARCHAR(50),
    recommendation TEXT,
    is_alert BOOLEAN DEFAULT FALSE,
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
CREATE INDEX idx_tasks_asset_id ON tasks(asset_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_system_logs_asset_id ON system_logs(asset_id);
CREATE INDEX idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX idx_ai_analyses_asset_id ON ai_analyses(asset_id);
CREATE INDEX idx_ai_analyses_is_alert ON ai_analyses(is_alert);

-- ============================================================================
-- INSERT ASSETS (30 Total)
-- ============================================================================

INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-01', 'TB2 Bayraktar 1', 'DRONE', 'IDLE', 'FRIEND', 38.462583, 27.215356, 22.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-02', 'TB2 Bayraktar 2', 'DRONE', 'IDLE', 'FRIEND', 38.46942, 27.218794, 42.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-03', 'TB2 Bayraktar 3', 'DRONE', 'IDLE', 'FRIEND', 38.467232, 27.211478, 1.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-01', 'ANKA-S 1', 'DRONE', 'IDLE', 'FRIEND', 38.462689, 27.218842, 39.6, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-02', 'ANKA-S 2', 'DRONE', 'IDLE', 'FRIEND', 38.467215, 27.211558, 49.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-03', 'ANKA-S 3', 'DRONE', 'EXERCISE', 'FRIEND', 38.230511, 27.017017, 1635.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-01', 'Aksungur 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.221925, 26.950423, 529.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-02', 'Aksungur 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.35041, 27.048104, 1068.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-01', 'Mini IHA 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.364094, 26.97877, 913.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-02', 'Mini IHA 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.25623, 26.956745, 1389.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-01', 'SAT Komando Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.467211, 27.215675, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-02', 'SAT Komando Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.46558, 27.218951, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-03', 'SAT Komando Tim 3', 'SOLDIER', 'IDLE', 'FRIEND', 38.463219, 27.215347, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-01', 'SAS Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.468658, 27.212254, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-02', 'SAS Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.465947, 27.215267, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-01', 'Dag Komando 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.309258, 26.97994, 122.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-02', 'Dag Komando 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.249601, 27.060462, 440.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-03', 'Dag Komando 3', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.299171, 26.948628, 451.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-01', 'Piyade Manga 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.253829, 27.055226, 280.1, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-02', 'Piyade Manga 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.356342, 27.047386, 399.1, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-01', 'Altay Tank 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.4653, 27.219005, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-02', 'Altay Tank 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.46389, 27.21276, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-01', 'Kirpi MRAP 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.462153, 27.215436, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-02', 'Kirpi MRAP 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.465872, 27.217464, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-03', 'Kirpi MRAP 3', 'VEHICLE', 'IDLE', 'FRIEND', 38.468997, 27.214845, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-01', 'Kobra Zirhli 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.299398, 27.069975, 286.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-02', 'Kobra Zirhli 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.320956, 27.011834, 243.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-01', 'Firtina Obus 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.364698, 27.019086, 190.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-02', 'Firtina Obus 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.288152, 27.060973, 290.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('EJDER-01', 'Ejder Yalcin 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.36108, 27.05105, 277.6, CURRENT_TIMESTAMP);

-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215356, 38.462583), 4326), 22.8, 0, 90, '{"heading": 314.7, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218794, 38.46942), 4326), 42.4, 0, 99, '{"heading": 291.3, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211478, 38.467232), 4326), 1.2, 0, 98, '{"heading": 99.1, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218842, 38.462689), 4326), 39.6, 0, 100, '{"heading": 209.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211558, 38.467215), 4326), 49.7, 0, 93, '{"heading": 172.1, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.017017, 38.230511), 4326), 1635.2, 137.6, 73, '{"heading": 219.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.950423, 38.221925), 4326), 529.8, 83.9, 86, '{"heading": 51.7, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.048104, 38.35041), 4326), 1068.9, 148.1, 64, '{"heading": 276.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.97877, 38.364094), 4326), 913.3, 84.0, 90, '{"heading": 181.0, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.956745, 38.25623), 4326), 1389.2, 139.7, 73, '{"heading": 10.5, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215675, 38.467211), 4326), 0, 0, 97, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.2, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.218951, 38.46558), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 96, "body_temp": 36.9, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215347, 38.463219), 4326), 0, 0, 98, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212254, 38.468658), 4326), 0, 0, 94, '{"heart_rate": 70, "spo2": 98, "body_temp": 37.0, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215267, 38.465947), 4326), 0, 0, 100, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.97994, 38.309258), 4326), 122.5, 6.1, 63, '{"heart_rate": 85, "spo2": 97, "body_temp": 36.5, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.060462, 38.249601), 4326), 440.8, 3.0, 89, '{"heart_rate": 109, "spo2": 98, "body_temp": 36.7, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.948628, 38.299171), 4326), 451.8, 5.3, 78, '{"heart_rate": 93, "spo2": 99, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.055226, 38.253829), 4326), 280.1, 7.0, 64, '{"heart_rate": 87, "spo2": 99, "body_temp": 36.8, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.047386, 38.356342), 4326), 399.1, 7.9, 60, '{"heart_rate": 96, "spo2": 99, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.219005, 38.4653), 4326), 0, 0, 99, '{"fuel_level": 99, "engine_temp": 79, "engine_status": "OFF", "heading": 67.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.21276, 38.46389), 4326), 0, 0, 95, '{"fuel_level": 95, "engine_temp": 83, "engine_status": "OFF", "heading": 239.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215436, 38.462153), 4326), 0, 0, 95, '{"fuel_level": 95, "engine_temp": 78, "engine_status": "OFF", "heading": 276.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217464, 38.465872), 4326), 0, 0, 90, '{"fuel_level": 90, "engine_temp": 70, "engine_status": "OFF", "heading": 97.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214845, 38.468997), 4326), 0, 0, 90, '{"fuel_level": 90, "engine_temp": 72, "engine_status": "OFF", "heading": 5.1, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.069975, 38.299398), 4326), 286.2, 41.1, 86, '{"fuel_level": 86, "engine_temp": 72, "engine_status": "RUNNING", "heading": 279.1, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.011834, 38.320956), 4326), 243.7, 51.9, 92, '{"fuel_level": 92, "engine_temp": 75, "engine_status": "RUNNING", "heading": 241.2, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.019086, 38.364698), 4326), 190.9, 41.4, 93, '{"fuel_level": 93, "engine_temp": 78, "engine_status": "RUNNING", "heading": 170.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.060973, 38.288152), 4326), 290.9, 20.5, 77, '{"fuel_level": 77, "engine_temp": 77, "engine_status": "RUNNING", "heading": 38.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('EJDER-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.05105, 38.36108), 4326), 277.6, 49.1, 74, '{"fuel_level": 74, "engine_temp": 80, "engine_status": "RUNNING", "heading": 289.6, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);

-- ============================================================================
-- INSERT TASKS (v2)
-- ============================================================================

INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-01', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-02', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-03', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-01', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-02', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-03', 'Fotograf Haritalama', 'Tatbikat bolgesinin hava fotograflarini cek', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-03', 'Kesif Ucusu', 'Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-01', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-01', 'Kesif Ucusu', 'Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-02', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-02', 'Kesif Ucusu', 'Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-01', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-01', 'Konvoy Takibi', 'Mavi kuvvet konvoyunu havadan takip et', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-02', 'Kesif Ucusu', 'Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-02', 'Konvoy Takibi', 'Mavi kuvvet konvoyunu havadan takip et', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('SAT-TIM-01', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('SAT-TIM-02', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('SAT-TIM-03', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('SAS-TIM-01', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('SAS-TIM-02', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-01', 'Kesif Timi', 'Ileri kesif noktasina intikal', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-01', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-02', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-02', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-03', 'Nobet Gorevi', 'Kisla ana giris nobet gorevi', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-03', 'Tatbikat - Baskin', 'Simule edilmis baskin tatbikati', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-01', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-01', 'Tatbikat - Baskin', 'Simule edilmis baskin tatbikati', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-02', 'Tatbikat - Baskin', 'Simule edilmis baskin tatbikati', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-02', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ALTAY-01', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ALTAY-02', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-01', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-02', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-03', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-01', 'Konvoy Harekati', 'Alfa noktasindan Bravo noktasina malzeme taşima', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-02', 'Konvoy Harekati', 'Alfa noktasindan Bravo noktasina malzeme taşima', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-02', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-01', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-02', 'Konvoy Harekati', 'Alfa noktasindan Bravo noktasina malzeme taşima', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-02', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('EJDER-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('EJDER-01', 'Arazi Manevra', 'Tatbikat bolgesinde taktik manevra', 'IN_PROGRESS');

-- ============================================================================
-- INSERT SYSTEM LOGS (v2)
-- ============================================================================

INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('TB2-ALFA-03', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-03', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ANKA-BRAVO-03', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %14');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %25');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %15');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAT-TIM-03', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAS-TIM-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAS-TIM-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAS-TIM-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('SAS-TIM-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-01', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-01', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'MISSION_COMPLETE', 'Gorev basariyla tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %25');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %13');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ALTAY-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ALTAY-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ALTAY-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('ALTAY-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KIRPI-03', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %15');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');

-- ============================================================================
-- INSERT AI ANALYSES (v2)
-- ============================================================================

INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-03', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-02', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-03', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-03', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-02', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-02', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-02', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-02', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-03', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAS-TIM-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAS-TIM-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-03', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-03', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-03', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-02', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ALTAY-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ALTAY-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-01', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-03', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-02', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-02', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-02', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-02', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);

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
    task_count INTEGER;
    log_count INTEGER;
    analysis_count INTEGER;
    alert_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO asset_count FROM assets;
    SELECT COUNT(*) INTO telemetry_count FROM telemetry;
    SELECT COUNT(*) INTO drone_count FROM assets WHERE type = 'DRONE';
    SELECT COUNT(*) INTO soldier_count FROM assets WHERE type = 'SOLDIER';
    SELECT COUNT(*) INTO vehicle_count FROM assets WHERE type = 'VEHICLE';
    SELECT COUNT(*) INTO task_count FROM tasks;
    SELECT COUNT(*) INTO log_count FROM system_logs;
    SELECT COUNT(*) INTO analysis_count FROM ai_analyses;
    SELECT COUNT(*) INTO alert_count FROM ai_analyses WHERE is_alert = TRUE;
    
    RAISE NOTICE 'EGE TATBIKATI Database seeded!';
    RAISE NOTICE '   Total Assets: %', asset_count;
    RAISE NOTICE '   - Drones: %', drone_count;
    RAISE NOTICE '   - Soldiers: %', soldier_count;
    RAISE NOTICE '   - Vehicles: %', vehicle_count;
    RAISE NOTICE '   Initial Telemetry: %', telemetry_count;
    RAISE NOTICE '   Tasks: %', task_count;
    RAISE NOTICE '   System Logs: %', log_count;
    RAISE NOTICE '   AI Analyses: % (Alerts: %)', analysis_count, alert_count;
END $$;
