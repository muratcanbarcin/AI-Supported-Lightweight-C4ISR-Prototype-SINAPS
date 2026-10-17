"""
================================================================================
                    C4ISR DRONE (UAV) SIMULATOR - FULL SPECTRUM
================================================================================
    SINAPS UAV TELEMETRY GENERATOR
    
    Simulates drone flight telemetry including position, speed, battery, and mode.
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


class DroneSim:
    """
    Drone/UAV telemetry simulator.
    
    Modes:
    - Live streaming: Connect to MQTT and publish telemetry
    - Training data generation: Generate labeled samples for AI training
    """
    
    # Valid flight modes
    FLIGHT_MODES = ["AUTO", "MANUAL", "LOITER", "RTH", "GUIDED", "LAND", "EMERGENCY", "LOST_LINK", "FORCED_LAND"]
    
    # Base configuration defaults
    DEFAULT_CONFIG = {
        "start_lat": 39.9260,
        "start_lon": 32.8420,
        "start_alt_m": 120.0,
        "speed_mps": 14.0
    }
    
    def __init__(self, cfg):
        b = cfg.get("broker", {}); u = cfg.get("uav", cfg.get("drone", {}))
        self.topic = u.get("topic", "drone/events")
        self.drone_id = u.get("id", u.get("drone_id", "drone1"))
        self.dt = 1.0 / float(u.get("rate_hz", 2.0))
        
        # Position and flight parameters
        self.lat = float(u.get("start_lat", self.DEFAULT_CONFIG["start_lat"]))
        self.lon = float(u.get("start_lon", self.DEFAULT_CONFIG["start_lon"]))
        self.alt = float(u.get("start_alt_m", self.DEFAULT_CONFIG["start_alt_m"]))
        self.speed = float(u.get("speed_mps", self.DEFAULT_CONFIG["speed_mps"]))
        self.heading = random.uniform(0, 360)
        
        # Status
        self.mode = "AUTO"
        self.battery_pct = 80.0
        self.signal_strength = 95.0
        self.gps_fix = True
        
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
            print(f"[DroneSim] ID={self.drone_id} Target={self.host}:{self.port} Topic={self.topic}")
            self.client = mqtt.Client(client_id=f"sim-{self.drone_id}", clean_session=True)
            if b.get("user"):
                self.client.username_pw_set(b["user"], b.get("pass", ""))
            if b.get("tls"):
                import ssl
                self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): 
        print(f"[DroneSim] MQTT connected rc={rc}")
    
    def _on_disconnect(self, c, u, rc): 
        print(f"[DroneSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        if not self.client:
            return
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[DroneSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait)
                wait = min(max_wait, wait * 2)

    def _pub(self, obj, qos=1):
        if self.client:
            self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def _apply_scenario_physics(self, scenario_name: str):
        """Apply scenario physics to internal state."""
        scenario = ScenarioLibrary.get_scenario(EntityType.DRONE, scenario_name)
        if not scenario:
            return
        
        self.current_scenario = scenario_name
        
        # Apply telemetry from scenario
        telemetry_config = scenario.get("telemetry", {})
        
        alt_range = telemetry_config.get("altitude_m", (80, 150))
        self.alt = round(random_value_in_range(alt_range), 1)
        
        speed_range = telemetry_config.get("speed_mps", (10, 18))
        self.speed = round(random_value_in_range(speed_range), 2)
        
        battery_range = telemetry_config.get("battery_pct", (40, 90))
        self.battery_pct = round(random_value_in_range(battery_range), 1)
        
        self.mode = telemetry_config.get("mode", "AUTO")
        
        # Optional fields
        if "signal_strength_pct" in telemetry_config:
            sig_range = telemetry_config["signal_strength_pct"]
            self.signal_strength = round(random_value_in_range(sig_range), 1)
        else:
            self.signal_strength = round(random.uniform(70, 100), 1)

    def telemetry(self) -> dict:
        """Generate telemetry message in MQTT format."""
        return {
            "domain": "drone",
            "type": "telemetry",
            "id": self.drone_id,
            "time": now_iso(),
            "payload": {
                "position": {
                    "lat": round(self.lat, 7),
                    "lon": round(self.lon, 7),
                    "alt_m": round(self.alt, 1)
                },
                "yaw_deg": round(self.heading % 360, 1),
                "ground_speed_mps": round(self.speed, 2),
                "mode": self.mode,
                "battery": {"soc_pct": round(self.battery_pct, 1)},
                "signal_strength_pct": round(self.signal_strength, 1),
                "alignment": self.alignment,
                "threat_level": 0 if self.alignment == "FRIEND" else random.randint(30, 90)
            }
        }

    def generate_telemetry_for_ai(self) -> dict:
        """
        Generate telemetry in the format expected by the AI service.
        This is the format used for training data.
        """
        return {
            "type": "drone",
            "source_id": self.drone_id,
            "timestamp": now_iso(),
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": round(self.alt, 1),
            "speed": round(self.speed, 2),
            "battery_level": round(self.battery_pct, 1),
            "mode": self.mode,
            "heading": round(self.heading % 360, 1),
            "signal_strength": round(self.signal_strength, 1),
            "gps_fix": self.gps_fix
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
        self.drone_id = generate_source_id(EntityType.DRONE)
        
        # 5. Scenario-specific adjustments
        scenario = ScenarioLibrary.get_scenario(EntityType.DRONE, scenario_name)
        if scenario:
            # Handle special scenario flags
            if scenario.get("gps_jump_detected"):
                self.gps_fix = False
                # Add GPS jump simulation
                self.lat += random.uniform(-0.005, 0.005)
                self.lon += random.uniform(-0.005, 0.005)
            else:
                self.gps_fix = True
        
        # 6. Generate telemetry
        telemetry = self.generate_telemetry_for_ai()
        
        # 7. Apply noise if requested
        if apply_noise:
            telemetry = self.noise_injector.inject_noise(telemetry, EntityType.DRONE)
        
        # 8. Generate ground truth label
        label = GroundTruthGenerator.get_label(EntityType.DRONE, scenario_name, telemetry)
        
        return telemetry, label

    def maybe_detection(self):
        """Simulate target detection (for ISR missions)."""
        if random.random() < 0.10:
            return {
                "domain": "drone",
                "type": "detection",
                "id": f"{self.drone_id}-eo",
                "time": now_iso(),
                "payload": {
                    "sensor_id": f"{self.drone_id}-eo",
                    "target_type": random.choice(["UAS", "VEHICLE", "PERSONNEL"]),
                    "position": {
                        "lat": self.lat + random.uniform(-0.0006, 0.0006),
                        "lon": self.lon + random.uniform(-0.0006, 0.0006),
                        "alt_m": round(self.alt + random.uniform(-10, 10), 1)
                    },
                    "velocity_mps": round(self.speed + random.uniform(-2, 2), 1),
                    "heading_deg": round((self.heading + random.uniform(-5, 5)) % 360, 1),
                    "confidence_pct": round(random.uniform(0.7, 0.95), 2)
                }
            }
        return None

    def maybe_alert(self):
        """Generate battery warning alert when low."""
        if 18.0 < self.battery_pct < 20.0 and not getattr(self, "_alerted", False):
            self._alerted = True
            return {
                "domain": "drone",
                "type": "alert",
                "id": f"al-{self.drone_id}-lowbat",
                "time": now_iso(),
                "payload": {
                    "severity": "WARNING",
                    "title": "Low Battery",
                    "category": "POWER",
                    "description": f"Battery at {self.battery_pct:.1f}%",
                    "related": {"uav_id": self.drone_id}
                }
            }
        return None

    def step(self, t):
        """Advance simulation by one time step."""
        # Circular flight pattern
        radius = 250.0
        omega = self.speed / radius
        ang = omega * t
        north = radius * math.cos(ang) * self.dt
        east = radius * math.sin(ang) * self.dt
        
        self.lat, self.lon = offset_latlon(self.lat, self.lon, north, east)
        self.heading = (math.degrees(ang) + 90) % 360
        
        # Battery drain
        drain_rate = 0.02  # per second
        if self.current_scenario:
            scenario = ScenarioLibrary.get_scenario(EntityType.DRONE, self.current_scenario)
            if scenario:
                drain_rate *= scenario.get("battery_drain_multiplier", 1.0)
        
        self.battery_pct = max(5.0, self.battery_pct - (self.dt * drain_rate))

    def run(self, duration=None):
        """Run live MQTT streaming."""
        if not self.client:
            print("[DroneSim] No MQTT client configured. Use generate_training_data() instead.")
            return
            
        print(f"[DroneSim] publishing to mqtt://{self.host}:{self.port} topic={self.topic} id={self.drone_id}")
        self.connect_with_backoff()
        t = 0.0
        try:
            while True:
                self.step(t)
                telemetry_data = self.telemetry()
                print(f"[DEBUG] ID={self.drone_id} Alt={self.alt:.1f}m Battery={self.battery_pct:.1f}% Mode={self.mode}")
                self._pub(telemetry_data)
                
                det = self.maybe_detection()
                if det:
                    self._pub(det)
                    
                al = self.maybe_alert()
                if al:
                    self._pub(al)
                    
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
            print("[DroneSim] stopped.")


# Alias for backward compatibility
UAVSim = DroneSim


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
            "uav": {
                "id": args.id,
                "rate_hz": args.rate,
                "start_lat": args.lat,
                "start_lon": args.lon,
                "start_alt_m": args.alt,
                "speed_mps": args.speed,
                "topic": args.topic
            }
        }
    return cfg

def parse_args():
    ap = argparse.ArgumentParser(description="C4ISR Drone/UAV Simulator")
    ap.add_argument("--config", "-c", default="sim-producers/uav_sim.yaml")
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--user", default=os.environ.get("MQTT_USER", ""))
    ap.add_argument("--password", default=os.environ.get("MQTT_PASSWORD", ""))
    ap.add_argument("--tls", action="store_true")
    ap.add_argument("--cafile", default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id", default="drone1")
    ap.add_argument("--rate", type=float, default=2.0)
    ap.add_argument("--lat", type=float, default=39.9260)
    ap.add_argument("--lon", type=float, default=32.8420)
    ap.add_argument("--alt", type=float, default=120.0)
    ap.add_argument("--speed", type=float, default=14.0)
    ap.add_argument("--topic", default="drone/events")
    ap.add_argument("--duration", type=float, default=None)
    
    # Training data mode
    ap.add_argument("--training-mode", action="store_true",
                    help="Generate training samples instead of streaming")
    ap.add_argument("--scenario", default="WAYPOINT_MISSION",
                    help="Scenario to simulate for training data")
    ap.add_argument("--samples", type=int, default=10,
                    help="Number of training samples to generate")
    
    return ap.parse_args()


if __name__ == "__main__":
    args = parse_args()
    cfg = load_cfg(args.config, args)
    
    sim = DroneSim(cfg)
    
    if args.training_mode:
        # Training data generation mode
        print(f"[DroneSim] Generating {args.samples} training samples for scenario: {args.scenario}")
        for i in range(args.samples):
            telemetry, label = sim.generate_training_data(args.scenario)
            print(json.dumps({"telemetry": telemetry, "label": label}, indent=2))
    else:
        # Live streaming mode
        sim.run(args.duration)
