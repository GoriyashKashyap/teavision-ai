"""Inference predictor — runs the LightTeaNet-ECA model and returns structured results."""

from __future__ import annotations

import logging
import time
import uuid
from datetime import UTC, datetime
from typing import List

from app.ml.classes import DISEASE_CLASSES
from app.ml.explainability import generate_attention_heatmap
from app.ml.model import model_manager
from app.ml.preprocessing import preprocess_image
from app.ml.quality import analyze_image_quality
from app.schemas.prediction import PredictionResponse, QualityAssessment, TopPrediction

logger = logging.getLogger("teavision.predictor")


def run_prediction(image_bytes: bytes, model_id: Optional[str] = None) -> PredictionResponse:
    """Preprocess image bytes and run a single forward pass with the selected model.

    Returns:
        PredictionResponse with class name, confidence, top-3 predictions,
        full probability distribution, explainability heatmaps, and timing metadata.

    Raises:
        RuntimeError: If the model is not loaded or fails.
        ValueError:   If the image cannot be decoded.
    """
    try:
        import torch
        import torch.nn.functional as F
    except ImportError as exc:
        raise RuntimeError("PyTorch not installed.") from exc

    model = model_manager.get_model(model_id)
    meta = model_manager.get_meta(model_id)
    model_display_name = meta.get("name", "LightTeaNet-ECA")

    # Preprocess
    tensor = preprocess_image(image_bytes)  # (1, 3, 224, 224)

    # Inference
    t0 = time.perf_counter()
    with torch.inference_mode():
        logits = model(tensor)                        # (1, 7)
        probs  = F.softmax(logits, dim=1).squeeze(0) # (7,)
    inference_ms = (time.perf_counter() - t0) * 1000

    probs_list: List[float] = probs.tolist()

    # Top-3
    top3_indices = sorted(range(len(probs_list)), key=lambda i: probs_list[i], reverse=True)[:3]
    top_predictions = [
        TopPrediction(
            class_name=DISEASE_CLASSES[i],
            class_index=i,
            confidence=round(probs_list[i], 6),
        )
        for i in top3_indices
    ]

    # Best prediction
    best_idx        = top3_indices[0]
    predicted_class = DISEASE_CLASSES[best_idx]
    confidence      = round(probs_list[best_idx], 6)

    logger.info(
        f"Prediction: {predicted_class} ({confidence*100:.1f}%) in {inference_ms:.1f} ms"
    )

    # Image Quality Assessment (Phase 6)
    quality_data = None
    try:
        q_raw = analyze_image_quality(image_bytes)
        quality_data = QualityAssessment(**q_raw)
    except Exception as exc:
        logger.warning(f"Quality assessment failed: {exc}")

    # Explainable AI Saliency Heatmap (Phase 6)
    heatmap_overlay = None
    saliency_heatmap = None
    explanation_note = None
    try:
        xai_res = generate_attention_heatmap(
            image_bytes,
            best_idx,
            tensor,
            model=model,
            model_name=model_display_name,
        )
        heatmap_overlay = xai_res["heatmap_overlay"]
        saliency_heatmap = xai_res["saliency_heatmap"]
        explanation_note = xai_res["explanation_note"]
    except Exception as exc:
        logger.warning(f"Explainability heatmap generation failed: {exc}")

    return PredictionResponse(
        prediction_id     = str(uuid.uuid4()),
        predicted_class   = predicted_class,
        class_index       = best_idx,
        confidence        = confidence,
        top_predictions   = top_predictions,
        probabilities     = [round(p, 6) for p in probs_list],
        inference_time_ms = round(inference_ms, 2),
        model_version     = meta.get("name", model_manager.version),
        created_at        = datetime.now(UTC).isoformat(),
        quality_assessment= quality_data,
        heatmap_overlay   = heatmap_overlay,
        saliency_heatmap  = saliency_heatmap,
        explanation_note  = explanation_note,
    )
