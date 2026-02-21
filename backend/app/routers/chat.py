from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import get_ai_response

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str
    risk_score: float = 0.0
    risk_level: str = "unknown"
    location: str = "your current location"
    history: Optional[list[dict]] = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/message", response_model=ChatResponse)
async def chat(body: ChatMessage):
    """Send a message to SafeSphere AI assistant."""
    reply = await get_ai_response(
        user_message=body.message,
        risk_score=body.risk_score,
        risk_level=body.risk_level,
        location=body.location,
        conversation_history=body.history,
    )
    return ChatResponse(reply=reply)
