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

class VehicleSim:
    def __init__(self, cfg):
        b = cfg["broker"]; v = cfg["vehicle"]
        self.topic = v.get("topic","vehicle/events")
        self.id = v.get("id","vehicle1")
        self.dt = 1.0/float(v.get("rate_hz",1.0))
        self.lat = float(v.get("start_lat",39.9300))
        self.lon = float(v.get("start_lon",32.8500))
        self.alt = float(v.get("start_alt_m",900.0)) # Land altitude
        self.speed = float(v.get("speed_kph",40.0))
        self.heading = 90.0
        self.type = v.get("type", "APC")
        self.fuel_pct = 95.0
        self.engine = "RUN"
        self.health_pct = 100.0

        print(f"[VehicleSim] ID={self.id} Target={b['host']}:{b['port']} Topic={self.topic}")

        self.client = mqtt.Client(client_id=f"sim-{self.id}", clean_session=True)
        if b.get("user"): self.client.username_pw_set(b["user"], b.get("pass",""))
        if b.get("tls"):
            import ssl
            self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
        self.host, self.port = b.get("host","localhost"), int(b.get("port",1883))
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): print(f"[VehicleSim] MQTT connected rc={rc}")
    def _on_disconnect(self, c, u, rc): print(f"[VehicleSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[VehicleSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait); wait = min(max_wait, wait*2)

    def _pub(self, obj, qos=1):
        self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def telemetry(self):
        # Alignment: Tank -> FOE, Others -> FRIEND
        is_foe = "tank" in self.id.lower()
        alignment = "FOE" if is_foe else "FRIEND"
        threat = random.randint(50, 95) if is_foe else 0

        return {
            "domain":"vehicle","type":"telemetry","id":self.id,"time":now_iso(),
            "payload":{
                "id": self.id,
                "time": now_iso(),
                "type": self.type,
                "position":{"lat":self.lat,"lon":self.lon,"alt_m":round(self.alt,1)},
                "heading_deg":round(self.heading%360,1),
                "speed_kph":round(self.speed,2),
                "engine":self.engine,
                "fuel_pct":round(self.fuel_pct,1),
                "health_pct":round(self.health_pct,1),
                "alignment": alignment,
                "threat_level": threat
            }
        }

    def step(self,t):
        # Move in square path
        speed_mps = (self.speed * 1000) / 3600
        radius=500.0; omega=speed_mps/radius; ang=omega*t
        north=radius*math.cos(ang)*self.dt*0.5 # Slower movement
        east=radius*math.sin(ang)*self.dt*0.5
        self.lat,self.lon=offset_latlon(self.lat,self.lon,north,east)
        self.heading=(math.degrees(ang)+90)%360
        self.fuel_pct=max(1.0,self.fuel_pct-(self.dt*0.005))
        if self.fuel_pct < 5.0: self.engine = "IDLE"

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
            self.client.loop(1.0); self.client.disconnect(); print("[VehicleSim] stopped.")

def load_cfg(path, args):
    if path and pathlib.Path(path).exists() and yaml:
        with open(path,"r",encoding="utf-8") as f:
            cfg=yaml.safe_load(f)
    else:
        cfg={
            "broker":{"host":args.host,"port":args.port,"user":args.user,"pass":args.password,
                      "tls":args.tls,"cafile":args.cafile},
            "vehicle":{"id":args.id,"rate_hz":args.rate,"start_lat":args.lat,"start_lon":args.lon,
                       "start_alt_m":args.alt,"speed_kph":args.speed,"topic":args.topic}
        }
    return cfg

def parse_args():
    ap=argparse.ArgumentParser()
    ap.add_argument("--config","-c",default="sim-producers/vehicle_sim.yaml")
    ap.add_argument("--host",default="localhost"); ap.add_argument("--port",type=int,default=1883)
    ap.add_argument("--user",default="admin"); ap.add_argument("--password",default="password")
    ap.add_argument("--tls",action="store_true"); ap.add_argument("--cafile",default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id",default="vehicle1"); ap.add_argument("--rate",type=float,default=1.0)
    ap.add_argument("--lat",type=float,default=39.9300); ap.add_argument("--lon",type=float,default=32.8500)
    ap.add_argument("--alt",type=float,default=900.0); ap.add_argument("--speed",type=float,default=40.0)
    ap.add_argument("--topic",default="vehicle/events"); ap.add_argument("--duration",type=float,default=None)
    return ap.parse_args()

if __name__=="__main__":
    args=parse_args()
    cfg=load_cfg(args.config,args)
    VehicleSim(cfg).run(args.duration)
