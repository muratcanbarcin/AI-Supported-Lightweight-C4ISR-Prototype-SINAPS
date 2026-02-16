#!/usr/bin/env python3
"""
===============================================================================
C4ISR MIDDLEWARE — EDGE AI / ANOMALY DETECTION PROCESSOR
===============================================================================
    ███╗   ███╗██╗██████╗ ██████╗ ██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗
    ████╗ ████║██║██╔══██╗██╔══██╗██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝
    ██╔████╔██║██║██║  ██║██║  ██║██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗
    ██║╚██╔╝██║██║██║  ██║██║  ██║██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝
    ██║ ╚═╝ ██║██║██████╔╝██████╔╝███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗
    ╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝

    Architecture:
        MQTT (c4isr/telemetry) ──▶ [Rule Engine] ──▶ [ML Model] ──▶ Route
                                         │                │
                                    CRITICAL           SUSPICIOUS
                                         │                │
                                    ┌────┴────────────────┘
                                    ▼
                            AI Service (/analyze) + Backend (/api/v1/telemetry)

        NORMAL ──▶ Backend only (no AI overhead)

    Startup:
        Trains a lightweight IsolationForest on synthetic "Normal Behavior"
        data so predictions are available immediately.

    Dependencies:
        paho-mqtt, scikit-learn, numpy, requests
===============================================================================
"""

import os
import sys
import json
import time
import signal
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict

import numpy as np
import requests
from sklearn.ensemble import IsolationForest
import paho.mqtt.client as mqtt

# =============================================================================
#                           CONFIGURATION
# =============================================================================

MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "c4isr/telemetry")
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "c4isr-middleware")

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:8080/api/v1/telemetry")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://host.docker.internal:8000/analyze")

# Rule-based thresholds
RULE_HEART_RATE_CRITICAL = int(os.getenv("RULE_HR_CRITICAL", "150"))
RULE_FUEL_CRITICAL = int(os.getenv("RULE_FUEL_CRITICAL", "10"))
RULE_COMBAT_STATUSES = {"COMBAT", "ENGAGED", "PANIC", "CRITICAL"}

# ML model config
ML_CONTAMINATION = float(os.getenv("ML_CONTAMINATION", "0.05"))
ML_N_ESTIMATORS = int(os.getenv("ML_N_ESTIMATORS", "100"))
ML_RANDOM_STATE = 42

# Retry / resilience
HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "15"))       # Backend timeout (fast)
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", "120"))           # AI Service timeout (LLM inference is slow)
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "2"))

# Thread pool for async AI calls (so MQTT pipeline isn't blocked)
_ai_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ai-fwd")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("middleware")


# =============================================================================
#                       CLASSIFICATION LABELS
# =============================================================================

class Classification:
    NORMAL = "NORMAL"
    SUSPICIOUS = "SUSPICIOUS"
    CRITICAL = "CRITICAL"


# =============================================================================
#                       ISOLATION FOREST MODEL (Edge AI)
# =============================================================================

