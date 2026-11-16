"""Explainable AI (XAI) module for TeaVision AI.
Generates gradient-based visual saliency heatmaps and overlays showing which leaf regions
most heavily influenced the LightTeaNet-ECA prediction.
"""

from __future__ import annotations

import base64
import io
import logging
from typing import Dict, Tuple
import numpy as np
from PIL import Image, ImageFilter
import torch

from app.ml.model import model_manager

logger = logging.getLogger("teavision.explainability")


def _apply_jet_colormap(normalized_2d: np.ndarray) -> Image.Image:
    """Map a 2D float array in [0, 1] to a RGB heatmap image using a smooth colormap."""
    val = np.clip(normalized_2d, 0.0, 1.0)
    # Jet colormap formula: Blue -> Cyan -> Green -> Yellow -> Red
    r = np.clip(1.5 - np.abs(val * 4.0 - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(val * 4.0 - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(val * 4.0 - 1.0), 0.0, 1.0)

    rgb = (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)
    return Image.fromarray(rgb)


def generate_attention_heatmap(
    image_bytes: bytes,
    class_index: int,
    tensor: torch.Tensor,
    model: Optional[object] = None,
    model_name: str = "LightTeaNet-ECA",
) -> Dict[str, str]:
    """Generate visual explanation heatmaps for the given class prediction.

    Args:
        image_bytes: Raw image bytes from the user upload.
        class_index: Target category index (0 to 6) to explain.
        tensor: The preprocessed float tensor (1, 3, 224, 224).
        model: Optional model instance to use (defaults to active model).
        model_name: Display name of the model for the scientific note.

    Returns:
        Dict with 'heatmap_overlay', 'saliency_heatmap' (base64 data URLs)
        and 'explanation_note'.
    """
    if model is None:
        model = model_manager.get_model()

    # Clone tensor and enable gradients
    input_tensor = tensor.clone().detach()
    input_tensor.requires_grad = True

    with torch.enable_grad():
        logits = model(input_tensor)
        target_score = logits[0, class_index]
        grads = torch.autograd.grad(target_score, input_tensor)[0]

    # Calculate absolute gradient across RGB channels: (1, 3, 224, 224) -> (224, 224)
    saliency = torch.max(grads.abs(), dim=1)[0].squeeze(0).detach().cpu().numpy()

    # Min-max normalization
    s_min, s_max = float(saliency.min()), float(saliency.max())
    if s_max - s_min > 1e-8:
        saliency_norm = (saliency - s_min) / (s_max - s_min)
    else:
        saliency_norm = np.zeros_like(saliency)

    # Convert to heatmap and smooth with Gaussian blur for organic attribution contours
    raw_heatmap = _apply_jet_colormap(saliency_norm)
    smoothed_heatmap = raw_heatmap.filter(ImageFilter.GaussianBlur(radius=6))

    # Load original image and resize to match 224x224
    try:
        orig = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224), Image.BILINEAR)
    except Exception:
        orig = Image.new("RGB", (224, 224), (200, 200, 200))

    # Blend original and smoothed heatmap (alpha = 0.5)
    overlay = Image.blend(orig, smoothed_heatmap, alpha=0.52)

    # Encode to base64 Data URLs
    def to_data_url(pil_img: Image.Image) -> str:
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"

    return {
        "heatmap_overlay": to_data_url(overlay),
        "saliency_heatmap": to_data_url(smoothed_heatmap),
        "explanation_note": (
            f"Visual heatmap highlights the leaf pixels that most strongly influenced the "
            f"{model_name} classification score. Warm regions (red/yellow) indicate primary "
            f"visual evidence; cool regions (blue) had minimal impact. This represents model attention, "
            f"not pathological proof."
        ),
    }

