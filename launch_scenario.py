import subprocess
import time
import random
import sys
import signal
import os

# Configuration
NUM_DRONES = 3
NUM_VEHICLES = 5
NUM_SOLDIERS = 5

BASE_LAT = 39.9250
BASE_LON = 32.8500
AREA_SPREAD = 0.05 # degrees

procs = []

def signal_handler(sig, frame):
    print("\nStopping all simulators...")
    for p in procs:
        p.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def launch():
    print(f"Launching Scenario: {NUM_DRONES} Drones, {NUM_VEHICLES} Vehicles, {NUM_SOLDIERS} Soldiers")
    
    # Launch Drones
    for i in range(NUM_DRONES):
        lat = BASE_LAT + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        lon = BASE_LON + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        cmd = [sys.executable, "simulators/sim-producers/drone_sim.py",
               "--id", f"drone_{i+1}",
               "--lat", str(lat), "--lon", str(lon),
               "--rate", "2.0"]
        procs.append(subprocess.Popen(cmd))
        print(f"Started Drone {i+1}")
        time.sleep(0.5)

    # Launch Vehicles
    for i in range(NUM_VEHICLES):
        lat = BASE_LAT + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        lon = BASE_LON + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        speed = random.choice([30, 45, 60, 80])
        cmd = [sys.executable, "simulators/sim-producers/vehicle_sim.py",
               "--id", f"vehicle_{i+1}",
               "--lat", str(lat), "--lon", str(lon),
               "--speed", str(speed),
               "--rate", "1.0"]
        procs.append(subprocess.Popen(cmd))
        print(f"Started Vehicle {i+1}")
        time.sleep(0.5)

    # Launch Soldiers
    for i in range(NUM_SOLDIERS):
        lat = BASE_LAT + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        lon = BASE_LON + random.uniform(-AREA_SPREAD, AREA_SPREAD)
        cmd = [sys.executable, "simulators/sim-producers/soldier_sim.py",
               "--id", f"soldier_{i+1}",
               "--lat", str(lat), "--lon", str(lon),
               "--rate", "1.0"]
        procs.append(subprocess.Popen(cmd))
        print(f"Started Soldier {i+1}")
        time.sleep(0.5)

    print(f"All {len(procs)} simulators running. Press Ctrl+C to stop.")
    
    while True:
        time.sleep(1)

if __name__ == "__main__":
    launch()
