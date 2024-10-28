import logging
import json
import asyncio
import time
from typing import AsyncGenerator, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from core.model_interface import ModelFactory, ModelInterface
from models.models import Message
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

def create_model_for_conversation(conversation_id: UUID, model_type: str, model_name: str, temperature: float) -> ModelInterface:
    start_time = time.time()
    try:
        model = ModelFactory.create_model(model_type, model_name, temperature)
        creation_time = time.time() - start_time
        logger.info(f"Model created successfully for conversation {conversation_id}. Type: {model_type}, Name: {model_name}. Creation time: {creation_time:.2f} seconds")
        return model
    except Exception as e:
        logger.error(f"Error creating model for conversation {conversation_id}: {str(e)}. Time taken: {time.time() - start_time:.2f} seconds")
        raise HTTPException(status_code=500, detail=f"Error creating model: {str(e)}")

async def store_message(db: Session, conversation_id: UUID, role: str, content: str) -> bool:
    max_retries = 3
    retry_count = 0
    start_time = time.time()
    
    while retry_count < max_retries:
        try:
            new_message = Message(
                conversation_id=conversation_id,
                role=role,
                content=content
            )
            db.add(new_message)
            db.commit()
            storage_time = time.time() - start_time
            logger.info(f"Stored {role} message in conversation: {conversation_id}. Storage time: {storage_time:.2f} seconds")
            return True
        except SQLAlchemyError as e:
            logger.error(f"Failed to store message (attempt {retry_count + 1}): {str(e)}. Time elapsed: {time.time() - start_time:.2f} seconds")
            db.rollback()
            retry_count += 1
            if retry_count < max_retries:
                await asyncio.sleep(0.5)  # Wait before retrying
    
    logger.error(f"Failed to store message after {max_retries} attempts. Total time: {time.time() - start_time:.2f} seconds")
    return False

async def stream_generator(
    model: ModelInterface,
    conversation_id: UUID,
    content: str, 
    request: Request, 
    db: Session
) -> AsyncGenerator[str, None]:
    response_chunks = []
    start_time = time.time()
    token_count = 0
    
    try:
        async for token in model.generate(content):
            if await request.is_disconnected():
                logger.info(f"Client disconnected, storing partial response. Tokens generated: {token_count}. Time elapsed: {time.time() - start_time:.2f} seconds")
                if response_chunks:
                    complete_response = "".join(response_chunks)
                    await store_message(db, conversation_id, "llm", complete_response)
                yield f"data: {json.dumps({'error': 'Client disconnected'})}\n\n"
                return

            response_chunks.append(token)
            token_count += 1
            yield f"data: {json.dumps({'data': token})}\n\n"
            await asyncio.sleep(0)  # Allow other tasks to run

        if response_chunks:
            complete_response = "".join(response_chunks)
            if await store_message(db, conversation_id, "llm", complete_response):
                yield "data: [DONE]\n\n"
            else:
                yield f"data: {json.dumps({'error': 'Failed to store message'})}\n\n"
        else:
            yield "data: [DONE]\n\n"

        total_time = time.time() - start_time
        logger.info(f"Stream generation completed. Tokens generated: {token_count}. Total time: {total_time:.2f} seconds. Average time per token: {total_time/token_count:.4f} seconds")

    except Exception as e:
        logger.error(f"Error in stream_generator: {str(e)}. Time elapsed: {time.time() - start_time:.2f} seconds")
        if response_chunks:
            complete_response = "".join(response_chunks)
            await store_message(db, conversation_id, "llm", complete_response)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
