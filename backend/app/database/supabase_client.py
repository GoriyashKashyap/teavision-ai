"""Supabase PostgREST REST client for TeaVision AI.
Provides cloud persistence when SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are configured.
Uses httpx for high-performance direct HTTP calls without requiring heavy external SDKs.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("teavision.supabase")


class SupabaseClient:
    """Lightweight REST client for Supabase database tables."""

    def __init__(self) -> None:
        self.url = settings.SUPABASE_URL.rstrip("/")
        # Prefer service role key for backend operations to bypass RLS, fallback to anon key
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def _headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def insert_prediction(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Insert a prediction record into public.predictions."""
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/predictions"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(endpoint, json=payload, headers=self._headers())
                if res.is_success:
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else payload
                logger.warning(f"Supabase prediction insert failed [{res.status_code}]: {res.text}")
        except Exception as exc:
            logger.warning(f"Supabase connection error on insert_prediction: {exc}")
        return None

    def insert_feedback(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Insert feedback into public.prediction_feedback."""
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/prediction_feedback"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(endpoint, json=payload, headers=self._headers())
                if res.is_success:
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else payload
                logger.warning(f"Supabase feedback insert failed [{res.status_code}]: {res.text}")
        except Exception as exc:
            logger.warning(f"Supabase connection error on insert_feedback: {exc}")
        return None

    def insert_observation(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Insert observation into public.field_observations."""
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/field_observations"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(endpoint, json=payload, headers=self._headers())
                if res.is_success:
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else payload
                logger.warning(f"Supabase observation insert failed [{res.status_code}]: {res.text}")
        except Exception as exc:
            logger.warning(f"Supabase connection error on insert_observation: {exc}")
        return None

    def list_predictions(
        self,
        limit: int = 50,
        offset: int = 0,
        disease_filter: Optional[str] = None,
    ) -> Optional[List[Dict[str, Any]]]:
        """Fetch list of predictions from Supabase."""
        if not self.is_configured:
            return None
        endpoint = f"{self.url}/rest/v1/predictions"
        params: Dict[str, Any] = {
            "order": "created_at.desc",
            "limit": limit,
            "offset": offset,
        }
        if disease_filter:
            params["predicted_class"] = f"eq.{disease_filter}"

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(endpoint, params=params, headers=self._headers())
                if res.is_success:
                    return res.json()
                logger.warning(f"Supabase list_predictions failed [{res.status_code}]: {res.text}")
        except Exception as exc:
            logger.warning(f"Supabase connection error on list_predictions: {exc}")
        return None


supabase_client = SupabaseClient()
