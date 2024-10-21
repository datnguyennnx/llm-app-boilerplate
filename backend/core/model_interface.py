from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
import asyncio
from config.settings import settings
import logging
from core.helper.prompt import get_system_message
from functools import lru_cache

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

    @lru_cache(maxsize=1)
    def get_cached_system_message(self) -> SystemMessage:
        return get_system_message()

    async def generate(self, content: str) -> AsyncGenerator[str, None]:
        callback = AsyncIteratorCallbackHandler()
        model = self.get_model(callback)
        
        system_message = self.get_cached_system_message()

        task = asyncio.create_task(
            model.agenerate(messages=[[system_message, HumanMessage(content=content)]])
        )

        try:
            async for token in callback.aiter():
                yield token
        except Exception as e:
            logger.error(f"Caught exception while streaming response: {e}")
        finally:
            callback.done.set()

        await task

    @abstractmethod
    def get_model(self, callback: AsyncIteratorCallbackHandler) -> Any:
        pass

class OpenAIModel(BaseLLMModel):
    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0.5):
        super().__init__(model_name, temperature, settings.OPENAI_API_KEY)

    def get_model(self, callback: AsyncIteratorCallbackHandler) -> ChatOpenAI:
        if not self.api_key:
            raise ValueError("OpenAI API key is not set")
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
#             raise ValueError("Anthropic API key is not set")
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
        if model_type.lower() == "openai":
            return OpenAIModel(model_name or settings.DEFAULT_OPENAI_MODEL, temperature)
        # elif model_type.lower() == "anthropic":
        #     return AnthropicModel(model_name or settings.DEFAULT_ANTHROPIC_MODEL, temperature)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")