class AnomalyDetector:
    """
    Lightweight anomaly detector using scikit-learn IsolationForest.
    
    Feature vector: [heart_rate, speed, fuel_level, battery_level]
    Trained on synthetic "Normal Behavior" data at startup.
    """

    FEATURE_NAMES = ["heart_rate", "speed", "fuel_level", "battery_level"]

    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self._lock = threading.Lock()

    def train(self):
        """
        Train IsolationForest on synthetic normal-range data immediately.

        Generates domain-specific profiles so each asset type has
        realistic "normal" feature vectors:
            Soldier: heart_rate 60-140, speed 0-10,   fuel 100,  battery 30-100
            Drone:   heart_rate 0,      speed 0-50,   fuel 100,  battery 20-100
            Vehicle: heart_rate 0,      speed 0-80,   fuel 40-100, battery 100
            Idle:    heart_rate 0/60-75, speed 0,      fuel/bat high
        """
        rng = np.random.RandomState(ML_RANDOM_STATE)
        blocks = []

        # --- Soldier profiles (active + idle) ---
        n = 300
        blocks.append(np.column_stack([
            rng.uniform(60, 140, n),   # heart_rate (exercise can go up to 140)
            rng.uniform(0, 10, n),     # speed (walking/running)
            np.full(n, 100.0),         # fuel (N/A for soldiers)
            rng.uniform(30, 100, n),   # battery
        ]))

        # --- Drone profiles (flying + idle/hangar) ---
        n = 300
        blocks.append(np.column_stack([
            np.zeros(n),               # heart_rate (N/A)
            rng.uniform(0, 50, n),     # speed (0 = hangar, up to 50 m/s)
            np.full(n, 100.0),         # fuel (N/A)
            rng.uniform(20, 100, n),   # battery
        ]))

        # --- Vehicle profiles (moving + idle/garage) ---
        n = 300
        blocks.append(np.column_stack([
            np.zeros(n),               # heart_rate (N/A)
            rng.uniform(0, 80, n),     # speed (0 = parked)
            rng.uniform(40, 100, n),   # fuel
            np.full(n, 100.0),         # battery (N/A)
        ]))

        # --- Idle assets (all types, minimal values) ---
        n = 100
        blocks.append(np.column_stack([
            rng.choice([0.0] * 60 + list(rng.uniform(60, 75, 40)), n),  # hr: 0 or resting
            np.zeros(n),               # speed 0
            rng.uniform(80, 100, n),   # fuel high
            rng.uniform(80, 100, n),   # battery high
        ]))

        X_train = np.vstack(blocks)

        n_total = X_train.shape[0]
        logger.info(
            "Training IsolationForest — %d samples, %d estimators, contamination=%.2f",
            n_total, ML_N_ESTIMATORS, ML_CONTAMINATION,
        )
        t0 = time.time()

        self.model = IsolationForest(
            n_estimators=ML_N_ESTIMATORS,
            contamination=ML_CONTAMINATION,
            random_state=ML_RANDOM_STATE,
            n_jobs=-1,
        )
        self.model.fit(X_train)

        elapsed_ms = (time.time() - t0) * 1000
        logger.info("✅ IsolationForest trained in %.1f ms", elapsed_ms)

    def predict(self, features: np.ndarray) -> int:
        """
        Predict anomaly: returns 1 (normal) or -1 (anomaly).
        Thread-safe.
        """
        with self._lock:
            if self.model is None:
                logger.warning("Model not trained yet — skipping ML check")
                return 1  # assume normal
            return int(self.model.predict(features.reshape(1, -1))[0])

    def extract_features(self, message: dict) -> np.ndarray:
        """
        Extract the 4-feature vector from any telemetry message.

        The simulation publishes nested payloads:
            {domain, type, id, time, payload: {...}}

        Feature mapping by domain:
            drone:   heart_rate=0,  speed=ground_speed_mps, fuel=100, battery=battery.soc_pct
            soldier: heart_rate=hr, speed=0,                fuel=100, battery=device.battery_pct
            vehicle: heart_rate=0,  speed=speed_kph,        fuel=fuel_pct, battery=100
        """
        domain = message.get("domain", "").lower()
        payload = message.get("payload", {})

        heart_rate = 0.0
        speed = 0.0
        fuel_level = 100.0
        battery_level = 100.0

        if domain == "drone":
            speed = payload.get("ground_speed_mps", 0.0)
            battery_info = payload.get("battery", {})
            battery_level = battery_info.get("soc_pct", 100.0) if isinstance(battery_info, dict) else 100.0

        elif domain == "soldier":
            heart_rate = payload.get("heart_rate", 70.0)
            device_info = payload.get("device", {})
            battery_level = device_info.get("battery_pct", 100.0) if isinstance(device_info, dict) else 100.0

        elif domain == "vehicle":
            speed = payload.get("speed_kph", 0.0)
            fuel_level = payload.get("fuel_pct", 100.0)

        return np.array([heart_rate, speed, fuel_level, battery_level], dtype=np.float64)


# =============================================================================
#                       RULE ENGINE
# =============================================================================

