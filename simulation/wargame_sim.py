#!/usr/bin/env python3
"""
===============================================================================
EGE TATBIKATI - LIVE SIMULATION ENGINE (MQTT — FIRE & FORGET)
===============================================================================
Real-time tactical simulation for Aegean Exercise scenario.
Publishes ALL telemetry to the unified MQTT topic `c4isr/telemetry`.
The Middleware service subscribes, applies Edge AI anomaly detection, and
routes messages to the Backend and/or AI Service automatically.

Features:
- 30 units (10 Drone, 10 Soldier, 10 Ground Vehicle)
- Half in Izmir Barracks (IDLE) - minimal movement
- Half in Aegean Exercise (EXERCISE) - active movement
- Publishes to MQTT every 60 seconds (configurable)
- Fire-and-Forget: no HTTP, no direct backend calls

Usage:
    python wargame_sim.py [--interval SECONDS] [--broker-host HOST] [--broker-port PORT]

Default: 60 second intervals, localhost:1883
===============================================================================
"""

import asyncio
import json
import math
import random
import argparse
import signal
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum

# MQTT Client
import paho.mqtt.client as mqtt

# HTTP client for Backend REST API (v2 tables)
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    print("[WARN] aiohttp not installed. v2 table seeding disabled. Install: pip install aiohttp")


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 1883
DEFAULT_INTERVAL = 60  # 1 minute
DEFAULT_BACKEND_URL = "http://localhost:8080"  # Spring Boot backend

# MQTT Topic — unified for Middleware consumption
MQTT_TOPIC_TELEMETRY = "c4isr/telemetry"

# How often (in cycles) to seed v2 tables
V2_SEED_EVERY_N_CYCLES = 3  # Every 3 cycles


# =============================================================================
# V2 TABLE TEMPLATES (Tasks, System Logs, AI Analyses)
# =============================================================================

V2_TASK_TEMPLATES = {
    "drone": [
        ("Kesif Ucusu", "Hedef bolgesinde alcak irtifa kesif ucusu gerceklestir"),
        ("Gozetleme Gorevi", "Sinir hattinda gozetleme gorevi"),
        ("Fotograf Haritalama", "Tatbikat bolgesinin hava fotograflarini cek"),
        ("Konvoy Takibi", "Mavi kuvvet konvoyunu havadan takip et"),
        ("Gece Tarama", "Gece termal kamera ile bolge taramasi"),
    ],
    "soldier": [
        ("Devriye Gorevi", "Kuzey sektor devriye hattinda yuruyus"),
        ("Nobet Gorevi", "Kisla ana giris nobet gorevi"),
        ("Tatbikat Baskin", "Simule edilmis baskin tatbikati"),
        ("Kesif Timi", "Ileri kesif noktasina intikal"),
        ("Ilk Yardim", "Saha ilk yardim egitimi katilimi"),
    ],
    "vehicle": [
        ("Konvoy Harekati", "Alfa noktasindan Bravo noktasina malzeme tasima"),
        ("Arazi Manevra", "Tatbikat bolgesinde taktik manevra"),
        ("Hedef Atisi", "Atis poligonunda hedef atisi"),
        ("Muharebe Destek", "Piyade birligine yakin destek gorevi"),
        ("Bakim Kontrol", "Periyodik bakim ve teknik kontrol"),
    ],
}

V2_LOG_EVENTS = [
    ("HEARTBEAT", "Sistem saglik kontrolu basarili"),
    ("MODE_CHANGE", "Operasyonel mod degisikligi tamamlandi"),
    ("GPS_LOCK", "GPS sinyali kilitlendi, konum dogrulandi"),
    ("SENSOR_CALIBRATION", "Sensor kalibrasyonu tamamlandi"),
    ("MISSION_START", "Gorev basladi"),
    ("MISSION_COMPLETE", "Gorev basariyla tamamlandi"),
    ("BATTERY_WARNING", "Batarya seviyesi dusuk"),
    ("CONNECTION_RESTORED", "Baglanti yeniden kuruldu"),
]

