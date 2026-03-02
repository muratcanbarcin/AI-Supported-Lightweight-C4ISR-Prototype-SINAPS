#!/usr/bin/env python3
"""
===============================================================================
EGE TATBIKATI - DATABASE SEED GENERATOR
===============================================================================
Generates SQL seed file for PostgreSQL with:
- 30 units total (10 Drone, 10 Soldier, 10 Vehicle)
- Half in Izmir Barracks (IDLE)
- Half in Aegean Exercise Zone (EXERCISE)
- Tasks, System Logs, AI Analyses for the new v2 tables
- Users table with roles (ROLE_ADMIN, ROLE_COMMANDER, ROLE_USER)

Usage:
    python generate_seed.py
===============================================================================
"""

import random
import json
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple
from enum import Enum

# =============================================================================
# CONFIGURATION
# =============================================================================

OUTPUT_FILE = Path(__file__).parent / "ege_tatbikat_seed.sql"


# =============================================================================
# SEED TEMPLATES FOR NEW TABLES
# =============================================================================

# Task templates per asset type
TASK_TEMPLATES = {
    "DRONE": [
        ("Kesif Ucusu", "Hedef bolgesinde alçak irtifa kesif ucusu gerceklestir", "IN_PROGRESS"),
        ("Gozetleme Gorevi", "Sinir hattinda 24 saat gozetleme gorevi", "PENDING"),
        ("Fotograf Haritalama", "Tatbikat bolgesinin hava fotograflarini cek", "COMPLETED"),
        ("Konvoy Takibi", "Mavi kuvvet konvoyunu havadan takip et", "IN_PROGRESS"),
        ("Gece Gorevi", "Gece termal kamera ile bolge taramasi", "PENDING"),
    ],
    "SOLDIER": [
        ("Devriye Gorevi", "Kuzey sektor devriye hattinda yuruyus", "IN_PROGRESS"),
        ("Nobet Gorevi", "Kisla ana giris nobet gorevi", "IN_PROGRESS"),
        ("Tatbikat - Baskin", "Simule edilmis baskin tatbikati", "COMPLETED"),
        ("Ilk Yardim Egitimi", "Saha ilk yardim egitimi katilimi", "PENDING"),
        ("Kesif Timi", "Ileri kesif noktasina intikal", "IN_PROGRESS"),
    ],
    "VEHICLE": [
        ("Konvoy Harekati", "Alfa noktasindan Bravo noktasina malzeme taşima", "IN_PROGRESS"),
        ("Arazi Manevra", "Tatbikat bolgesinde taktik manevra", "IN_PROGRESS"),
        ("Hedef Atisi", "Atis poligonunda hedef atisi", "COMPLETED"),
        ("Bakim Kontrol", "Periyodik bakim ve teknik kontrol", "PENDING"),
        ("Muharebe Destek", "Piyade birligine yakin destek gorevi", "PENDING"),
    ],
}

# System log event templates
SYSTEM_LOG_TEMPLATES = [
    ("CONNECTION_ESTABLISHED", "Sistem baglantisi basariyla kuruldu"),
    ("MODE_CHANGE", "Operasyonel mod degisikligi: {old_mode} -> {new_mode}"),
    ("BATTERY_WARNING", "Batarya seviyesi kritik: %{level}"),
    ("GPS_LOCK", "GPS sinyali kilitlendi, konum dogrulandi"),
    ("FIRMWARE_UPDATE", "Firmware guncelleme tamamlandi v2.1.4"),
    ("SENSOR_CALIBRATION", "Sensor kalibrasyonu tamamlandi"),
    ("HEARTBEAT", "Sistem saglik kontrolu basarili"),
    ("MISSION_START", "Gorev basladi"),
    ("MISSION_COMPLETE", "Gorev basariyla tamamlandi"),
]

# AI Analysis templates
AI_ANALYSIS_TEMPLATES = [
    ("LOW", "Normal operasyonel aktivite, tehdit tespit edilmedi", False),
    ("LOW", "Rutin devriye hareketi, anomali yok", False),
    ("MEDIUM", "Beklenmeyen hiz degisimi tespit edildi, izleme onerisi", False),
    ("MEDIUM", "Rota sapmasi tespit edildi, operatorun dikkatine sunuldu", True),
    ("HIGH", "Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali", True),
    ("HIGH", "Anormal biyometrik degerler, personel saglik kontrolu gerekli", True),
    ("CRITICAL", "Olasi dusman temasi, birlik alarma gecirilmeli", True),
    ("LOW", "Standart tatbikat harekati, veriler normal sinirlar icinde", False),
    ("MEDIUM", "Yakit/batarya seviyesi dusuk, ikmal planlanmali", True),
    ("LOW", "Cevre kosullari normal, gorev devam edebilir", False),
]

