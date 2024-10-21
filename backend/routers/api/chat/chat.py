import logging
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from core.model_interface import ModelFactory, ModelInterface
from models.models import Conversation, Message, User
from database.database import get_db
import json
import traceback
from typing import AsyncGenerator, Optional, List
from starlette.background import BackgroundTask
from pydantic import BaseModel, Field
from uuid import UUID

router = APIRouter()
logger = logging.getLogger(__name__)

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

async def stream_generator(model: ModelInterface, content: str, request: Request, db: Session, conversation_id: UUID) -> AsyncGenerator[str, None]:
    try:
        async for token in model.generate(content):
            if await request.is_disconnected():
                logger.info("Client disconnected, stopping generation")
                break
            yield f"data: {json.dumps({'data': token})}\n\n"
        
        # Store the complete LLM response
        complete_response = "".join([token async for token in model.generate(content)])
        new_message = Message(conversation_id=conversation_id, sender="llm", content=complete_response)
        db.add(new_message)
        db.commit()
        
        yield "data: [DONE]\n\n"
    except SQLAlchemyError as e:
        logger.error(f"Database error in stream_generator: {str(e)}")
        db.rollback()
        yield f"data: {json.dumps({'error': 'Database error occurred'})}\n\n"
    except Exception as e:
        logger.error(f"Error in stream_generator: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"

@router.post('/streaming/ask')
async def streaming_ask(request: Request, db: Session = Depends(get_db)) -> StreamingResponse:
    user = request.state.user
    logger.info(f"Streaming ask request received for user: {user.email}")
    
    try:
        raw_data = await request.json()
        logger.info(f"Raw request data: {raw_data}")
        
        try:
            data = ChatRequest(**raw_data)
        except ValueError as ve:
            logger.error(f"Validation error: {str(ve)}")
            raise HTTPException(status_code=422, detail=str(ve))

        logger.info(f"Validated request data: {data.dict()}")

        if not data.conversation_id:
            # Create a new conversation
            new_conversation = Conversation(user_id=user.id, title=data.message[:50])  # Use first 50 chars of message as title
            db.add(new_conversation)
            db.commit()
            db.refresh(new_conversation)
            data.conversation_id = new_conversation.id
            logger.info(f"Created new conversation with id: {data.conversation_id}")
        else:
            # Verify the conversation belongs to the user
            conversation = db.query(Conversation).filter(
                Conversation.id == data.conversation_id,
                Conversation.user_id == user.id
            ).first()
            if not conversation:
                logger.error(f"Conversation not found for id: {data.conversation_id} and user: {user.id}")
                raise HTTPException(status_code=404, detail="Conversation not found")

        # Store the user's message
        new_message = Message(conversation_id=data.conversation_id, sender="user", content=data.message)
        db.add(new_message)
        db.commit()
        logger.info(f"Stored user message in conversation: {data.conversation_id}")

        logger.info(f"Creating model: type={data.model_type}, name={data.model_name}, temperature={data.temperature}")
        try:
            model = ModelFactory.create_model(data.model_type, data.model_name, data.temperature)
        except Exception as e:
            logger.error(f"Error creating model: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error creating model: {str(e)}")
        
        logger.info("Returning StreamingResponse")
        
        async def cleanup():
            logger.info("Cleaning up resources after streaming")
            await model.cleanup()

        return StreamingResponse(
            stream_generator(model, data.message, request, db, data.conversation_id),
            media_type="text/event-stream",
            background=BackgroundTask(cleanup)
        )
    except ValueError as ve:
        logger.error(f"Invalid model type: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except SQLAlchemyError as e:
        logger.error(f"Database error in streaming ask endpoint: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Error in streaming ask endpoint: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get('/messages/{conversation_id}', response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    user = request.state.user
    logger.info(f"GET /messages/{conversation_id} - User email: {user.email}")
    
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        ).first()
        if not conversation:
            logger.error(f"Conversation not found for id: {conversation_id} and user: {user.id}")
            raise HTTPException(status_code=404, detail="Conversation not found")

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
        raise HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Error in get_messages: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

logger.info("Chat router initialized")
