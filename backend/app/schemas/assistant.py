"""Schemas for AI Agricultural Assistant."""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    context_disease: Optional[str] = None
    history: Optional[List[ChatMessage]] = Field(default_factory=list)


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str]
    references: List[str]
    disclaimer: str

