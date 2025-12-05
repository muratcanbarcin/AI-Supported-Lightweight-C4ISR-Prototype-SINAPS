#!/usr/bin/env python3
import os, time, json, math, argparse
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
import yaml

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def lerp(a, b, t):
    return a + (b - a) * t

class ScenarioEngine:
    def __init__(self, scenario_path):
        with open(scenario_path, "r", encoding="utf-8") as f:
            raw = os.path.expandvars(f.read())
        self.sc = yaml.safe_load(raw)
        self.t0 = time.time()
        self.intrusion = None
        self.timeline = self.sc.get("timeline", [])
        self.idx = 0

    def elapsed(self):
        return time.time() - self.t0

    def _parse_t(self, tstr):
        mm, ss = tstr.split(":")
        return int(mm) * 60 + int(ss)

    def step(self, uav_state, publish_fn):
        while self.idx < len(self.timeline):
            t_needed = self._parse_t(self.timeline[self.idx]["t"])
            if self.elapsed() >= t_needed:
                self._run_action(self.timeline[self.idx], uav_state, publish_fn)
                self.idx += 1
            else:
                break

    def _run_action(self, act, uav_state, publish_fn):
        a = act.get("action")
        if a == "intrusion_inject":
            self.intrusion = act["intrusion"]
            print(f"[scenario] intrusion injected: {self.intrusion}")
        elif a == "publish_detection":
            topic = os.path.expandvars(act["mqtt_topic"])
            msg = make_detection_msg(uav_state, self.intrusion)
            publish_fn(topic, msg)
            print(f"[publish] detection -> {topic}")
        elif a == "publish_link16":
            topic = os.path.expandvars(act["mqtt_topic"])
            msg = make_j32_msg(uav_state, self.intrusion)
            publish_fn(topic, msg)
            print(f"[publish] J3.2 -> {topic}")

def make_detection_msg(uav, intr):
    return {
        "event": "intrusion_detected",
        "ts": now_iso(),
        "sensor_id": uav["id"],
        "target": {"track_number": intr["id"], "identity": intr.get("identity","UNKNOWN")},
        "pos": {"lat": intr["lat"], "lon": intr["lon"], "alt": intr["alt"]}
    }

def make_j32_msg(uav, intr):
    return {
        "msg_type": "J3.2",
        "ts": now_iso(),
        "track": { "track_number": intr["id"], "tn": 101, "pri": 3 },
        "pos":   { "lat": intr["lat"], "lon": intr["lon"], "alt_msl": intr["alt"] },
        "vel":   { "track_heading_deg": 90.0, "gs_mps": 12.0 },
        "identity": intr.get("identity","UNKNOWN"),
        "source": uav["id"]
    }

def load_cfg(path):
    with open(path, "r", encoding="utf-8") as f:
        raw = os.path.expandvars(f.read())
    return yaml.safe_load(raw)

def build_client(bcfg, client_id):
    cli = mqtt.Client(
    client_id=client_id,
    protocol=mqtt.MQTTv5,
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2
)  # MQTTv5: clean_session kullanılmaz

    if bcfg.get("tls", True):
        cli.tls_set(
            ca_certs=bcfg["cafile"],
            certfile=bcfg.get("client_cert"),
            keyfile=bcfg.get("client_key"),
        )
        cli.tls_insecure_set(False)

    def on_connect(client, userdata, flags, reason_code, properties=None):
        print(f"[MQTT] connected rc={reason_code} to {bcfg['host']}:{bcfg['port']}")

    cli.on_connect = on_connect
    return cli

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", default="simulators/sim-producers/uav_sim.yaml")
    args = ap.parse_args()

    cfg = load_cfg(args.cfg)
    b = cfg["broker"]
    uav_id = cfg["uav"]["id"]
    scenario_file = cfg.get("scenario_file")
    topics = cfg.get("topics", {})
    rate_hz = float(cfg["uav"].get("rate_hz", 2.0))

    engine = ScenarioEngine(scenario_file)

    cli = build_client(b, uav_id)
    cli.connect(b["host"], int(b["port"]), keepalive=60)

    def publish(topic, payload):
        cli.publish(topic, json.dumps(payload), qos=1, retain=False)

    route = cfg.get("route") or [
        {"lat": cfg["uav"]["start_lat"], "lon": cfg["uav"]["start_lon"], "alt": cfg["uav"]["start_alt_m"]}
    ]
    seg = 0; seg_t = 0.0; period = 1.0 / max(0.1, rate_hz)
    uav_state = {"id": uav_id, "lat": route[0]["lat"], "lon": route[0]["lon"], "alt": route[0]["alt"]}

    while True:
        tlm = {"ts": now_iso(), "uav_id": uav_id, "pos": {"lat": uav_state["lat"], "lon": uav_state["lon"], "alt": uav_state["alt"]}}
        tel_topic = topics.get("telemetry", f"drone/{uav_id}/telemetry")
        publish(tel_topic, tlm)

        engine.step(uav_state, publish)

        if len(route) > 1:
            a = route[seg % len(route)]; bpt = route[(seg + 1) % len(route)]
            t = (seg_t % 1.0)
            uav_state["lat"] = lerp(a["lat"], bpt["lat"], t)
            uav_state["lon"] = lerp(a["lon"], bpt["lon"], t)
            uav_state["alt"] = lerp(a["alt"], bpt["alt"], t)
            seg_t += 0.05
            if seg_t >= 1.0:
                seg += 1; seg_t = 0.0

        cli.loop(timeout=0.1)
        time.sleep(period)

if __name__ == "__main__":
    main()
