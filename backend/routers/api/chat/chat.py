import logging
import time
import math
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.models import Conversation, Message
from database.database import get_db
import traceback
from typing import List
from uuid import UUID
from sqlalchemy import desc, func, asc

from .chat_models import (
    ChatRequest, MessageResponse, ConversationResponse, 
    ConversationsListResponse, ConversationCreate, MessagesListResponse
)
from .chat_utils import stream_generator, create_model_for_conversation

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get('/conversations', response_model=ConversationsListResponse)
async def get_conversations(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    per_page: int = Query(10, ge=1, le=50, description="Number of items per page")
):
    start_time = time.time()
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"GET /conversations - User ID: {user.id} - Page: {page}")
    
    try:
        offset = (page - 1) * per_page
        
        total_count = db.query(func.count(Conversation.id))\
            .filter(Conversation.user_id == user.id)\
            .scalar()
        
        total_pages = math.ceil(total_count / per_page)
        
        conversations = db.query(Conversation)\
            .filter(Conversation.user_id == user.id)\
            .order_by(desc(Conversation.created_at))\
            .offset(offset)\
            .limit(per_page)\
            .all()
        
        response_conversations = [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at.isoformat()
            ) for conv in conversations
        ]
        
        logger.info(
            f"Retrieved {len(response_conversations)} conversations for user {user.id}. "
            f"Page: {page}, Total pages: {total_pages}"
        )
        
        return ConversationsListResponse(
            conversations=response_conversations,
            page=page,
            total_pages=total_pages,
            total_count=total_count,
            per_page=per_page
        )
        
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error in get_conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get('/messages/{conversation_id}', response_model=MessagesListResponse)
async def get_messages(
    conversation_id: UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    start_time = time.time()
    user = request.state.user
    logger.info(f"Fetching all messages for conversation: {conversation_id}")
    
    try:
        # Verify conversation belongs to user
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        ).first()
        if not conversation:
            logger.error(f"Conversation not found: {conversation_id}")
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Query all messages with chronological ordering (oldest to newest)
        messages = db.query(Message)\
            .filter(Message.conversation_id == conversation_id)\
            .order_by(asc(Message.created_at))\
            .all()

        response_messages = [
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at.isoformat()
            ) for msg in messages
        ]

        logger.info(f"Retrieved {len(response_messages)} messages for conversation {conversation_id}")

        return MessagesListResponse(
            messages=response_messages,
            page=1,
            total_pages=1,
            total_count=len(response_messages),
            per_page=len(response_messages)
        )

    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        total_time = time.time() - start_time
        logger.info(f"Total processing time for get_messages: {total_time:.2f} seconds")

@router.post('/conversations', response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    start_time = time.time()
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"POST /conversations - User ID: {user.id}")
    
    try:
        new_conversation = Conversation(
            user_id=user.id,
            title=conversation.title
        )
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)
        
        logger.info(f"Created new conversation: {new_conversation.id}")
        
        return ConversationResponse(
            id=new_conversation.id,
            title=new_conversation.title,
            created_at=new_conversation.created_at.isoformat()
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in create_conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error in create_conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        total_time = time.time() - start_time
        logger.info(f"Total processing time for create_conversation: {total_time:.2f} seconds")

@router.post('/streaming/ask')
async def streaming_ask(request: Request, db: Session = Depends(get_db)) -> StreamingResponse:
    start_time = time.time()
    user = request.state.user
    logger.info(f"Streaming ask request received for user: {user.email}")
    
    try:
        raw_data = await request.json()
        logger.debug(f"Raw request data: {raw_data}")
        
        try:
            data = ChatRequest(**raw_data)
        except ValueError as ve:
            logger.error(f"Validation error: {str(ve)}")
            raise HTTPException(status_code=422, detail=str(ve))

        try:
            if not data.conversation_id:
                new_conversation = Conversation(
                    user_id=user.id, 
                    title=data.message[:50]
                )
                db.add(new_conversation)
                db.commit()
                db.refresh(new_conversation)
                data.conversation_id = new_conversation.id
                logger.info(f"Created new conversation: {data.conversation_id}")
            else:
                conversation = db.query(Conversation).filter(
                    Conversation.id == data.conversation_id,
                    Conversation.user_id == user.id
                ).first()
                if not conversation:
                    logger.error(f"Conversation not found: {data.conversation_id}")
                    raise HTTPException(status_code=404, detail="Conversation not found")

            new_message = Message(
                conversation_id=data.conversation_id,
                role="user",
                content=data.message
            )
            db.add(new_message)
            db.commit()
            logger.info(f"Stored user message in conversation: {data.conversation_id}")

            setup_time = time.time() - start_time
            logger.info(f"Setup time before streaming: {setup_time:.2f} seconds")

            model = create_model_for_conversation(data.conversation_id, data.model_type, data.model_name, data.temperature)

            return StreamingResponse(
                stream_generator(model, data.conversation_id, data.message, request, db),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream",
                    "X-Accel-Buffering": "no",
                    "Access-Control-Allow-Origin": "*",
                }
            )

        except SQLAlchemyError as e:
            logger.error(f"Database error during conversation handling: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Database error occurred")

    except ValueError as ve:
        logger.error(f"Invalid request data: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        total_time = time.time() - start_time
        logger.info(f"Total processing time for streaming_ask: {total_time:.2f} seconds")

logger.info("Chat router initialized")
