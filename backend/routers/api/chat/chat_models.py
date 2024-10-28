from pydantic import BaseModel, UUID4, Field, validator
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[UUID4] = None
    model_type: str = "openai"
    model_name: str = "gpt-3.5-turbo"
    temperature: float = 0.7

class MessageResponse(BaseModel):
    id: UUID4
    role: str
    content: str
    created_at: str

class ConversationCreate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: UUID4
    title: str
    created_at: str

class ConversationsListResponse(BaseModel):
    conversations: List[ConversationResponse]
    page: int
    total_pages: int
    total_count: int
    per_page: int

class MessagesListResponse(BaseModel):
    messages: List[MessageResponse]
    page: int
    total_pages: int
    total_count: int
    per_page: int