def rule_check(message: dict) -> Tuple[bool, str]:
    """
    Hard-coded rule checks for immediate critical conditions.

    Returns (is_critical, reason).
    """
    domain = message.get("domain", "").lower()
    payload = message.get("payload", {})

    # --- Heart rate critical (soldiers) ---
    if domain == "soldier":
        hr = payload.get("heart_rate", 0)
        if hr > RULE_HEART_RATE_CRITICAL:
            return True, f"HEART_RATE={hr} > {RULE_HEART_RATE_CRITICAL}"

    # --- Fuel critical (vehicles) ---
    if domain == "vehicle":
        fuel = payload.get("fuel_pct", 100)
        if fuel < RULE_FUEL_CRITICAL:
            return True, f"FUEL={fuel} < {RULE_FUEL_CRITICAL}"

    # --- Combat / engaged status ---
    stress = str(payload.get("stress_level", "")).upper()
    status = str(payload.get("status", "")).upper()
    mission = str(payload.get("mission", "")).upper()

    for val in [stress, status, mission]:
        if val in RULE_COMBAT_STATUSES:
            return True, f"STATUS={val} in COMBAT list"

    return False, ""


# =============================================================================
#                       HTTP FORWARDER
# =============================================================================

def _post_with_retry(url: str, json_data: dict, label: str, timeout: int = None) -> bool:
    """POST JSON to url with retries.  Returns True on success."""
    _timeout = timeout or HTTP_TIMEOUT
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(url, json=json_data, timeout=_timeout)
            if resp.status_code < 400:
                logger.debug("[%s] ✔ %s  (HTTP %d)", label, url, resp.status_code)
                return True
            else:
                logger.warning(
                    "[%s] HTTP %d from %s — attempt %d/%d",
                    label, resp.status_code, url, attempt, MAX_RETRIES,
                )
        except requests.RequestException as exc:
            logger.warning(
                "[%s] Request to %s failed — attempt %d/%d — %s",
                label, url, attempt, MAX_RETRIES, exc,
            )
        if attempt < MAX_RETRIES:
            time.sleep(0.5 * attempt)
    return False


def forward_to_backend(raw_message: dict, classification: str, reason: str = ""):
    """
    Forward telemetry to the Spring Boot backend.
    Injects middleware metadata for observability.
    """
    enriched = dict(raw_message)  # shallow copy
    enriched["_middleware"] = {
        "classification": classification,
        "reason": reason,
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }
    _post_with_retry(BACKEND_URL, enriched, "BACKEND")


def _build_ai_request(raw_message: dict) -> dict:
    """
    Build an AnalysisRequest dict matching the AI Service's Pydantic schema.
    Returns None if domain is unknown.
    """
    domain = raw_message.get("domain", "unknown").lower()
    payload = raw_message.get("payload", {})
    entity_id = raw_message.get("id", "UNKNOWN")
    position = payload.get("position", {})
    lat = position.get("lat", 0.0)
    lon = position.get("lon", 0.0)

    # Valid DroneMode values in AI schema: AUTO, MANUAL, RTH, LOITER, LANDING
    VALID_DRONE_MODES = {"AUTO", "MANUAL", "RTH", "LOITER", "LANDING"}

    if domain == "drone":
        raw_mode = payload.get("mode", "AUTO")
        mode = raw_mode if raw_mode in VALID_DRONE_MODES else "LOITER"
        telemetry = {
            "type": "drone",
            "source_id": entity_id,
            "latitude": lat,
            "longitude": lon,
            "altitude": position.get("alt_m", 0.0),
            "speed": payload.get("ground_speed_mps", 0.0),
            "battery_level": (payload.get("battery", {}) or {}).get("soc_pct", 100.0),
            "mode": mode,
        }
    elif domain == "soldier":
        telemetry = {
            "type": "soldier",
            "source_id": entity_id,
            "latitude": lat,
            "longitude": lon,
            "vitals": {
                "hr_bpm": payload.get("heart_rate", 70),
                "spo2": payload.get("spo2", 98.0),
            },
            "status": payload.get("stress_level", "ACTIVE"),
        }
    elif domain == "vehicle":
        telemetry = {
            "type": "vehicle",
            "source_id": entity_id,
            "latitude": lat,
            "longitude": lon,
            "speed": payload.get("speed_kph", 0.0),
            "fuel_pct": payload.get("fuel_pct", 100.0),
            "vehicle_type": "APC",
        }
    else:
        return None

    return {
        "telemetry": telemetry,
        "include_context": True,
        "max_context_items": 3,
    }


