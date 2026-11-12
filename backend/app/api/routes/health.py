"""Health and readiness endpoint."""

from datetime import UTC, datetime
from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.ml.model import model_manager


router = APIRouter(tags=["health"])


@router.get("/health", response_model=dict)
async def health_check():
    """Return service health and readiness status."""
    is_healthy = model_manager.is_loaded()
    return {
        "status": "healthy" if is_healthy else "degraded",
        "model_loaded": is_healthy,
        "version": "0.1.0",
        "timestamp": datetime.now(UTC).isoformat(),
        "debug": settings.DEBUG,
    }


@router.get("/ready")
async def ready_check():
    """Kubernetes readiness probe endpoint."""
    if not model_manager.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"ready": True}
