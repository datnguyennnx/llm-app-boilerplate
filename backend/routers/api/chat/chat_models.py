from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None
    model_type: str = Field(default="openai")
    model_name: str = Field(default="gpt-3.5-turbo")
    temperature: float = Field(default=0.7, ge=0, le=1)

    class Config:
        allow_population_by_field_name = True

class MessageResponse(BaseModel):
    id: UUID
    sender: str
    content: str
    created_at: str
