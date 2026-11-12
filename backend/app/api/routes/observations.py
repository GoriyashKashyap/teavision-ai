"""Field observations API route for research data collection."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status
from app.database.repository import repo
from app.schemas.observation import FieldObservationPayload

logger = logging.getLogger("teavision.routes.observations")
router = APIRouter(tags=["field_observations"])


@router.post("/field-observations", status_code=status.HTTP_201_CREATED)
async def create_field_observation(payload: FieldObservationPayload):
    """Save an optional field observation associated with a prediction."""
    # Verify prediction exists
    pred = repo.get_prediction(payload.prediction_id)
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction '{payload.prediction_id}' not found.",
        )

    obs_id = repo.save_field_observation(
        prediction_id=payload.prediction_id,
        plantation_name=payload.plantation_name,
        district=payload.district,
        latitude=payload.latitude,
        longitude=payload.longitude,
        lighting_condition=payload.lighting_condition,
        leaf_age=payload.leaf_age,
        observation_notes=payload.observation_notes,
    )

    logger.info(f"Recorded field observation {obs_id} for prediction {payload.prediction_id}")
    return {"id": obs_id, "status": "recorded"}

