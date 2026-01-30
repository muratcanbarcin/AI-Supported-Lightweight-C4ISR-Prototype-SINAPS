"""
C4ISR Simulation Module

Contains simulators for:
- Soldier biometric telemetry
- Drone/UAV operational telemetry
- Ground vehicle telemetry

Also includes data generation utilities for AI training.
"""

from pathlib import Path

# Module root path
SIMULATION_ROOT = Path(__file__).parent

__all__ = ['SIMULATION_ROOT']
