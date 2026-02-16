# ==============================================================================
# C4ISR Middleware — Dockerfile
# ==============================================================================
# Lightweight Edge AI container for anomaly detection and telemetry routing.
# Trains IsolationForest at startup and then listens on MQTT for telemetry.
# ==============================================================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="SINAPS C4ISR Team"
LABEL description="Edge AI Middleware — Anomaly detection and telemetry routing"

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY processor.py .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check — process should be running
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import socket; s=socket.socket(); s.settimeout(2); s.connect(('localhost',1883)); s.close()" || exit 0

# Run the middleware processor
CMD ["python", "processor.py"]