V2_AI_TEMPLATES = [
    ("LOW", "Normal operasyonel aktivite, tehdit tespit edilmedi", False),
    ("LOW", "Rutin devriye hareketi, anomali yok", False),
    ("MEDIUM", "Beklenmeyen hiz degisimi tespit edildi, izleme onerisi", False),
    ("MEDIUM", "Rota sapmasi tespit edildi, operatorun dikkatine sunuldu", True),
    ("HIGH", "Kritik bolgeye yaklasma tespit edildi, acil onlem alinmali", True),
    ("HIGH", "Anormal biyometrik degerler, personel saglik kontrolu gerekli", True),
    ("CRITICAL", "Olasi dusman temasi, birlik alarma gecirilmeli", True),
    ("LOW", "Standart tatbikat harekati, veriler normal sinirlar icinde", False),
    ("MEDIUM", "Yakit/batarya seviyesi dusuk, ikmal planlanmali", True),
]


class AssetType(Enum):
    DRONE = "drone"
    SOLDIER = "soldier"
    VEHICLE = "vehicle"


class OperationalStatus(Enum):
    IDLE = "IDLE"
    EXERCISE = "EXERCISE"


# =============================================================================
# GEOGRAPHIC ZONES
# =============================================================================

ZONES = {
    OperationalStatus.IDLE: {
        "name": "Izmir Bornova Kislasi",
        "center": (38.4650, 27.2150),
        "spread_km": 0.5,
    },
    OperationalStatus.EXERCISE: {
        "name": "Ege Tatbikat Bolgesi",
        "center": (38.3000, 27.0000),
        "spread_km": 10,
        "patrol_radius_km": 5,
    },
}


# =============================================================================
# SIMULATED ASSET CLASS
# =============================================================================

@dataclass
class SimulatedAsset:
    """Represents a simulated tactical asset."""
    id: str
    name: str
    asset_type: AssetType
    status: OperationalStatus
    
    # Position
    latitude: float
    longitude: float
    altitude: float = 0.0
    heading: float = 0.0
    
    # Movement
    speed: float = 0.0
    patrol_angle: float = 0.0
    
    # Resources
    battery_level: int = 100
    fuel_level: int = 100
    
    # Biometrics (soldiers)
    heart_rate: int = 70
    spo2: int = 98
    stress_level: str = "LOW"
    body_temp: float = 36.5
    
    # Mission
    mission: str = "Bekleme"
    
    def to_mqtt_message(self) -> Dict[str, Any]:
        """Convert asset state to MQTT message format."""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Common position data
        position = {
            "lat": round(self.latitude, 6),
            "lon": round(self.longitude, 6),
            "alt_m": round(self.altitude, 1),
        }
        
        if self.asset_type == AssetType.DRONE:
            payload = {
                "position": position,
                "yaw_deg": round(self.heading, 1),
                "ground_speed_mps": round(self.speed * 0.277778, 1),
                "mode": "STANDBY" if self.status == OperationalStatus.IDLE else "AUTO",
                "battery": {"soc_pct": self.battery_level},
                "alignment": "FRIEND",
                "threat_level": 0,
                "mission": self.mission,
            }
        elif self.asset_type == AssetType.SOLDIER:
            payload = {
                "position": position,
                "heart_rate": self.heart_rate,
                "spo2": self.spo2,
                "stress_level": self.stress_level,
                "body_temp": round(self.body_temp, 1),
                "device": {"battery_pct": self.battery_level},
                "alignment": "FRIEND",
                "threat_level": 0,
                "mission": self.mission,
            }
        else:  # VEHICLE
            payload = {
                "position": position,
                "speed_kph": round(self.speed, 1),
                "heading": round(self.heading, 1),
                "fuel_pct": self.fuel_level,
                "engine_temp": random.randint(70, 95),
                "engine_status": "OFF" if self.status == OperationalStatus.IDLE else "RUNNING",
                "alignment": "FRIEND",
                "threat_level": 0,
                "mission": self.mission,
            }
        
        return {
            "domain": self.asset_type.value,
            "type": "telemetry",
            "id": self.id,
            "time": timestamp,
            "payload": payload,
        }
    
    def get_mqtt_topic(self) -> str:
        """All telemetry goes to the unified topic for Middleware processing."""
        return MQTT_TOPIC_TELEMETRY


