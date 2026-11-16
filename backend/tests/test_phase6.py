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
        self.assertIn("provider", data)
        self.assertIn("Brown Blight", data["reply"])

    def test_assistant_gemini_integration_mocked(self):
        from unittest.mock import patch, MagicMock

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "Gemini AI response regarding tea health.\nFOLLOWUP_QUESTIONS:\n- How to control weeds?\n- When to spray?\n- What fertilizer is best?"
                            }
                        ]
                    }
                }
            ]
        }

        with patch("app.services.assistant_service.httpx.AsyncClient.post", return_value=mock_resp), \
             patch("app.services.assistant_service.settings.GEMINI_API_KEY", "test_gemini_api_key"):
            response = self.client.post(
                "/api/v1/assistant/chat",
                json={"message": "What fertilizer is recommended for tea leaves?"}
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("Gemini", data["provider"])
            self.assertIn("Gemini AI response", data["reply"])
            self.assertEqual(len(data["suggested_followups"]), 3)

    def test_diagnose_endpoint(self):
        # 1. Create a prediction first
        files = {"file": ("leaf.jpg", self.sample_bytes, "image/jpeg")}
        predict_res = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(predict_res.status_code, 200)
        pred_id = predict_res.json()["prediction_id"]

        # 2. Request diagnostic assessment (POST)
        diag_res = self.client.post("/api/v1/diagnose", json={"prediction_id": pred_id})
        self.assertEqual(diag_res.status_code, 200)
        diag_data = diag_res.json()
        self.assertIn("diagnosis", diag_data)
        self.assertIn("prediction_snapshot", diag_data)
        self.assertIn("possible_cause", diag_data["diagnosis"])
        self.assertIn("recommendations", diag_data["diagnosis"])

        # 3. Request diagnostic assessment (GET)
        diag_get_res = self.client.get(f"/api/v1/diagnose/{pred_id}")
        self.assertEqual(diag_get_res.status_code, 200)
        self.assertEqual(diag_get_res.json()["prediction_snapshot"]["prediction_id"], pred_id)


if __name__ == "__main__":
    unittest.main()

