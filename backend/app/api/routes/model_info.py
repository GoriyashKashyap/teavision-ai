"""Model metadata & catalog endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Query
from app.ml.classes import DISEASE_CLASSES
from app.ml.model import model_manager

router = APIRouter(tags=["model"])


@router.get("/models", response_model=List[dict])
async def list_models():
    """Return all available models in the catalog and their deployment status."""
    return model_manager.list_models()


@router.get("/model/info", response_model=dict)
async def model_info(model_id: Optional[str] = Query(default=None, description="Optional model ID")):
    """Return detailed metadata about a specific or default ML model."""
    meta = model_manager.get_meta(model_id)
    return {
        "id": meta["id"],
        "name": meta["name"],
        "display_name": meta.get("display_name", meta["name"]),
        "version": meta["name"],
        "architecture": meta["architecture"],
        "family": meta["family"],
        "parameters": meta["parameters"],
        "format": meta["format"],
        "badge": meta["badge"],
        "description": meta["description"],
        "classes": DISEASE_CLASSES,
        "input_size": [224, 224],
        "status": "ready" if model_manager.is_loaded(meta["id"]) else "available",
    }
