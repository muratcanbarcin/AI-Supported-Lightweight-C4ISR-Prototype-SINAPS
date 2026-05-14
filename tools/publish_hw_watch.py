"""
Hardware Watch HTTP publisher — IZMIR-HW-WATCH-01.

Watch fiziksel prototipi backend'in HTTP POST endpoint'ine veri gönderecek.
Bu script gerçek saatin yapacağını simüle eder.

Kullanım:
    python tools/publish_hw_watch.py                       # normal vitals
    python tools/publish_hw_watch.py --scenario critical   # hr=175, spo2=84 (CRITICAL)
    python tools/publish_hw_watch.py --scenario suspicious # hr=140 (SUSPICIOUS)
    python tools/publish_hw_watch.py --loop --interval 10  # her 10sn'de bir publish
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
from datetime import datetime, timezone

WATCH_ID = "IZMIR-HW-WATCH-01"
DEFAULT_URL = "http://localhost:8080/api/v1/hardware/watch/telemetry"

SCENARIOS = {
    "normal":     {"hr_bpm": 88,  "spo2_pct": 98},
    "suspicious": {"hr_bpm": 140, "spo2_pct": 95},
    "critical":   {"hr_bpm": 175, "spo2_pct": 84},
}


def build_payload(scenario: str) -> dict:
    return {
        "domain": "watch",
        "type": "telemetry",
        "id": WATCH_ID,
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "payload": {
            "position": {"lat": 38.5090, "lon": 27.0140, "alt_m": 12.5},
            "vitals":   SCENARIOS[scenario],
            "device":   {"model": "SINAPS-Tactical-Watch", "battery_pct": 88.0},
            "is_simulated": False,
            "status": "IN_MISSION",
        },
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--scenario", choices=list(SCENARIOS.keys()), default="normal")
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--interval", type=float, default=10.0)
    args = ap.parse_args()

    def send_once() -> None:
        payload = build_payload(args.scenario)
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            args.url, data=body, method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[{payload['time']}] POST {args.url} → HTTP {resp.status} | scenario={args.scenario}")
            print("  response:", resp.read().decode("utf-8"))

    if args.loop:
        while True:
            send_once()
            time.sleep(args.interval)
    else:
        send_once()


if __name__ == "__main__":
    main()
