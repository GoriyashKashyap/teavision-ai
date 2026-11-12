"""Tests for Phase 6: Explainable AI Heatmaps, Image Quality, and AI Assistant."""

import io
import unittest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.ml.model import model_manager
from app.ml.preprocessing import preprocess_image
from app.ml.quality import analyze_image_quality
from app.ml.explainability import generate_attention_heatmap


class TestPhase6AdvancedAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        if not model_manager.is_loaded():
            model_manager.load()

        # Create sample in-memory image
        img = Image.new("RGB", (300, 300), color=(34, 139, 34))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        cls.sample_bytes = buf.getvalue()

    def test_image_quality_analysis(self):
        result = analyze_image_quality(self.sample_bytes)
        self.assertIn("quality_rating", result)
        self.assertIn("blur_score", result)
        self.assertIn("lighting_condition", result)
        self.assertIn("feedback_tips", result)
        self.assertIsInstance(result["feedback_tips"], list)

    def test_attention_heatmap_generation(self):
        tensor = preprocess_image(self.sample_bytes)
        xai_res = generate_attention_heatmap(self.sample_bytes, class_index=6, tensor=tensor)
        self.assertIn("heatmap_overlay", xai_res)
        self.assertIn("saliency_heatmap", xai_res)
        self.assertIn("explanation_note", xai_res)
        self.assertTrue(xai_res["heatmap_overlay"].startswith("data:image/png;base64,"))
        self.assertTrue(xai_res["saliency_heatmap"].startswith("data:image/png;base64,"))

    def test_predict_endpoint_returns_xai_and_quality(self):
        files = {"file": ("leaf.jpg", self.sample_bytes, "image/jpeg")}
        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("quality_assessment", data)
        self.assertIn("heatmap_overlay", data)
        self.assertIn("saliency_heatmap", data)
        self.assertIsNotNone(data["quality_assessment"])
        self.assertIsNotNone(data["heatmap_overlay"])

    def test_assistant_chat_endpoint(self):
        payload = {
            "message": "How do I prevent Brown Blight in my plantation?",
            "context_disease": "Brown Blight",
        }
        response = self.client.post("/api/v1/assistant/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("reply", data)
        self.assertIn("suggested_followups", data)
        self.assertIn("references", data)
        self.assertIn("disclaimer", data)
        self.assertIn("Brown Blight", data["reply"])


if __name__ == "__main__":
    unittest.main()

