"""Context-Aware Diagnostic Engine API endpoint.

POST /api/v1/diagnose — combines prediction + field observations + knowledge base
to produce a structured diagnostic assessment.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from app.database.repository import repo
from app.ml.diagnostic_engine import generate_diagnostic_assessment
from app.schemas.diagnostic import DiagnoseRequest, DiagnoseResponse, DiagnosticAssessment
from app.schemas.observation import FieldObservationPayload
from app.schemas.prediction import PredictionResponse

logger = logging.getLogger("teavision.routes.diagnose")
router = APIRouter(tags=["diagnostics"])


@router.post("/diagnose", response_model=DiagnoseResponse, status_code=status.HTTP_200_OK)
async def diagnose(payload: DiagnoseRequest):
    """Generate a context-aware diagnostic assessment for a prediction.

    Combines:
    - Model prediction and class probabilities
    - Grad-CAM visual explanation (already in prediction)
    - Optional user-provided field observations
    - Structured agricultural knowledge base
    - Rule-based diagnostic reasoning

    Returns structured diagnostic assessment with possible causes,
    evidence strengths, recommendations, and expert verification flag.
    """
    # 1. Retrieve the stored prediction
    stored = repo.get_prediction(payload.prediction_id)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction '{payload.prediction_id}' not found.",
        )

    # 2. Reconstruct PredictionResponse from stored data
    prediction = PredictionResponse(
        prediction_id=stored["prediction_id"],
        predicted_class=stored["predicted_class"],
        class_index=stored["class_index"],
        confidence=stored["confidence"],
        top_predictions=stored["top_predictions"],
        probabilities=stored["probabilities"],
        inference_time_ms=stored["inference_time_ms"],
        model_version=stored["model_version"],
        created_at=stored["created_at"],
        # Heatmap/quality are computed at inference time; not persisted in DB
    )

    # 3. Build optional field observation payload
    field_obs = None
    if payload.lighting_condition or payload.leaf_age or payload.observation_notes:
        field_obs = FieldObservationPayload(
            prediction_id=payload.prediction_id,
            lighting_condition=payload.lighting_condition or "unknown",
            leaf_age=payload.leaf_age or "unknown",
            observation_notes=payload.observation_notes,
        )

    # 4. Generate diagnostic assessment
    try:
        assessment_dict = generate_diagnostic_assessment(prediction, field_obs)
    except Exception as exc:
        logger.error(f"Diagnostic engine failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate diagnostic assessment. Please try again.",
        )

    # 5. Validate and return
    diagnosis = DiagnosticAssessment(**assessment_dict)

    return DiagnoseResponse(
        diagnosis=diagnosis,
        prediction_snapshot={
            "prediction_id": stored["prediction_id"],
            "predicted_class": stored["predicted_class"],
            "confidence": stored["confidence"],
            "top_predictions": stored["top_predictions"],
            "created_at": stored["created_at"],
        },
    )


@router.get("/diagnose/{prediction_id}", response_model=DiagnoseResponse, status_code=status.HTTP_200_OK)
async def diagnose_get(prediction_id: str):
    """GET diagnostic assessment for a prediction (no new field observations).

    Useful for re-evaluating a previous prediction without adding new data.
    """
    stored = repo.get_prediction(prediction_id)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction '{prediction_id}' not found.",
        )

    prediction = PredictionResponse(
        prediction_id=stored["prediction_id"],
        predicted_class=stored["predicted_class"],
        class_index=stored["class_index"],
        confidence=stored["confidence"],
        top_predictions=stored["top_predictions"],
        probabilities=stored["probabilities"],
        inference_time_ms=stored["inference_time_ms"],
        model_version=stored["model_version"],
        created_at=stored["created_at"],
    )

    # Use stored field observation if available
    field_obs = None
    if stored.get("field_observation"):
        fo = stored["field_observation"]
        field_obs = FieldObservationPayload(
            prediction_id=prediction_id,
            plantation_name=fo.get("plantation_name"),
            district=fo.get("district"),
            lighting_condition=fo.get("lighting_condition") or "unknown",
            leaf_age=fo.get("leaf_age") or "unknown",
            observation_notes=fo.get("observation_notes"),
        )

    try:
        assessment_dict = generate_diagnostic_assessment(prediction, field_obs)
    except Exception as exc:
        logger.error(f"Diagnostic engine failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate diagnostic assessment.",
        )

    diagnosis = DiagnosticAssessment(**assessment_dict)

    return DiagnoseResponse(
        diagnosis=diagnosis,
        prediction_snapshot={
            "prediction_id": stored["prediction_id"],
            "predicted_class": stored["predicted_class"],
            "confidence": stored["confidence"],
            "top_predictions": stored["top_predictions"],
            "created_at": stored["created_at"],
        },
    )