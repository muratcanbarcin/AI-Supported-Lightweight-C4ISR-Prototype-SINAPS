#!/usr/bin/env python3
"""
===============================================================================
EGE TATBIKATI - DATABASE SEED GENERATOR
===============================================================================
Generates SQL seed file for PostgreSQL with:
- 30 units total (10 Drone, 10 Soldier, 10 Vehicle)
- Half in Izmir Barracks (IDLE)
- Half in Aegean Exercise Zone (EXERCISE)

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
