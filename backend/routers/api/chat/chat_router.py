import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from core.model_interface import ModelFactory
from models.models import Conversation, Message
from database.database import get_db
from starlette.background import BackgroundTask

from .chat_models import ChatRequest
from .chat_utils import stream_generator

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/streaming/ask')
async def streaming_ask(request: Request, db: Session = Depends(get_db)) -> StreamingResponse:
    user = request.state.user
    if not user:
        return HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"Streaming ask request received for user: {user.email}")
    
    try:
        raw_data = await request.json()
        logger.info(f"Raw request data: {raw_data}")
        
        try:
            data = ChatRequest(**raw_data)
        except ValueError as ve:
            logger.error(f"Validation error: {str(ve)}")
            return HTTPException(status_code=422, detail=str(ve))

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
                return HTTPException(status_code=404, detail="Conversation not found")

        # Store the user's message
        new_message = Message(conversation_id=data.conversation_id, sender="user", content=data.message)
        db.add(new_message)
        db.commit()
        logger.info(f"Stored user message in conversation: {data.conversation_id}")

        logger.info(f"Creating model: type={data.model_type}, name={data.model_name}, temperature={data.temperature}")
        model = ModelFactory.create_model(data.model_type, data.model_name, data.temperature)
        
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
        return HTTPException(status_code=400, detail=str(ve))
    except SQLAlchemyError as e:
        logger.error(f"Database error in streaming ask endpoint: {str(e)}")
        db.rollback()
        return HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logger.error(f"Error in streaming ask endpoint: {str(e)}")
        return HTTPException(status_code=500, detail="An unexpected error occurred")

logger.info("Chat router initialized")
