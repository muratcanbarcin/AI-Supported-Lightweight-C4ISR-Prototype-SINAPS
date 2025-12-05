# tools/sub_test.py  (DEBUG)
import os, time, sys, traceback
import paho.mqtt.client as mqtt

H = os.getenv("MQTT_HOST", "127.0.0.1")
P = int(os.getenv("MQTT_PORT", "8883"))
CA = os.getenv("MQTT_CAFILE", "simulators/mqtt/conf/certs/ca.crt")
CC = os.getenv("MQTT_CLIENT_CERT", "simulators/mqtt/conf/certs/drone1.crt")
CK = os.getenv("MQTT_CLIENT_KEY", "simulators/mqtt/conf/certs/drone1.key")

cid = f"drone1-sub-{int(time.time())}"

print("[SUB] starting with:")
print(" host=", H, " port=", P)
print(" ca=", CA)
print(" cert=", CC)
print(" key=", CK)
print(" client_id=", cid)

cli = mqtt.Client(
    client_id=cid,
    protocol=mqtt.MQTTv5,
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
)
cli.enable_logger()  # paho internal logs
cli.tls_set(ca_certs=CA, certfile=CC, keyfile=CK)
cli.tls_insecure_set(False)

def on_connect(c,u,flags,rc,props=None):
    print(f"[SUB] connected rc={rc}, subscribing…")
    c.subscribe("drone/drone1/#", qos=1)
    c.subscribe("link16/#", qos=1)
    c.subscribe("#", qos=0)   # geçici debug: her şeyi dinle

def on_subscribe(c,u,mid,granted_qos,props=None):
    print(f"[SUB] suback mid={mid}, qos={granted_qos}")


def on_message(c,u,m):
    try:
        print("[MSG]", m.topic, m.payload.decode("utf-8")[:300])
    except Exception:
        print("[MSG-BIN]", m.topic, m.payload[:60])

def on_disconnect(c,u,rc,props=None):
    print(f"[SUB] disconnected rc={rc}")

cli.on_connect = on_connect
cli.on_message = on_message
cli.on_disconnect = on_disconnect
cli.on_subscribe = on_subscribe


try:
    cli.reconnect_delay_set(min_delay=1, max_delay=10)
    cli.connect(H, P, keepalive=60)
    cli.loop_forever()
except Exception as e:
    print("[SUB-ERROR]", e)
    traceback.print_exc()
    sys.exit(1)
