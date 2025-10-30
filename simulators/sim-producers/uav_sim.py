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

class UAVSim:
    def __init__(self, cfg):
        b = cfg["broker"]; u = cfg["uav"]
        self.topic = u.get("topic","drone/events")
        self.id = u.get("id","drone1")
        self.dt = 1.0/float(u.get("rate_hz",2.0))
        self.lat = float(u.get("start_lat",39.9260))
        self.lon = float(u.get("start_lon",32.8420))
        self.alt = float(u.get("start_alt_m",300.0))
        self.speed = float(u.get("speed_mps",14.0))
        self.heading = 270.0
        self.mode = "AUTO"
        self.soc_pct = 80.0

        self.client = mqtt.Client(client_id=f"sim-{self.id}", clean_session=True)
        if b.get("user"): self.client.username_pw_set(b["user"], b.get("pass",""))
        if b.get("tls"):
            import ssl
            self.client.tls_set(ca_certs=b.get("cafile"), cert_reqs=ssl.CERT_REQUIRED)
        self.host, self.port = b.get("host","localhost"), int(b.get("port",1883))
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc): print(f"[UAVSim] MQTT connected rc={rc}")
    def _on_disconnect(self, c, u, rc): print(f"[UAVSim] MQTT disconnected rc={rc}")

    def connect_with_backoff(self, max_wait=10):
        wait = 1
        while True:
            try:
                self.client.connect(self.host, self.port, keepalive=30)
                return
            except Exception as e:
                print(f"[UAVSim] connect failed: {e}; retry {wait}s")
                time.sleep(wait); wait = min(max_wait, wait*2)

    def _pub(self, obj, qos=1):
        self.client.publish(self.topic, json.dumps(obj, ensure_ascii=False), qos=qos)

    def telemetry(self):
        return {
            "domain":"drone","type":"telemetry","id":self.id,"time":now_iso(),
            "payload":{
                "position":{"lat":self.lat,"lon":self.lon,"alt_m":round(self.alt,1)},
                "yaw_deg":round(self.heading%360,1),
                "ground_speed_mps":round(self.speed,2),
                "mode":self.mode,
                "battery":{"soc_pct":round(self.soc_pct,1)}
            }
        }

    def maybe_detection(self):
        if random.random()<0.10:
            return {
                "domain":"drone","type":"detection","id":f"{self.id}-eo","time":now_iso(),
                "payload":{
                    "sensor_id":f"{self.id}-eo","target_type":"UAS",
                    "position":{"lat":self.lat+random.uniform(-0.0006,0.0006),
                                "lon":self.lon+random.uniform(-0.0006,0.0006),
                                "alt_m":round(self.alt+random.uniform(-10,10),1)},
                    "velocity_mps":round(self.speed+random.uniform(-2,2),1),
                    "heading_deg":round((self.heading+random.uniform(-5,5))%360,1),
                    "confidence_pct":round(random.uniform(0.7,0.95),2)
                }
            }

    def maybe_alert(self):
        if 18.0 < self.soc_pct < 20.0 and not getattr(self,"_alerted",False):
            self._alerted=True
            return {
                "domain":"drone","type":"alert","id":f"al-{self.id}-lowbat","time":now_iso(),
                "payload":{"severity":"WARNING","title":"Düşük pil","category":"POWER",
                           "description":f"Batarya %{self.soc_pct:.1f}",
                           "related":{"uav_id":self.id}}
            }

    def step(self,t):
        radius=250.0; omega=self.speed/radius; ang=omega*t
        north=radius*math.cos(ang)*self.dt; east=radius*math.sin(ang)*self.dt
        self.lat,self.lon=offset_latlon(self.lat,self.lon,north,east)
        self.heading=(math.degrees(ang)+90)%360
        self.soc_pct=max(5.0,self.soc_pct-(self.dt*0.02))

    def run(self, duration=None):
        print(f"[UAVSim] publish to mqtt://{self.host}:{self.port} topic={self.topic} id={self.id}")
        self.connect_with_backoff()
        t=0.0
        try:
            while True:
                self.step(t)
                self._pub(self.telemetry())
                det=self.maybe_detection()
                if det:self._pub(det)
                al=self.maybe_alert()
                if al:self._pub(al)
                self.client.loop(timeout=0.1)
                time.sleep(self.dt); t+=self.dt
                if duration and t>=duration: break
        except KeyboardInterrupt:
            pass
        finally:
            self.client.loop(1.0); self.client.disconnect(); print("[UAVSim] stopped.")

def load_cfg(path, args):
    # yaml varsa onu, yoksa argümanları kullan
    if path and pathlib.Path(path).exists() and yaml:
        with open(path,"r",encoding="utf-8") as f:
            cfg=yaml.safe_load(f)
    else:
        cfg={
            "broker":{"host":args.host,"port":args.port,"user":args.user,"pass":args.password,
                      "tls":args.tls,"cafile":args.cafile},
            "uav":{"id":args.id,"rate_hz":args.rate,"start_lat":args.lat,"start_lon":args.lon,
                   "start_alt_m":args.alt,"speed_mps":args.speed,"topic":args.topic}
        }
    return cfg

def parse_args():
    ap=argparse.ArgumentParser()
    ap.add_argument("--config","-c",default="sim-producers/uav_sim.yaml")
    ap.add_argument("--host",default="localhost"); ap.add_argument("--port",type=int,default=1883)
    ap.add_argument("--user",default="emiran"); ap.add_argument("--password",default="734574")
    ap.add_argument("--tls",action="store_true"); ap.add_argument("--cafile",default="mqtt/conf/certs/server.crt")
    ap.add_argument("--id",default="drone1"); ap.add_argument("--rate",type=float,default=2.0)
    ap.add_argument("--lat",type=float,default=39.9260); ap.add_argument("--lon",type=float,default=32.8420)
    ap.add_argument("--alt",type=float,default=300.0); ap.add_argument("--speed",type=float,default=14.0)
    ap.add_argument("--topic",default="drone/events"); ap.add_argument("--duration",type=float,default=None)
    return ap.parse_args()

if __name__=="__main__":
    args=parse_args()
    cfg=load_cfg(args.config,args)
    UAVSim(cfg).run(args.duration)
