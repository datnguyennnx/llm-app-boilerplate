import logging
import json
from typing import AsyncGenerator
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from core.model_interface import ModelInterface
from models.models import Message
from fastapi import Request

logger = logging.getLogger(__name__)

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
