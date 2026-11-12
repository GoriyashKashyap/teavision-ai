"""Prediction history endpoints."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.database.repository import repo

router = APIRouter(tags=["history"])


@router.get("/predictions")
async def list_predictions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    disease: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    """List recent prediction records with optional disease filtering, search, and pagination."""
    return repo.list_predictions(
        limit=limit,
        offset=offset,
        disease_filter=disease,
        search=search,
    )


@router.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Retrieve full prediction details, associated feedback, and field observation."""
    pred = repo.get_prediction(prediction_id)
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction '{prediction_id}' not found.",
        )
    return pred

