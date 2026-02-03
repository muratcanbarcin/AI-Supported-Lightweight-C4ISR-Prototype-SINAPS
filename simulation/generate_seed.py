#!/usr/bin/env python3
"""
===============================================================================
TSK WARGAME SIMULATION - DATABASE SEED GENERATOR
===============================================================================
Generates SQL seed file for PostgreSQL with:
- Full TSK hierarchical inventory (Drone Squadrons, Infantry Units, Armor)
- Scenario-based initial positioning (Ankara Base, Border Patrol, Syria Combat)
- Compatible with PostGIS geometry, pgvector, and AI tactical memory

Usage:
    python generate_seed.py
    
Output:
    ../postgres/init.sql
===============================================================================
"""

import random
import os
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple
from enum import Enum

# =============================================================================
# CONFIGURATION
# =============================================================================

# Primary output - postgres folder
OUTPUT_FILE_PRIMARY = Path(__file__).parent.parent / "postgres" / "init.sql"
# Fallback output - simulation folder
OUTPUT_FILE_FALLBACK = Path(__file__).parent / "tsk_seed.sql"


class AssetType(Enum):
    DRONE = "DRONE"
    SOLDIER = "SOLDIER"
    VEHICLE = "VEHICLE"


class OperationalStatus(Enum):
    IDLE = "IDLE"
    PATROL = "PATROL"
    COMBAT = "COMBAT"


class Alignment(Enum):
    FRIEND = "FRIEND"
    FOE = "FOE"


# =============================================================================
# GEOGRAPHIC ZONES
# =============================================================================

# Zone definitions with center coordinates and spread radius
ZONES = {
    "ANKARA_BASE": {
        "name": "Mürted Hava Üssü",
        "center": (39.95, 32.60),
        "spread_km": 5,
        "status": OperationalStatus.IDLE,
        "weight": 0.30,  # 30% of assets
    },
    "BORDER_PATROL": {
        "name": "Hatay/Kilis Sınır Hattı",
        "center": (36.60, 36.50),
        "spread_km": 15,
        "status": OperationalStatus.PATROL,
        "weight": 0.40,  # 40% of assets
    },
    "SYRIA_COMBAT": {
        "name": "Suriye Harekat Bölgesi",
        "center": (36.20, 37.00),
        "spread_km": 20,
        "status": OperationalStatus.COMBAT,
        "weight": 0.30,  # 30% of assets
    },
}


# =============================================================================
# TSK INVENTORY DEFINITIONS
# =============================================================================

@dataclass
class Asset:
    id: str
    name: str
    asset_type: AssetType
    variant: str
    unit_name: str
    status: OperationalStatus
    latitude: float
    longitude: float
    altitude: float
    speed: float
    battery_level: int
    alignment: Alignment = Alignment.FRIEND


# Drone Squadrons (İHA Filoları)
DRONE_SQUADRONS = [
    {"name": "341. Filo", "base": "Ankara", "size": 12, "variants": ["Akıncı", "TB2"]},
    {"name": "342. Filo", "base": "Diyarbakır", "size": 15, "variants": ["TB2", "ANKA-S"]},
    {"name": "343. Filo", "base": "Batman", "size": 10, "variants": ["TB2"]},
    {"name": "344. Filo", "base": "Elazığ", "size": 14, "variants": ["ANKA-S", "TB2"]},
    {"name": "345. Filo", "base": "Malatya", "size": 11, "variants": ["Akıncı", "ANKA-S"]},
]

# Infantry Units (Piyade/Komando Birlikleri)
INFANTRY_UNITS = [
    {"name": "OKK-Alpha", "type": "Bordo Bereli", "size": 22},
    {"name": "OKK-Bravo", "type": "Bordo Bereli", "size": 20},
    {"name": "JÖH-Mardin", "type": "JÖH", "size": 25},
    {"name": "JÖH-Şırnak", "type": "JÖH", "size": 24},
    {"name": "JÖH-Hakkari", "type": "JÖH", "size": 23},
    {"name": "Komando-1.Tb", "type": "Dağ Komando", "size": 21},
    {"name": "Komando-2.Tb", "type": "Amfibi Komando", "size": 20},
    {"name": "Komando-3.Tb", "type": "SAT", "size": 18},
    {"name": "Komando-4.Tb", "type": "SAS", "size": 19},
    {"name": "Komando-5.Tb", "type": "MAK", "size": 22},
]

