#!/usr/bin/env python3
"""
============================================================================
    C4ISR — TSK WARGAME MAP SEED v1.0
============================================================================
    Populates the `assets` and `telemetry` tables with:
      • Realistic Turkish Armed Forces (TSK) simulated units
      • 3 live physical hardware prototype placeholders

    Simulated units span Land, Air, and Naval branches with
    real TSK base coordinates. Live prototypes (drone, OBD vehicle,
    smartwatch soldier) are flagged is_simulated=false so the UI
    can distinguish them from the hundreds of wargame units.

    Usage:
        cd ai-service
        python seed_tsk_map.py              # append mode
        python seed_tsk_map.py --clean      # wipe old assets first

    Prerequisites:
        - PostgreSQL running (docker compose up -d)
        - PostGIS extension enabled
============================================================================
"""

import sys
import os
import time
from datetime import datetime, timedelta
import random
import json

import psycopg2
from psycopg2.extras import execute_values

# ── DB connection ────────────────────────────────────────────────────────
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:password@localhost:5433/c4isr_db",
)

# ════════════════════════════════════════════════════════════════════════
#  ASSET DEFINITIONS
# ════════════════════════════════════════════════════════════════════════

SIMULATED_ASSETS: list[dict] = [
    # ── LAND (KARA KUVVETLERİ) ───────────────────────────────────────
    # 2. Ordu Komutanlığı — Malatya
    {
        "id": "2ORDU-KH-MALATYA",
        "name": "2. Ordu Komutanlığı Karargahı",
        "type": "VEHICLE",
        "variant": "Komuta Merkezi",
        "unit_name": "2. Ordu K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.3552,
        "lon": 38.3095,
        "alt": 0,
    },
    {
        "id": "2ORDU-M60T-01",
        "name": "M60T Sabra #1",
        "type": "VEHICLE",
        "variant": "M60T",
        "unit_name": "2. Ordu K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 38.3580,
        "lon": 38.3120,
        "alt": 0,
    },
    {
        "id": "2ORDU-M60T-02",
        "name": "M60T Sabra #2",
        "type": "VEHICLE",
        "variant": "M60T",
        "unit_name": "2. Ordu K.",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 38.3545,
        "lon": 38.3060,
        "alt": 0,
    },
    {
        "id": "2ORDU-LEOPARD-01",
        "name": "Leopard 2A4 #1",
        "type": "VEHICLE",
        "variant": "Leopard 2A4",
        "unit_name": "2. Ordu K.",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 38.3600,
        "lon": 38.3200,
        "alt": 0,
    },
    {
        "id": "2ORDU-KIRPI-01",
        "name": "Kırpı MRAP #1",
        "type": "VEHICLE",
        "variant": "Kırpı",
        "unit_name": "2. Ordu K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 38.3510,
        "lon": 38.3150,
        "alt": 0,
    },
    {
        "id": "2ORDU-COBRA-01",
        "name": "Cobra II #1",
        "type": "VEHICLE",
        "variant": "Cobra II",
        "unit_name": "2. Ordu K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.3565,
        "lon": 38.3040,
        "alt": 0,
    },
    {
        "id": "2ORDU-FIRTINA-01",
        "name": "T-155 Fırtına #1",
        "type": "VEHICLE",
        "variant": "T-155 Fırtına",
        "unit_name": "2. Ordu K.",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 38.3490,
        "lon": 38.3180,
        "alt": 0,
    },
    {
        "id": "2ORDU-PIYADE-01",
        "name": "Komando Tim Lideri Alpha",
        "type": "SOLDIER",
        "variant": "Komando",
        "unit_name": "2. Ordu K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 38.3530,
        "lon": 38.3070,
        "alt": 0,
    },
    {
        "id": "2ORDU-PIYADE-02",
        "name": "Komando Tim Lideri Bravo",
        "type": "SOLDIER",
        "variant": "Komando",
        "unit_name": "2. Ordu K.",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 38.3570,
        "lon": 38.3140,
        "alt": 0,
    },
    {
        "id": "2ORDU-SENSOR-01",
        "name": "Gözetleme Radarı Malatya",
        "type": "SENSOR",
        "variant": "Gözetleme Radarı",
        "unit_name": "2. Ordu K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.3620,
        "lon": 38.2980,
        "alt": 850,
    },

    # 3. Piyade Tümeni — Yüksekova
    {
        "id": "3PTUMEN-KH-YUKSEKOVA",
        "name": "3. Piyade Tümeni Karargahı",
        "type": "VEHICLE",
        "variant": "Komuta Merkezi",
        "unit_name": "3. Piyade Tümeni",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 37.5753,
        "lon": 44.2882,
        "alt": 0,
    },
    {
        "id": "3PTUMEN-KIRPI-01",
        "name": "Kırpı MRAP Yüksekova #1",
        "type": "VEHICLE",
        "variant": "Kırpı",
        "unit_name": "3. Piyade Tümeni",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.5770,
        "lon": 44.2900,
        "alt": 0,
    },
    {
        "id": "3PTUMEN-KIRPI-02",
        "name": "Kırpı MRAP Yüksekova #2",
        "type": "VEHICLE",
        "variant": "Kırpı",
        "unit_name": "3. Piyade Tümeni",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.5740,
        "lon": 44.2860,
        "alt": 0,
    },
    {
        "id": "3PTUMEN-COBRA-01",
        "name": "Cobra II Yüksekova #1",
        "type": "VEHICLE",
        "variant": "Cobra II",
        "unit_name": "3. Piyade Tümeni",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.5780,
        "lon": 44.2920,
        "alt": 0,
    },
    {
        "id": "3PTUMEN-ACV15-01",
        "name": "ACV-15 ZMA Yüksekova #1",
        "type": "VEHICLE",
        "variant": "ACV-15",
        "unit_name": "3. Piyade Tümeni",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 37.5720,
        "lon": 44.2850,
        "alt": 0,
    },
    {
        "id": "3PTUMEN-KOMANDO-01",
        "name": "Dağ Komando Tim Alpha",
        "type": "SOLDIER",
        "variant": "Dağ Komando",
        "unit_name": "3. Piyade Tümeni",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.5800,
        "lon": 44.2950,
        "alt": 2100,
    },
    {
        "id": "3PTUMEN-KOMANDO-02",
        "name": "Dağ Komando Tim Bravo",
        "type": "SOLDIER",
        "variant": "Dağ Komando",
        "unit_name": "3. Piyade Tümeni",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.5690,
        "lon": 44.2810,
        "alt": 2250,
    },
    {
        "id": "3PTUMEN-KOMANDO-03",
        "name": "Dağ Komando Tim Charlie",
        "type": "SOLDIER",
        "variant": "Dağ Komando",
        "unit_name": "3. Piyade Tümeni",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.5830,
        "lon": 44.2980,
        "alt": 2050,
    },
    {
        "id": "3PTUMEN-SENSOR-01",
        "name": "Sınır Gözetleme Radarı Yüksekova",
        "type": "SENSOR",
        "variant": "Sınır Radarı",
        "unit_name": "3. Piyade Tümeni",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 37.5850,
        "lon": 44.3000,
        "alt": 2400,
    },

    # ── AIR (HAVA KUVVETLERİ) ────────────────────────────────────────
    # 8. Ana Jet Üssü — Diyarbakır
    {
        "id": "8AJU-F16-VIPER-01",
        "name": "F-16C Viper 'Yıldırım-1'",
        "type": "DRONE",
        "variant": "F-16C Block 50",
        "unit_name": "8. Ana Jet Üssü (181. Filo)",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.8931,
        "lon": 40.2007,
        "alt": 9500,
    },
    {
        "id": "8AJU-F16-VIPER-02",
        "name": "F-16C Viper 'Yıldırım-2'",
        "type": "DRONE",
        "variant": "F-16C Block 50",
        "unit_name": "8. Ana Jet Üssü (181. Filo)",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.9100,
        "lon": 40.2200,
        "alt": 8200,
    },
    {
        "id": "8AJU-F16-VIPER-03",
        "name": "F-16D Viper 'Yıldırım-3'",
        "type": "DRONE",
        "variant": "F-16D Block 50+",
        "unit_name": "8. Ana Jet Üssü (181. Filo)",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 37.8940,
        "lon": 40.1990,
        "alt": 0,
    },
    {
        "id": "8AJU-F16-VIPER-04",
        "name": "F-16C Viper 'Pars-1'",
        "type": "DRONE",
        "variant": "F-16C Block 40",
        "unit_name": "8. Ana Jet Üssü (182. Filo)",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.8800,
        "lon": 40.1800,
        "alt": 10200,
    },
    {
        "id": "8AJU-F16-VIPER-05",
        "name": "F-16C Viper 'Pars-2'",
        "type": "DRONE",
        "variant": "F-16C Block 40",
        "unit_name": "8. Ana Jet Üssü (182. Filo)",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.9200,
        "lon": 40.2500,
        "alt": 7800,
    },
    {
        "id": "8AJU-F16-VIPER-06",
        "name": "F-16D Viper 'Pars-3'",
        "type": "DRONE",
        "variant": "F-16D Block 50+",
        "unit_name": "8. Ana Jet Üssü (182. Filo)",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 37.8925,
        "lon": 40.2015,
        "alt": 0,
    },
    {
        "id": "8AJU-SENSOR-RADAR",
        "name": "AN/TPS-77 Hava Savunma Radarı Diyarbakır",
        "type": "SENSOR",
        "variant": "AN/TPS-77",
        "unit_name": "8. Ana Jet Üssü",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 37.8960,
        "lon": 40.2050,
        "alt": 680,
    },

    # 14. İnsansız Uçak Sistemleri Üs K. — Batman
    {
        "id": "14IUS-TB2-01",
        "name": "Bayraktar TB2 'Kartal-1'",
        "type": "DRONE",
        "variant": "TB2",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.9272,
        "lon": 41.1213,
        "alt": 5500,
    },
    {
        "id": "14IUS-TB2-02",
        "name": "Bayraktar TB2 'Kartal-2'",
        "type": "DRONE",
        "variant": "TB2",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.9400,
        "lon": 41.1400,
        "alt": 4800,
    },
    {
        "id": "14IUS-TB2-03",
        "name": "Bayraktar TB2 'Kartal-3'",
        "type": "DRONE",
        "variant": "TB2",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 37.9280,
        "lon": 41.1200,
        "alt": 0,
    },
    {
        "id": "14IUS-AKINCI-01",
        "name": "Bayraktar Akıncı 'Doğan-1'",
        "type": "DRONE",
        "variant": "Akıncı",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 37.9150,
        "lon": 41.1050,
        "alt": 7200,
    },
    {
        "id": "14IUS-AKINCI-02",
        "name": "Bayraktar Akıncı 'Doğan-2'",
        "type": "DRONE",
        "variant": "Akıncı",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.9350,
        "lon": 41.1350,
        "alt": 6800,
    },
    {
        "id": "14IUS-ANKA-01",
        "name": "TAI Anka-S 'Şahin-1'",
        "type": "DRONE",
        "variant": "Anka-S",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 37.9500,
        "lon": 41.1500,
        "alt": 6000,
    },
    {
        "id": "14IUS-SENSOR-GCS",
        "name": "İHA Yer Kontrol İstasyonu Batman",
        "type": "SENSOR",
        "variant": "GCS",
        "unit_name": "14. İUS Üs K. (Batman)",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 37.9265,
        "lon": 41.1225,
        "alt": 540,
    },

    # ── NAVAL (DENİZ KUVVETLERİ) ─────────────────────────────────────
    # Gölcük Donanma Ana Üssü — Kocaeli
    {
        "id": "GOLCUK-TCG-ANADOLU",
        "name": "TCG Anadolu (L-408)",
        "type": "VEHICLE",
        "variant": "LHD / Hafif Uçak Gemisi",
        "unit_name": "Gölcük Donanma K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 40.7188,
        "lon": 29.8226,
        "alt": 0,
    },
    {
        "id": "GOLCUK-TCG-ISTANBUL",
        "name": "TCG İstanbul (F-515)",
        "type": "VEHICLE",
        "variant": "İstif Sınıfı Fırkateyn",
        "unit_name": "Gölcük Donanma K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 40.7200,
        "lon": 29.8100,
        "alt": 0,
    },
    {
        "id": "GOLCUK-TCG-BARBAROS",
        "name": "TCG Barbaros (F-244)",
        "type": "VEHICLE",
        "variant": "Barbaros Sınıfı Fırkateyn",
        "unit_name": "Gölcük Donanma K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 40.7150,
        "lon": 29.8350,
        "alt": 0,
    },
    {
        "id": "GOLCUK-TCG-SALIHREIS",
        "name": "TCG Salihreis (F-246)",
        "type": "VEHICLE",
        "variant": "Barbaros Sınıfı Fırkateyn",
        "unit_name": "Gölcük Donanma K.",
        "status": "IDLE",
        "alignment": "FRIEND",
        "lat": 40.7175,
        "lon": 29.8250,
        "alt": 0,
    },
    {
        "id": "GOLCUK-TCG-REIS-01",
        "name": "TCG Piri Reis (S-330)",
        "type": "VEHICLE",
        "variant": "Reis Sınıfı Denizaltı (Type 214TN)",
        "unit_name": "Gölcük Donanma K.",
        "status": "COMBAT",
        "alignment": "FRIEND",
        "lat": 40.7100,
        "lon": 29.8400,
        "alt": -80,
    },
    {
        "id": "GOLCUK-TCG-REIS-02",
        "name": "TCG Hızır Reis (S-331)",
        "type": "VEHICLE",
        "variant": "Reis Sınıfı Denizaltı (Type 214TN)",
        "unit_name": "Gölcük Donanma K.",
        "status": "PATROL",
        "alignment": "FRIEND",
        "lat": 40.7050,
        "lon": 29.8500,
        "alt": -60,
    },
    {
        "id": "GOLCUK-SIH-01",
        "name": "SİHA Kontrol Gemisi (MİLGEM)",
        "type": "VEHICLE",
        "variant": "Ada Sınıfı Korvet",
        "unit_name": "Gölcük Donanma K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 40.7220,
        "lon": 29.8150,
        "alt": 0,
    },
    {
        "id": "GOLCUK-SENSOR-SONAR",
        "name": "Liman Sonar Ağı Gölcük",
        "type": "SENSOR",
        "variant": "Denizaltı Tespit Sonar",
        "unit_name": "Gölcük Donanma K.",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 40.7130,
        "lon": 29.8300,
        "alt": -15,
    },
]

