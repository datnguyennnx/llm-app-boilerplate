import asyncio
import logging
from typing import AsyncGenerator, Optional
from config.settings import settings
from core.model_interface import ModelFactory

logger = logging.getLogger(__name__)

async def askLLM(
    content: str,
    model_type: str = settings.DEFAULT_MODEL_TYPE,
    model_name: Optional[str] = None,
    temperature: float = settings.DEFAULT_TEMPERATURE
) -> AsyncGenerator[str, None]:
    """
    Asynchronously generate a response from a language model.

    Args:
        content (str): The input message or prompt for the language model.
        model_type (str, optional): The type of model to use ('openai' or 'anthropic').
                                    Defaults to the value in settings.DEFAULT_MODEL_TYPE.
        model_name (str, optional): The specific model name. If None, uses the default for the model type.
        temperature (float, optional): The temperature setting for the model.
                                       Defaults to the value in settings.DEFAULT_TEMPERATURE.

    Yields:
        str: Tokens of the generated response.

    Raises:
        ValueError: If an invalid model configuration is provided.
        Exception: For any unexpected errors during execution.
    """
    logger.info(f"Received message: {content}")
    logger.info(f"Using model type: {model_type}, model name: {model_name}, temperature: {temperature}")

    try:
        model = ModelFactory.create_model(model_type, model_name, temperature)
        logger.info(f"Initialized {model_type} model")

        logger.info("Generating response")
        async for token in model.generate(content):
            logger.debug(f"Yielding token: {token}")
            yield token

    except ValueError as ve:
        logger.error(f"Invalid model configuration: {ve}")
        yield f"Error: {ve}"
    except Exception as e:
        logger.error(f"Unexpected error occurred: {e}")
        yield f"An unexpected error occurred. Please try again later."

    logger.info("Completed askLLM function")
