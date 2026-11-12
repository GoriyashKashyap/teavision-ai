"""Feedback schema (placeholder for Phase 2+)."""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


class FeedbackPayload(BaseModel):
    prediction_id:   str
    user_assessment: Literal["correct", "incorrect", "unsure"]
    comments:        Optional[str] = None