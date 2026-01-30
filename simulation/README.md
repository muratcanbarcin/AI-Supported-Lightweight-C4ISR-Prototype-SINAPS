# Simulation Module

This module contains all simulation and data generation utilities for the C4ISR system.

## Contents

- **soldier_sim.py** - Soldier biometric and position simulator
- **drone_sim.py** - UAV/Drone telemetry simulator
- **vehicle_sim.py** - Ground vehicle telemetry simulator
- **sim_utils.py** - Shared utilities and scenario definitions
- **data_generator.py** - Full-spectrum training data generator
- **tests/** - Demo and test scripts

## Running Simulators

### Live MQTT Streaming Mode

```bash
cd simulation
python soldier_sim.py --host localhost --port 1883
python drone_sim.py --host localhost --port 1883
python vehicle_sim.py --host localhost --port 1883
```

### Training Data Generation Mode

```bash
cd simulation

# Generate soldier training samples
python soldier_sim.py --training-mode --scenario ROUTINE_PATROL --samples 100

# Generate full-spectrum dataset (all entity types)
python data_generator.py --samples 10000 --output training_data.jsonl
```

## Demo Scripts

The `tests/` directory contains PowerShell demo scripts:

```powershell
cd simulation/tests
.\C4ISR_Full_Demo.ps1
```

> **Note:** Demo scripts require the AI service to be running at `http://127.0.0.1:8000`
