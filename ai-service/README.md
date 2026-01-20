# C4ISR AI Microservice

> ⚠️ **SECURE MODE**: This service operates in AIR-GAPPED mode with NO internet connectivity.

AI-powered tactical decision support service using RAG (Retrieval-Augmented Generation) and LoRA fine-tuning.

## Features

- **Instant Reaction (RAG)**: Retrieve similar historical tactical events from PostgreSQL (pgvector) for context-aware decisions
- **Long-Term Adaptation (LoRA)**: Fine-tune the model with accumulated tactical data
- **4-bit Quantization**: Lightweight execution using BitsAndBytes quantization
- **Air-Gapped Operation**: All models loaded from local directory - NO external network calls

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURE ENVIRONMENT                       │
│                   (No Internet Access)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  local_models/  │     │     AI Microservice         │   │
│  │  ├── llm/       │────▶│  • FastAPI                  │   │
│  │  └── embedding/ │     │  • RAG Engine               │   │
│  └─────────────────┘     │  • Model Engine             │   │
│                          └─────────────────────────────┘   │
│                                      │                      │
│                          ┌───────────▼───────────┐         │
│                          │  PostgreSQL + pgvector│         │
│                          └───────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **PostgreSQL with pgvector**: Run the `postgres/init-vector.sql` script
2. **Local Models**: Downloaded via `download_models.py` on internet-connected machine
3. **CUDA-capable GPU**: Recommended for model inference

## Setup (Air-Gapped Deployment)

### Step 1: Download Models (ON INTERNET-CONNECTED MACHINE)
```bash
# On a machine WITH internet access:
export HF_TOKEN=your_huggingface_token
python download_models.py

# This creates:
# ./local_models/llm/       - Gemma-2-2b-it model
# ./local_models/embedding/ - all-MiniLM-L6-v2 model
```

### Step 2: Transfer Models
```bash
# Copy the local_models folder to secure environment via approved media
# Folder size: ~5-10 GB
```

### Step 3: Initialize Database (ON SECURE ENVIRONMENT)
```bash
psql -U admin -d c4isr_db -f ../postgres/init-vector.sql
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Run the Service
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST `/analyze`
Analyze telemetry data and get tactical decision.

```json
{
  "telemetry": {
    "platform_id": "RADAR-ALPHA-01",
    "platform_type": "RADAR_STATION",
    "contact_bearing": 45,
    "contact_range_nm": 50,
    "contact_altitude_m": 5000,
    "contact_speed_knots": 450,
    "classification": "UNKNOWN"
  }
}
```

### POST `/ingest`
Save a confirmed event to tactical memory.

```json
{
  "event_description": "Unidentified aircraft detected...",
  "outcome": "Scrambled interceptors, identified as friendly...",
  "threat_category": "UNKNOWN"
}
```

### POST `/train`
Trigger LoRA fine-tuning (background task).

```json
{
  "training_examples": [
    {
      "instruction": "Analyze radar contact",
      "input_data": "Unknown aircraft, no IFF...",
      "output": "THREAT LEVEL: HIGH..."
    }
  ],
  "epochs": 3
}
```

## Architecture

```
ai-service/
├── main.py              # FastAPI application
├── config/
│   ├── settings.py      # Configuration management
│   └── database.py      # PostgreSQL connection pool
├── services/
│   ├── rag_engine.py    # Vector search & embeddings
│   └── model_engine.py  # LLM with LoRA
├── schemas/             # Pydantic models
└── adapters/            # Saved LoRA adapters
```
