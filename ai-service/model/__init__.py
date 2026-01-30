"""
C4ISR AI Model Module

This module contains:
- model_engine.py: The core AI model handler (Gemma-9b with LoRA adapters)
- adapters/: Directory containing fine-tuned LoRA adapters
"""

from .model_engine import model_engine, ModelEngine

__all__ = ['model_engine', 'ModelEngine']
