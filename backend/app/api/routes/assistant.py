"""AI Agronomist Assistant API endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import process_assistant_query

router = APIRouter(tags=["assistant"])


@router.post("/assistant/chat", response_model=AssistantChatResponse)
async def chat_assistant(payload: AssistantChatRequest):
    """Receive agronomic inquiries and return authoritative plant pathology intelligence."""
    return process_assistant_query(
        message=payload.message,
        context_disease=payload.context_disease,
        history=[msg.model_dump() for msg in payload.history] if payload.history else None,
    )

