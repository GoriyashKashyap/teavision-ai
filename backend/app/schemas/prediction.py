"""Pydantic schemas for prediction request/response."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TopPrediction(BaseModel):
    class_name: str
    class_index: int
    confidence: float = Field(ge=0.0, le=1.0)


class QualityAssessment(BaseModel):
    quality_rating: str
    is_blurry: bool
    blur_score: float
    brightness: float
    contrast: float
    lighting_condition: str
    lighting_label: str
    dimensions: List[int]
    feedback_tips: List[str]


class PredictionResponse(BaseModel):
    prediction_id:     str
    predicted_class:   str
    class_index:       int
    confidence:        float = Field(ge=0.0, le=1.0)
    top_predictions:   List[TopPrediction]
    probabilities:     List[float]
    inference_time_ms: float
    model_version:     str
    created_at:        str
    image_url:         Optional[str] = None
    quality_assessment: Optional[QualityAssessment] = None
    heatmap_overlay:   Optional[str] = None
    saliency_heatmap:  Optional[str] = None
    explanation_note:  Optional[str] = None
