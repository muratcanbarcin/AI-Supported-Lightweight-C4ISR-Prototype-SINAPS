#!/usr/bin/env python3
"""
===============================================================================
EGE TATBIKATI - LIVE SIMULATION ENGINE
===============================================================================
Real-time tactical simulation for Aegean Exercise scenario.

Features:
- 30 units (10 Drone, 10 Soldier, 10 Ground Vehicle)
- Half in Izmir Barracks (IDLE) - minimal movement
- Half in Aegean Exercise (EXERCISE) - active movement
- Sends telemetry every 60 seconds (configurable)
- All data persisted to PostgreSQL

Usage:
    python wargame_sim.py [--interval SECONDS] [--backend URL]
    
Default: 60 second intervals (1 minute)
===============================================================================
"""

import asyncio
import aiohttp
import json
import math
import random
import argparse
import signal
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_BACKEND_URL = "http://localhost:8080/api/v1/telemetry"
DEFAULT_INTERVAL = 60  # 1 minute


class AssetType(Enum):
    DRONE = "drone"
    SOLDIER = "soldier"
    VEHICLE = "vehicle"


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
    
    # Mission
    mission: str = "Bekleme"
    
    def to_telemetry_message(self) -> Dict[str, Any]:
        """Convert asset state to backend-compatible telemetry message."""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        if self.asset_type == AssetType.DRONE:
            payload = {
                "position": {
                    "lat": round(self.latitude, 6),
                    "lon": round(self.longitude, 6),
                    "alt_m": round(self.altitude, 1),
                },
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
                "position": {
                    "lat": round(self.latitude, 6),
                    "lon": round(self.longitude, 6),
                    "alt_m": round(self.altitude, 1),
                },
                "heart_rate": self.heart_rate,
                "spo2": self.spo2,
                "stress_level": self.stress_level,
                "body_temp": round(random.uniform(36.2, 37.2), 1),
                "device": {"battery_pct": self.battery_level},
                "alignment": "FRIEND",
                "threat_level": 0,
                "mission": self.mission,
            }
        else:  # VEHICLE (Ground vehicles)
            payload = {
                "position": {
                    "lat": round(self.latitude, 6),
                    "lon": round(self.longitude, 6),
                    "alt_m": round(self.altitude, 1),
                },
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


# =============================================================================
# MOVEMENT BEHAVIORS
# =============================================================================

def update_idle_asset(asset: SimulatedAsset):
    """Assets in Izmir Barracks - minimal movement."""
    # Very small position jitter (people walking around base)
    asset.latitude += random.uniform(-0.00005, 0.00005)
    asset.longitude += random.uniform(-0.00005, 0.00005)
    asset.speed = 0
    asset.altitude = 0 if asset.asset_type != AssetType.DRONE else random.uniform(0, 10)
    
    # Resources stay high (charging/refueling)
    asset.battery_level = min(100, asset.battery_level + random.randint(0, 2))
    asset.fuel_level = min(100, asset.fuel_level + random.randint(0, 2))
    
    # Soldiers resting
    if asset.asset_type == AssetType.SOLDIER:
        asset.heart_rate = random.randint(60, 75)
        asset.spo2 = random.randint(97, 99)
        asset.stress_level = "LOW"
        asset.mission = "Kisla Gorevi"
    elif asset.asset_type == AssetType.DRONE:
        asset.mission = "Hangar Bekleme"
    else:
        asset.mission = "Garajda Bekleme"


def update_exercise_asset(asset: SimulatedAsset):
    """Assets in Aegean Exercise - active tactical movement."""
    zone = ZONES[OperationalStatus.EXERCISE]
    center_lat, center_lon = zone["center"]
    radius_km = zone.get("patrol_radius_km", 5)
    radius_deg = radius_km * 0.009
    
    # Circular/patrol movement with variation
    asset.patrol_angle += random.uniform(0.02, 0.06)
    if asset.patrol_angle > 2 * math.pi:
        asset.patrol_angle -= 2 * math.pi
    
    # Different behavior per asset type
    if asset.asset_type == AssetType.DRONE:
        # High altitude reconnaissance pattern
        offset_lat = radius_deg * math.cos(asset.patrol_angle) * random.uniform(0.8, 1.2)
        offset_lon = radius_deg * math.sin(asset.patrol_angle) * random.uniform(0.8, 1.2)
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(1000, 2500)
        asset.speed = random.uniform(100, 160)
        asset.heading = math.degrees(asset.patrol_angle + math.pi / 2) % 360
        asset.battery_level = max(20, asset.battery_level - random.randint(0, 2))
        asset.mission = "Kesif Ucusu"
        
    elif asset.asset_type == AssetType.SOLDIER:
        # Infantry patrol / exercise
        offset_lat = (radius_deg * 0.4) * math.cos(asset.patrol_angle) * random.uniform(0.9, 1.1)
        offset_lon = (radius_deg * 0.4) * math.sin(asset.patrol_angle) * random.uniform(0.9, 1.1)
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(100, 400)  # Hilly terrain
        asset.speed = random.uniform(3, 8)
        asset.heart_rate = random.randint(90, 130)
        asset.spo2 = random.randint(94, 98)
        asset.stress_level = random.choice(["MEDIUM", "MEDIUM", "HIGH"])
        asset.battery_level = max(30, asset.battery_level - random.randint(0, 1))
        asset.mission = "Arazi Tatbikati"
        
    else:  # VEHICLE (Ground vehicles - tanks, MRAPs, etc.)
        # Armored vehicle patrol
        offset_lat = radius_deg * math.cos(asset.patrol_angle + random.uniform(-0.1, 0.1))
        offset_lon = radius_deg * math.sin(asset.patrol_angle + random.uniform(-0.1, 0.1))
        asset.latitude = center_lat + offset_lat
        asset.longitude = center_lon + offset_lon
        asset.altitude = random.uniform(50, 300)  # Terrain elevation
        asset.speed = random.uniform(25, 55)  # km/h
        asset.heading = math.degrees(asset.patrol_angle + math.pi / 2) % 360
        asset.fuel_level = max(40, asset.fuel_level - random.randint(0, 1))
        
        # Random mission types for vehicles
        missions = ["Arazi Devriye", "Konvoy Harekati", "Hedef Atisi", "Manevra"]
        asset.mission = random.choice(missions)


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
    
    # 10 Vehicles (Ground vehicles)
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
# SIMULATION ENGINE
# =============================================================================

class EgeTatbikatiSimulator:
    """Main simulation engine."""
    
    def __init__(self, backend_url: str, interval: float):
        self.backend_url = backend_url
        self.interval = interval
        self.assets: List[SimulatedAsset] = []
        self.running = False
        self.stats = {
            "messages_sent": 0,
            "errors": 0,
            "start_time": None,
            "cycles": 0,
        }
    
    def initialize(self):
        """Initialize the simulation."""
        print("Initializing Ege Tatbikati Simulation...")
        self.assets = generate_assets()
        
        # Count by status
        idle_count = len([a for a in self.assets if a.status == OperationalStatus.IDLE])
        exercise_count = len([a for a in self.assets if a.status == OperationalStatus.EXERCISE])
        
        print(f"\nAsset Distribution:")
        print(f"   Total: {len(self.assets)} units")
        print(f"   Izmir Kisla (IDLE): {idle_count}")
        print(f"   Ege Tatbikat (EXERCISE): {exercise_count}")
        
        # Count by type
        print(f"\nAsset Types:")
        print(f"   Drones: {len([a for a in self.assets if a.asset_type == AssetType.DRONE])}")
        print(f"   Soldiers: {len([a for a in self.assets if a.asset_type == AssetType.SOLDIER])}")
        print(f"   Vehicles: {len([a for a in self.assets if a.asset_type == AssetType.VEHICLE])}")
    
    async def update_assets(self):
        """Update all asset positions and states."""
        for asset in self.assets:
            update_fn = UPDATE_FUNCTIONS.get(asset.status)
            if update_fn:
                update_fn(asset)
    
    async def send_telemetry(self, session: aiohttp.ClientSession, asset: SimulatedAsset):
        """Send single asset telemetry to backend."""
        try:
            message = asset.to_telemetry_message()
            async with session.post(self.backend_url, json=message) as response:
                if response.status == 200:
                    self.stats["messages_sent"] += 1
                else:
                    self.stats["errors"] += 1
                    if self.stats["errors"] <= 3:
                        text = await response.text()
                        print(f"\nError sending {asset.id}: {response.status}")
        except Exception as e:
            self.stats["errors"] += 1
            if self.stats["errors"] <= 3:
                print(f"\nConnection error: {e}")
    
    async def send_all_telemetry(self, session: aiohttp.ClientSession):
        """Send telemetry for all assets."""
        tasks = [self.send_telemetry(session, asset) for asset in self.assets]
        await asyncio.gather(*tasks)
    
    async def run_simulation_loop(self):
        """Main simulation loop."""
        self.running = True
        self.stats["start_time"] = datetime.now()
        
        connector = aiohttp.TCPConnector(limit=50)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            while self.running:
                self.stats["cycles"] += 1
                cycle_start = datetime.now()
                
                # Update all asset states
                await self.update_assets()
                
                # Send telemetry
                await self.send_all_telemetry(session)
                
                # Print status
                elapsed = (datetime.now() - self.stats["start_time"]).total_seconds()
                elapsed_min = elapsed / 60
                
                print(f"\rCycle {self.stats['cycles']:03d} | "
                      f"Sent: {self.stats['messages_sent']:,} | "
                      f"Errors: {self.stats['errors']} | "
                      f"Runtime: {elapsed_min:.1f} min | "
                      f"Next in {self.interval}s...", end="", flush=True)
                
                # Wait for next cycle
                cycle_duration = (datetime.now() - cycle_start).total_seconds()
                sleep_time = max(0, self.interval - cycle_duration)
                await asyncio.sleep(sleep_time)
        
        print("\n\nSimulation stopped.")
    
    def stop(self):
        """Stop the simulation."""
        self.running = False


# =============================================================================
# MAIN
# =============================================================================

async def main():
    parser = argparse.ArgumentParser(description="Ege Tatbikati Simulation Engine")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL,
                        help=f"Update interval in seconds (default: {DEFAULT_INTERVAL})")
    parser.add_argument("--backend", type=str, default=DEFAULT_BACKEND_URL,
                        help=f"Backend API URL (default: {DEFAULT_BACKEND_URL})")
    args = parser.parse_args()
    
    print("=" * 60)
    print("EGE TATBIKATI SIMULATION ENGINE")
    print("=" * 60)
    print(f"Backend: {args.backend}")
    print(f"Interval: {args.interval}s ({args.interval/60:.1f} min)")
    print("=" * 60)
    
    simulator = EgeTatbikatiSimulator(args.backend, args.interval)
    simulator.initialize()
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("\n\nStopping simulation...")
        simulator.stop()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n" + "=" * 60)
    print("Starting simulation... (Press Ctrl+C to stop)")
    print("   Each unit sends data every 60 seconds")
    print("=" * 60 + "\n")
    
    await simulator.run_simulation_loop()
    
    # Final stats
    print("\nFinal Statistics:")
    print(f"   Total Messages Sent: {simulator.stats['messages_sent']:,}")
    print(f"   Total Errors: {simulator.stats['errors']}")
    print(f"   Total Cycles: {simulator.stats['cycles']}")
    if simulator.stats["start_time"]:
        elapsed = (datetime.now() - simulator.stats["start_time"]).total_seconds()
        print(f"   Total Runtime: {elapsed/60:.1f} minutes")


if __name__ == "__main__":
    asyncio.run(main())
