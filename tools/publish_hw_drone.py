"""
Hardware Drone MQTT publisher — IZMIR-HW-DRONE-01.

Mosquitto CLI tools yoksa veya PowerShell JSON escape sorunlarıyla uğraşmamak
için kullanılır. Paho-MQTT zaten projede mevcut.

Kullanım:
    # Tek mesaj yolla (varsayılan: HOSTILE detection → CRITICAL):
    python tools/publish_hw_drone.py

    # Düşman yerine sadece dost kuvvet (→ NORMAL):
    python tools/publish_hw_drone.py --scenario friendly

    # Her 60 saniyede bir publish (gerçek drone davranışını simüle eder):
    python tools/publish_hw_drone.py --loop

    # Farklı broker:
    python tools/publish_hw_drone.py --host 192.168.1.10 --port 1883
"""
from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone

import paho.mqtt.publish as publish

DRONE_ID = "IZMIR-HW-DRONE-01"
TOPIC = f"hardware/drone/{DRONE_ID}/telemetry"

SCENARIOS = {
    "hostile": [
        {"class": "MILITARY_VEHICLE", "alignment": "HOSTILE",  "confidence": 0.89, "estimated_distance_m": 718.4},
        {"class": "SOLDIER",          "alignment": "FRIENDLY", "confidence": 0.95, "estimated_distance_m": 150.2},
        {"class": "TRUCK",            "alignment": "UNKNOWN",  "confidence": 0.87, "estimated_distance_m": 710.1},
        {"class": "CIVILIAN_VEHICLE", "alignment": "NEUTRAL",  "confidence": 0.88, "estimated_distance_m": 328.1},
    ],
    "unknown": [
        {"class": "TRUCK",            "alignment": "UNKNOWN",  "confidence": 0.91, "estimated_distance_m": 540.0},
        {"class": "CIVILIAN_VEHICLE", "alignment": "NEUTRAL",  "confidence": 0.84, "estimated_distance_m": 220.0},
    ],
    "friendly": [
        {"class": "SOLDIER",          "alignment": "FRIENDLY", "confidence": 0.96, "estimated_distance_m": 120.0},
        {"class": "CIVILIAN_VEHICLE", "alignment": "NEUTRAL",  "confidence": 0.78, "estimated_distance_m": 410.0},
    ],
    "empty": [],
}


def build_payload(scenario: str) -> dict:
    return {
        "domain": "drone",
        "type": "telemetry",
        "id": DRONE_ID,
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "payload": {
            "position": {"lat": 38.5120, "lon": 27.0155, "alt_m": 450.0},
            "battery":  {"soc_pct": 82.5},
            "is_simulated": False,
            "status": "IN_MISSION",
            "edge_analysis": {"detections": SCENARIOS[scenario]},
        },
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--scenario", choices=list(SCENARIOS.keys()), default="hostile")
    ap.add_argument("--loop", action="store_true", help="Her 60sn'de bir publish et")
    ap.add_argument("--interval", type=float, default=60.0)
    args = ap.parse_args()

    def send_once() -> None:
        payload = build_payload(args.scenario)
        publish.single(
            topic=TOPIC,
            payload=json.dumps(payload),
            hostname=args.host,
            port=args.port,
            qos=1,
        )
        print(f"[{payload['time']}] published → {TOPIC} (scenario={args.scenario})")

    if args.loop:
        while True:
            send_once()
            time.sleep(args.interval)
    else:
        send_once()


if __name__ == "__main__":
    main()
