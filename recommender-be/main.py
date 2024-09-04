import logging
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks import AsyncIteratorCallbackHandler
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Health check endpoint
@app.get("/ping")
async def ping():
    logger.info("Health check endpoint called")
    return {"message": "pong"}

async def send_message(content: str):
    callback = AsyncIteratorCallbackHandler()
    model = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        streaming=True,
        verbose=True,
        callbacks=[callback],
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    system_message = SystemMessage(content="""
    Format your responses using Markdown syntax for better readability and structure. 
    Please use the following Markdown elements:

    1. Use headings (##, ###, ####) to organize main points and subpoints.
    2. Use bullet points (-) or numbered lists (1., 2., 3.) for listing items or steps.
    3. Use **bold** or *italic* for emphasis where appropriate.
    4. Use `code blocks` for any code or technical terms.
    5. Use > for quotations or important notes.
    6. Use --- for horizontal rules to separate sections if needed.

    Ensure your response is well-structured and easy to read.
    """)
    
    task = asyncio.create_task(
        model.agenerate(messages=[[system_message, HumanMessage(content=content)]])
    )

    try:
        async for token in callback.aiter():
            yield token
    except Exception as e:
        logger.error(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task

# WebSocket endpoint for chat
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            logger.info(f"Received message: {data}")
            
            # Generate and stream the response
            async for token in send_message(data):
                await websocket.send_text(token)
                logger.info(f"Sent token: {token}")
            
            # Send a special message to indicate the end of the response
            await websocket.send_text("[END]")
            logger.info("Sent [END] message")
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
    finally:
        logger.info("WebSocket connection closed")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")