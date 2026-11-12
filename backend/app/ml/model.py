"""
ML model manager — loads the TorchScript artifact once at startup.
Inference endpoints check is_loaded() before attempting prediction.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("teavision.model")


class ModelManager:
    """Singleton that owns the loaded TorchScript model."""

    def __init__(self) -> None:
        self._model: Optional[object] = None
        self.version: str = settings.MODEL_VERSION

    # ------------------------------------------------------------------
    def load(self) -> None:
        """Load the TorchScript model from disk.

        Raises FileNotFoundError if the artifact is missing.
        Raises RuntimeError if the model fails to load for any other reason.
        """
        try:
            import torch  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "PyTorch is not installed. "
                "Install it with: pip install torch --index-url https://download.pytorch.org/whl/cpu"
            ) from exc

        path = Path(settings.MODEL_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {path.resolve()}. "
                "Please place lightteanet_eca_mobilevit_xxs_kd.pt in backend/models/ ."
            )

        logger.info(f"Loading model from {path} …")
        try:
            self._model = torch.jit.load(str(path), map_location="cpu")
            self._model.eval()  # type: ignore[union-attr]
            logger.info("Model loaded and set to eval mode.")
        except Exception as exc:
            self._model = None
            raise RuntimeError(f"Failed to load TorchScript model: {exc}") from exc

    # ------------------------------------------------------------------
    def is_loaded(self) -> bool:
        return self._model is not None

    # ------------------------------------------------------------------
    def get_model(self):
        """Return the loaded model or raise if unavailable."""
        if self._model is None:
            raise RuntimeError("Model is not loaded.")
        return self._model


# Shared singleton — imported by routes and services
model_manager = ModelManager()
