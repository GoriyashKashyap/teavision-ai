"""Image preprocessing pipeline — must match the training evaluation exactly.

Expected pipeline:
  1. Receive a bytes/PIL image
  2. Convert to RGB
  3. Resize to 224 × 224
  4. Convert to tensor (H×W×C → C×H×W, [0,1])
  5. Apply ImageNet normalisation
     mean  = [0.485, 0.456, 0.406]
     std   = [0.229, 0.224, 0.225]
"""

from __future__ import annotations

import io
import logging
from typing import Optional

logger = logging.getLogger("teavision.preprocessing")

INPUT_SIZE = (224, 224)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


def preprocess_image(image_bytes: bytes):
    """Return a (1, 3, 224, 224) normalised float32 tensor ready for inference.

    Args:
        image_bytes: Raw image bytes from the uploaded file.

    Returns:
        torch.Tensor of shape (1, 3, 224, 224).

    Raises:
        ValueError: If the bytes cannot be decoded as an image.
        ImportError: If PyTorch or Pillow is unavailable.
    """
    try:
        import torch
        import numpy as np
        from PIL import Image
    except ImportError as exc:
        raise ImportError(f"Required package not installed: {exc}") from exc

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    # --- Convert to RGB (handles RGBA, palette, greyscale) ---
    image = image.convert("RGB")

    # --- Resize ---
    image = image.resize(INPUT_SIZE, Image.BILINEAR)

    # --- To float tensor in [0, 1] ---
    img_array = np.array(image, dtype=np.float32) / 255.0  # H × W × 3

    # --- ImageNet normalisation ---
    mean = np.array(IMAGENET_MEAN, dtype=np.float32)
    std  = np.array(IMAGENET_STD,  dtype=np.float32)
    img_array = (img_array - mean) / std

    # --- H×W×C → C×H×W → batch ---
    tensor = torch.from_numpy(img_array.transpose(2, 0, 1)).unsqueeze(0)  # (1,3,224,224)

    return tensor
