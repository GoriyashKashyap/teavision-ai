"""
ML model manager — supports multi-model selection across research models:
- LightTeaNet-ECA (Distilled Student - Primary)
- LightTeaNet-SE (Lightweight Student with Squeeze-and-Excitation)
- MobileNetV2 (Empirical Baseline CNN)
- MobileViT-XXS (Vision Transformer Teacher)
- MobileViT-S (Heavy Vision Transformer Teacher)
"""

from __future__ import annotations

import io
import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("teavision.model")

MODELS_DIR = Path("models")

# Safe unpickler mapping CUDA serialized tensors to CPU
class _CPUUnpickler(pickle.Unpickler):
    def find_class(self, module: str, name: str) -> Any:
        if module == "torch.storage" and name == "_load_from_bytes":
            import torch  # noqa: PLC0415
            return lambda b: torch.load(io.BytesIO(b), map_location="cpu", weights_only=False)
        return super().find_class(module, name)


MODEL_CATALOG: Dict[str, Dict[str, Any]] = {
    "lightteanet-eca-kd": {
        "id": "lightteanet-eca-kd",
        "name": "LightTeaNet-ECA",
        "display_name": "LightTeaNet-ECA (KD Student)",
        "architecture": "LightTeaNet-ECA",
        "family": "Student (Distilled)",
        "parameters": 101940,
        "filename": "lightteanet_eca_mobilevit_xxs_kd_torchscript.pt",
        "loader_type": "torchscript",
        "format": "TorchScript (.pt)",
        "is_default": True,
        "badge": "Primary (101K params)",
        "description": "Custom lightweight student CNN with ECA attention, distilled from MobileViT-XXS. Primary research model.",
    },
    "lightteanet-se": {
        "id": "lightteanet-se",
        "name": "LightTeaNet-SE",
        "display_name": "LightTeaNet-SE (Student)",
        "architecture": "LightTeaNet-SE",
        "family": "Student",
        "parameters": 76000,
        "filename": "lightteanet_se_torchscript.pt",
        "loader_type": "torchscript",
        "format": "TorchScript (.pt)",
        "is_default": False,
        "badge": "Ultra-Fast (29ms)",
        "description": "Ultra-lightweight student CNN variant with Squeeze-and-Excitation attention blocks.",
    },
    "mobilenetv2-baseline": {
        "id": "mobilenetv2-baseline",
        "name": "MobileNetV2",
        "display_name": "MobileNetV2 (Baseline)",
        "architecture": "MobileNetV2",
        "family": "Baseline CNN",
        "parameters": 2232839,
        "filename": "mobilenetv2_baseline (1).pth",
        "loader_type": "mobilenet_v2",
        "format": "PyTorch StateDict (.pth)",
        "is_default": False,
        "badge": "Baseline CNN (2.2M)",
        "description": "Standard MobileNetV2 inverted residual network trained directly on tea leaf dataset as an empirical baseline.",
    },
    "mobilevit-xxs": {
        "id": "mobilevit-xxs",
        "name": "MobileViT-XXS",
        "display_name": "MobileViT-XXS (Teacher)",
        "architecture": "MobileViT-XXS",
        "family": "Vision Transformer Teacher",
        "parameters": 953271,
        "filename": "mobilevit_xxs_trained_model (1).pkl",
        "loader_type": "pickle",
        "format": "PyTorch ByobNet (.pkl)",
        "is_default": False,
        "badge": "Teacher (0.95M)",
        "description": "Mobile Vision Transformer (XXS) teacher model combining separable convolutions with multi-head self-attention.",
    },
    "mobilevit-s": {
        "id": "mobilevit-s",
        "name": "MobileViT-S",
        "display_name": "MobileViT-S (Heavy Teacher)",
        "architecture": "MobileViT-S",
        "family": "Vision Transformer Teacher",
        "parameters": 4942119,
        "filename": "mobilevit_s_trained_model (1).pkl",
        "loader_type": "pickle",
        "format": "PyTorch ByobNet (.pkl)",
        "is_default": False,
        "badge": "Heavy Teacher (4.9M)",
        "description": "High-capacity MobileViT-S teacher model with deep transformer blocks for high-representation learning.",
    },
}

DEFAULT_MODEL_ID = "lightteanet-eca-kd"