# User seed data - Turkish military personnel
# All default passwords: "sinaps123" (plain text for prototype)
USER_SEED_DATA = [
    {
        "username": "admin",
        "password": "sinaps123",
        "full_name": "Semih Utku",
        "rank": "Yüzbaşı",
        "role": "ROLE_ADMIN",
        "active": True,
    },
    {
        "username": "komutan01",
        "password": "sinaps123",
        "full_name": "Kaan Yıldırım",
        "rank": "Binbaşı",
        "role": "ROLE_COMMANDER",
        "active": True,
    },
    {
        "username": "komutan02",
        "password": "sinaps123",
        "full_name": "Arda Çelik",
        "rank": "Yüzbaşı",
        "role": "ROLE_COMMANDER",
        "active": True,
    },
    {
        "username": "operator01",
        "password": "sinaps123",
        "full_name": "Emre Demir",
        "rank": "Üsteğmen",
        "role": "ROLE_USER",
        "active": True,
    },
    {
        "username": "operator02",
        "password": "sinaps123",
        "full_name": "Burak Aksoy",
        "rank": "Teğmen",
        "role": "ROLE_USER",
        "active": True,
    },
    {
        "username": "operator03",
        "password": "sinaps123",
        "full_name": "Murat Can Barçın",
        "rank": "Asteğmen",
        "role": "ROLE_USER",
        "active": True,
    },
    {
        "username": "operator04",
        "password": "sinaps123",
        "full_name": "Yusuf Kara",
        "rank": "Astsubay",
        "role": "ROLE_USER",
        "active": True,
    },
    {
        "username": "operator05",
        "password": "sinaps123",
        "full_name": "Ali Özkan",
        "rank": "Çavuş",
        "role": "ROLE_USER",
        "active": False,
    },
]


class AssetType(Enum):
    DRONE = "DRONE"
    SOLDIER = "SOLDIER"
    VEHICLE = "VEHICLE"


class OperationalStatus(Enum):
    IDLE = "IDLE"           # Izmir Kisla
    EXERCISE = "EXERCISE"   # Ege Tatbikat


class Alignment(Enum):
    FRIEND = "FRIEND"


# =============================================================================
# GEOGRAPHIC ZONES
# =============================================================================

ZONES = {
    OperationalStatus.IDLE: {
        "name": "Izmir Bornova Kislasi",
        "center": (38.4650, 27.2150),  # Izmir Bornova
        "spread_km": 0.5,  # Small area - barracks
    },
    OperationalStatus.EXERCISE: {
        "name": "Ege Tatbikat Bolgesi",
        "center": (38.3000, 27.0000),  # Inland Aegean region
        "spread_km": 10,  # Exercise area
    },
}


# =============================================================================
# ASSET DEFINITIONS - 30 TOTAL (NO TURKISH CHARS)
# =============================================================================

@dataclass
class Asset:
    id: str
    name: str
    asset_type: AssetType
    status: OperationalStatus
    latitude: float
    longitude: float
    altitude: float
    speed: float
    battery_level: int
    alignment: Alignment = Alignment.FRIEND


# 10 Drones (IHA - Insansiz Hava Araci)
DRONE_UNITS = [
    {"id": "TB2-ALFA-01", "name": "TB2 Bayraktar 1"},
    {"id": "TB2-ALFA-02", "name": "TB2 Bayraktar 2"},
    {"id": "TB2-ALFA-03", "name": "TB2 Bayraktar 3"},
    {"id": "ANKA-BRAVO-01", "name": "ANKA-S 1"},
    {"id": "ANKA-BRAVO-02", "name": "ANKA-S 2"},
    {"id": "ANKA-BRAVO-03", "name": "ANKA-S 3"},
    {"id": "AKSUNGUR-01", "name": "Aksungur 1"},
    {"id": "AKSUNGUR-02", "name": "Aksungur 2"},
    {"id": "MINI-IHA-01", "name": "Mini IHA 1"},
    {"id": "MINI-IHA-02", "name": "Mini IHA 2"},
]

