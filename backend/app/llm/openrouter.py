import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.llm.provider import LLMProvider
from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

class OpenRouterProvider(LLMProvider):
    name = "openrouter"

    def __init__(self):
        self.keys = [
            k.strip() for k in [
                settings.OPENROUTER_API_KEY,
                settings.OPENROUTER_API_KEY_2,
                settings.OPENROUTER_API_KEY_3
            ] if k and len(k.strip()) > 5
        ]
        self.active_key_index = 0
        self.primary_model = settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct"
        self.fallback_models = [
            self.primary_model,
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "deepseek/deepseek-r1:free"
        ]

    async def is_available(self) -> bool:
        return len(self.keys) > 0

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.debug("OpenRouter API has no valid keys configured.")
            return None

        url = "https://openrouter.ai/api/v1/chat/completions"

        # Try active key; if quota exhausted, try secondary then tertiary
        while self.active_key_index < len(self.keys):
            current_key = self.keys[self.active_key_index]
            key_label = f"key #{self.active_key_index + 1}"
            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://truthlens.local",
                "X-Title": "TruthLens"
            }

            for model_name in self.fallback_models:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": f"{system_instruction}\nRespond ONLY in valid JSON format."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                }

                try:
                    async with httpx.AsyncClient(timeout=25.0) as client:
                        await db.record_api_call("openrouter")
                        response = await client.post(url, headers=headers, json=payload)

                        if response.status_code == 200:
                            data = response.json()
                            choices = data.get("choices", [])
                            if choices:
                                content = choices[0]["message"]["content"]
                                return json.loads(content)

                        elif response.status_code in (429, 402) or (response.status_code == 400 and "quota" in response.text.lower()):
                            logger.warning(f"OpenRouter {key_label} quota / rate limit exhausted (status {response.status_code}).")
                            # Break model loop to advance key
                            break

                        elif response.status_code in (404, 400):
                            logger.info(f"OpenRouter model {model_name} unavailable on {key_label}, trying next model...")
                            continue

                        else:
                            logger.error(f"OpenRouter API returned status {response.status_code}: {response.text[:120]}")
                            break

                except Exception as e:
                    logger.error(f"OpenRouter API request exception on {key_label} ({model_name}): {e}")
                    continue

            # Advance to next key if this key is exhausted
            self.active_key_index += 1
            if self.active_key_index < len(self.keys):
                logger.info(f"Failing over to OpenRouter key #{self.active_key_index + 1}...")

        logger.warning("All configured OpenRouter API keys are exhausted or unavailable.")
        return None
