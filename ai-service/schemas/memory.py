"""
Memory/RAG Schemas
Defines structures for ingesting and retrieving tactical memory
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ContextItem(BaseModel):
    """A single context item retrieved from tactical memory"""
    id: Optional[int] = None
    event_description: str
    outcome: str
    similarity_score: float = Field(ge=0, le=1)
    timestamp: Optional[datetime] = None
    source_platform: Optional[str] = None
    threat_category: Optional[str] = None


class IngestRequest(BaseModel):
    """Request to ingest a new tactical event into memory"""
    event_description: str = Field(
        ..., 
        min_length=10,
        description="Detailed description of the tactical event"
    )
    outcome: str = Field(
        ..., 
        min_length=10,
        description="The confirmed correct action/response taken"
    )
    source_platform: Optional[str] = Field(
        None,
        description="Platform/sensor that detected the event"
    )
    threat_category: Optional[str] = Field(
        None,
        description="Threat classification (HOSTILE, UNKNOWN, FRIENDLY)"
    )
    confidence_score: float = Field(
        default=0.0,
        ge=0,
        le=1,
        description="Confidence in the outcome correctness"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_description": "Unidentified drone detected at 1000m altitude, erratic flight pattern, no transponder signal",
                "outcome": "Deployed counter-drone system, captured drone for analysis, identified as civilian hobby drone off-course",
                "source_platform": "AIR-DEFENSE-RADAR-03",
                "threat_category": "UNKNOWN",
                "confidence_score": 0.95
            }
        }


class IngestResponse(BaseModel):
    """Response after successfully ingesting an event"""
    success: bool
    event_id: int
    message: str
    embedding_generated: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "event_id": 42,
                "message": "Event successfully ingested into tactical memory",
                "embedding_generated": True
            }
        }


class RetrieveRequest(BaseModel):
    """Request to retrieve similar historical events"""
    query: str = Field(..., min_length=5, description="Query text for similarity search")
    limit: int = Field(default=3, ge=1, le=20, description="Maximum number of results")
    min_similarity: float = Field(
        default=0.0, 
        ge=0, 
        le=1, 
        description="Minimum similarity threshold"
    )
    threat_category_filter: Optional[str] = Field(
        None,
        description="Filter by threat category"
    )


class RetrieveResponse(BaseModel):
    """Response containing similar historical events"""
    results: List[ContextItem]
    query_processed: str
    total_found: int
    search_time_ms: float
