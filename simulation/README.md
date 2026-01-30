# Simulation Module

This module contains all simulation, data generation, and contract definitions for the C4ISR system.

## Structure

```
simulation/
├── soldier_sim.py      # Soldier biometric and position simulator
├── drone_sim.py        # UAV/Drone telemetry simulator
├── vehicle_sim.py      # Ground vehicle telemetry simulator
├── sim_utils.py        # Shared utilities and scenario definitions
├── data_generator.py   # Full-spectrum training data generator
│
├── data/               # Generated training datasets
│   ├── real_world_train_data.jsonl  # 10K+ training samples (12MB)
│   └── test_dataset.jsonl           # Test/validation samples
│
├── contracts/          # JSON Schema definitions
│   ├── schemas/        # Schema files for validation
│   └── samples/        # Example payloads
│
└── tests/              # Demo and test scripts
    └── C4ISR_Full_Demo.ps1
```

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
python data_generator.py --samples 10000 --output data/new_training_data.jsonl
```

## Demo Scripts

The `tests/` directory contains PowerShell demo scripts:

```powershell
cd simulation/tests
.\C4ISR_Full_Demo.ps1
```

> **Note:** Demo scripts require the AI service to be running at `http://127.0.0.1:8000`

## Training Data

Pre-generated training data is stored in `data/`:

| File | Size | Description |
|------|------|-------------|
| `real_world_train_data.jsonl` | ~12MB | Full-spectrum dataset with 10K+ samples |
| `test_dataset.jsonl` | ~120KB | Smaller test/validation set |

