"""
================================================================================
                    C4ISR SOLDIER SIMULATOR - FULL SPECTRUM
================================================================================
    SINAPS SOLDIER TELEMETRY GENERATOR
    
    Simulates smartwatch/biometric sensor data from dismounted personnel.
    Supports both:
    - Live MQTT streaming for real-time testing
    - Training data generation for AI fine-tuning
    
================================================================================
"""

import json, os, time, math, argparse, random, datetime, pathlib
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
    # Fallback for when running from different directory
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


class SoldierSim:
    """
    Soldier biometric and position simulator.
    
    Modes:
    - Live streaming: Connect to MQTT and publish telemetry
    - Training data generation: Generate labeled samples for AI training
    """
    
    # Base configuration defaults
    DEFAULT_CONFIG = {
        "start_lat": 39.9280,
        "start_lon": 32.8480,
        "start_alt_m": 900.0,
        "speed_kph": 5.0,
        "unit_id": "alpha-team"
    }
    
    def __init__(self, cfg):
        b = cfg.get("broker", {}); s = cfg.get("soldier", {})
        self.topic = s.get("topic", "watch/events")
        self.soldier_id = s.get("soldier_id", "soldier1")
        self.unit_id = s.get("unit_id", self.DEFAULT_CONFIG["unit_id"])
        self.dt = 1.0 / float(s.get("rate_hz", 1.0))
        
        # Position and movement
        self.lat = float(s.get("start_lat", self.DEFAULT_CONFIG["start_lat"]))
        self.lon = float(s.get("start_lon", self.DEFAULT_CONFIG["start_lon"]))
        self.alt = float(s.get("start_alt_m", self.DEFAULT_CONFIG["start_alt_m"]))
        self.speed = float(s.get("speed_kph", self.DEFAULT_CONFIG["speed_kph"]))
        self.heading = random.uniform(0, 360)
        
        # Vitals - defaults for normal operation
        self.hr_bpm = 75
        self.spo2 = 98.0
        self.resp_bpm = 16.0
        self.skin_temp_c = 36.5
        self.stress_index = 0.15
        
        # State
        self.alignment = "FRIEND"
        self.status = "ACTIVE"
        self.current_scenario = None
        
        # Noise injector for training data
        self.noise_injector = NoiseInjector()
        
        # MQTT setup (only if broker config provided)
        self.client = None
        self.host = b.get("host", "localhost")
        self.port = int(b.get("port", 1883))
        
        if b.get("host"):
            print(f"[SoldierSim] ID={self.soldier_id} Target={self.host}:{self.port} Topic={self.topic}")
            self.client = mqtt.Client(client_id=f"sim-{self.soldier_id}", clean_session=True)
            if b.get("user"): 
                self.client.username_pw_set(b["user"], b.get("pass", ""))
            if b.get("tls"):
                import ssl
                self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): 
        print(f"[SoldierSim] MQTT connected rc={rc}")
    
    def _on_disconnect(self, c, u, rc): 
        print(f"[SoldierSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        if not self.client:
            return
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[SoldierSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait)
                wait = min(max_wait, wait * 2)

    def _pub(self, obj, qos=1):
        if self.client:
            self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def _apply_scenario_physics(self, scenario_name: str):
        """Apply scenario physics to internal state."""
        scenario = ScenarioLibrary.get_scenario(EntityType.SOLDIER, scenario_name)
        if not scenario:
            return
        
        self.current_scenario = scenario_name
        
        # Apply vitals from scenario
        vitals = scenario.get("vitals", {})
        self.hr_bpm = int(random_value_in_range(vitals.get("hr_bpm", (70, 80))))
        self.spo2 = round(random_value_in_range(vitals.get("spo2", (97, 99))), 1)
        self.resp_bpm = round(random_value_in_range(vitals.get("resp_bpm", (14, 18))), 1)
        self.skin_temp_c = round(random_value_in_range(vitals.get("skin_temp_c", (36, 37))), 1)
        self.stress_index = round(random_value_in_range(vitals.get("stress_index", (0.1, 0.3))), 2)
        
        # Apply speed from scenario
        speed_range = scenario.get("speed_kph", (3, 5))
        self.speed = round(random_value_in_range(speed_range), 1)

    def telemetry(self) -> dict:
        """Generate telemetry message in the expected format."""
        stress = max(0.0, min(1.0, (self.hr_bpm - 60) / 120.0))
        
        return {
            "domain": "watch",
            "type": "telemetry",
            "id": self.soldier_id,
            "time": now_iso(),
            "payload": {
                "soldier_id": self.soldier_id,
                "unit_id": self.unit_id,
                "collected_at": now_iso(),
                "position": {
                    "lat": round(self.lat, 7),
                    "lon": round(self.lon, 7),
                    "alt_m": round(self.alt, 1)
                },
                "vitals": {
                    "hr_bpm": self.hr_bpm,
                    "spo2_pct": self.spo2,
                    "resp_bpm": self.resp_bpm,
                    "skin_temp_c": self.skin_temp_c,
                    "stress_score": round(stress, 2)
                },
                "device": {
                    "device_id": f"dev-{self.soldier_id}",
                    "model": "SmartWatch-X1",
                    "battery_pct": round(random.uniform(40, 100), 1)
                },
                "alignment": self.alignment,
                "threat_level": 0
            }
        }

    def generate_telemetry_for_ai(self) -> dict:
        """
        Generate telemetry in the format expected by the AI service.
        This is the format used for training data.
        """
        return {
            "type": "soldier",
            "source_id": self.soldier_id,
            "timestamp": now_iso(),
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": round(self.alt, 1),
            "speed": round(self.speed, 2),
            "vitals": {
                "hr_bpm": self.hr_bpm,
                "spo2": self.spo2,
                "resp_bpm": self.resp_bpm,
                "skin_temp_c": self.skin_temp_c,
                "stress_index": self.stress_index
            },
            "status": self.status,
            "unit_id": self.unit_id,
            "callsign": self.soldier_id.upper()
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
        self.lat = self.DEFAULT_CONFIG["start_lat"] + random.uniform(-0.01, 0.01)
        self.lon = self.DEFAULT_CONFIG["start_lon"] + random.uniform(-0.01, 0.01)
        
        # 3. Generate unique source ID for variety
        self.soldier_id = generate_source_id(EntityType.SOLDIER)
        
        # 4. Generate telemetry
        telemetry = self.generate_telemetry_for_ai()
        
        # 5. Apply noise if requested
        if apply_noise:
            telemetry = self.noise_injector.inject_noise(telemetry, EntityType.SOLDIER)
        
        # 6. Generate ground truth label
        label = GroundTruthGenerator.get_label(EntityType.SOLDIER, scenario_name, telemetry)
        
        return telemetry, label

    def step(self, t):
        """Advance simulation by one time step."""
        # Movement simulation
        speed_mps = (self.speed * 1000) / 3600
        radius = 50.0
        omega = speed_mps / radius
        ang = omega * t
        north = radius * math.cos(ang) * self.dt
        east = radius * math.sin(ang) * self.dt
        
        self.lat, self.lon = offset_latlon(self.lat, self.lon, north, east)
        self.heading = (self.heading + random.uniform(-5, 5)) % 360
        
        # Vitals variation
        if not self.current_scenario:
            self.hr_bpm = max(50, min(200, self.hr_bpm + random.randint(-3, 3)))

    def run(self, duration=None):
        """Run live MQTT streaming."""
        if not self.client:
            print("[SoldierSim] No MQTT client configured. Use generate_training_data() instead.")
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
            print("[SoldierSim] stopped.")


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
            "soldier": {
                "soldier_id": args.id,
                "rate_hz": args.rate,
                "start_lat": args.lat,
                "start_lon": args.lon,
                "start_alt_m": args.alt,
                "speed_kph": args.speed,
                "topic": args.topic
            }
        }
    return cfg

def parse_args():
    ap = argparse.ArgumentParser(description="C4ISR Soldier Simulator")
    ap.add_argument("--config", "-c", default="sim-producers/soldier_sim.yaml")
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--user", default=os.environ.get("MQTT_USER", ""))
    ap.add_argument("--password", default=os.environ.get("MQTT_PASSWORD", ""))
    ap.add_argument("--tls", action="store_true")
    ap.add_argument("--cafile", default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id", default="soldier1")
    ap.add_argument("--rate", type=float, default=1.0)
    ap.add_argument("--lat", type=float, default=39.9280)
    ap.add_argument("--lon", type=float, default=32.8480)
    ap.add_argument("--alt", type=float, default=900.0)
    ap.add_argument("--speed", type=float, default=5.0)
    ap.add_argument("--topic", default="watch/events")
    ap.add_argument("--duration", type=float, default=None)
    
    # Training data mode
    ap.add_argument("--training-mode", action="store_true", 
                    help="Generate training samples instead of streaming")
    ap.add_argument("--scenario", default="ROUTINE_PATROL",
                    help="Scenario to simulate for training data")
    ap.add_argument("--samples", type=int, default=10,
                    help="Number of training samples to generate")
    
    return ap.parse_args()


if __name__ == "__main__":
    args = parse_args()
    cfg = load_cfg(args.config, args)
    
    sim = SoldierSim(cfg)
    
    if args.training_mode:
        # Training data generation mode
        print(f"[SoldierSim] Generating {args.samples} training samples for scenario: {args.scenario}")
        for i in range(args.samples):
            telemetry, label = sim.generate_training_data(args.scenario)
            print(json.dumps({"telemetry": telemetry, "label": label}, indent=2))
    else:
        # Live streaming mode
        sim.run(args.duration)