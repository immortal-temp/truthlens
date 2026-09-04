import logging
from typing import Dict, Any, Optional, Tuple
from app.llm.provider import LLMProvider
from app.llm.gemini import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.openrouter import OpenRouterProvider
from app.config import settings

logger = logging.getLogger(__name__)

class LLMManager:
    def __init__(self):
        self.providers: list[LLMProvider] = [
            GroqProvider(),
            GeminiProvider(),
            OpenRouterProvider()
        ]

    async def execute_with_fallback(
        self,
        prompt: str,
        system_instruction: str
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Executes prompt across providers in priority order: Gemini -> Groq -> OpenRouter.
        Returns (parsed_json_dict, provider_name_used).
        If all providers fail, returns (None, "none").
        """
        for provider in self.providers:
            if await provider.is_available():
                logger.info(f"Attempting LLM call using provider: {provider.name}...")
                try:
                    result = await provider.generate_json(prompt, system_instruction)
                    if result is not None:
                        logger.info(f"Successfully generated response via {provider.name}.")
                        return result, provider.name
                    logger.warning(f"Provider {provider.name} failed or rate-limited. Trying next fallback...")
                except Exception as e:
                    logger.error(f"Error during {provider.name} execution: {e}. Moving to next fallback.")
            else:
                logger.debug(f"Provider {provider.name} not configured, skipping.")

        logger.warning("All configured LLM providers failed or none are configured.")
        return None, "fallback_evidence_only"

llm_manager = LLMManager()
