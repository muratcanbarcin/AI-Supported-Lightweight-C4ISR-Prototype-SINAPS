import json, time, math, random, datetime, argparse, pathlib
import numpy as np
import yaml, paho.mqtt.client as mqtt
from jsonschema import validate, Draft202012Validator
from jsonschema.exceptions import ValidationError
from pathlib import Path

def resolve_path(p: str) -> Path:
    p = Path(p)
    if p.is_absolute():
        return p
    # önce çalışma dizini, sonra 'simulators' klasörü (bu dosyanın 2. üstü)
    candidates = [Path.cwd() / p, Path(__file__).resolve().parents[1] / p]
    for c in candidates:
        if c.exists():
            return c
    return Path(p)  # son çare

def now_iso():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()

def offset_latlon(lat, lon, north_m, east_m):
    dlat = north_m / 111_320.0
    dlon = east_m / (40075000.0 * math.cos(math.radians(lat)) / 360.0)
    return lat + dlat, lon + dlon

def load_json(path):
    with open(path, "r", encoding="utf-8") as f: return json.load(f)

class SchemaValidator:
    def __init__(self, telem_path, alert_path):
        self.telemetry_schema = load_json(telem_path)
        self.alert_schema     = load_json(alert_path)
        # önceden derle (hız)
        self.val_telem = Draft202012Validator(self.telemetry_schema)
        self.val_alert = Draft202012Validator(self.alert_schema)

    def check_telemetry(self, obj):
        self.val_telem.validate(obj)

    def check_alert(self, obj):
        self.val_alert.validate(obj)



class MQTT:
    def __init__(self, b):
        self.cli = mqtt.Client(
            client_id=f"sim-watch-{random.randint(1000,9999)}",
            clean_session=True
        )

        # username/password ARTIK KULLANMIYORUZ (client cert ile kimlik doğrulama)
        if b.get("tls", True):
            import ssl
            cafile = b.get("cafile")
            cert   = b.get("client_cert")
            key    = b.get("client_key")

            # CA + (varsa) istemci sertifikası
            if cert and key:
                self.cli.tls_set(
                    ca_certs=cafile,
                    certfile=cert,
                    keyfile=key,
                    cert_reqs=ssl.CERT_REQUIRED,
                    tls_version=ssl.PROTOCOL_TLS_CLIENT,
                )
            else:
                self.cli.tls_set(
                    ca_certs=cafile,
                    cert_reqs=ssl.CERT_REQUIRED,
                    tls_version=ssl.PROTOCOL_TLS_CLIENT,
                )
            self.cli.tls_insecure_set(False)

        self.host, self.port = b["host"], int(b["port"])

    def connect(self):
        self.cli.connect(self.host, self.port, keepalive=30)
        self.cli.loop_start()

    def close(self):
        self.cli.loop_stop(); self.cli.disconnect()

    def pub(self, topic, obj, qos=1):
        self.cli.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos)

