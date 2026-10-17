-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: 2026-03-03T01:33:31.189251
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
DROP TABLE IF EXISTS users CASCADE;

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

-- Users table (authentication & profile)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    rank VARCHAR(100),
    role VARCHAR(50) DEFAULT 'ROLE_USER' CHECK (role IN ('ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMMANDER')),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
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
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- INSERT ASSETS (30 Total)
-- ============================================================================

INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-01', 'TB2 Bayraktar 1', 'DRONE', 'IDLE', 'FRIEND', 38.462873, 27.213462, 6.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-02', 'TB2 Bayraktar 2', 'DRONE', 'IDLE', 'FRIEND', 38.46874, 27.211674, 7.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('TB2-ALFA-03', 'TB2 Bayraktar 3', 'DRONE', 'IDLE', 'FRIEND', 38.468017, 27.217761, 47.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-01', 'ANKA-S 1', 'DRONE', 'IDLE', 'FRIEND', 38.464391, 27.2192, 34.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-02', 'ANKA-S 2', 'DRONE', 'IDLE', 'FRIEND', 38.461576, 27.219231, 11.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ANKA-BRAVO-03', 'ANKA-S 3', 'DRONE', 'EXERCISE', 'FRIEND', 38.255, 26.914381, 1599.3, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-01', 'Aksungur 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.351405, 27.007229, 641.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('AKSUNGUR-02', 'Aksungur 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.250511, 26.982247, 909.8, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-01', 'Mini IHA 1', 'DRONE', 'EXERCISE', 'FRIEND', 38.275208, 27.032622, 1449.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('MINI-IHA-02', 'Mini IHA 2', 'DRONE', 'EXERCISE', 'FRIEND', 38.261191, 27.019131, 613.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-01', 'SAT Komando Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.463947, 27.213947, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-02', 'SAT Komando Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.469253, 27.211458, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAT-TIM-03', 'SAT Komando Tim 3', 'SOLDIER', 'IDLE', 'FRIEND', 38.461124, 27.211496, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-01', 'SAS Tim 1', 'SOLDIER', 'IDLE', 'FRIEND', 38.46824, 27.212028, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('SAS-TIM-02', 'SAS Tim 2', 'SOLDIER', 'IDLE', 'FRIEND', 38.464597, 27.21932, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-01', 'Dag Komando 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.297337, 26.972679, 352.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-02', 'Dag Komando 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.372144, 27.04722, 147.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOMANDO-03', 'Dag Komando 3', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.304881, 27.049349, 326.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-01', 'Piyade Manga 1', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.27638, 26.953045, 412.4, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('PIYADE-02', 'Piyade Manga 2', 'SOLDIER', 'EXERCISE', 'FRIEND', 38.277952, 26.941659, 255.2, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-01', 'Altay Tank 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.46389, 27.215596, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('ALTAY-02', 'Altay Tank 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.461035, 27.214489, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-01', 'Kirpi MRAP 1', 'VEHICLE', 'IDLE', 'FRIEND', 38.461223, 27.21283, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-02', 'Kirpi MRAP 2', 'VEHICLE', 'IDLE', 'FRIEND', 38.463003, 27.214629, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KIRPI-03', 'Kirpi MRAP 3', 'VEHICLE', 'IDLE', 'FRIEND', 38.467809, 27.217051, 0, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-01', 'Kobra Zirhli 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.340914, 27.052552, 169.9, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('KOBRA-02', 'Kobra Zirhli 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.311196, 26.949945, 78.7, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-01', 'Firtina Obus 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.227169, 27.035226, 185.1, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('FIRTINA-02', 'Firtina Obus 2', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.350756, 27.017955, 209.5, CURRENT_TIMESTAMP);
INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('EJDER-01', 'Ejder Yalcin 1', 'VEHICLE', 'EXERCISE', 'FRIEND', 38.274731, 26.943503, 297.9, CURRENT_TIMESTAMP);

-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.213462, 38.462873), 4326), 6.3, 0, 90, '{"heading": 177.1, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211674, 38.46874), 4326), 7.9, 0, 93, '{"heading": 29.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('TB2-ALFA-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217761, 38.468017), 4326), 47.3, 0, 94, '{"heading": 106.6, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.2192, 38.464391), 4326), 34.8, 0, 92, '{"heading": 215.2, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.219231, 38.461576), 4326), 11.9, 0, 97, '{"heading": 10.5, "mode": "STANDBY", "alignment": "FRIEND", "threat_level": 0, "mission": "Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ANKA-BRAVO-03', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.914381, 38.255), 4326), 1599.3, 88.4, 79, '{"heading": 260.9, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.007229, 38.351405), 4326), 641.4, 105.8, 54, '{"heading": 190.6, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('AKSUNGUR-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.982247, 38.250511), 4326), 909.8, 82.4, 84, '{"heading": 249.1, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-01', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.032622, 38.275208), 4326), 1449.9, 81.0, 85, '{"heading": 276.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('MINI-IHA-02', 'DRONE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.019131, 38.261191), 4326), 613.5, 90.4, 89, '{"heading": 132.3, "mode": "AUTO", "alignment": "FRIEND", "threat_level": 0, "mission": "Kesif Ucusu"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.213947, 38.463947), 4326), 0, 0, 94, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211458, 38.469253), 4326), 0, 0, 100, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.4, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAT-TIM-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.211496, 38.461124), 4326), 0, 0, 93, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.212028, 38.46824), 4326), 0, 0, 90, '{"heart_rate": 70, "spo2": 99, "body_temp": 36.7, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('SAS-TIM-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.21932, 38.464597), 4326), 0, 0, 90, '{"heart_rate": 70, "spo2": 97, "body_temp": 36.3, "stress_level": "LOW", "alignment": "FRIEND", "threat_level": 0, "mission": "Kisla Nobet"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.972679, 38.297337), 4326), 352.4, 3.0, 77, '{"heart_rate": 105, "spo2": 97, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.04722, 38.372144), 4326), 147.2, 4.3, 70, '{"heart_rate": 102, "spo2": 99, "body_temp": 36.9, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOMANDO-03', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.049349, 38.304881), 4326), 326.7, 5.7, 89, '{"heart_rate": 90, "spo2": 98, "body_temp": 36.4, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-01', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.953045, 38.27638), 4326), 412.4, 3.6, 71, '{"heart_rate": 108, "spo2": 97, "body_temp": 36.6, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('PIYADE-02', 'SOLDIER', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.941659, 38.277952), 4326), 255.2, 3.6, 67, '{"heart_rate": 91, "spo2": 98, "body_temp": 36.3, "stress_level": "MEDIUM", "alignment": "FRIEND", "threat_level": 0, "mission": "Tatbikat"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.215596, 38.46389), 4326), 0, 0, 91, '{"fuel_level": 91, "engine_temp": 85, "engine_status": "OFF", "heading": 171.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('ALTAY-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214489, 38.461035), 4326), 0, 0, 96, '{"fuel_level": 96, "engine_temp": 78, "engine_status": "OFF", "heading": 75.5, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.21283, 38.461223), 4326), 0, 0, 97, '{"fuel_level": 97, "engine_temp": 75, "engine_status": "OFF", "heading": 248.3, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.214629, 38.463003), 4326), 0, 0, 96, '{"fuel_level": 96, "engine_temp": 73, "engine_status": "OFF", "heading": 82.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KIRPI-03', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.217051, 38.467809), 4326), 0, 0, 96, '{"fuel_level": 96, "engine_temp": 78, "engine_status": "OFF", "heading": 183.7, "alignment": "FRIEND", "threat_level": 0, "mission": "Garajda Bekleme"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.052552, 38.340914), 4326), 169.9, 37.8, 73, '{"fuel_level": 73, "engine_temp": 80, "engine_status": "RUNNING", "heading": 46.2, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('KOBRA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.949945, 38.311196), 4326), 78.7, 47.3, 74, '{"fuel_level": 74, "engine_temp": 76, "engine_status": "RUNNING", "heading": 173.8, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.035226, 38.227169), 4326), 185.1, 48.0, 90, '{"fuel_level": 90, "engine_temp": 77, "engine_status": "RUNNING", "heading": 293.9, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('FIRTINA-02', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(27.017955, 38.350756), 4326), 209.5, 36.7, 78, '{"fuel_level": 78, "engine_temp": 74, "engine_status": "RUNNING", "heading": 359.1, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);
INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('EJDER-01', 'VEHICLE', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint(26.943503, 38.274731), 4326), 297.9, 36.4, 89, '{"fuel_level": 89, "engine_temp": 80, "engine_status": "RUNNING", "heading": 82.4, "alignment": "FRIEND", "threat_level": 0, "mission": "Arazi Tatbikati"}'::jsonb);

-- ============================================================================
-- INSERT TASKS (v2)
-- ============================================================================

INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-01', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-02', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('TB2-ALFA-03', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-01', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-02', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-03', 'Kesif Ucusu', 'Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ANKA-BRAVO-03', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-01', 'Gozetleme Gorevi', 'Sinir hattinda 24 saat gozetleme gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-01', 'Konvoy Takibi', 'Mavi kuvvet konvoyunu havadan takip et', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-02', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('AKSUNGUR-02', 'Fotograf Haritalama', 'Tatbikat bolgesinin hava fotograflarini cek', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-01', 'Fotograf Haritalama', 'Tatbikat bolgesinin hava fotograflarini cek', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-01', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-02', 'Fotograf Haritalama', 'Tatbikat bolgesinin hava fotograflarini cek', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('MINI-IHA-02', 'Gece Gorevi', 'Gece termal kamera ile bolge taramasi', 'PENDING');
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
VALUES ('KOMANDO-01', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-01', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-02', 'Nobet Gorevi', 'Kisla ana giris nobet gorevi', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-02', 'Kesif Timi', 'Ileri kesif noktasina intikal', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-03', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOMANDO-03', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-01', 'Tatbikat - Baskin', 'Simule edilmis baskin tatbikati', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-01', 'Kesif Timi', 'Ileri kesif noktasina intikal', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-02', 'Ilk Yardim Egitimi', 'Saha ilk yardim egitimi katilimi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('PIYADE-02', 'Devriye Gorevi', 'Kuzey sektor devriye hattinda yuruyus', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ALTAY-01', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('ALTAY-02', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-02', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KIRPI-03', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-01', 'Bakim Kontrol', 'Periyodik bakim ve teknik kontrol', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-02', 'Hedef Atisi', 'Atis poligonunda hedef atisi', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('KOBRA-02', 'Arazi Manevra', 'Tatbikat bolgesinde taktik manevra', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-01', 'Arazi Manevra', 'Tatbikat bolgesinde taktik manevra', 'IN_PROGRESS');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-02', 'Hedef Atisi', 'Atis poligonunda hedef atisi', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('FIRTINA-02', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('EJDER-01', 'Hedef Atisi', 'Atis poligonunda hedef atisi', 'COMPLETED');
INSERT INTO tasks (asset_id, title, description, status)
VALUES ('EJDER-01', 'Muharebe Destek', 'Piyade birligine yakin destek gorevi', 'PENDING');

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
VALUES ('ANKA-BRAVO-03', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %13');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'MISSION_COMPLETE', 'Gorev basariyla tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-01', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('AKSUNGUR-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('MINI-IHA-02', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
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
VALUES ('KOMANDO-01', 'MISSION_COMPLETE', 'Gorev basariyla tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'MISSION_COMPLETE', 'Gorev basariyla tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-02', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %18');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOMANDO-03', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('PIYADE-02', 'BATTERY_WARNING', 'Batarya seviyesi kritik: %24');
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
VALUES ('KOBRA-01', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-01', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-01', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'SENSOR_CALIBRATION', 'Sensor kalibrasyonu tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'MISSION_START', 'Gorev basladi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('KOBRA-02', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-01', 'GPS_LOCK', 'GPS sinyali kilitlendi, konum dogrulandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'FIRMWARE_UPDATE', 'Firmware guncelleme tamamlandi v2.1.4');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('FIRTINA-02', 'MISSION_COMPLETE', 'Gorev basariyla tamamlandi');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'MODE_CHANGE', 'Operasyonel mod degisikligi: IDLE -> EXERCISE');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('EJDER-01', 'MISSION_START', 'Gorev basladi');

-- ============================================================================
-- INSERT AI ANALYSES (v2)
-- ============================================================================

INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-02', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('TB2-ALFA-03', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-03', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ANKA-BRAVO-03', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-02', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('AKSUNGUR-02', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-01', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-02', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('MINI-IHA-02', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-01', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAT-TIM-03', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAS-TIM-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('SAS-TIM-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-01', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-01', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-01', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-03', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOMANDO-03', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-01', 'MEDIUM', 'Yakit/batarya seviyesi dusuk, ikmal planlanmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-01', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-01', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-02', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-02', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('PIYADE-02', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ALTAY-01', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('ALTAY-02', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-01', 'LOW', 'Cevre kosullari normal, gorev devam edebilir', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KIRPI-03', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-01', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-01', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-02', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('KOBRA-02', 'MEDIUM', 'Rota sapmasi tespit edildi, operatorun dikkatine sunuldu', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'LOW', 'Normal operasyonel aktivite, tehdit tespit edilmedi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'LOW', 'Standart tatbikat harekati, veriler normal sinirlar icinde', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-01', 'CRITICAL', 'Olasi dusman temasi, birlik alarma gecirilmeli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-02', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-02', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('FIRTINA-02', 'LOW', 'Rutin devriye hareketi, anomali yok', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'MEDIUM', 'Beklenmeyen hiz degisimi tespit edildi, izleme onerisi', FALSE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'HIGH', 'Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali', TRUE);
INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('EJDER-01', 'HIGH', 'Anormal biyometrik degerler, personel saglik kontrolu gerekli', TRUE);

-- ============================================================================
-- INSERT USERS (legacy prototype table, not app_users)
-- Passwords were removed before publication. Regenerate with
-- SEED_DEFAULT_PASSWORD set; do not commit the result.
-- The running system seeds app_users from the backend seeder.
-- ============================================================================

INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('admin', 'REDACTED', 'Semih Utku', 'Yüzbaşı', 'ROLE_ADMIN', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('komutan01', 'REDACTED', 'Kaan Yıldırım', 'Binbaşı', 'ROLE_COMMANDER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('komutan02', 'REDACTED', 'Arda Çelik', 'Yüzbaşı', 'ROLE_COMMANDER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('operator01', 'REDACTED', 'Emre Demir', 'Üsteğmen', 'ROLE_USER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('operator02', 'REDACTED', 'Burak Aksoy', 'Teğmen', 'ROLE_USER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('operator03', 'REDACTED', 'Murat Can Barçın', 'Asteğmen', 'ROLE_USER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('operator04', 'REDACTED', 'Yusuf Kara', 'Astsubay', 'ROLE_USER', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('operator05', 'REDACTED', 'Ali Özkan', 'Çavuş', 'ROLE_USER', FALSE, CURRENT_TIMESTAMP);

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
    user_count INTEGER;
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
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE 'EGE TATBIKATI Database seeded!';
    RAISE NOTICE '   Total Assets: %', asset_count;
    RAISE NOTICE '   - Drones: %', drone_count;
    RAISE NOTICE '   - Soldiers: %', soldier_count;
    RAISE NOTICE '   - Vehicles: %', vehicle_count;
    RAISE NOTICE '   Initial Telemetry: %', telemetry_count;
    RAISE NOTICE '   Tasks: %', task_count;
    RAISE NOTICE '   System Logs: %', log_count;
    RAISE NOTICE '   AI Analyses: % (Alerts: %)', analysis_count, alert_count;
    RAISE NOTICE '   Users: %', user_count;
END $$;
