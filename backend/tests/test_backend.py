"""Automated test suite for TeaVision AI backend.
Covers model loading, preprocessing, prediction pipeline, and API endpoints.
"""

import io
import unittest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.ml.classes import DISEASE_CLASSES
from app.ml.model import model_manager
from app.ml.preprocessing import preprocess_image, INPUT_SIZE, IMAGENET_MEAN, IMAGENET_STD
from app.ml.predictor import run_prediction


def create_dummy_image(color=(34, 139, 34), size=(300, 300), format="JPEG") -> bytes:
    """Helper to generate in-memory dummy image bytes."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


class TestTeaVisionModel(unittest.TestCase):
    """Test model loading and metadata."""

    def test_model_is_loaded(self):
        if not model_manager.is_loaded():
            model_manager.load()
        self.assertTrue(model_manager.is_loaded())
        self.assertIsNotNone(model_manager.get_model())

    def test_disease_classes_order(self):
        expected_classes = [
            "Tea algal leaf spot",
            "Brown Blight",
            "Gray Blight",
            "Helopeltis",
            "Red spider",
            "Green mirid bug",
            "Healthy leaf",
        ]
        self.assertEqual(DISEASE_CLASSES, expected_classes)
        self.assertEqual(len(DISEASE_CLASSES), 7)


class TestImagePreprocessing(unittest.TestCase):
    """Test preprocessing steps and normalization."""

    def test_valid_image_preprocessing(self):
        img_bytes = create_dummy_image(size=(400, 300))
        tensor = preprocess_image(img_bytes)

        # Check tensor shape: (1, 3, 224, 224)
        self.assertEqual(tensor.shape, (1, 3, 224, 224))
        self.assertEqual(str(tensor.dtype), "torch.float32")

    def test_invalid_image_bytes(self):
        with self.assertRaises(ValueError):
            preprocess_image(b"not-an-image-data-string")


class TestPredictionPipeline(unittest.TestCase):
    """Test predictor functionality and output integrity."""

    def setUp(self):
        if not model_manager.is_loaded():
            model_manager.load()

    def test_prediction_output_integrity(self):
        img_bytes = create_dummy_image(color=(50, 120, 40))
        result = run_prediction(img_bytes)

        # Verify class validity
        self.assertIn(result.predicted_class, DISEASE_CLASSES)
        self.assertEqual(DISEASE_CLASSES[result.class_index], result.predicted_class)

        # Confidence bounds
        self.assertGreaterEqual(result.confidence, 0.0)
        self.assertLessEqual(result.confidence, 1.0)

        # Top 3 predictions check
        self.assertEqual(len(result.top_predictions), 3)
        self.assertEqual(result.top_predictions[0].class_name, result.predicted_class)
        self.assertGreaterEqual(result.top_predictions[0].confidence, result.top_predictions[1].confidence)
        self.assertGreaterEqual(result.top_predictions[1].confidence, result.top_predictions[2].confidence)

        # Probabilities distribution
        self.assertEqual(len(result.probabilities), 7)
        prob_sum = sum(result.probabilities)
        self.assertAlmostEqual(prob_sum, 1.0, places=2)

        # Latency
        self.assertGreater(result.inference_time_ms, 0)


class TestApiRoutes(unittest.TestCase):
    """Test API routes using FastAPI TestClient."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        if not model_manager.is_loaded():
            model_manager.load()

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])

    def test_model_info_endpoint(self):
        response = self.client.get("/api/v1/model/info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "LightTeaNet-ECA")
        self.assertEqual(data["parameters"], 101940)
        self.assertEqual(len(data["classes"]), 7)

    def test_predict_endpoint_valid_image(self):
        img_bytes = create_dummy_image()
        files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prediction_id", data)
        self.assertIn("predicted_class", data)
        self.assertIn(data["predicted_class"], DISEASE_CLASSES)
        self.assertEqual(len(data["probabilities"]), 7)

    def test_predict_endpoint_unsupported_file_type(self):
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 422)

    def test_predict_endpoint_empty_file(self):
        files = {"file": ("empty.jpg", b"", "image/jpeg")}
        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 422)

    def test_feedback_endpoint(self):
        payload = {
            "prediction_id": "test-uuid-123",
            "user_assessment": "correct",
            "comments": "Observed in sector 4, symptoms match brown blight."
        }
        response = self.client.post("/api/v1/feedback", json=payload)
        self.assertEqual(response.status_code, 204)

    def test_history_and_analytics_endpoints(self):
        # 1. First trigger a prediction to guarantee at least one record
        img_bytes = create_dummy_image()
        files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
        predict_resp = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(predict_resp.status_code, 200)
        pred_id = predict_resp.json()["prediction_id"]

        # 2. Check history listing
        hist_resp = self.client.get("/api/v1/predictions?limit=10")
        self.assertEqual(hist_resp.status_code, 200)
        hist_data = hist_resp.json()
        self.assertIn("items", hist_data)
        self.assertGreaterEqual(hist_data["total"], 1)

        # 3. Check single prediction detail
        detail_resp = self.client.get(f"/api/v1/predictions/{pred_id}")
        self.assertEqual(detail_resp.status_code, 200)
        detail_data = detail_resp.json()
        self.assertEqual(detail_data["prediction_id"], pred_id)

        # 4. Record a field observation for this prediction
        obs_payload = {
            "prediction_id": pred_id,
            "plantation_name": "Nuwara Eliya High Elevation Estate",
            "district": "Nuwara Eliya",
            "lighting_condition": "overcast",
            "leaf_age": "maintenance_mature",
            "observation_notes": "Lesions detected on eastern slope foliage."
        }
        obs_resp = self.client.post("/api/v1/field-observations", json=obs_payload)
        self.assertEqual(obs_resp.status_code, 201)
        self.assertIn("id", obs_resp.json())

        # 5. Check analytics summary
        analytics_resp = self.client.get("/api/v1/analytics/summary")
        self.assertEqual(analytics_resp.status_code, 200)
        analytics_data = analytics_resp.json()
        self.assertIn("total_predictions", analytics_data)
        self.assertIn("distribution", analytics_data)
        self.assertGreaterEqual(analytics_data["total_predictions"], 1)
        self.assertGreaterEqual(analytics_data["field_observations_count"], 1)


if __name__ == "__main__":
    unittest.main()
