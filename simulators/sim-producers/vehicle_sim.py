"""
================================================================================
                    C4ISR VEHICLE SIMULATOR - FULL SPECTRUM
================================================================================
    SINAPS GROUND VEHICLE TELEMETRY GENERATOR
    
    Simulates ground vehicle telemetry including tanks, APCs, trucks, and HMMWVs.
    Supports both:
    - Live MQTT streaming for real-time testing
    - Training data generation for AI fine-tuning
    
================================================================================
"""

import json, time, math, argparse, random, datetime, pathlib
import paho.mqtt.client as mqtt

try:
    import yaml
except Exception:
    yaml = None

# Import simulation utilities
try:
    from sim_utils import (
        EntityType, ScenarioCategory, ScenarioLibrary,
        GroundTruthGenerator, NoiseInjector,
        random_value_in_range, generate_source_id, generate_timestamp
    )
except ImportError:
    import sys
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from sim_utils import (
        EntityType, ScenarioCategory, ScenarioLibrary,
        GroundTruthGenerator, NoiseInjector,
        random_value_in_range, generate_source_id, generate_timestamp
    )


def now_iso():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()

def offset_latlon(lat, lon, north_m, east_m):
    dlat = north_m / 111_320.0
    dlon = east_m / (40075000.0 * math.cos(math.radians(lat)) / 360.0)
    return lat + dlat, lon + dlon


