"""Schemas for Context-Aware Diagnostic Engine responses."""

from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class PossibleCause(BaseModel):
    """Possible biological cause with evidence strength."""
    agent: str
    type: Literal["documented", "contributing_factor", "hypothesis", "unverified"]
    evidence: List[str] = Field(default_factory=list)


class ContributingFactor(BaseModel):
    """Environmental factor contributing to condition."""
    factor: str
    strength: Literal["contributing", "primary", "secondary"]


class ConfidenceEvidence(BaseModel):
    """Evidence strength distinct from model confidence."""
    strength: Literal["strong", "moderate", "weak", "insufficient"]
    explanation: str
    model_confidence: float = Field(ge=0.0, le=1.0)
    distinct_from_reasoning: str


class Reference(BaseModel):
    """Scientific reference source."""
    title: str
    year: str
    url: Optional[str] = None


class DiagnosticRecommendation(BaseModel):
    """Recommendations for management."""
    cultural: List[str] = Field(default_factory=list)
    sanitation: List[str] = Field(default_factory=list)
    drainage_canopy: List[str] = Field(default_factory=list)
    biological: List[str] = Field(default_factory=list)
    chemical: List[str] = Field(default_factory=list)


class DiagnosticAssessment(BaseModel):
    """Complete diagnostic assessment combining prediction, explainability,
    field observations, and agricultural knowledge base.

    Provides:
    - Detected category
    - Possible biological cause with evidence strength
    - Supporting evidence from image and observations
    - Contributing environmental factors
    - Missing information that would improve diagnosis
    - Evidence strength (distinct from model confidence)
    - Categorized recommendations
    - Scientific references
    - Expert verification flag
    """
    detected_category: str
    possible_cause: PossibleCause
    supporting_evidence: List[str]
    contributing_factors: List[ContributingFactor]
    missing_information: List[str]
    confidence_evidence: ConfidenceEvidence
    recommendations: DiagnosticRecommendation
    references: List[Reference]
    requires_expert_verification: bool
    last_reviewed_date: str


class DiagnoseRequest(BaseModel):
    """Request for diagnostic assessment."""
    prediction_id: str
    # Field observations are optional - user can add after seeing results
    lighting_condition: Optional[Literal["direct_sunlight", "overcast", "shaded", "indoor_lab", "unknown"]] = None
    leaf_age: Optional[Literal["tender_flush", "maintenance_mature", "old_coarse", "unknown"]] = None
    observation_notes: Optional[str] = Field(default=None, max_length=1000)


class DiagnoseResponse(BaseModel):
    """Response with full diagnostic assessment."""
    diagnosis: DiagnosticAssessment
    prediction_snapshot: dict  # Contains the original prediction details