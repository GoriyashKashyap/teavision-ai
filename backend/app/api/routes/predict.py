"""Prediction API endpoint."""

from __future__ import annotations

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.database.repository import repo
from app.ml.model import model_manager
from app.ml.predictor import run_prediction
from app.schemas.prediction import PredictionResponse

logger = logging.getLogger("teavision.routes.predict")

router = APIRouter(tags=["prediction"])

ACCEPTED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict(
    file: Annotated[UploadFile, File(description="Tea leaf image (JPEG, PNG, WebP)")],
    model_id: Optional[str] = Form(default=None, description="Model ID to use for inference"),
):
    """Run disease detection on a single tea leaf image.

    Returns the predicted class, confidence score, top-3 predictions,
    full probability distribution and inference metadata.
    """
    # --- Model availability -------------------------------------------------
    if not model_manager.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The inference model is not loaded. "
                "Please place the model artifact at the configured path and restart the service."
            ),
        )

    # --- File type validation -----------------------------------------------
    if file.content_type not in ACCEPTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: '{file.content_type}'. Please upload a JPEG, PNG, or WebP image.",
        )

    # --- Read and size-check ------------------------------------------------
    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )

    # --- Inference ----------------------------------------------------------
    try:
        result = run_prediction(image_bytes, model_id=model_id)
        # Persist prediction record
        repo.save_prediction(
            prediction_id=result.prediction_id,
            predicted_class=result.predicted_class,
            class_index=result.class_index,
            confidence=result.confidence,
            probabilities=result.probabilities,
            top_predictions=[p.model_dump() for p in result.top_predictions],
            inference_time_ms=result.inference_time_ms,
            model_version=result.model_version,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not process image: {exc}",
        )
    except RuntimeError as exc:
        logger.error(f"Inference error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference failed. Please try again.",
        )

    return result
