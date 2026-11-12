"""Model metadata endpoint."""

from fastapi import APIRouter
from app.ml.classes import DISEASE_CLASSES
from app.ml.model import model_manager


router = APIRouter(tags=["model"])


@router.get("/model/info", response_model=dict)
async def model_info():
    """Return information about the loaded ML model."""
    return {
        "name": "LightTeaNet-ECA",
        "version": model_manager.version,
        "architecture": "Lightweight depthwise‑separable CNN with Efficient Channel Attention (ECA)",
        "parameters": 101940,
        "classes": DISEASE_CLASSES,
        "input_size": [224, 224],
        "status": "ready" if model_manager.is_loaded() else "loading",
    }
