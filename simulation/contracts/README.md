# Telemetry Contracts

JSON Schema definitions and example payloads for C4ISR telemetry data.

## Structure

```
contracts/
├── schemas/        # JSON Schema definitions
│   ├── drone.telemetry.schema.json
│   ├── drone.alert.schema.json
│   ├── drone.detection.schema.json
│   ├── vehicle.telemetry.schema.json
│   ├── vehicle.alert.schema.json
│   ├── vehicle.detection.schema.json
│   ├── watch.telemetry.schema.json
│   ├── watch.alert.schema.json
│   └── watch.detection.schema.json
│
└── samples/        # Example payloads
    ├── drone.telemetry.example.json
    ├── vehicle.telemetry.example.json
    └── watch.telemetry.example.json
```

## Usage

These schemas define the expected format for MQTT messages between simulators and the backend.

### Validation Example (Python)

```python
import json
import jsonschema

with open('schemas/drone.telemetry.schema.json') as f:
    schema = json.load(f)

payload = {"domain": "drone", "type": "telemetry", ...}
jsonschema.validate(payload, schema)
```