# ── LIVE PHYSICAL HARDWARE PROTOTYPES ─────────────────────────────────
LIVE_ASSETS: list[dict] = [
    {
        "id": "SINAPS-DRONE-01",
        "name": "SINAPS Prototip Drone",
        "type": "DRONE",
        "variant": "Prototip Quadcopter",
        "unit_name": "SINAPS R&D Lab",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.4192,
        "lon": 27.1287,
        "alt": 0,
    },
    {
        "id": "SINAPS-OBD-KIRPI",
        "name": "SINAPS OBD Kırpı Aracı",
        "type": "VEHICLE",
        "variant": "OBD Prototip",
        "unit_name": "SINAPS R&D Lab",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.4185,
        "lon": 27.1295,
        "alt": 0,
    },
    {
        "id": "SINAPS-WATCH-KOMANDO",
        "name": "SINAPS Smartwatch Komando",
        "type": "SOLDIER",
        "variant": "Wearable Prototip",
        "unit_name": "SINAPS R&D Lab",
        "status": "ONLINE",
        "alignment": "FRIEND",
        "lat": 38.4178,
        "lon": 27.1280,
        "alt": 0,
    },
]


# ════════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════════════════

def ensure_columns(cur) -> None:
    """Add variant, unit_name, is_simulated columns if they don't exist yet."""
    for col, typedef in [
        ("variant", "VARCHAR(100)"),
        ("unit_name", "VARCHAR(100)"),
        ("is_simulated", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ]:
        cur.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'assets' AND column_name = '{col}'
                ) THEN
                    ALTER TABLE assets ADD COLUMN {col} {typedef};
                END IF;
            END $$;
        """)


def build_telemetry_row(asset: dict, is_sim: bool) -> tuple:
    """Generate one telemetry snapshot for an asset."""
    now = datetime.utcnow()
    jitter_lat = random.uniform(-0.001, 0.001) if is_sim else 0
    jitter_lon = random.uniform(-0.001, 0.001) if is_sim else 0

    lat = asset["lat"] + jitter_lat
    lon = asset["lon"] + jitter_lon
    alt = asset["alt"]
    speed = round(random.uniform(0, 120), 1) if asset["status"] != "IDLE" else 0.0
    battery = random.randint(40, 100)

    heading = round(random.uniform(0, 360), 1)
    payload = json.dumps({
        "alignment": asset["alignment"],
        "threat_level": 0,
        "heading": heading,
        "unit_name": asset.get("unit_name", ""),
        "variant": asset.get("variant", ""),
        "is_simulated": is_sim,
        "status": asset["status"],
    })

    point_wkt = f"SRID=4326;POINT({lon} {lat})"

    return (
        asset["id"],
        asset["type"],
        now - timedelta(seconds=random.randint(0, 300)),
        point_wkt,
        alt,
        speed,
        battery,
        payload,
    )


# ════════════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════════════

def main():
    clean_mode = "--clean" in sys.argv

    print("=" * 72)
    print("  C4ISR — TSK WARGAME MAP SEED v1.0")
    print(f"  Simulated units : {len(SIMULATED_ASSETS)}")
    print(f"  Live prototypes : {len(LIVE_ASSETS)}")
    if clean_mode:
        print("  ⚠  CLEAN MODE — old assets & telemetry will be wiped")
    print("=" * 72)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # Step 1: Ensure schema columns exist
        print("\n[1/5] Ensuring schema columns (variant, unit_name, is_simulated)...")
        ensure_columns(cur)
        conn.commit()
        print("      OK")

        # Step 2: Clean old data if requested
        if clean_mode:
            print("[2/5] Cleaning old data...")
            cur.execute("DELETE FROM telemetry")
            cur.execute("DELETE FROM assets")
            conn.commit()
            print("      Telemetry & assets tables cleared")
        else:
            print("[2/5] Append mode — skipping cleanup")

        # Step 3: Insert simulated assets
        print(f"[3/5] Inserting {len(SIMULATED_ASSETS)} simulated TSK assets...")
        sim_insert = """
            INSERT INTO assets
                (id, name, type, variant, unit_name, status, alignment,
                 last_latitude, last_longitude, last_altitude, is_simulated, last_update)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name       = EXCLUDED.name,
                type       = EXCLUDED.type,
                variant    = EXCLUDED.variant,
                unit_name  = EXCLUDED.unit_name,
                status     = EXCLUDED.status,
                alignment  = EXCLUDED.alignment,
                last_latitude  = EXCLUDED.last_latitude,
                last_longitude = EXCLUDED.last_longitude,
                last_altitude  = EXCLUDED.last_altitude,
                is_simulated   = TRUE,
                last_update    = CURRENT_TIMESTAMP
        """
        for a in SIMULATED_ASSETS:
            cur.execute(sim_insert, (
                a["id"], a["name"], a["type"], a["variant"], a["unit_name"],
                a["status"], a["alignment"], a["lat"], a["lon"], a["alt"],
            ))
        conn.commit()
        print(f"      {len(SIMULATED_ASSETS)} simulated assets upserted")

        # Step 4: Insert live hardware prototypes
        print(f"[4/5] Inserting {len(LIVE_ASSETS)} LIVE hardware prototypes...")
        live_insert = """
            INSERT INTO assets
                (id, name, type, variant, unit_name, status, alignment,
                 last_latitude, last_longitude, last_altitude, is_simulated, last_update)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name       = EXCLUDED.name,
                type       = EXCLUDED.type,
                variant    = EXCLUDED.variant,
                unit_name  = EXCLUDED.unit_name,
                status     = EXCLUDED.status,
                alignment  = EXCLUDED.alignment,
                last_latitude  = EXCLUDED.last_latitude,
                last_longitude = EXCLUDED.last_longitude,
                last_altitude  = EXCLUDED.last_altitude,
                is_simulated   = FALSE,
                last_update    = CURRENT_TIMESTAMP
        """
        for a in LIVE_ASSETS:
            cur.execute(live_insert, (
                a["id"], a["name"], a["type"], a["variant"], a["unit_name"],
                a["status"], a["alignment"], a["lat"], a["lon"], a["alt"],
            ))
        conn.commit()
        print(f"      {len(LIVE_ASSETS)} live prototypes upserted")

        # Step 5: Insert telemetry snapshots
        all_assets = [(a, True) for a in SIMULATED_ASSETS] + [(a, False) for a in LIVE_ASSETS]
        total_telemetry = len(all_assets)
        print(f"[5/5] Inserting {total_telemetry} telemetry snapshots...")

        tel_insert = """
            INSERT INTO telemetry
                (source_id, source_type, timestamp, location, altitude, speed, battery_level, payload)
            VALUES (%s, %s, %s, ST_GeomFromEWKT(%s), %s, %s, %s, %s::jsonb)
        """
        for asset, is_sim in all_assets:
            row = build_telemetry_row(asset, is_sim)
            cur.execute(tel_insert, row)
        conn.commit()
        print(f"      {total_telemetry} telemetry rows inserted")

        # Summary
        cur.execute("SELECT COUNT(*) FROM assets WHERE is_simulated = TRUE")
        sim_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM assets WHERE is_simulated = FALSE")
        live_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM telemetry")
        tel_count = cur.fetchone()[0]

        print("\n" + "─" * 72)
        print("  SUMMARY")
        print(f"    Simulated assets : {sim_count}")
        print(f"    Live prototypes  : {live_count}")
        print(f"    Total assets     : {sim_count + live_count}")
        print(f"    Telemetry rows   : {tel_count}")
        print("─" * 72)
        print("  DONE — TSK wargame map seeded successfully")
        print("─" * 72)

    except Exception as e:
        conn.rollback()
        print(f"\n  ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