# =============================================================================
# MOVEMENT BEHAVIORS
# =============================================================================

def update_idle_asset(asset: SimulatedAsset):
    """Assets in Izmir Barracks - minimal movement."""
    asset.latitude += random.uniform(-0.00005, 0.00005)
    asset.longitude += random.uniform(-0.00005, 0.00005)
    asset.speed = 0
    asset.altitude = 0 if asset.asset_type != AssetType.DRONE else random.uniform(0, 10)
    
    asset.battery_level = min(100, asset.battery_level + random.randint(0, 2))
    asset.fuel_level = min(100, asset.fuel_level + random.randint(0, 2))
    
    if asset.asset_type == AssetType.SOLDIER:
        asset.heart_rate = random.randint(60, 75)
        asset.spo2 = random.randint(97, 99)
        asset.stress_level = "LOW"
        asset.body_temp = round(random.uniform(36.2, 36.8), 1)
        asset.mission = "Kisla Gorevi"
    elif asset.asset_type == AssetType.DRONE:
        asset.mission = "Hangar Bekleme"
    else:
        asset.mission = "Garajda Bekleme"


def update_exercise_asset(asset: SimulatedAsset):
    """Assets in Aegean Exercise - active tactical movement.
    
    Includes low-probability anomaly injection (~10-15%) to simulate
    realistic edge cases that the Middleware should detect:
        - Soldiers: HR spike >150, COMBAT status, hypothermia/hyperthermia
        - Vehicles: Critical fuel <10%, engine overheat
        - Drones:   Severe battery drain, erratic speed
    """
    zone = ZONES[OperationalStatus.EXERCISE]
    center_lat, center_lon = zone["center"]
    radius_km = zone.get("patrol_radius_km", 5)
    radius_deg = radius_km * 0.009
    
    asset.patrol_angle += random.uniform(0.02, 0.06)
    if asset.patrol_angle > 2 * math.pi:
        asset.patrol_angle -= 2 * math.pi
    
    # Roll for anomaly (~10% chance per asset per cycle)
    anomaly_roll = random.random()
    
    if asset.asset_type == AssetType.DRONE:
        offset_lat = radius_deg * math.cos(asset.patrol_angle) * random.uniform(0.8, 1.2)
        offset_lon = radius_deg * math.sin(asset.patrol_angle) * random.uniform(0.8, 1.2)
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(1000, 2500)
        asset.speed = random.uniform(100, 160)
        asset.heading = math.degrees(asset.patrol_angle + math.pi / 2) % 360
        asset.battery_level = max(20, asset.battery_level - random.randint(0, 2))
        asset.mission = "Kesif Ucusu"
        
        # 🔴 Anomaly: Severe battery drain (ML should catch)
        if anomaly_roll < 0.08:
            asset.battery_level = random.randint(5, 15)
            asset.speed = random.uniform(180, 250)  # erratic speed
            asset.mission = "ACIL Donus"
        
    elif asset.asset_type == AssetType.SOLDIER:
        offset_lat = (radius_deg * 0.4) * math.cos(asset.patrol_angle) * random.uniform(0.9, 1.1)
        offset_lon = (radius_deg * 0.4) * math.sin(asset.patrol_angle) * random.uniform(0.9, 1.1)
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(100, 400)
        asset.speed = random.uniform(3, 8)
        asset.heart_rate = random.randint(90, 140)
        asset.spo2 = random.randint(93, 98)
        asset.stress_level = random.choice(["MEDIUM", "MEDIUM", "HIGH"])
        asset.body_temp = round(random.uniform(36.8, 37.8), 1)
        asset.battery_level = max(30, asset.battery_level - random.randint(0, 1))
        asset.mission = "Arazi Tatbikati"
        
        # 🔴 Anomaly: Heart rate spike + COMBAT (Rule Engine should catch)
        if anomaly_roll < 0.10:
            asset.heart_rate = random.randint(155, 195)
            asset.stress_level = random.choice(["COMBAT", "ENGAGED", "PANIC"])
            asset.spo2 = random.randint(85, 92)
            asset.body_temp = round(random.uniform(38.5, 40.0), 1)
            asset.speed = random.uniform(10, 20)  # sprinting
            asset.mission = "Catisma / Temas"
        # 🟡 Anomaly: Moderate HR anomaly (ML should catch, rules may not)
        elif anomaly_roll < 0.15:
            asset.heart_rate = random.randint(141, 149)
            asset.spo2 = random.randint(88, 93)
            asset.body_temp = round(random.uniform(38.0, 39.0), 1)
            asset.speed = random.uniform(12, 18)
            asset.mission = "Yogun Efor"
        
    else:  # VEHICLE
        offset_lat = radius_deg * math.cos(asset.patrol_angle + random.uniform(-0.1, 0.1))
        offset_lon = radius_deg * math.sin(asset.patrol_angle + random.uniform(-0.1, 0.1))
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(50, 300)
        asset.speed = random.uniform(25, 55)
        asset.heading = math.degrees(asset.patrol_angle + math.pi / 2) % 360
        asset.fuel_level = max(40, asset.fuel_level - random.randint(0, 1))
        missions = ["Arazi Devriye", "Konvoy Harekati", "Hedef Atisi", "Manevra"]
        asset.mission = random.choice(missions)
        
        # 🔴 Anomaly: Critical fuel (Rule Engine should catch)
        if anomaly_roll < 0.08:
            asset.fuel_level = random.randint(3, 9)
            asset.speed = random.uniform(5, 15)  # limping
            asset.mission = "ACIL Yakit"