class VehicleSim:
    """
    Ground vehicle telemetry simulator.
    
    Supports vehicle types: TANK, APC, MRAP, HMWWV, TRUCK
    
    Modes:
    - Live streaming: Connect to MQTT and publish telemetry
    - Training data generation: Generate labeled samples for AI training
    """
    
    # Vehicle types
    VEHICLE_TYPES = ["TANK", "APC", "MRAP", "HMWWV", "TRUCK", "LAV", "IFV"]
    
    # Engine states
    ENGINE_STATES = ["RUN", "IDLE", "OFF", "DAMAGED", "FIRE"]
    
    # Base configuration defaults
    DEFAULT_CONFIG = {
        "start_lat": 39.9300,
        "start_lon": 32.8500,
        "start_alt_m": 900.0,
        "speed_kph": 45.0
    }
    
    def __init__(self, cfg):
        b = cfg.get("broker", {}); v = cfg.get("vehicle", {})
        self.topic = v.get("topic", "vehicle/events")
        self.vehicle_id = v.get("id", v.get("vehicle_id", "vehicle1"))
        self.dt = 1.0 / float(v.get("rate_hz", 1.0))
        
        # Position and movement
        self.lat = float(v.get("start_lat", self.DEFAULT_CONFIG["start_lat"]))
        self.lon = float(v.get("start_lon", self.DEFAULT_CONFIG["start_lon"]))
        self.alt = float(v.get("start_alt_m", self.DEFAULT_CONFIG["start_alt_m"]))
        self.speed = float(v.get("speed_kph", self.DEFAULT_CONFIG["speed_kph"]))
        self.heading = random.uniform(0, 360)
        
        # Vehicle status
        self.vehicle_type = v.get("type", random.choice(self.VEHICLE_TYPES))
        self.fuel_pct = 95.0
        self.engine_state = "RUN"
        self.engine_temp_c = 85.0
        self.health_pct = 100.0
        self.orientation = "NORMAL"
        
        # State tracking
        self.alignment = "FRIEND"
        self.current_scenario = None
        
        # Noise injector
        self.noise_injector = NoiseInjector()
        
        # MQTT setup (only if broker config provided)
        self.client = None
        self.host = b.get("host", "localhost")
        self.port = int(b.get("port", 1883))
        
        if b.get("host"):
            print(f"[VehicleSim] ID={self.vehicle_id} Type={self.vehicle_type} Target={self.host}:{self.port} Topic={self.topic}")
            self.client = mqtt.Client(client_id=f"sim-{self.vehicle_id}", clean_session=True)
            if b.get("user"):
                self.client.username_pw_set(b["user"], b.get("pass", ""))
            if b.get("tls"):
                import ssl
                self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): 
        print(f"[VehicleSim] MQTT connected rc={rc}")
    
    def _on_disconnect(self, c, u, rc): 
        print(f"[VehicleSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        if not self.client:
            return
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[VehicleSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait)
                wait = min(max_wait, wait * 2)

    def _pub(self, obj, qos=1):
        if self.client:
            self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def _apply_scenario_physics(self, scenario_name: str):
        """Apply scenario physics to internal state."""
        scenario = ScenarioLibrary.get_scenario(EntityType.VEHICLE, scenario_name)
        if not scenario:
            return
        
        self.current_scenario = scenario_name
        
        # Apply telemetry from scenario
        telemetry_config = scenario.get("telemetry", {})
        
        speed_range = telemetry_config.get("speed_kph", (30, 50))
        self.speed = round(random_value_in_range(speed_range), 1)
        
        fuel_range = telemetry_config.get("fuel_pct", (50, 90))
        self.fuel_pct = round(random_value_in_range(fuel_range), 1)
        
        temp_range = telemetry_config.get("engine_temp_c", (80, 100))
        self.engine_temp_c = round(random_value_in_range(temp_range), 1)
        
        health_range = telemetry_config.get("health_pct", (80, 100))
        self.health_pct = round(random_value_in_range(health_range), 1)
        
        self.engine_state = telemetry_config.get("engine_state", "RUN")
        
        # Special orientation handling for rollover scenarios
        if "orientation" in telemetry_config:
            self.orientation = telemetry_config["orientation"]
        else:
            self.orientation = "NORMAL"

    def telemetry(self) -> dict:
        """Generate telemetry message in MQTT format."""
        # Alignment based on ID
        is_foe = "enemy" in self.vehicle_id.lower() or "foe" in self.vehicle_id.lower()
        alignment = "FOE" if is_foe else "FRIEND"
        threat = random.randint(50, 95) if is_foe else 0
        
        return {
            "domain": "vehicle",
            "type": "telemetry",
            "id": self.vehicle_id,
            "time": now_iso(),
            "payload": {
                "id": self.vehicle_id,
                "time": now_iso(),
                "type": self.vehicle_type,
                "position": {
                    "lat": round(self.lat, 7),
                    "lon": round(self.lon, 7),
                    "alt_m": round(self.alt, 1)
                },
                "heading_deg": round(self.heading % 360, 1),
                "speed_kph": round(self.speed, 1),
                "engine": self.engine_state,
                "engine_temp_c": round(self.engine_temp_c, 1),
                "fuel_pct": round(self.fuel_pct, 1),
                "health_pct": round(self.health_pct, 1),
                "alignment": alignment,
                "threat_level": threat
            }
        }

    def generate_telemetry_for_ai(self) -> dict:
        """
        Generate telemetry in the format expected by the AI service.
        This is the format used for training data.
        """
        return {
            "type": "vehicle",
            "source_id": self.vehicle_id,
            "timestamp": now_iso(),
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": round(self.alt, 1),
            "speed": round(self.speed, 1),
            "fuel_pct": round(self.fuel_pct, 1),
            "vehicle_type": self.vehicle_type,
            "engine_state": self.engine_state,
            "engine_temp_c": round(self.engine_temp_c, 1),
            "health_pct": round(self.health_pct, 1),
            "heading": round(self.heading % 360, 1),
            "orientation": self.orientation
        }

    def generate_training_data(self, scenario_name: str, apply_noise: bool = True) -> tuple:
        """
        Generate a single training sample for AI fine-tuning.
        
        Args:
            scenario_name: Name of the scenario to simulate
            apply_noise: Whether to apply realistic sensor noise
            
        Returns:
            Tuple of (telemetry_dict, label_dict)
        """
        # 1. Apply scenario physics
        self._apply_scenario_physics(scenario_name)
        
        # 2. Randomize position slightly
        self.lat = self.DEFAULT_CONFIG["start_lat"] + random.uniform(-0.02, 0.02)
        self.lon = self.DEFAULT_CONFIG["start_lon"] + random.uniform(-0.02, 0.02)
        
        # 3. Random heading
        self.heading = random.uniform(0, 360)
        
        # 4. Generate unique source ID for variety
        self.vehicle_id = generate_source_id(EntityType.VEHICLE)
        
        # 5. Random vehicle type (or keep from scenario)
        self.vehicle_type = random.choice(self.VEHICLE_TYPES)
        
        # 6. Generate telemetry
        telemetry = self.generate_telemetry_for_ai()
        
        # 7. Apply noise if requested
        if apply_noise:
            telemetry = self.noise_injector.inject_noise(telemetry, EntityType.VEHICLE)
        
        # 8. Generate ground truth label
        label = GroundTruthGenerator.get_label(EntityType.VEHICLE, scenario_name, telemetry)
        
        return telemetry, label

    def step(self, t):
        """Advance simulation by one time step."""
        # Movement pattern (square patrol route)
        speed_mps = (self.speed * 1000) / 3600
        radius = 500.0
        omega = speed_mps / radius
        ang = omega * t
        north = radius * math.cos(ang) * self.dt * 0.5  # Slower than drones
        east = radius * math.sin(ang) * self.dt * 0.5
        
        self.lat, self.lon = offset_latlon(self.lat, self.lon, north, east)
        self.heading = (math.degrees(ang) + 90) % 360
        
        # Fuel consumption
        fuel_burn_rate = 0.005  # per second
        if self.current_scenario:
            scenario = ScenarioLibrary.get_scenario(EntityType.VEHICLE, self.current_scenario)
            if scenario:
                fuel_burn_rate *= scenario.get("fuel_drop_rate", 1.0)
        
        self.fuel_pct = max(1.0, self.fuel_pct - (self.dt * fuel_burn_rate))
        
        # Engine behavior based on fuel
        if self.fuel_pct < 5.0:
            self.engine_state = "IDLE"
        
        # Engine temp variation
        self.engine_temp_c += random.uniform(-0.5, 0.5)
        self.engine_temp_c = max(60, min(150, self.engine_temp_c))

    def run(self, duration=None):
        """Run live MQTT streaming."""
        if not self.client:
            print("[VehicleSim] No MQTT client configured. Use generate_training_data() instead.")
            return
            
        self.connect_with_backoff()
        t = 0.0
        try:
            while True:
                self.step(t)
                self._pub(self.telemetry())
                self.client.loop(timeout=0.1)
                time.sleep(self.dt)
                t += self.dt
                if duration and t >= duration:
                    break
        except KeyboardInterrupt:
            pass
        finally:
            self.client.loop(1.0)
            self.client.disconnect()
            print("[VehicleSim] stopped.")


# ============================================================================
#                           CLI SUPPORT
# ============================================================================

def load_cfg(path, args):
    if path and pathlib.Path(path).exists() and yaml:
        with open(path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
    else:
        cfg = {
            "broker": {
                "host": args.host,
                "port": args.port,
                "user": args.user,
                "pass": args.password,
                "tls": args.tls,
                "cafile": args.cafile
            },
            "vehicle": {
                "id": args.id,
                "rate_hz": args.rate,
                "start_lat": args.lat,
                "start_lon": args.lon,
                "start_alt_m": args.alt,
                "speed_kph": args.speed,
                "topic": args.topic,
                "type": args.vehicle_type
            }
        }
    return cfg

def parse_args():
    ap = argparse.ArgumentParser(description="C4ISR Vehicle Simulator")
    ap.add_argument("--config", "-c", default="sim-producers/vehicle_sim.yaml")
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--user", default="admin")
    ap.add_argument("--password", default="password")
    ap.add_argument("--tls", action="store_true")
    ap.add_argument("--cafile", default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id", default="vehicle1")
    ap.add_argument("--rate", type=float, default=1.0)
    ap.add_argument("--lat", type=float, default=39.9300)
    ap.add_argument("--lon", type=float, default=32.8500)
    ap.add_argument("--alt", type=float, default=900.0)
    ap.add_argument("--speed", type=float, default=45.0)
    ap.add_argument("--topic", default="vehicle/events")
    ap.add_argument("--duration", type=float, default=None)
    ap.add_argument("--vehicle-type", default="APC", 
                    choices=VehicleSim.VEHICLE_TYPES,
                    help="Type of vehicle to simulate")
    
    # Training data mode
    ap.add_argument("--training-mode", action="store_true",
                    help="Generate training samples instead of streaming")
    ap.add_argument("--scenario", default="CONVOY_MODE",
                    help="Scenario to simulate for training data")
    ap.add_argument("--samples", type=int, default=10,
                    help="Number of training samples to generate")
    
    return ap.parse_args()


if __name__ == "__main__":
    args = parse_args()
    cfg = load_cfg(args.config, args)
    
    sim = VehicleSim(cfg)
    
    if args.training_mode:
        # Training data generation mode
        print(f"[VehicleSim] Generating {args.samples} training samples for scenario: {args.scenario}")
        for i in range(args.samples):
            telemetry, label = sim.generate_training_data(args.scenario)
            print(json.dumps({"telemetry": telemetry, "label": label}, indent=2))
    else:
        # Live streaming mode
        sim.run(args.duration)
