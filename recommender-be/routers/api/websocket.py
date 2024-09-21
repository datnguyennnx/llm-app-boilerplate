import logging
from fastapi import APIRouter, WebSocket, HTTPException, Query, Depends
from jose import jwt, JWTError
from core.ask import askLLM
from config.settings import get_settings
from starlette.websockets import WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_token(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=403, detail="No token provided")
    return token

async def verify_token(token: str = Depends(get_token)):
    try:
        settings = get_settings()
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, user=Depends(verify_token)):
    await websocket.accept()
    logger.info(f"WebSocket connection established for user: {user}")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message: {data}")
            
            try:
                async for response_token in askLLM(data):
                    await websocket.send_text(response_token)
                
                await websocket.send_text("[END]")
                logger.info("Sent [END] message")
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                await websocket.send_text(f"Error: {str(e)}")
                await websocket.send_text("[END]")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
    finally:
        logger.info(f"WebSocket connection closed for user: {user}")
        await websocket.close()