class ModelManager:
    """Manages multi-model loading, caching, and execution."""

    def __init__(self) -> None:
        self._models: Dict[str, object] = {}
        self.default_id: str = DEFAULT_MODEL_ID
        self.version: str = settings.MODEL_VERSION

    # ------------------------------------------------------------------
    def _resolve_model_path(self, filename: str) -> Path:
        """Locate the model file inside backend/models or configured MODEL_PATH parent."""
        # Try relative to models/
        p = MODELS_DIR / filename
        if p.exists():
            return p
        # Try configured path parent
        p2 = Path(settings.MODEL_PATH).parent / filename
        if p2.exists():
            return p2
        # Try direct file path
        p3 = Path(filename)
        if p3.exists():
            return p3
        return p

    # ------------------------------------------------------------------
    def load(self, model_id: Optional[str] = None) -> object:
        """Load a specific model or the default model into memory."""
        mid = (model_id or self.default_id).lower().strip()
        if mid in self._models:
            return self._models[mid]

        meta = MODEL_CATALOG.get(mid)
        if not meta:
            # Fallback to default if unknown model_id passed
            logger.warning(f"Unknown model_id '{mid}', falling back to '{self.default_id}'")
            mid = self.default_id
            meta = MODEL_CATALOG[mid]
            if mid in self._models:
                return self._models[mid]

        path = self._resolve_model_path(meta["filename"])
        if not path.exists():
            # If default model requested but missing, check settings.MODEL_PATH
            if mid == self.default_id and Path(settings.MODEL_PATH).exists():
                path = Path(settings.MODEL_PATH)
            else:
                raise FileNotFoundError(f"Model file not found: {path.resolve()}")

        logger.info(f"Loading '{meta['name']}' ({mid}) from {path} …")

        try:
            import torch  # noqa: PLC0415

            loader = meta["loader_type"]
            if loader == "torchscript":
                model = torch.jit.load(str(path), map_location="cpu")
            elif loader == "mobilenet_v2":
                import torchvision.models as models  # noqa: PLC0415
                model = models.mobilenet_v2(weights=None, num_classes=7)
                state_dict = torch.load(str(path), map_location="cpu", weights_only=False)
                model.load_state_dict(state_dict)
            elif loader == "pickle":
                import timm  # noqa: PLC0415, F401
                with open(str(path), "rb") as f:
                    model = _CPUUnpickler(f).load()
            else:
                raise ValueError(f"Unsupported loader type: {loader}")

            model.eval()
            self._models[mid] = model
            logger.info(f"Model '{mid}' successfully loaded and set to eval mode.")
            return model
        except Exception as exc:
            logger.error(f"Failed to load model '{mid}': {exc}", exc_info=True)
            raise RuntimeError(f"Failed to load model '{mid}': {exc}") from exc

    # ------------------------------------------------------------------
    def is_loaded(self, model_id: Optional[str] = None) -> bool:
        mid = (model_id or self.default_id).lower().strip()
        return mid in self._models or len(self._models) > 0

    # ------------------------------------------------------------------
    def get_model(self, model_id: Optional[str] = None) -> object:
        """Return the loaded model object (loads lazily if needed)."""
        mid = (model_id or self.default_id).lower().strip()
        if mid not in self._models:
            return self.load(mid)
        return self._models[mid]

    # ------------------------------------------------------------------
    def get_meta(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Return metadata for a model."""
        mid = (model_id or self.default_id).lower().strip()
        meta = MODEL_CATALOG.get(mid)
        if not meta:
            meta = MODEL_CATALOG[self.default_id]
        return meta

    # ------------------------------------------------------------------
    def list_models(self) -> List[Dict[str, Any]]:
        """List all models registered in the catalog and their disk availability."""
        result = []
        for mid, meta in MODEL_CATALOG.items():
            path = self._resolve_model_path(meta["filename"])
            is_avail = path.exists() or (mid == self.default_id and Path(settings.MODEL_PATH).exists())
            result.append({
                "id": meta["id"],
                "name": meta["name"],
                "display_name": meta.get("display_name", meta["name"]),
                "architecture": meta["architecture"],
                "family": meta["family"],
                "parameters": meta["parameters"],
                "format": meta["format"],
                "is_default": meta["is_default"],
                "badge": meta["badge"],
                "description": meta["description"],
                "available": is_avail,
                "is_loaded": mid in self._models,
            })
        return result


# Shared singleton
model_manager = ModelManager()
