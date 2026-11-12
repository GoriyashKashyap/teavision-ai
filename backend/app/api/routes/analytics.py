"""Analytics summary endpoint for Phase 5 / Module 5."""

from __future__ import annotations

from fastapi import APIRouter
from app.database.repository import repo

router = APIRouter(tags=["analytics"])


@router.get("/analytics/summary")
async def get_analytics_summary():
    """Return platform prediction statistics and class distributions for researchers."""
    return repo.get_analytics_summary()

