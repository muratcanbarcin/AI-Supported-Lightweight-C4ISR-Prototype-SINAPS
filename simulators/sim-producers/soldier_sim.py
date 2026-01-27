import json, time, math, argparse, random, datetime, pathlib
import paho.mqtt.client as mqtt

try:
    import yaml
except Exception:
    yaml = None

def now_iso():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()

def offset_latlon(lat, lon, north_m, east_m):
    dlat = north_m / 111_320.0
    dlon = east_m / (40075000.0 * math.cos(math.radians(lat)) / 360.0)
    return lat + dlat, lon + dlon

class SoldierSim:
    def __init__(self, cfg):
        b = cfg["broker"]; s = cfg["soldier"]
        self.topic = s.get("topic","watch/events")
        self.soldier_id = s.get("soldier_id","soldier1")
        self.unit_id = s.get("unit_id","alpha-team")
        self.dt = 1.0/float(s.get("rate_hz",1.0))
        
        self.lat = float(s.get("start_lat",39.9280))
        self.lon = float(s.get("start_lon",32.8480))
        self.alt = float(s.get("start_alt_m",900.0))
        self.speed = float(s.get("speed_kph",5.0)) # Walking speed
        self.heading = 0.0
        
        # BAŞLANGIÇ DEĞERİ (Kriz Modu)
        self.hr_bpm = 185 
        
        print(f"[SoldierSim] ID={self.soldier_id} Target={b['host']}:{b['port']} Topic={self.topic}")

        self.client = mqtt.Client(client_id=f"sim-{self.soldier_id}", clean_session=True)
        if b.get("user"): self.client.username_pw_set(b["user"], b.get("pass",""))
        if b.get("tls"):
            import ssl
            self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
        self.host, self.port = b.get("host","localhost"), int(b.get("port",1883))
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): print(f"[SoldierSim] MQTT connected rc={rc}")
    def _on_disconnect(self, c, u, rc): print(f"[SoldierSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[SoldierSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait); wait = min(max_wait, wait*2)

    def _pub(self, obj, qos=1):
        self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def telemetry(self):
        # Stress hesabı: Nabız yüksek olduğu için stress skoru da otomatik yükselecek
        stress = max(0.0, min(1.0, (self.hr_bpm - 60) / 120.0))
        
        # Asker her zaman dost unsur
        alignment = "FRIEND"
        threat = 0

        return {
            "domain":"watch","type":"telemetry","id":self.soldier_id,"time":now_iso(),
            "payload": {
                "soldier_id": self.soldier_id,
                "unit_id": self.unit_id,
                "collected_at": now_iso(),
                "position": {"lat":self.lat, "lon":self.lon, "alt_m":round(self.alt,1)},
                "vitals": {
                    "hr_bpm": self.hr_bpm,   # step() fonksiyonunda 185'e kilitlendi
                    "spo2_pct": 85.0,        # KRİTİK: Hipoksi (Oksijen yetersizliği)
                    "resp_bpm": 35.0,        # KRİTİK: Hızlı solunum
                    "skin_temp_c": 39.5,     # KRİTİK: Yüksek ateş
                    "stress_score": stress   # 0.9 - 1.0 arası çıkacak
                },
                "device": {
                    "device_id": f"dev-{self.soldier_id}",
                    "model": "SmartWatch-X1",
                    "battery_pct": 88.0
                },
                "alignment": alignment,
                "threat_level": threat
            }
        }

    def step(self, t):
        # Hareket Mantığı (Zigzag yürüme)
        speed_mps = (self.speed * 1000) / 3600
        radius=50.0; omega=speed_mps/radius; ang=omega*t
        north=radius*math.cos(ang)*self.dt
        east=radius*math.sin(ang)*self.dt 
        
        self.lat, self.lon = offset_latlon(self.lat, self.lon, north, east)
        
        # --- KRİZ MODU ---
        # Eskiden burası rastgele 75 yapıyordu, şimdi 185'e kilitliyoruz.
        self.hr_bpm = 185 

    def run(self, duration=None):
        self.connect_with_backoff()
        t=0.0
        try:
            while True:
                self.step(t)
                self._pub(self.telemetry())
                self.client.loop(timeout=0.1)
                time.sleep(self.dt); t+=self.dt
                if duration and t>=duration: break
        except KeyboardInterrupt:
            pass
        finally:
            self.client.loop(1.0); self.client.disconnect(); print("[SoldierSim] stopped.")

def load_cfg(path, args):
    if path and pathlib.Path(path).exists() and yaml:
        with open(path,"r",encoding="utf-8") as f:
            cfg=yaml.safe_load(f)
    else:
        cfg={
            "broker":{"host":args.host,"port":args.port,"user":args.user,"pass":args.password,
                      "tls":args.tls,"cafile":args.cafile},
            "soldier":{"soldier_id":args.id,"rate_hz":args.rate,"start_lat":args.lat,"start_lon":args.lon,
                       "start_alt_m":args.alt,"speed_kph":args.speed,"topic":args.topic}
        }
    return cfg

def parse_args():
    ap=argparse.ArgumentParser()
    ap.add_argument("--config","-c",default="sim-producers/soldier_sim.yaml")
    ap.add_argument("--host",default="localhost"); ap.add_argument("--port",type=int,default=1883)
    ap.add_argument("--user",default="admin"); ap.add_argument("--password",default="password")
    ap.add_argument("--tls",action="store_true"); ap.add_argument("--cafile",default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id",default="soldier1"); ap.add_argument("--rate",type=float,default=1.0)
    ap.add_argument("--lat",type=float,default=39.9280); ap.add_argument("--lon",type=float,default=32.8480)
    ap.add_argument("--alt",type=float,default=900.0); ap.add_argument("--speed",type=float,default=5.0)
    ap.add_argument("--topic",default="watch/events"); ap.add_argument("--duration",type=float,default=None)
    return ap.parse_args()

if __name__=="__main__":
    args=parse_args()
    cfg=load_cfg(args.config,args)
    SoldierSim(cfg).run(args.duration)