#!/usr/bin/env python3
"""
===============================================================================
TSK WARGAME SIMULATION - LIVE ENGINE
===============================================================================
Real-time tactical simulation engine for C4ISR system testing.

Features:
- Async HTTP telemetry streaming to Spring Boot backend
- Scenario-based movement patterns (IDLE, PATROL, COMBAT)
- Realistic biometric/vehicle telemetry generation
- Configurable update intervals

Usage:
    python wargame_sim.py [--interval SECONDS] [--backend URL]
    
Example:
    python wargame_sim.py --interval 5 --backend http://localhost:8080/api/v1/telemetry

Dependencies:
    pip install aiohttp asyncio
===============================================================================
"""

import asyncio
import aiohttp
import json
import math
import random
import argparse
import signal
import sys
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_BACKEND_URL = "http://localhost:8080/api/v1/telemetry"
DEFAULT_INTERVAL = 5  # seconds


class AssetType(Enum):
    DRONE = "drone"
    SOLDIER = "soldier"
    VEHICLE = "vehicle"


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

ZONES = {
    OperationalStatus.IDLE: {
        "name": "Mürted Hava Üssü (Ankara)",
        "center": (39.95, 32.60),
        "behavior": "stationary",
    },
    OperationalStatus.PATROL: {
        "name": "Hatay/Kilis Sınır Hattı",
        "center": (36.60, 36.50),
        "behavior": "circular_patrol",
        "patrol_radius_km": 10,
    },
    OperationalStatus.COMBAT: {
        "name": "Suriye Harekat Bölgesi",
        "center": (36.20, 37.00),
        "behavior": "erratic_combat",
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
    variant: str
    status: OperationalStatus
    alignment: Alignment
    
    # Position
    latitude: float
    longitude: float
    altitude: float = 0.0
    heading: float = 0.0
    
    # Movement
    speed: float = 0.0
    patrol_angle: float = 0.0  # For circular patrol
    
    # Health/Resources
    battery_level: int = 100
    fuel_level: int = 100
    
    # Biometrics (soldiers)
    heart_rate: int = 70
    spo2: int = 98
    stress_level: str = "LOW"
    
    # Combat state
    ammo_status: str = "FULL"
    last_alert: Optional[str] = None
    
    def to_telemetry_message(self) -> Dict[str, Any]:
        """Convert asset state to backend-compatible telemetry message."""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Build payload based on asset type
        if self.asset_type == AssetType.DRONE:
            payload = {
                "position": {
                    "lat": round(self.latitude, 6),
                    "lon": round(self.longitude, 6),
                    "alt_m": round(self.altitude, 1),
                },
                "yaw_deg": round(self.heading, 1),
                "ground_speed_mps": round(self.speed * 0.277778, 1),  # km/h to m/s
                "mode": "COMBAT" if self.status == OperationalStatus.COMBAT else (
                    "PATROL" if self.status == OperationalStatus.PATROL else "STANDBY"
                ),
                "battery": {"soc_pct": self.battery_level},
                "alignment": self.alignment.value,
                "threat_level": 0,
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
                "body_temp": round(random.uniform(36.2, 37.5), 1),
                "steps": random.randint(0, 100),
                "device": {"battery_pct": self.battery_level},
                "alignment": self.alignment.value,
                "threat_level": 0,
                "ammo_status": self.ammo_status,
            }
            if self.last_alert:
                payload["alert"] = self.last_alert
        else:  # Vehicle
            payload = {
                "position": {
                    "lat": round(self.latitude, 6),
                    "lon": round(self.longitude, 6),
                    "alt_m": round(self.altitude, 1),
                },
                "speed_kph": round(self.speed, 1),
                "heading": round(self.heading, 1),
                "fuel_pct": self.fuel_level,
                "engine_temp": random.randint(75, 95),
                "engine_status": "OFF" if self.status == OperationalStatus.IDLE else "RUNNING",
                "alignment": self.alignment.value,
                "threat_level": 0,
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
    """Assets in Ankara base - minimal movement, high resources."""
    # Stationary - only minor position jitter
    asset.latitude += random.uniform(-0.0001, 0.0001)
    asset.longitude += random.uniform(-0.0001, 0.0001)
    asset.speed = 0
    
    # Resources stay high
    asset.battery_level = max(90, min(100, asset.battery_level + random.randint(0, 2)))
    asset.fuel_level = max(90, min(100, asset.fuel_level + random.randint(0, 2)))
    
    # Soldiers resting
    if asset.asset_type == AssetType.SOLDIER:
        asset.heart_rate = random.randint(60, 80)
        asset.spo2 = random.randint(97, 99)
        asset.stress_level = "LOW"
        asset.ammo_status = "FULL"


def update_patrol_asset(asset: SimulatedAsset):
    """Assets on border patrol - circular movement pattern."""
    zone = ZONES[OperationalStatus.PATROL]
    center_lat, center_lon = zone["center"]
    radius_km = zone.get("patrol_radius_km", 10)
    radius_deg = radius_km * 0.009  # Approximate km to degrees
    
    # Circular patrol movement
    asset.patrol_angle += random.uniform(0.02, 0.05)  # Slow rotation
    if asset.patrol_angle > 2 * math.pi:
        asset.patrol_angle -= 2 * math.pi
    
    # Calculate new position on circle
    offset_lat = radius_deg * math.cos(asset.patrol_angle) * random.uniform(0.8, 1.2)
    offset_lon = radius_deg * math.sin(asset.patrol_angle) * random.uniform(0.8, 1.2)
    
    asset.latitude = center_lat + offset_lat
    asset.longitude = center_lon + offset_lon
    
    # Update heading to face movement direction
    asset.heading = math.degrees(asset.patrol_angle + math.pi / 2) % 360
    
    # Set appropriate speeds
    if asset.asset_type == AssetType.DRONE:
        asset.speed = random.uniform(60, 100)  # km/h
        asset.altitude = random.uniform(800, 1500)
        asset.battery_level = max(30, asset.battery_level - random.randint(0, 2))
    elif asset.asset_type == AssetType.SOLDIER:
        asset.speed = random.uniform(3, 6)  # km/h walking
        asset.heart_rate = random.randint(90, 120)
        asset.spo2 = random.randint(95, 98)
        asset.stress_level = "MEDIUM"
        asset.battery_level = max(40, asset.battery_level - random.randint(0, 1))
    else:  # Vehicle
        asset.speed = random.uniform(20, 40)  # km/h
        asset.fuel_level = max(30, asset.fuel_level - random.randint(0, 2))


def update_combat_asset(asset: SimulatedAsset):
    """Assets in Syria combat zone - erratic movement, high stress."""
    # Zig-zag erratic movement
    direction_change = random.uniform(-0.5, 0.5)
    asset.heading = (asset.heading + direction_change * 180) % 360
    
    # Calculate movement based on heading
    heading_rad = math.radians(asset.heading)
    
    if asset.asset_type == AssetType.DRONE:
        move_distance = random.uniform(0.01, 0.03)  # Fast movement
        asset.speed = random.uniform(100, 180)  # km/h combat speed
        asset.altitude = random.uniform(500, 2000) + random.uniform(-100, 100)
        asset.battery_level = max(15, asset.battery_level - random.randint(1, 3))
    elif asset.asset_type == AssetType.SOLDIER:
        move_distance = random.uniform(0.001, 0.005)  # Running/taking cover
        asset.speed = random.uniform(5, 12)  # km/h running
        
        # Combat stress biometrics
        asset.heart_rate = random.randint(120, 160)
        if random.random() < 0.1:  # 10% chance of spike
            asset.heart_rate = random.randint(160, 180)
        
        asset.spo2 = random.randint(92, 97)  # Lower due to exertion
        if random.random() < 0.05:
            asset.spo2 = random.randint(88, 92)  # Occasional dip
        
        asset.stress_level = "HIGH"
        asset.battery_level = max(20, asset.battery_level - random.randint(0, 2))
        
        # Occasional ammo alerts
        if random.random() < 0.15:
            asset.ammo_status = random.choice(["LOW", "CRITICAL", "NORMAL"])
            if asset.ammo_status in ["LOW", "CRITICAL"]:
                asset.last_alert = f"AMMO_{asset.ammo_status}"
        else:
            asset.last_alert = None
    else:  # Vehicle
        move_distance = random.uniform(0.005, 0.015)
        asset.speed = random.uniform(30, 60)  # km/h
        asset.fuel_level = max(10, asset.fuel_level - random.randint(1, 4))
    
    # Apply movement
    asset.latitude += move_distance * math.cos(heading_rad)
    asset.longitude += move_distance * math.sin(heading_rad)
    
    # Keep within combat zone bounds
    zone = ZONES[OperationalStatus.COMBAT]
    center_lat, center_lon = zone["center"]
    max_distance = 0.3  # degrees
    
    if abs(asset.latitude - center_lat) > max_distance:
        asset.latitude = center_lat + (max_distance if asset.latitude > center_lat else -max_distance)
        asset.heading = (asset.heading + 180) % 360
    if abs(asset.longitude - center_lon) > max_distance:
        asset.longitude = center_lon + (max_distance if asset.longitude > center_lon else -max_distance)
        asset.heading = (asset.heading + 180) % 360


UPDATE_FUNCTIONS = {
    OperationalStatus.IDLE: update_idle_asset,
    OperationalStatus.PATROL: update_patrol_asset,
    OperationalStatus.COMBAT: update_combat_asset,
}


# =============================================================================
# TSK INVENTORY GENERATION
# =============================================================================

def generate_tsk_inventory() -> List[SimulatedAsset]:
    """Generate the full TSK asset inventory."""
    assets = []
    
    # Drone Squadrons
    squadrons = [
        ("341.Filo", ["Akıncı", "TB2"], 12),
        ("342.Filo", ["TB2", "ANKA-S"], 15),
        ("343.Filo", ["TB2"], 10),
        ("344.Filo", ["ANKA-S", "TB2"], 14),
        ("345.Filo", ["Akıncı", "ANKA-S"], 11),
    ]
    
    for squad_name, variants, size in squadrons:
        for i in range(1, size + 1):
            variant = random.choice(variants)
            status = random.choices(
                [OperationalStatus.IDLE, OperationalStatus.PATROL, OperationalStatus.COMBAT],
                weights=[0.3, 0.4, 0.3]
            )[0]
            zone = ZONES[status]
            center_lat, center_lon = zone["center"]
            
            assets.append(SimulatedAsset(
                id=f"{squad_name}-{variant}-{i:02d}",
                name=f"{variant} #{i}",
                asset_type=AssetType.DRONE,
                variant=variant,
                status=status,
                alignment=Alignment.FRIEND,
                latitude=center_lat + random.uniform(-0.1, 0.1),
                longitude=center_lon + random.uniform(-0.1, 0.1),
                altitude=random.uniform(500, 2000) if status != OperationalStatus.IDLE else 0,
                heading=random.uniform(0, 360),
                battery_level=random.randint(60, 100),
            ))
    
    # Infantry Units
    infantry = [
        ("OKK-Alpha", "Bordo Bereli", 22),
        ("OKK-Bravo", "Bordo Bereli", 20),
        ("JÖH-Mardin", "JÖH", 25),
        ("JÖH-Şırnak", "JÖH", 24),
        ("JÖH-Hakkari", "JÖH", 23),
        ("Komando-1Tb", "Dağ Komando", 21),
        ("Komando-2Tb", "Amfibi", 20),
        ("Komando-3Tb", "SAT", 18),
        ("Komando-4Tb", "SAS", 19),
        ("Komando-5Tb", "MAK", 22),
    ]
    
    for unit_name, variant, size in infantry:
        for i in range(1, size + 1):
            status = random.choices(
                [OperationalStatus.IDLE, OperationalStatus.PATROL, OperationalStatus.COMBAT],
                weights=[0.3, 0.4, 0.3]
            )[0]
            zone = ZONES[status]
            center_lat, center_lon = zone["center"]
            
            assets.append(SimulatedAsset(
                id=f"{unit_name}-{i:02d}",
                name=f"{variant} Personel #{i}",
                asset_type=AssetType.SOLDIER,
                variant=variant,
                status=status,
                alignment=Alignment.FRIEND,
                latitude=center_lat + random.uniform(-0.15, 0.15),
                longitude=center_lon + random.uniform(-0.15, 0.15),
                altitude=random.uniform(0, 100),
                heart_rate=70 if status == OperationalStatus.IDLE else random.randint(90, 140),
                spo2=random.randint(95, 99),
                battery_level=random.randint(50, 100),
            ))
    
    # Armored Units
    armor = [
        ("1ZPT", ["Altay Tank", "M60T"], 8),
        ("2ZPT", ["Altay Tank", "Leopard 2A4"], 10),
        ("3Mek", ["Kirpi II", "Kobra II"], 12),
        ("4Mek", ["Kirpi II", "Ejder"], 9),
        ("Topcu", ["Fırtına Obüs", "T-155"], 6),
    ]
    
    for unit_name, variants, size in armor:
        for i in range(1, size + 1):
            variant = random.choice(variants)
            status = random.choices(
                [OperationalStatus.IDLE, OperationalStatus.PATROL, OperationalStatus.COMBAT],
                weights=[0.3, 0.4, 0.3]
            )[0]
            zone = ZONES[status]
            center_lat, center_lon = zone["center"]
            
            assets.append(SimulatedAsset(
                id=f"{unit_name}-{variant.replace(' ', '-')}-{i:02d}",
                name=f"{variant} #{i}",
                asset_type=AssetType.VEHICLE,
                variant=variant,
                status=status,
                alignment=Alignment.FRIEND,
                latitude=center_lat + random.uniform(-0.12, 0.12),
                longitude=center_lon + random.uniform(-0.12, 0.12),
                altitude=random.uniform(0, 50),
                heading=random.uniform(0, 360),
                fuel_level=random.randint(50, 100),
            ))
    
    return assets


# =============================================================================
# SIMULATION ENGINE
# =============================================================================

class WargameSimulator:
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
        }
    
    def initialize(self):
        """Initialize the simulation with TSK inventory."""
        print("🎖️  Initializing TSK Wargame Simulation...")
        self.assets = generate_tsk_inventory()
        
        # Count by status
        status_counts = {}
        for asset in self.assets:
            status_counts[asset.status.value] = status_counts.get(asset.status.value, 0) + 1
        
        print(f"\n📊 Asset Distribution:")
        print(f"   Total Assets: {len(self.assets)}")
        for status, count in status_counts.items():
            print(f"   {status}: {count}")
        
        # Count by type
        type_counts = {}
        for asset in self.assets:
            type_counts[asset.asset_type.value] = type_counts.get(asset.asset_type.value, 0) + 1
        
        print(f"\n🎯 Asset Types:")
        for atype, count in type_counts.items():
            print(f"   {atype.upper()}: {count}")
    
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
                    text = await response.text()
                    if self.stats["errors"] <= 5:  # Limit error spam
                        print(f"⚠️  Error sending {asset.id}: {response.status} - {text[:100]}")
        except Exception as e:
            self.stats["errors"] += 1
            if self.stats["errors"] <= 5:
                print(f"❌ Connection error for {asset.id}: {e}")
    
    async def send_batch_telemetry(self, session: aiohttp.ClientSession):
        """Send all telemetry as a batch (more efficient)."""
        messages = [asset.to_telemetry_message() for asset in self.assets]
        batch_url = self.backend_url + "/batch"
        
        try:
            async with session.post(batch_url, json=messages) as response:
                if response.status == 200:
                    self.stats["messages_sent"] += len(messages)
                else:
                    # Fallback to individual sends
                    self.stats["errors"] += 1
                    print(f"⚠️  Batch send failed ({response.status}), falling back to individual sends...")
                    tasks = [self.send_telemetry(session, asset) for asset in self.assets]
                    await asyncio.gather(*tasks)
        except Exception as e:
            self.stats["errors"] += 1
            print(f"❌ Batch connection error: {e}")
            # Fallback to individual sends
            tasks = [self.send_telemetry(session, asset) for asset in self.assets]
            await asyncio.gather(*tasks)
    
    async def run_simulation_loop(self):
        """Main simulation loop."""
        self.running = True
        self.stats["start_time"] = datetime.now()
        
        connector = aiohttp.TCPConnector(limit=50)  # Connection pool
        timeout = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            cycle = 0
            while self.running:
                cycle += 1
                cycle_start = datetime.now()
                
                # Update all asset states
                await self.update_assets()
                
                # Send telemetry (batch mode)
                await self.send_batch_telemetry(session)
                
                # Print status
                elapsed = (datetime.now() - self.stats["start_time"]).total_seconds()
                rate = self.stats["messages_sent"] / elapsed if elapsed > 0 else 0
                
                print(f"\r🔄 Cycle {cycle:04d} | "
                      f"Sent: {self.stats['messages_sent']:,} | "
                      f"Errors: {self.stats['errors']} | "
                      f"Rate: {rate:.1f} msg/s | "
                      f"Elapsed: {elapsed:.0f}s", end="", flush=True)
                
                # Wait for next cycle
                cycle_duration = (datetime.now() - cycle_start).total_seconds()
                sleep_time = max(0, self.interval - cycle_duration)
                await asyncio.sleep(sleep_time)
        
        print("\n\n🛑 Simulation stopped.")
    
    def stop(self):
        """Stop the simulation."""
        self.running = False


# =============================================================================
# MAIN
# =============================================================================

async def main():
    parser = argparse.ArgumentParser(description="TSK Wargame Simulation Engine")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL,
                        help=f"Update interval in seconds (default: {DEFAULT_INTERVAL})")
    parser.add_argument("--backend", type=str, default=DEFAULT_BACKEND_URL,
                        help=f"Backend API URL (default: {DEFAULT_BACKEND_URL})")
    args = parser.parse_args()
    
    print("=" * 70)
    print("🎖️  TSK WARGAME SIMULATION ENGINE")
    print("=" * 70)
    print(f"Backend URL: {args.backend}")
    print(f"Update Interval: {args.interval}s")
    print("=" * 70)
    
    simulator = WargameSimulator(args.backend, args.interval)
    simulator.initialize()
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("\n\n⏹️  Stopping simulation...")
        simulator.stop()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n" + "=" * 70)
    print("🚀 Starting simulation... (Press Ctrl+C to stop)")
    print("=" * 70 + "\n")
    
    await simulator.run_simulation_loop()
    
    # Final stats
    print("\n📊 Final Statistics:")
    print(f"   Total Messages Sent: {simulator.stats['messages_sent']:,}")
    print(f"   Total Errors: {simulator.stats['errors']}")
    if simulator.stats["start_time"]:
        elapsed = (datetime.now() - simulator.stats["start_time"]).total_seconds()
        print(f"   Total Runtime: {elapsed:.1f}s")
        print(f"   Average Rate: {simulator.stats['messages_sent']/elapsed:.1f} msg/s")


if __name__ == "__main__":
    asyncio.run(main())
