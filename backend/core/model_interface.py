from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
import asyncio
from config.settings import settings
import logging
import time
from core.helper.prompt import get_system_message

logger = logging.getLogger(__name__)

class ModelInterface(ABC):
    @abstractmethod
    async def generate(self, content: str) -> AsyncGenerator[str, None]:
        pass

class BaseLLMModel(ModelInterface):
    def __init__(self, model_name: str, temperature: float, api_key: str):
        self.model_name = model_name
        self.temperature = temperature
        self.api_key = api_key
        self._current_task = None
        self._callback = None
        self._generation_lock = asyncio.Lock()
        logger.info(f"Initialized {self.__class__.__name__} with model: {model_name}, temperature: {temperature}")

    async def generate(self, content: str) -> AsyncGenerator[str, None]:
        start_time = time.time()
        token_count = 0
        async with self._generation_lock:  # Ensure only one generation at a time
            self._callback = AsyncIteratorCallbackHandler()
            model = self.get_model(self._callback)
            
            system_message = get_system_message()
            logger.debug(f"System message generated for {self.model_name}")

            self._current_task = asyncio.create_task(
                model.agenerate(messages=[[system_message, HumanMessage(content=content)]])
            )

            try:
                async for token in self._callback.aiter():
                    token_count += 1
                    yield token
            except Exception as e:
                logger.error(f"Error during generation with {self.model_name}: {str(e)}")
                raise
            finally:
                if self._callback:
                    self._callback.done.set()

                try:
                    if not self._current_task.done():
                        await self._current_task
                except Exception as e:
                    logger.error(f"Error waiting for generation task with {self.model_name}: {str(e)}")

        total_time = time.time() - start_time
        logger.info(f"Generation completed for {self.model_name}. Tokens generated: {token_count}. Total time: {total_time:.2f} seconds. Average time per token: {total_time/token_count:.4f} seconds")

    @abstractmethod
    def get_model(self, callback: AsyncIteratorCallbackHandler) -> Any:
        pass

class OpenAIModel(BaseLLMModel):
    def __init__(self, model_name: str = "gpt-3.5-turbo", temperature: float = 0.5):
        super().__init__(model_name, temperature, settings.OPENAI_API_KEY)

    def get_model(self, callback: AsyncIteratorCallbackHandler) -> ChatOpenAI:
        if not self.api_key:
            logger.error("OpenAI API key is not set")
            raise ValueError("OpenAI API key is not set")
        logger.info(f"Creating ChatOpenAI model: {self.model_name}")
        return ChatOpenAI(
            model_name=self.model_name,
            streaming=True,
            verbose=True,
            callbacks=[callback],
            temperature=self.temperature,
            openai_api_key=self.api_key
        )

# class AnthropicModel(BaseLLMModel):
#     def __init__(self, model_name: str = settings.DEFAULT_ANTHROPIC_MODEL, temperature: float = settings.DEFAULT_TEMPERATURE):
#         super().__init__(model_name, temperature, settings.ANTHROPIC_API_KEY)

#     def get_model(self, callback: AsyncIteratorCallbackHandler) -> ChatAnthropic:
#         if not self.api_key:
#             logger.error("Anthropic API key is not set")
#             raise ValueError("Anthropic API key is not set")
#         logger.info(f"Creating ChatAnthropic model: {self.model_name}")
#         return ChatAnthropic(
#             model=self.model_name,
#             streaming=True,
#             verbose=True,
#             callbacks=[callback],
#             temperature=self.temperature,
#             anthropic_api_key=self.api_key
#         )

class ModelFactory:
    @staticmethod
    def create_model(model_type: str, model_name: str = None, temperature: float = 0.5) -> ModelInterface:
        logger.info(f"Creating model. Type: {model_type}, Name: {model_name}, Temperature: {temperature}")
        if model_type.lower() == "openai":
            return OpenAIModel(model_name or settings.DEFAULT_OPENAI_MODEL, temperature)
        # elif model_type.lower() == "anthropic":
        #     return AnthropicModel(model_name or settings.DEFAULT_ANTHROPIC_MODEL, temperature)
        else:
            logger.error(f"Unsupported model type: {model_type}")
            raise ValueError(f"Unsupported model type: {model_type}")

logger.info("Model interface module initialized")