# 10 Soldiers (Asker - Piyade/Komando)
SOLDIER_UNITS = [
    {"id": "SAT-TIM-01", "name": "SAT Komando Tim 1"},
    {"id": "SAT-TIM-02", "name": "SAT Komando Tim 2"},
    {"id": "SAT-TIM-03", "name": "SAT Komando Tim 3"},
    {"id": "SAS-TIM-01", "name": "SAS Tim 1"},
    {"id": "SAS-TIM-02", "name": "SAS Tim 2"},
    {"id": "KOMANDO-01", "name": "Dag Komando 1"},
    {"id": "KOMANDO-02", "name": "Dag Komando 2"},
    {"id": "KOMANDO-03", "name": "Dag Komando 3"},
    {"id": "PIYADE-01", "name": "Piyade Manga 1"},
    {"id": "PIYADE-02", "name": "Piyade Manga 2"},
]

# 10 Vehicles (KARA ARACLARI - Zirhli/Mekanize)
VEHICLE_UNITS = [
    {"id": "ALTAY-01", "name": "Altay Tank 1"},
    {"id": "ALTAY-02", "name": "Altay Tank 2"},
    {"id": "KIRPI-01", "name": "Kirpi MRAP 1"},
    {"id": "KIRPI-02", "name": "Kirpi MRAP 2"},
    {"id": "KIRPI-03", "name": "Kirpi MRAP 3"},
    {"id": "KOBRA-01", "name": "Kobra Zirhli 1"},
    {"id": "KOBRA-02", "name": "Kobra Zirhli 2"},
    {"id": "FIRTINA-01", "name": "Firtina Obus 1"},
    {"id": "FIRTINA-02", "name": "Firtina Obus 2"},
    {"id": "EJDER-01", "name": "Ejder Yalcin 1"},
]


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def random_coord_in_zone(zone: dict) -> Tuple[float, float]:
    """Generate random coordinates within a zone's spread radius."""
    center_lat, center_lon = zone["center"]
    spread_km = zone["spread_km"]
    
    # Convert km to degrees (approximate)
    km_to_deg = 0.009  # ~1km = 0.009 degrees
    spread_deg = spread_km * km_to_deg
    
    lat = center_lat + random.uniform(-spread_deg, spread_deg)
    lon = center_lon + random.uniform(-spread_deg, spread_deg)
    
    return round(lat, 6), round(lon, 6)


def generate_assets() -> List[Asset]:
    """Generate all 30 assets with balanced distribution."""
    assets = []
    
    # Split each type: half IDLE (Izmir), half EXERCISE (Ege)
    all_units = [
        (DRONE_UNITS, AssetType.DRONE),
        (SOLDIER_UNITS, AssetType.SOLDIER),
        (VEHICLE_UNITS, AssetType.VEHICLE),
    ]
    
    for units, asset_type in all_units:
        for i, unit in enumerate(units):
            # First half IDLE, second half EXERCISE
            status = OperationalStatus.IDLE if i < 5 else OperationalStatus.EXERCISE
            zone = ZONES[status]
            lat, lon = random_coord_in_zone(zone)
            
            # Set values based on status
            if status == OperationalStatus.IDLE:
                altitude = 0 if asset_type != AssetType.DRONE else random.uniform(0, 50)
                speed = 0
                battery = random.randint(90, 100)
            else:  # EXERCISE
                if asset_type == AssetType.DRONE:
                    altitude = random.uniform(500, 2000)
                    speed = random.uniform(80, 150)
                    battery = random.randint(50, 90)
                elif asset_type == AssetType.SOLDIER:
                    altitude = random.uniform(100, 500)  # Hill terrain
                    speed = random.uniform(2, 8)
                    battery = random.randint(60, 95)
                else:  # VEHICLE (Ground vehicles)
                    altitude = random.uniform(50, 300)  # Terrain
                    speed = random.uniform(20, 60)  # km/h
                    battery = random.randint(70, 100)  # Fuel
            
            assets.append(Asset(
                id=unit["id"],
                name=unit["name"],
                asset_type=asset_type,
                status=status,
                latitude=lat,
                longitude=lon,
                altitude=round(altitude, 1),
                speed=round(speed, 1),
                battery_level=battery,
            ))
    
    return assets


# =============================================================================
# SQL GENERATION
# =============================================================================