class Soldier:
    """
    Şema (watch.telemetry / watch.alert) alanları:
    - ortak header: domain:"watch", type:"telemetry|alert", id, time(ISO-8601)
    - telemetry.payload:
        position{lat,lon,alt_m}, vitals{heart_rate_bpm,spo2_pct,skin_temp_c,steps}, battery{soc_pct}
    - alert.payload:
        severity("INFO|WARNING|MAJOR|CRITICAL"), title, category, description, related{soldier_id}
    """
    def __init__(self, sid, topic, rate_hz, lat, lon, alt, thr, validator: SchemaValidator):
        self.id=sid; self.topic=topic; self.dt=1.0/float(rate_hz)
        self.lat, self.lon, self.alt = lat, lon, alt
        self.hr   = np.random.normal(82, 4)
        self.spo2 = np.random.normal(97.5, 0.6)
        self.temp = np.random.normal(36.6, 0.2)
        self.steps=0; self.batt=85.0
        self.thr=thr; self._alerted_batt=False
        self.V=validator

    def step(self):
        spd = np.clip(np.random.normal(1.1,0.6), 0, 2.5)  # m/s
        head=np.random.uniform(0,2*math.pi)
        north=spd*math.cos(head)*self.dt; east=spd*math.sin(head)*self.dt
        self.lat,self.lon=offset_latlon(self.lat,self.lon,north,east)
        self.steps += int(max(spd*1.3,0))
        self.hr   = float(np.clip(np.random.normal(self.hr,1.2), 54, 160))
        self.spo2 = float(np.clip(np.random.normal(self.spo2,0.15), 88, 100))
        self.temp = float(np.clip(np.random.normal(self.temp,0.03), 35.8, 40.0))
        self.batt = max(3.0, self.batt - self.dt*0.02)

    def telemetry(self):
        obj={
            "domain":"watch","type":"telemetry","id":self.id,"time":now_iso(),
            "payload":{
                "position":{"lat":round(self.lat,6),"lon":round(self.lon,6),"alt_m":round(self.alt,1)},
                "vitals":{"heart_rate_bpm":int(round(self.hr)),
                          "spo2_pct":round(self.spo2,1),
                          "skin_temp_c":round(self.temp,1),
                          "steps":int(self.steps)},
                "battery":{"soc_pct":round(self.batt,1)}
            }
        }
        self.V.check_telemetry(obj)
        return obj

    def alerts(self):
        out=[]
        def mk(sev,title,cat,desc):
            obj={"domain":"watch","type":"alert","id":f"al-{self.id}-{int(time.time())}",
                 "time":now_iso(),
                 "payload":{"severity":sev,"title":title,"category":cat,
                            "description":desc,"related":{"soldier_id":self.id}}}
            self.V.check_alert(obj); out.append(obj)
        # kurallar:
        if random.random()<0.02:  # düşme
            peak=np.random.uniform(self.thr["fall_g"], self.thr["fall_g"]+1.0)
            mk("CRITICAL","Düşme algılandı","SAFETY",f"ivme_tepe_g={peak:.2f}")
        if self.hr>=self.thr["tachy_bpm"]: mk("MAJOR","Taşikardi","MEDICAL",f"HR={self.hr:.0f} bpm")
        if self.hr<=self.thr["brady_bpm"]: mk("MAJOR","Bradikardi","MEDICAL",f"HR={self.hr:.0f} bpm")
        if self.spo2<=self.thr["low_spo2_pct"]: mk("CRITICAL","Düşük SpO2","MEDICAL",f"SpO2={self.spo2:.1f}%")
        if self.temp>=self.thr["high_temp_c"]: mk("MAJOR","Yüksek ateş","MEDICAL",f"T={self.temp:.1f}°C")
        if self.batt<=self.thr["battery_low_pct"] and not self._alerted_batt:
            mk("WARNING","Düşük pil","POWER",f"Batarya %{self.batt:.1f}"); self._alerted_batt=True
        return out

def run(cfg):
    b=cfg["broker"]; u=cfg["unit"]; thr=cfg["thresholds"]; sc=cfg["schemas"]
    V=SchemaValidator(sc["telemetry"], sc["alert"])
    m=MQTT(b); m.connect()
    soldiers=[Soldier(sid,u["topic"],u["rate_hz"],u["start_lat"],u["start_lon"],u["start_alt_m"],thr,V)
              for sid in u["ids"]]
    print(f"[SoldierSim] {len(soldiers)} unit → {u['topic']} @ mqtt://{b['host']}:{b['port']}")
    try:
        while True:
            for s in soldiers:
                s.step()
                try:
                    m.pub(u["topic"], s.telemetry())
                    for al in s.alerts(): m.pub(u["topic"], al)
                except ValidationError as ve:
                    print(f"[SchemaError] {ve.message}")
            time.sleep(1.0/float(u["rate_hz"]))
    except KeyboardInterrupt:
        pass
    finally:
        m.close(); print("[SoldierSim] stopped.")

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("-c","--config",default="sim-producers/soldier_sim.yaml")
    args=ap.parse_args()
    with open(args.config,"r",encoding="utf-8") as f: cfg=yaml.safe_load(f)
    run(cfg)

if __name__=="__main__": main()
