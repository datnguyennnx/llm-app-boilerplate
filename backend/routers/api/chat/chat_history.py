import logging
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.models import Conversation, Message, User
from database.database import get_db
from typing import List
from uuid import UUID
from .chat_models import MessageResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get('/messages/{conversation_id}', response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    user = request.state.user
    if not user:
        return HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"GET /messages/{conversation_id} - User email: {user.email}")
    
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        ).first()
        if not conversation:
            logger.error(f"Conversation not found for id: {conversation_id} and user: {user.id}")
            return HTTPException(status_code=404, detail="Conversation not found")

        messages = db.query(Message)\
            .filter(Message.conversation_id == conversation_id)\
            .order_by(Message.created_at)\
            .offset(skip)\
            .limit(limit)\
            .all()

        logger.info(f"Retrieved {len(messages)} messages for conversation {conversation_id}")
        return [MessageResponse(id=msg.id, sender=msg.sender, content=msg.content, created_at=str(msg.created_at)) for msg in messages]
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_messages: {str(e)}")
        return HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Error in get_messages: {str(e)}")
        return HTTPException(status_code=500, detail="An unexpected error occurred")
