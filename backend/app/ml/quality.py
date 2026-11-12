"""Image quality assessment module for TeaVision AI.
Evaluates sharpness (blur detection), lighting balance, and composition before/during inference.
"""

from __future__ import annotations

import io
import logging
from typing import Any, Dict, List
import numpy as np
from PIL import Image

logger = logging.getLogger("teavision.quality")


def analyze_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    """Analyze image quality parameters: sharpness/blur, lighting, and contrast.

    Returns:
        Dict containing quality_rating, blur_score, is_blurry, brightness_score,
        lighting_condition, and constructive feedback tips.
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError(f"Cannot decode image for quality check: {exc}") from exc

    # Convert to RGB if palette/RGBA
    if pil_img.mode in ("P", "RGBA"):
        rgb_img = pil_img.convert("RGB")
    else:
        rgb_img = pil_img.convert("RGB")

    width, height = rgb_img.size
    gray = rgb_img.convert("L")
    arr = np.array(gray, dtype=np.float32)

    # 1. Laplacian sharpness (blur detection)
    lap = np.zeros_like(arr)
    lap[1:-1, 1:-1] = (
        arr[:-2, 1:-1] + arr[2:, 1:-1] + arr[1:-1, :-2] + arr[1:-1, 2:] - 4 * arr[1:-1, 1:-1]
    )
    blur_score = float(lap.var())
    is_blurry = blur_score < 75.0

    # 2. Lighting / Exposure
    brightness = float(arr.mean())
    contrast = float(arr.std())

    if brightness < 50.0:
        lighting_condition = "under_exposed"
        lighting_label = "Low Lighting / Dark"
    elif brightness > 205.0:
        lighting_condition = "over_exposed"
        lighting_label = "Harsh Glare / Washed Out"
    else:
        lighting_condition = "optimal"
        lighting_label = "Optimal Lighting"

    # 3. Constructive Feedback & Rating
    tips: List[str] = []
    issues = 0

    if is_blurry:
        issues += 1
        tips.append("Image is slightly soft or blurry. Hold the camera steady and tap to focus on the leaf lesion.")
    else:
        tips.append("Leaf details and epidermal textures are sharp.")

    if lighting_condition == "under_exposed":
        issues += 1
        tips.append("Lighting is dim. Move to a better-lit area or use diffused natural sunlight.")
    elif lighting_condition == "over_exposed":
        issues += 1
        tips.append("Lighting has high glare. Avoid direct midday sun reflection on wet leaf surfaces.")
    else:
        tips.append("Lighting and contrast are well-balanced.")

    if min(width, height) < 224:
        tips.append("Image resolution is lower than standard 224×224 model input.")

    if issues == 0:
        quality_rating = "excellent"
    elif issues == 1:
        quality_rating = "good"
    else:
        quality_rating = "fair"

    return {
        "quality_rating": quality_rating,
        "is_blurry": is_blurry,
        "blur_score": round(blur_score, 1),
        "brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "lighting_condition": lighting_condition,
        "lighting_label": lighting_label,
        "dimensions": [width, height],
        "feedback_tips": tips,
    }

