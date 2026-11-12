"""Field observation schema for Phase 4 / Module 7."""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


class FieldObservationPayload(BaseModel):
    prediction_id: str
    plantation_name: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lighting_condition: Optional[Literal["direct_sunlight", "overcast", "shaded", "indoor_lab", "unknown"]] = "unknown"
    leaf_age: Optional[Literal["tender_flush", "maintenance_mature", "old_coarse", "unknown"]] = "unknown"
    observation_notes: Optional[str] = Field(default=None, max_length=1000)