def escape_sql_string(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def generate_sql(assets: List[Asset]) -> str:
    """Generate complete SQL file content."""
    
    timestamp = datetime.now().isoformat()
    
    sql = f"""-- ============================================================================
-- EGE TATBIKATI - DATABASE SEED
-- Generated: {timestamp}
-- Total Assets: {len(assets)}
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

"""
    
    # Generate INSERT statements for assets
    for asset in assets:
        sql += f"""INSERT INTO assets (id, name, type, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('{escape_sql_string(asset.id)}', '{escape_sql_string(asset.name)}', '{asset.asset_type.value}', '{asset.status.value}', '{asset.alignment.value}', {asset.latitude}, {asset.longitude}, {asset.altitude}, CURRENT_TIMESTAMP);
"""
    
    sql += """
-- ============================================================================
-- INSERT INITIAL TELEMETRY
-- ============================================================================

"""
    
    # Generate initial telemetry for each asset
    for asset in assets:
        # Build payload JSON based on asset type
        if asset.asset_type == AssetType.DRONE:
            payload = {
                "heading": round(random.uniform(0, 360), 1),
                "mode": "STANDBY" if asset.status == OperationalStatus.IDLE else "AUTO",
                "alignment": asset.alignment.value,
                "threat_level": 0,
                "mission": "Bekleme" if asset.status == OperationalStatus.IDLE else "Kesif Ucusu",
            }
        elif asset.asset_type == AssetType.SOLDIER:
            payload = {
                "heart_rate": 70 if asset.status == OperationalStatus.IDLE else random.randint(85, 110),
                "spo2": random.randint(96, 99),
                "body_temp": round(random.uniform(36.2, 37.0), 1),
                "stress_level": "LOW" if asset.status == OperationalStatus.IDLE else "MEDIUM",
                "alignment": asset.alignment.value,
                "threat_level": 0,
                "mission": "Kisla Nobet" if asset.status == OperationalStatus.IDLE else "Tatbikat",
            }
        else:  # VEHICLE (Ground vehicles)
            payload = {
                "fuel_level": asset.battery_level,
                "engine_temp": random.randint(70, 85),
                "engine_status": "OFF" if asset.status == OperationalStatus.IDLE else "RUNNING",
                "heading": round(random.uniform(0, 360), 1),
                "alignment": asset.alignment.value,
                "threat_level": 0,
                "mission": "Garajda Bekleme" if asset.status == OperationalStatus.IDLE else "Arazi Tatbikati",
            }
        
        payload_json = json.dumps(payload, ensure_ascii=False).replace("'", "''")
        
        sql += f"""INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('{escape_sql_string(asset.id)}', '{asset.asset_type.value}', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint({asset.longitude}, {asset.latitude}), 4326), {asset.altitude}, {asset.speed}, {asset.battery_level}, '{payload_json}'::jsonb);
"""
    
    # ========================================================================
    # NEW v2 TABLES: Tasks, System Logs, AI Analyses
    # ========================================================================
    
    sql += generate_tasks_sql(assets)
    sql += generate_system_logs_sql(assets)
    sql += generate_ai_analyses_sql(assets)
    sql += generate_users_sql()
    
    sql += """
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
"""
    
    return sql


def generate_tasks_sql(assets: List[Asset]) -> str:
    """Generate INSERT statements for tasks table."""
    sql = """
-- ============================================================================
-- INSERT TASKS (v2)
-- ============================================================================

"""
    for asset in assets:
        # Each EXERCISE asset gets 1-2 tasks, IDLE assets get 1 pending task
        templates = TASK_TEMPLATES.get(asset.asset_type.value, TASK_TEMPLATES["DRONE"])
        if asset.status == OperationalStatus.EXERCISE:
            chosen = random.sample(templates, min(2, len(templates)))
        else:
            # IDLE assets get a single PENDING task
            pending_tasks = [t for t in templates if t[2] == "PENDING"]
            chosen = [random.choice(pending_tasks)] if pending_tasks else [templates[0]]
        
        for title, description, status in chosen:
            sql += f"""INSERT INTO tasks (asset_id, title, description, status)
VALUES ('{escape_sql_string(asset.id)}', '{escape_sql_string(title)}', '{escape_sql_string(description)}', '{status}');
"""
    return sql


def generate_system_logs_sql(assets: List[Asset]) -> str:
    """Generate INSERT statements for system_logs table."""
    sql = """
-- ============================================================================
-- INSERT SYSTEM LOGS (v2)
-- ============================================================================

"""
    for asset in assets:
        # Every asset gets a CONNECTION_ESTABLISHED log
        sql += f"""INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('{escape_sql_string(asset.id)}', 'CONNECTION_ESTABLISHED', 'Sistem baglantisi basariyla kuruldu');
"""
        # EXERCISE assets get 2-3 extra event logs
        if asset.status == OperationalStatus.EXERCISE:
            extra_events = random.sample(SYSTEM_LOG_TEMPLATES[1:], random.randint(2, 3))
            for event_type, message_template in extra_events:
                message = message_template.format(
                    old_mode="IDLE", new_mode="EXERCISE",
                    level=random.randint(10, 25)
                )
                sql += f"""INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('{escape_sql_string(asset.id)}', '{escape_sql_string(event_type)}', '{escape_sql_string(message)}');
"""
        else:
            # IDLE assets get a HEARTBEAT
            sql += f"""INSERT INTO system_logs (asset_id, event_type, message)
VALUES ('{escape_sql_string(asset.id)}', 'HEARTBEAT', 'Sistem saglik kontrolu basarili');
"""
    return sql


def generate_ai_analyses_sql(assets: List[Asset]) -> str:
    """Generate INSERT statements for ai_analyses table."""
    sql = """
-- ============================================================================
-- INSERT AI ANALYSES (v2)
-- ============================================================================

"""
    for asset in assets:
        # EXERCISE assets get 2-3 analyses (some with alerts)
        # IDLE assets get 1 LOW-threat analysis
        if asset.status == OperationalStatus.EXERCISE:
            count = random.randint(2, 3)
            # Ensure at least one is HIGH/CRITICAL for some exercise assets
            chosen = random.sample(AI_ANALYSIS_TEMPLATES, min(count, len(AI_ANALYSIS_TEMPLATES)))
        else:
            # Idle: just a single LOW analysis
            low_templates = [t for t in AI_ANALYSIS_TEMPLATES if t[0] == "LOW"]
            chosen = [random.choice(low_templates)]
        
        for threat_level, recommendation, is_alert in chosen:
            alert_val = "TRUE" if is_alert else "FALSE"
            sql += f"""INSERT INTO ai_analyses (asset_id, threat_level, recommendation, is_alert)
VALUES ('{escape_sql_string(asset.id)}', '{threat_level}', '{escape_sql_string(recommendation)}', {alert_val});
"""
    return sql


def generate_users_sql() -> str:
    """Generate INSERT statements for users table."""
    sql = """
-- ============================================================================
-- INSERT USERS (Authentication & Profile)
-- ============================================================================

"""
    for user in USER_SEED_DATA:
        active_val = "TRUE" if user["active"] else "FALSE"
        sql += f"""INSERT INTO users (username, password, full_name, rank, role, active, created_at)
VALUES ('{escape_sql_string(user["username"])}', '{escape_sql_string(user["password"])}', '{escape_sql_string(user["full_name"])}', '{escape_sql_string(user["rank"])}', '{user["role"]}', {active_val}, CURRENT_TIMESTAMP);
"""
    return sql


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 60)
    print("EGE TATBIKATI - DATABASE SEED GENERATOR")
    print("=" * 60)
    
    # Generate assets
    print("\nGenerating 30 assets...")
    assets = generate_assets()
    
    # Count by status
    idle_count = len([a for a in assets if a.status == OperationalStatus.IDLE])
    exercise_count = len([a for a in assets if a.status == OperationalStatus.EXERCISE])
    
    print(f"   Izmir Kisla (IDLE): {idle_count}")
    print(f"   Ege Tatbikat (EXERCISE): {exercise_count}")
    
    # Count by type
    print(f"\n   Drones: {len([a for a in assets if a.asset_type == AssetType.DRONE])}")
    print(f"   Soldiers: {len([a for a in assets if a.asset_type == AssetType.SOLDIER])}")
    print(f"   Vehicles: {len([a for a in assets if a.asset_type == AssetType.VEHICLE])}")
    print(f"\n   + Tasks, System Logs, AI Analyses (v2 tables)")
    print(f"   + Users: {len(USER_SEED_DATA)} (Admin, Commander, Operators)")
    
    # Generate SQL
    print("\nGenerating SQL...")
    sql_content = generate_sql(assets)
    
    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sql_content)
    
    print(f"\nSQL file generated: {OUTPUT_FILE}")
    print(f"   Total size: {len(sql_content):,} bytes")
    print("\n" + "=" * 60)
    print("To apply seed, run:")
    print(f"   Get-Content {OUTPUT_FILE.name} | docker exec -i c4isr-db psql -U admin -d c4isr_db")
    print("=" * 60)


if __name__ == "__main__":
    main()