UPDATE_FUNCTIONS = {
    OperationalStatus.IDLE: update_idle_asset,
    OperationalStatus.EXERCISE: update_exercise_asset,
}


# =============================================================================
# ASSET GENERATION (30 units)
# =============================================================================

def generate_assets() -> List[SimulatedAsset]:
    """Generate the 30 assets for Ege Tatbikati."""
    assets = []
    
    # 10 Drones
    drone_units = [
        ("TB2-ALFA-01", "TB2 Bayraktar 1"),
        ("TB2-ALFA-02", "TB2 Bayraktar 2"),
        ("TB2-ALFA-03", "TB2 Bayraktar 3"),
        ("ANKA-BRAVO-01", "ANKA-S 1"),
        ("ANKA-BRAVO-02", "ANKA-S 2"),
        ("ANKA-BRAVO-03", "ANKA-S 3"),
        ("AKSUNGUR-01", "Aksungur 1"),
        ("AKSUNGUR-02", "Aksungur 2"),
        ("MINI-IHA-01", "Mini IHA 1"),
        ("MINI-IHA-02", "Mini IHA 2"),
    ]
    
    for i, (unit_id, name) in enumerate(drone_units):
        status = OperationalStatus.IDLE if i < 5 else OperationalStatus.EXERCISE
        zone = ZONES[status]
        center_lat, center_lon = zone["center"]
        spread = zone["spread_km"] * 0.009
        
        assets.append(SimulatedAsset(
            id=unit_id,
            name=name,
            asset_type=AssetType.DRONE,
            status=status,
            latitude=center_lat + random.uniform(-spread, spread),
            longitude=center_lon + random.uniform(-spread, spread),
            altitude=0 if status == OperationalStatus.IDLE else random.uniform(800, 2000),
            heading=random.uniform(0, 360),
            battery_level=random.randint(80, 100),
            patrol_angle=random.uniform(0, 2 * math.pi),
        ))
    
    # 10 Soldiers
    soldier_units = [
        ("SAT-TIM-01", "SAT Komando Tim 1"),
        ("SAT-TIM-02", "SAT Komando Tim 2"),
        ("SAT-TIM-03", "SAT Komando Tim 3"),
        ("SAS-TIM-01", "SAS Tim 1"),
        ("SAS-TIM-02", "SAS Tim 2"),
        ("KOMANDO-01", "Dag Komando 1"),
        ("KOMANDO-02", "Dag Komando 2"),
        ("KOMANDO-03", "Dag Komando 3"),
        ("PIYADE-01", "Piyade Manga 1"),
        ("PIYADE-02", "Piyade Manga 2"),
    ]
    
    for i, (unit_id, name) in enumerate(soldier_units):
        status = OperationalStatus.IDLE if i < 5 else OperationalStatus.EXERCISE
        zone = ZONES[status]
        center_lat, center_lon = zone["center"]
        spread = zone["spread_km"] * 0.009
        
        assets.append(SimulatedAsset(
            id=unit_id,
            name=name,
            asset_type=AssetType.SOLDIER,
            status=status,
            latitude=center_lat + random.uniform(-spread, spread),
            longitude=center_lon + random.uniform(-spread, spread),
            heart_rate=70 if status == OperationalStatus.IDLE else random.randint(85, 110),
            spo2=random.randint(96, 99),
            battery_level=random.randint(70, 100),
            patrol_angle=random.uniform(0, 2 * math.pi),
        ))
    
    # 10 Vehicles
    vehicle_units = [
        ("ALTAY-01", "Altay Tank 1"),
        ("ALTAY-02", "Altay Tank 2"),
        ("KIRPI-01", "Kirpi MRAP 1"),
        ("KIRPI-02", "Kirpi MRAP 2"),
        ("KIRPI-03", "Kirpi MRAP 3"),
        ("KOBRA-01", "Kobra Zirhli 1"),
        ("KOBRA-02", "Kobra Zirhli 2"),
        ("FIRTINA-01", "Firtina Obus 1"),
        ("FIRTINA-02", "Firtina Obus 2"),
        ("EJDER-01", "Ejder Yalcin 1"),
    ]
    
    for i, (unit_id, name) in enumerate(vehicle_units):
        status = OperationalStatus.IDLE if i < 5 else OperationalStatus.EXERCISE
        zone = ZONES[status]
        center_lat, center_lon = zone["center"]
        spread = zone["spread_km"] * 0.009
        
        assets.append(SimulatedAsset(
            id=unit_id,
            name=name,
            asset_type=AssetType.VEHICLE,
            status=status,
            latitude=center_lat + random.uniform(-spread, spread),
            longitude=center_lon + random.uniform(-spread, spread),
            heading=random.uniform(0, 360),
            fuel_level=random.randint(70, 100),
            patrol_angle=random.uniform(0, 2 * math.pi),
        ))
    
    return assets


