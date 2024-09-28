import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from middleware.auth import verify_google_token
from core.model_interface import ModelFactory, ModelInterface
import json
from typing import AsyncGenerator
from starlette.background import BackgroundTask

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_token_from_header(request: Request) -> str:
    token = request.headers.get("Authorization")
    if not token:
        logger.warning("No Authorization header provided")
        raise HTTPException(status_code=403, detail="No token provided")
    return token.split("Bearer ")[-1]

async def verify_token_header(token: str = Depends(get_token_from_header)) -> dict:
    token_info = await verify_google_token(token)
    if token_info is None:
        logger.warning("Invalid authentication credentials")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return token_info

async def stream_generator(model: ModelInterface, content: str, request: Request) -> AsyncGenerator[str, None]:
    try:
        async for token in model.generate(content):
            if await request.is_disconnected():
                logger.info("Client disconnected, stopping generation")
                break
            yield f"data: {json.dumps({'data': token})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Error in stream_generator: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

@router.post('/streaming/ask')
async def streaming_ask(request: Request, token_info: dict = Depends(verify_token_header)) -> StreamingResponse:
    logger.info(f"Streaming ask request received for user: {token_info.get('email')}")
    
    try:
        data = await request.json()
        message = data.get("message")
        model_type = data.get("model_type", "openai")
        model_name = data.get("model_name", "gpt-3.5-turbo")
        temperature = data.get("temperature", 0.7)

        logger.info(f"Request data: message='{message}', model_type={model_type}, model_name={model_name}, temperature={temperature}")

        if not message:
            logger.warning("No message provided in request")
            raise HTTPException(status_code=400, detail="No message provided")

        logger.info(f"Creating model: type={model_type}, name={model_name}, temperature={temperature}")
        model = ModelFactory.create_model(model_type, model_name, temperature)
        
        logger.info("Returning StreamingResponse")
        
        async def cleanup():
            logger.info("Cleaning up resources after streaming")
            await model.cleanup()

        return StreamingResponse(
            stream_generator(model, message, request),
            media_type="text/event-stream",
            background=BackgroundTask(cleanup)
        )
    except ValueError as ve:
        logger.error(f"Invalid model type: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in streaming ask endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

logger.info("Chat router initialized")