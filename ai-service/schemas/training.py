"""
Training Schemas
Defines structures for LoRA fine-tuning requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class TrainingStatus(str, Enum):
    """Status of a training job"""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TrainingExample(BaseModel):
    """A single training example for LoRA fine-tuning"""
    instruction: str = Field(
        ...,
        min_length=10,
        description="The tactical situation/context as instruction"
    )
    input_data: str = Field(
        ...,
        min_length=5,
        description="The telemetry or event data"
    )
    output: str = Field(
        ...,
        min_length=10,
        description="The expected/correct response"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "instruction": "Analyze the following radar contact and provide tactical recommendations",
                "input_data": "Contact: Unknown aircraft, bearing 090, range 50nm, altitude 25000ft, speed 500kts, no IFF",
                "output": "THREAT LEVEL: HIGH. Recommend scrambling interceptors, attempt radio contact on guard frequency, prepare air defense systems. Rationale: High-speed aircraft in controlled airspace without IFF response indicates potential hostile intent."
            }
        }


class TrainingRequest(BaseModel):
    """Request to start LoRA fine-tuning"""
    training_examples: List[TrainingExample] = Field(
        ...,
        min_length=1,
        description="List of training examples for fine-tuning"
    )
    epochs: int = Field(default=3, ge=1, le=10, description="Number of training epochs")
    learning_rate: float = Field(default=2e-4, gt=0, lt=1, description="Learning rate")
    batch_size: int = Field(default=4, ge=1, le=32, description="Training batch size")
    lora_rank: Optional[int] = Field(default=None, ge=4, le=64, description="LoRA rank (uses default if not specified)")
    save_adapter_name: str = Field(
        default="tactical_adapter",
        description="Name for saving the LoRA adapter"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "training_examples": [
                    {
                        "instruction": "Analyze radar contact and recommend action",
                        "input_data": "Unknown aircraft, no IFF, heading towards restricted airspace",
                        "output": "THREAT LEVEL: HIGH. Scramble interceptors..."
                    }
                ],
                "epochs": 3,
                "learning_rate": 0.0002,
                "batch_size": 4,
                "save_adapter_name": "tactical_adapter_v1"
            }
        }


class TrainingResponse(BaseModel):
    """Response for training request"""
    job_id: str = Field(..., description="Unique training job identifier")
    status: TrainingStatus
    message: str
    started_at: Optional[datetime] = None
    estimated_duration_minutes: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "train_001_20240120_120000",
                "status": "RUNNING",
                "message": "Training started with 50 examples",
                "started_at": "2024-01-20T12:00:00Z",
                "estimated_duration_minutes": 15.5
            }
        }


class TrainingStatusResponse(BaseModel):
    """Response for training status check"""
    job_id: str
    status: TrainingStatus
    progress_percent: float = Field(ge=0, le=100)
    current_epoch: Optional[int] = None
    total_epochs: Optional[int] = None
    current_loss: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    adapter_path: Optional[str] = None