# =============================================================================
# MQTT CLIENT CALLBACKS
# =============================================================================

def on_connect(client, userdata, flags, rc, properties=None):
    """Callback when connected to MQTT broker."""
    if rc == 0:
        print("[MQTT] Connected to broker successfully!")
    else:
        print(f"[MQTT] Connection failed with code: {rc}")


def on_disconnect(client, userdata, rc, properties=None):
    """Callback when disconnected from MQTT broker."""
    print(f"[MQTT] Disconnected from broker (rc={rc})")


def on_publish(client, userdata, mid, properties=None):
    """Callback when message is published."""
    pass  # Quiet


# =============================================================================
# SIMULATION ENGINE
# =============================================================================

class EgeTatbikatiSimulator:
    """Main simulation engine with MQTT publishing and v2 table seeding."""
    
    def __init__(self, broker_host: str, broker_port: int, interval: float, backend_url: str = DEFAULT_BACKEND_URL):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.interval = interval
        self.backend_url = backend_url
        self.assets: List[SimulatedAsset] = []
        self.running = False
        self.mqtt_client: mqtt.Client = None
        self.http_session: Optional[Any] = None
        self.stats = {
            "messages_sent": 0,
            "errors": 0,
            "start_time": None,
            "cycles": 0,
            "v2_tasks_posted": 0,
            "v2_logs_posted": 0,
            "v2_analyses_posted": 0,
        }
    
    def connect_mqtt(self) -> bool:
        """Connect to MQTT broker."""
        try:
            self.mqtt_client = mqtt.Client(
                client_id=f"c4isr-simulation-{random.randint(1000, 9999)}",
                protocol=mqtt.MQTTv5
            )
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_disconnect = on_disconnect
            self.mqtt_client.on_publish = on_publish
            
            print(f"[MQTT] Connecting to {self.broker_host}:{self.broker_port}...")
            self.mqtt_client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            print(f"[MQTT] Connection error: {e}")
            return False
    
    def disconnect_mqtt(self):
        """Disconnect from MQTT broker."""
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            print("[MQTT] Disconnected.")
    
    def initialize(self):
        """Initialize the simulation."""
        print("\nInitializing Ege Tatbikati Simulation...")
        self.assets = generate_assets()
        
        idle_count = len([a for a in self.assets if a.status == OperationalStatus.IDLE])
        exercise_count = len([a for a in self.assets if a.status == OperationalStatus.EXERCISE])
        
        print(f"\nAsset Distribution:")
        print(f"   Total: {len(self.assets)} units")
        print(f"   Izmir Kisla (IDLE): {idle_count}")
        print(f"   Ege Tatbikat (EXERCISE): {exercise_count}")
        
        print(f"\nAsset Types:")
        print(f"   Drones: {len([a for a in self.assets if a.asset_type == AssetType.DRONE])}")
        print(f"   Soldiers: {len([a for a in self.assets if a.asset_type == AssetType.SOLDIER])}")
        print(f"   Vehicles: {len([a for a in self.assets if a.asset_type == AssetType.VEHICLE])}")
    
    def update_assets(self):
        """Update all asset positions and states."""
        for asset in self.assets:
            update_fn = UPDATE_FUNCTIONS.get(asset.status)
            if update_fn:
                update_fn(asset)
    
    def publish_telemetry(self, asset: SimulatedAsset) -> bool:
        """Publish asset telemetry via MQTT."""
        try:
            message = asset.to_mqtt_message()
            topic = asset.get_mqtt_topic()
            payload = json.dumps(message, ensure_ascii=False)
            
            result = self.mqtt_client.publish(topic, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                self.stats["messages_sent"] += 1
                return True
            else:
                self.stats["errors"] += 1
                return False
        except Exception as e:
            self.stats["errors"] += 1
            if self.stats["errors"] <= 5:
                print(f"\n[ERROR] Publish failed for {asset.id}: {e}")
            return False
    
    def publish_all_telemetry(self):
        """Publish telemetry for all assets."""
        for asset in self.assets:
            self.publish_telemetry(asset)
    
    # =========================================================================
    # V2 TABLE SEEDING (Tasks, System Logs, AI Analyses via REST API)
    # =========================================================================
    
    async def init_http_session(self):
        """Initialize aiohttp session for backend REST calls."""
        if HAS_AIOHTTP and self.http_session is None:
            self.http_session = aiohttp.ClientSession()
    
    async def close_http_session(self):
        """Close aiohttp session."""
        if self.http_session:
            await self.http_session.close()
            self.http_session = None
    
    async def post_random_task(self, asset: SimulatedAsset):
        """POST a random task for an asset to /api/v1/tasks."""
        if not self.http_session:
            return
        try:
            templates = V2_TASK_TEMPLATES.get(asset.asset_type.value, V2_TASK_TEMPLATES["drone"])
            title, description = random.choice(templates)
            status = random.choice(["PENDING", "IN_PROGRESS"])
            
            payload = {
                "assetId": asset.id,
                "title": title,
                "description": description,
                "status": status,
            }
            async with self.http_session.post(
                f"{self.backend_url}/api/v1/tasks",
                json=payload, timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    self.stats["v2_tasks_posted"] += 1
        except Exception as e:
            if self.stats["errors"] < 3:
                print(f"\n[V2-TASK] Error posting task for {asset.id}: {e}")
    
    async def post_system_log(self, asset: SimulatedAsset, event_type: str = None, message: str = None):
        """POST a system log entry for an asset."""
        if not self.http_session:
            return
        try:
            if event_type is None or message is None:
                evt, msg = random.choice(V2_LOG_EVENTS)
                event_type = event_type or evt
                message = message or msg
            
            payload = {
                "assetId": asset.id,
                "eventType": event_type,
                "message": message,
            }
            async with self.http_session.post(
                f"{self.backend_url}/api/v1/system-logs",
                json=payload, timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    self.stats["v2_logs_posted"] += 1
        except Exception:
            pass  # Silent — don't flood console
    
    async def post_ai_analysis(self, asset: SimulatedAsset):
        """POST an AI analysis record for an asset."""
        if not self.http_session:
            return
        try:
            # Exercise assets more likely to get HIGH/CRITICAL
            if asset.status == OperationalStatus.EXERCISE:
                template = random.choice(V2_AI_TEMPLATES)
            else:
                # IDLE: always LOW
                low_only = [t for t in V2_AI_TEMPLATES if t[0] == "LOW"]
                template = random.choice(low_only)
            
            threat_level, recommendation, is_alert = template
            
            payload = {
                "assetId": asset.id,
                "threatLevel": threat_level,
                "recommendation": recommendation,
                "isAlert": is_alert,
            }
            async with self.http_session.post(
                f"{self.backend_url}/api/v1/ai-analyses",
                json=payload, timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    self.stats["v2_analyses_posted"] += 1
        except Exception:
            pass  # Silent
    
    async def seed_v2_tables(self):
        """Seed v2 tables with data for a random subset of assets."""
        if not HAS_AIOHTTP or not self.http_session:
            return
        
        # Pick 3-6 random assets to seed per cycle
        subset = random.sample(self.assets, min(random.randint(3, 6), len(self.assets)))
        
        tasks = []
        for asset in subset:
            # ~50% chance each type of v2 record
            if random.random() < 0.4:
                tasks.append(self.post_random_task(asset))
            if random.random() < 0.6:
                tasks.append(self.post_system_log(asset))
            if random.random() < 0.5:
                tasks.append(self.post_ai_analysis(asset))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def run_simulation_loop(self):
        """Main async simulation loop."""
        self.running = True
        self.stats["start_time"] = datetime.now()
        
        # Init HTTP session for v2 table seeding
        await self.init_http_session()
        
        while self.running:
            self.stats["cycles"] += 1
            cycle_start = datetime.now()
            
            # Update all asset states
            self.update_assets()
            
            # Publish telemetry via MQTT
            self.publish_all_telemetry()
            
            # Seed v2 tables every N cycles
            if HAS_AIOHTTP and self.stats["cycles"] % V2_SEED_EVERY_N_CYCLES == 0:
                await self.seed_v2_tables()
            
            # Print status
            elapsed = (datetime.now() - self.stats["start_time"]).total_seconds()
            elapsed_min = elapsed / 60
            
            v2_total = (self.stats["v2_tasks_posted"] + 
                        self.stats["v2_logs_posted"] + 
                        self.stats["v2_analyses_posted"])
            
            print(f"\rCycle {self.stats['cycles']:03d} | "
                  f"MQTT: {self.stats['messages_sent']:,} | "
                  f"v2: {v2_total} (T:{self.stats['v2_tasks_posted']}/L:{self.stats['v2_logs_posted']}/A:{self.stats['v2_analyses_posted']}) | "
                  f"Err: {self.stats['errors']} | "
                  f"{elapsed_min:.1f}min | "
                  f"Next in {self.interval}s...", end="", flush=True)
            
            # Wait for next cycle
            cycle_duration = (datetime.now() - cycle_start).total_seconds()
            sleep_time = max(0, self.interval - cycle_duration)
            await asyncio.sleep(sleep_time)
        
        # Cleanup
        await self.close_http_session()
        print("\n\nSimulation stopped.")
    
    def stop(self):
        """Stop the simulation."""
        self.running = False


# =============================================================================
# MAIN
# =============================================================================

async def main():
    parser = argparse.ArgumentParser(description="Ege Tatbikati Simulation (MQTT + v2 REST)")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL,
                        help=f"Update interval in seconds (default: {DEFAULT_INTERVAL})")
    parser.add_argument("--broker-host", type=str, default=DEFAULT_BROKER_HOST,
                        help=f"MQTT broker host (default: {DEFAULT_BROKER_HOST})")
    parser.add_argument("--broker-port", type=int, default=DEFAULT_BROKER_PORT,
                        help=f"MQTT broker port (default: {DEFAULT_BROKER_PORT})")
    parser.add_argument("--backend-url", type=str, default=DEFAULT_BACKEND_URL,
                        help=f"Backend REST URL (default: {DEFAULT_BACKEND_URL})")
    args = parser.parse_args()
    
    print("=" * 60)
    print("EGE TATBIKATI SIMULATION ENGINE (MQTT + v2 REST)")
    print("=" * 60)
    print(f"MQTT Broker: {args.broker_host}:{args.broker_port}")
    print(f"Backend URL: {args.backend_url}")
    print(f"Interval: {args.interval}s ({args.interval/60:.1f} min)")
    print(f"Topic: {MQTT_TOPIC_TELEMETRY} (unified — Middleware routes)")
    print(f"v2 Table Seeding: {'ENABLED' if HAS_AIOHTTP else 'DISABLED (install aiohttp)'}")
    print(f"v2 Seed Frequency: Every {V2_SEED_EVERY_N_CYCLES} cycles")
    print("=" * 60)
    
    simulator = EgeTatbikatiSimulator(args.broker_host, args.broker_port, args.interval, args.backend_url)
    
    # Connect to MQTT
    if not simulator.connect_mqtt():
        print("\nFailed to connect to MQTT broker. Make sure Mosquitto is running.")
        print("Run: docker compose up -d")
        return
    
    # Initialize assets
    simulator.initialize()
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("\n\nStopping simulation...")
        simulator.stop()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n" + "=" * 60)
    print("Starting simulation... (Press Ctrl+C to stop)")
    print("Each unit publishes to c4isr/telemetry — Middleware handles routing")
    if HAS_AIOHTTP:
        print(f"v2 tables (tasks/logs/analyses) seeded every {V2_SEED_EVERY_N_CYCLES} cycles via REST")
    print("=" * 60 + "\n")
    
    try:
        await simulator.run_simulation_loop()
    finally:
        simulator.disconnect_mqtt()
    
    # Final stats
    print("\nFinal Statistics:")
    print(f"   MQTT Messages Published: {simulator.stats['messages_sent']:,}")
    print(f"   v2 Tasks Posted: {simulator.stats['v2_tasks_posted']}")
    print(f"   v2 System Logs Posted: {simulator.stats['v2_logs_posted']}")
    print(f"   v2 AI Analyses Posted: {simulator.stats['v2_analyses_posted']}")
    print(f"   Total Errors: {simulator.stats['errors']}")
    print(f"   Total Cycles: {simulator.stats['cycles']}")
    if simulator.stats["start_time"]:
        elapsed = (datetime.now() - simulator.stats["start_time"]).total_seconds()
        print(f"   Total Runtime: {elapsed/60:.1f} minutes")


if __name__ == "__main__":
    asyncio.run(main())
