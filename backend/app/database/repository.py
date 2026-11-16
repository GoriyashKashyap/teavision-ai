"""Data repository for TeaVision AI.
Provides local persistent SQLite storage by default, and seamlessly connects to Supabase when configured.
Ensures history, feedback, field observations, and analytics work out-of-the-box.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from app.core.config import settings
from app.database.supabase_client import supabase_client

logger = logging.getLogger("teavision.database")

DB_DIR = Path("data")
DB_PATH = DB_DIR / "teavision.db"


def get_db_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database, initializing schema if needed."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite database tables matching Supabase schema."""
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                predicted_class TEXT NOT NULL,
                class_index INTEGER NOT NULL,
                confidence REAL NOT NULL,
                probabilities TEXT NOT NULL,
                top_predictions TEXT NOT NULL,
                image_path TEXT,
                inference_time_ms REAL NOT NULL,
                model_version TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS field_observations (
                id TEXT PRIMARY KEY,
                prediction_id TEXT NOT NULL,
                user_id TEXT,
                plantation_name TEXT,
                district TEXT,
                latitude REAL,
                longitude REAL,
                lighting_condition TEXT,
                leaf_age TEXT,
                observation_notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS prediction_feedback (
                id TEXT PRIMARY KEY,
                prediction_id TEXT NOT NULL,
                user_id TEXT,
                user_assessment TEXT NOT NULL,
                comments TEXT,
                expert_verified INTEGER DEFAULT 0,
                verified_class TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
            );
        """)
        conn.commit()


# Initialize on import
init_db()


class Repository:
    """Handles data storage and retrieval for predictions, feedback, and field observations."""

    @staticmethod
    def save_prediction(
        prediction_id: str,
        predicted_class: str,
        class_index: int,
        confidence: float,
        probabilities: List[float],
        top_predictions: List[Dict[str, Any]],
        inference_time_ms: float,
        model_version: str,
        image_path: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        created_at = datetime.now(UTC).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO predictions (
                    id, user_id, predicted_class, class_index, confidence,
                    probabilities, top_predictions, image_path, inference_time_ms,
                    model_version, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    prediction_id,
                    user_id,
                    predicted_class,
                    class_index,
                    confidence,
                    json.dumps(probabilities),
                    json.dumps(top_predictions),
                    image_path,
                    inference_time_ms,
                    model_version,
                    created_at,
                ),
            )
            conn.commit()

        # If Supabase is configured, replicate record to cloud database
        if supabase_client.is_configured:
            supabase_client.insert_prediction({
                "id": prediction_id,
                "user_id": user_id,
                "predicted_class": predicted_class,
                "class_index": class_index,
                "confidence": confidence,
                "probabilities": probabilities,
                "top_predictions": top_predictions,
                "image_path": image_path,
                "inference_time_ms": inference_time_ms,
                "model_version": model_version,
                "created_at": created_at,
            })

        return {
            "prediction_id": prediction_id,
            "predicted_class": predicted_class,
            "class_index": class_index,
            "confidence": confidence,
            "created_at": created_at,
        }

    @staticmethod
    def list_predictions(
        limit: int = 50,
        offset: int = 0,
        disease_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = "SELECT * FROM predictions"
        params: List[Any] = []
        conditions: List[str] = []

        if disease_filter:
            conditions.append("predicted_class = ?")
            params.append(disease_filter)

        if search:
            conditions.append("(predicted_class LIKE ? OR id LIKE ?)")
            params.append(f"%{search}%")
            params.append(f"%{search}%")

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Count total
        count_query = f"SELECT COUNT(*) as count FROM ({query})"
        with get_db_connection() as conn:
            total = conn.execute(count_query, params).fetchone()["count"]

            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, params).fetchall()

        items = []
        for r in rows:
            items.append({
                "prediction_id": r["id"],
                "predicted_class": r["predicted_class"],
                "class_index": r["class_index"],
                "confidence": r["confidence"],
                "probabilities": json.loads(r["probabilities"]),
                "top_predictions": json.loads(r["top_predictions"]),
                "image_path": r["image_path"],
                "inference_time_ms": r["inference_time_ms"],
                "model_version": r["model_version"],
                "created_at": r["created_at"],
            })

        return {"total": total, "items": items, "limit": limit, "offset": offset}

    @staticmethod
    def get_prediction(prediction_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT * FROM predictions WHERE id = ?", (prediction_id,)
            ).fetchone()
            if not row:
                return None

            feedback_rows = conn.execute(
                "SELECT * FROM prediction_feedback WHERE prediction_id = ?", (prediction_id,)
            ).fetchall()
            feedbacks = [dict(f) for f in feedback_rows]

            obs_row = conn.execute(
                "SELECT * FROM field_observations WHERE prediction_id = ?", (prediction_id,)
            ).fetchone()
            observation = dict(obs_row) if obs_row else None

        return {
            "prediction_id": row["id"],
            "predicted_class": row["predicted_class"],
            "class_index": row["class_index"],
            "confidence": row["confidence"],
            "probabilities": json.loads(row["probabilities"]),
            "top_predictions": json.loads(row["top_predictions"]),
            "image_path": row["image_path"],
            "inference_time_ms": row["inference_time_ms"],
            "model_version": row["model_version"],
            "created_at": row["created_at"],
            "feedback": feedbacks,
            "field_observation": observation,
        }

    @staticmethod
    def save_feedback(
        prediction_id: str,
        user_assessment: str,
        comments: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        feedback_id = str(uuid.uuid4())
        created_at = datetime.now(UTC).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO prediction_feedback (
                    id, prediction_id, user_id, user_assessment, comments, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (feedback_id, prediction_id, user_id, user_assessment, comments, created_at),
            )
            conn.commit()

        if supabase_client.is_configured:
            supabase_client.insert_feedback({
                "id": feedback_id,
                "prediction_id": prediction_id,
                "user_id": user_id,
                "user_assessment": user_assessment,
                "comments": comments,
                "created_at": created_at,
            })

        return feedback_id

    @staticmethod
    def save_field_observation(
        prediction_id: str,
        plantation_name: Optional[str] = None,
        district: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        lighting_condition: Optional[str] = None,
        leaf_age: Optional[str] = None,
        observation_notes: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        obs_id = str(uuid.uuid4())
        created_at = datetime.now(UTC).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO field_observations (
                    id, prediction_id, user_id, plantation_name, district,
                    latitude, longitude, lighting_condition, leaf_age,
                    observation_notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    obs_id,
                    prediction_id,
                    user_id,
                    plantation_name,
                    district,
                    latitude,
                    longitude,
                    lighting_condition,
                    leaf_age,
                    observation_notes,
                    created_at,
                ),
            )
            conn.commit()

        if supabase_client.is_configured:
            supabase_client.insert_observation({
                "id": obs_id,
                "prediction_id": prediction_id,
                "user_id": user_id,
                "plantation_name": plantation_name,
                "district": district,
                "latitude": latitude,
                "longitude": longitude,
                "lighting_condition": lighting_condition,
                "leaf_age": leaf_age,
                "observation_notes": observation_notes,
                "created_at": created_at,
            })

        return obs_id

    @staticmethod
    def get_analytics_summary() -> Dict[str, Any]:
        with get_db_connection() as conn:
            total_preds = conn.execute("SELECT COUNT(*) as c FROM predictions").fetchone()["c"]

            healthy_preds = conn.execute(
                "SELECT COUNT(*) as c FROM predictions WHERE predicted_class = 'Healthy leaf'"
            ).fetchone()["c"]

            disease_preds = total_preds - healthy_preds

            # Per-class distribution
            class_counts = conn.execute(
                "SELECT predicted_class, COUNT(*) as c FROM predictions GROUP BY predicted_class ORDER BY c DESC"
            ).fetchall()
            distribution = {r["predicted_class"]: r["c"] for r in class_counts}

            # Average latency
            avg_latency_row = conn.execute(
                "SELECT AVG(inference_time_ms) as avg_lat FROM predictions"
            ).fetchone()
            avg_latency = round(avg_latency_row["avg_lat"] or 0, 1)

            # Feedback counts
            feedback_counts = conn.execute(
                "SELECT user_assessment, COUNT(*) as c FROM prediction_feedback GROUP BY user_assessment"
            ).fetchall()
            feedback_stats = {r["user_assessment"]: r["c"] for r in feedback_counts}

            # Field observations count
            obs_count = conn.execute("SELECT COUNT(*) as c FROM field_observations").fetchone()["c"]

        return {
            "total_predictions": total_preds,
            "healthy_count": healthy_preds,
            "disease_count": disease_preds,
            "distribution": distribution,
            "average_latency_ms": avg_latency,
            "feedback_stats": feedback_stats,
            "field_observations_count": obs_count,
        }


repo = Repository()

