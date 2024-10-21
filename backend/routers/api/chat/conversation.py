import logging
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from sqlalchemy.exc import SQLAlchemyError
from models.models import Conversation
from database.database import get_db
from pydantic import BaseModel, Field
from typing import List
from uuid import UUID

router = APIRouter()
logger = logging.getLogger(__name__)

class ConversationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: str

class ConversationsListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int

@router.get('/conversations', response_model=ConversationsListResponse)
async def get_conversations(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    user = request.state.user
    if not user:
        return HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"GET /conversations - User ID: {user.id}")
    
    try:
        total = db.query(func.count(Conversation.id)).filter(Conversation.user_id == user.id).scalar()
        
        conversations = db.query(Conversation)\
            .filter(Conversation.user_id == user.id)\
            .order_by(desc(Conversation.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        logger.info(f"Retrieved {len(conversations)} conversations for user {user.id}")
        return ConversationsListResponse(
            conversations=[ConversationResponse(id=conv.id, title=conv.title, created_at=str(conv.created_at)) for conv in conversations],
            total=total
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_conversations: {str(e)}")
        return HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error in get_conversations: {str(e)}")
        return HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post('/conversations', response_model=ConversationResponse)
async def create_conversation(
    request: Request,
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    user = request.state.user
    if not user:
        return HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"POST /conversations - User ID: {user.id}")
    logger.info(f"Received conversation creation request: {conversation.dict()}")
    
    try:
        new_conversation = Conversation(user_id=user.id, title=conversation.title)
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)
        
        logger.info(f"Created new conversation: {new_conversation.id}")
        return ConversationResponse(id=new_conversation.id, title=new_conversation.title, created_at=str(new_conversation.created_at))
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in create_conversation: {str(e)}")
        return HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error in create_conversation: {str(e)}")
        return HTTPException(status_code=500, detail="An unexpected error occurred")

logger.info("Conversation router initialized")
