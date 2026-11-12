"""Feedback endpoint."""

from __future__ import annotations

import logging
from fastapi import APIRouter
from app.database.repository import repo
from app.schemas.feedback import FeedbackPayload

logger = logging.getLogger("teavision.routes.feedback")
router = APIRouter(tags=["feedback"])


@router.post("/feedback", status_code=204)
async def submit_feedback(payload: FeedbackPayload):
    """Store user feedback on a prediction."""
    logger.info(
        f"Recording feedback for {payload.prediction_id}: {payload.user_assessment}"
    )
    repo.save_feedback(
        prediction_id=payload.prediction_id,
        user_assessment=payload.user_assessment,
        comments=payload.comments,
    )
    return