def _do_ai_forward(analysis_request: dict, entity_id: str, classification: str, reason: str):
    """Blocking AI call — runs in thread pool so it doesn't stall MQTT pipeline."""
    success = _post_with_retry(AI_SERVICE_URL, analysis_request, "AI-SERVICE", timeout=AI_TIMEOUT)
    if success:
        logger.info(
            "🧠 AI analysis complete — entity=%s classification=%s reason=%s",
            entity_id, classification, reason,
        )
    else:
        logger.warning(
            "🧠 AI analysis FAILED — entity=%s classification=%s reason=%s",
            entity_id, classification, reason,
        )


# Per-asset cooldown tracker: {entity_id: last_dispatch_timestamp}
_ai_cooldown: Dict[str, float] = {}
_AI_COOLDOWN_SECONDS = 60  # Don't re-analyze same asset within 60s


def forward_to_ai(raw_message: dict, classification: str, reason: str = ""):
    """
    Fire-and-forget: submit AI request to a background thread.
    Includes per-asset cooldown to prevent flooding the LLM (~12s/inference).
    """
    entity_id = raw_message.get("id", "UNKNOWN")

    # Cooldown check — skip if same asset was dispatched recently
    now = time.time()
    last_dispatch = _ai_cooldown.get(entity_id, 0)
    if (now - last_dispatch) < _AI_COOLDOWN_SECONDS:
        remaining = int(_AI_COOLDOWN_SECONDS - (now - last_dispatch))
        logger.debug(
            "⏳ AI cooldown active — %s skipped (%ds remaining)", entity_id, remaining
        )
        return

    analysis_request = _build_ai_request(raw_message)
    if analysis_request is None:
        logger.warning("Unknown domain — skipping AI forward")
        return

    _ai_cooldown[entity_id] = now
    _ai_executor.submit(_do_ai_forward, analysis_request, entity_id, classification, reason)
    logger.info(
        "🧠 AI analysis dispatched (async) — entity=%s classification=%s",
        entity_id, classification,
    )


# =============================================================================
#                       PROCESSING PIPELINE
# =============================================================================

class TelemetryProcessor:
    """
    Full processing pipeline:
        1. Parse JSON
        2. Rule Check   → CRITICAL?
        3. ML Check     → SUSPICIOUS?
        4. Route accordingly
    """

    def __init__(self, detector: AnomalyDetector):
        self.detector = detector
        self.stats = {
            "total": 0,
            "normal": 0,
            "suspicious": 0,
            "critical": 0,
            "errors": 0,
        }
        self._lock = threading.Lock()

    def process(self, raw_payload: bytes):
        """Process a single MQTT message payload."""
        with self._lock:
            self.stats["total"] += 1

        try:
            message = json.loads(raw_payload)
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON: %s", exc)
            with self._lock:
                self.stats["errors"] += 1
            return

        entity_id = message.get("id", "?")
        domain = message.get("domain", "?")

        # --- Step 1: Rule Check ---
        is_critical, rule_reason = rule_check(message)
        if is_critical:
            classification = Classification.CRITICAL
            reason = f"RULE: {rule_reason}"
            logger.warning(
                "🔴 CRITICAL — %s [%s] — %s", entity_id, domain, reason
            )
            with self._lock:
                self.stats["critical"] += 1
            # Route to BOTH AI + Backend
            forward_to_ai(message, classification, reason)
            forward_to_backend(message, classification, reason)
            return

        # --- Step 2: ML Check ---
        features = self.detector.extract_features(message)
        prediction = self.detector.predict(features)

        if prediction == -1:
            classification = Classification.SUSPICIOUS
            reason = (
                f"ML_ANOMALY: features={features.tolist()}"
            )
            logger.warning(
                "🟡 SUSPICIOUS — %s [%s] — %s", entity_id, domain, reason
            )
            with self._lock:
                self.stats["suspicious"] += 1
            # Route to BOTH AI + Backend
            forward_to_ai(message, classification, reason)
            forward_to_backend(message, classification, reason)
            return

        # --- Step 3: Normal path ---
        classification = Classification.NORMAL
        logger.debug("🟢 NORMAL — %s [%s]", entity_id, domain)
        with self._lock:
            self.stats["normal"] += 1
        # Route to Backend ONLY — NO AI call
        forward_to_backend(message, classification)

    def print_stats(self):
        with self._lock:
            s = self.stats
        logger.info(
            "📊 Stats — Total: %d | Normal: %d | Suspicious: %d | Critical: %d | Errors: %d",
            s["total"], s["normal"], s["suspicious"], s["critical"], s["errors"],
        )