# Armored Units (Zırhlı Birlikler)
ARMORED_UNITS = [
    {"name": "1. ZPT Alayı", "variants": ["Altay Tank", "M60T"], "size": 8},
    {"name": "2. ZPT Alayı", "variants": ["Altay Tank", "Leopard 2A4"], "size": 10},
    {"name": "3. Mekanize Bl.", "variants": ["Kirpi II", "Kobra II"], "size": 12},
    {"name": "4. Mekanize Bl.", "variants": ["Kirpi II", "Ejder Yalçın"], "size": 9},
    {"name": "Topçu Taburu", "variants": ["Fırtına Obüs", "T-155"], "size": 6},
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


def assign_zone() -> dict:
    """Randomly assign a zone based on weight distribution."""
    r = random.random()
    cumulative = 0.0
    
    for zone_key, zone in ZONES.items():
        cumulative += zone["weight"]
        if r <= cumulative:
            return zone
    
    return list(ZONES.values())[-1]


def generate_drone_assets() -> List[Asset]:
    """Generate all drone assets from squadrons."""
    assets = []
    
    for squadron in DRONE_SQUADRONS:
        for i in range(1, squadron["size"] + 1):
            variant = random.choice(squadron["variants"])
            zone = assign_zone()
            lat, lon = random_coord_in_zone(zone)
            
            # Drones fly at altitude
            altitude = random.uniform(500, 3000) if zone["status"] != OperationalStatus.IDLE else 0
            speed = random.uniform(80, 150) if zone["status"] != OperationalStatus.IDLE else 0
            battery = random.randint(60, 100) if zone["status"] == OperationalStatus.IDLE else random.randint(30, 80)
            
            asset_id = f"{squadron['name']}-{variant}-{i:02d}"
            
            assets.append(Asset(
                id=asset_id,
                name=f"{variant} #{i}",
                asset_type=AssetType.DRONE,
                variant=variant,
                unit_name=squadron["name"],
                status=zone["status"],
                latitude=lat,
                longitude=lon,
                altitude=altitude,
                speed=speed,
                battery_level=battery,
            ))
    
    return assets


def generate_soldier_assets() -> List[Asset]:
    """Generate all soldier assets from infantry units."""
    assets = []
    
    for unit in INFANTRY_UNITS:
        for i in range(1, unit["size"] + 1):
            zone = assign_zone()
            lat, lon = random_coord_in_zone(zone)
            
            # Soldiers on ground
            altitude = random.uniform(0, 50)  # Terrain altitude
            speed = 0 if zone["status"] == OperationalStatus.IDLE else random.uniform(1, 8)  # Walking/running
            battery = random.randint(70, 100)  # Device battery
            
            asset_id = f"{unit['name']}-{i:02d}"
            
            assets.append(Asset(
                id=asset_id,
                name=f"{unit['type']} Personel #{i}",
                asset_type=AssetType.SOLDIER,
                variant=unit["type"],
                unit_name=unit["name"],
                status=zone["status"],
                latitude=lat,
                longitude=lon,
                altitude=altitude,
                speed=speed,
                battery_level=battery,
            ))
    
    return assets


def generate_vehicle_assets() -> List[Asset]:
    """Generate all vehicle assets from armored units."""
    assets = []
    
    for unit in ARMORED_UNITS:
        for i in range(1, unit["size"] + 1):
            variant = random.choice(unit["variants"])
            zone = assign_zone()
            lat, lon = random_coord_in_zone(zone)
            
            # Vehicles on ground
            altitude = random.uniform(0, 100)  # Terrain altitude
            speed = 0 if zone["status"] == OperationalStatus.IDLE else random.uniform(10, 50)  # km/h
            battery = random.randint(60, 100)  # Actually fuel level
            
            asset_id = f"{unit['name'].replace(' ', '-').replace('.', '')}-{variant.replace(' ', '-')}-{i:02d}"
            
            assets.append(Asset(
                id=asset_id,
                name=f"{variant} #{i}",
                asset_type=AssetType.VEHICLE,
                variant=variant,
                unit_name=unit["name"],
                status=zone["status"],
                latitude=lat,
                longitude=lon,
                altitude=altitude,
                speed=speed,
                battery_level=battery,  # Represents fuel for vehicles
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
    
    sql_parts = [
        f"""-- ============================================================================
-- TSK WARGAME SIMULATION - DATABASE SEED
-- Generated: {timestamp}
-- Total Assets: {len(assets)}
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

""",
    ]
    
    # Generate INSERT statements for assets
    for asset in assets:
        sql_parts.append(f"""INSERT INTO assets (id, name, type, variant, unit_name, status, alignment, last_latitude, last_longitude, last_altitude, last_update)
VALUES ('{escape_sql_string(asset.id)}', '{escape_sql_string(asset.name)}', '{asset.asset_type.value}', '{escape_sql_string(asset.variant)}', '{escape_sql_string(asset.unit_name)}', '{asset.status.value}', '{asset.alignment.value}', {asset.latitude}, {asset.longitude}, {asset.altitude}, CURRENT_TIMESTAMP);
""")
    
    sql_parts.append("""
-- ============================================================================
-- INSERT INITIAL TELEMETRY (One record per asset)
-- ============================================================================

""")
    
    # Generate initial telemetry for each asset
    for asset in assets:
        # Build payload JSON based on asset type
        if asset.asset_type == AssetType.DRONE:
            payload = {
                "heading": round(random.uniform(0, 360), 1),
                "mode": "AUTO" if asset.status != OperationalStatus.IDLE else "STANDBY",
                "alignment": asset.alignment.value,
                "threat_level": 0,
                "vertical_speed": round(random.uniform(-5, 5), 1),
            }
        elif asset.asset_type == AssetType.SOLDIER:
            heart_rate = 70 if asset.status == OperationalStatus.IDLE else (
                random.randint(90, 120) if asset.status == OperationalStatus.PATROL else random.randint(120, 160)
            )
            payload = {
                "heart_rate": heart_rate,
                "spo2": random.randint(94, 99),
                "body_temp": round(random.uniform(36.2, 37.2), 1),
                "stress_level": "LOW" if asset.status == OperationalStatus.IDLE else (
                    "MEDIUM" if asset.status == OperationalStatus.PATROL else "HIGH"
                ),
                "alignment": asset.alignment.value,
                "threat_level": 0,
            }
        else:  # VEHICLE
            payload = {
                "fuel_level": asset.battery_level,
                "engine_temp": random.randint(70, 95),
                "engine_status": "OFF" if asset.status == OperationalStatus.IDLE else "RUNNING",
                "alignment": asset.alignment.value,
                "threat_level": 0,
            }
        
        import json
        payload_json = json.dumps(payload).replace("'", "''")
        
        sql_parts.append(f"""INSERT INTO telemetry (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
VALUES ('{escape_sql_string(asset.id)}', '{asset.asset_type.value}', CURRENT_TIMESTAMP, ST_SetSRID(ST_MakePoint({asset.longitude}, {asset.latitude}), 4326), {asset.altitude}, {asset.speed}, {asset.battery_level}, '{payload_json}'::jsonb);
""")
    
    sql_parts.append("""
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
""")
    
    return "\n".join(sql_parts)


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 70)
    print("TSK WARGAME SIMULATION - DATABASE SEED GENERATOR")
    print("=" * 70)
    
    # Generate all assets
    print("\n🚁 Generating Drone Squadrons...")
    drones = generate_drone_assets()
    print(f"   Created {len(drones)} drones")
    
    print("🪖 Generating Infantry Units...")
    soldiers = generate_soldier_assets()
    print(f"   Created {len(soldiers)} soldiers")
    
    print("🚛 Generating Armored Units...")
    vehicles = generate_vehicle_assets()
    print(f"   Created {len(vehicles)} vehicles")
    
    all_assets = drones + soldiers + vehicles
    
    # Print zone distribution
    print("\n📍 Zone Distribution:")
    for status in OperationalStatus:
        count = len([a for a in all_assets if a.status == status])
        print(f"   {status.value}: {count} assets ({count/len(all_assets)*100:.1f}%)")
    
    # Generate SQL
    print("\n📝 Generating SQL...")
    sql_content = generate_sql(all_assets)
    
    # Try primary path first, fallback if permission denied
    output_file = OUTPUT_FILE_PRIMARY
    try:
        OUTPUT_FILE_PRIMARY.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE_PRIMARY, "w", encoding="utf-8") as f:
            f.write(sql_content)
    except PermissionError:
        print(f"⚠️  Permission denied for {OUTPUT_FILE_PRIMARY}")
        print(f"   Using fallback path...")
        output_file = OUTPUT_FILE_FALLBACK
        with open(OUTPUT_FILE_FALLBACK, "w", encoding="utf-8") as f:
            f.write(sql_content)
    
    print(f"\n✅ SQL file generated: {output_file}")
    print(f"   Total size: {len(sql_content):,} bytes")
    print(f"   Total assets: {len(all_assets)}")
    print("\n" + "=" * 70)
    print("To apply seed, run:")
    print(f"   docker exec -i c4isr-db psql -U admin -d c4isr_db < {output_file}")
    print("=" * 70)


if __name__ == "__main__":
    main()