# =============================================================================
#                       MQTT CLIENT
# =============================================================================

class MiddlewareMQTTClient:
    """MQTT subscriber that feeds each message through the processor."""

    def __init__(self, processor: TelemetryProcessor):
        self.processor = processor
        self.client: Optional[mqtt.Client] = None
        self._connected = threading.Event()

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info("✅ Connected to MQTT broker %s:%d", MQTT_BROKER_HOST, MQTT_BROKER_PORT)
            client.subscribe(MQTT_TOPIC, qos=1)
            logger.info("📡 Subscribed to topic: %s", MQTT_TOPIC)
            self._connected.set()
        else:
            logger.error("❌ MQTT connection failed — rc=%d", rc)

    def _on_disconnect(self, client, userdata, rc, properties=None):
        self._connected.clear()
        logger.warning("⚡ MQTT disconnected (rc=%d) — will auto-reconnect", rc)

    def _on_message(self, client, userdata, msg):
        """Called for every message on the subscribed topic."""
        self.processor.process(msg.payload)

    def connect(self) -> bool:
        """Connect to the MQTT broker with retry logic."""
        self.client = mqtt.Client(
            client_id=f"{MQTT_CLIENT_ID}-{int(time.time()) % 10000}",
            protocol=mqtt.MQTTv5,
        )
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)

        max_attempts = 30  # wait up to ~60s for broker to be available
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(
                    "Connecting to MQTT %s:%d (attempt %d/%d)...",
                    MQTT_BROKER_HOST, MQTT_BROKER_PORT, attempt, max_attempts,
                )
                self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
                self.client.loop_start()
                # Wait a short time for the on_connect callback
                if self._connected.wait(timeout=5):
                    return True
            except Exception as exc:
                logger.warning("Connection attempt %d failed: %s", attempt, exc)
            time.sleep(2)

        logger.error("❌ Could not connect to MQTT after %d attempts", max_attempts)
        return False

    def disconnect(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT client disconnected.")


# =============================================================================
#                       MAIN
# =============================================================================

def main():
    logger.info("=" * 70)
    logger.info("C4ISR MIDDLEWARE — EDGE AI / ANOMALY DETECTION PROCESSOR")
    logger.info("=" * 70)
    logger.info("MQTT Broker  : %s:%d", MQTT_BROKER_HOST, MQTT_BROKER_PORT)
    logger.info("MQTT Topic   : %s", MQTT_TOPIC)
    logger.info("Backend URL  : %s", BACKEND_URL)
    logger.info("AI Service   : %s", AI_SERVICE_URL)
    logger.info("=" * 70)

    # --- Step 1: Train model ---
    detector = AnomalyDetector()
    detector.train()

    # --- Step 2: Create processor ---
    processor = TelemetryProcessor(detector)

    # --- Step 3: Connect to MQTT ---
    mqtt_client = MiddlewareMQTTClient(processor)
    if not mqtt_client.connect():
        logger.critical("Cannot start — MQTT broker unavailable")
        sys.exit(1)

    # --- Graceful shutdown ---
    shutdown_event = threading.Event()

    def handle_signal(sig, frame):
        logger.info("Shutdown signal received (%s)", signal.Signals(sig).name)
        shutdown_event.set()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info("🚀 Middleware is ONLINE — listening for telemetry...")
    logger.info("Press Ctrl+C to stop.\n")

    # --- Keep alive + periodic stats ---
    try:
        while not shutdown_event.is_set():
            shutdown_event.wait(timeout=30)
            if not shutdown_event.is_set():
                processor.print_stats()
    finally:
        mqtt_client.disconnect()
        processor.print_stats()
        logger.info("Middleware stopped.")


if __name__ == "__main__":
    main()
