import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.llm.provider import LLMProvider
from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self):
        self.keys = [
            k.strip() for k in [
                settings.GEMINI_API_KEY,
                settings.GEMINI_API_KEY_2,
                settings.GEMINI_API_KEY_3
            ] if k and len(k.strip()) > 5
        ]
        self.active_key_index = 0
        self.primary_model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self.fallback_models = [
            self.primary_model,
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro"
        ]

    async def is_available(self) -> bool:
        return len(self.keys) > 0

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.debug("Gemini API has no valid keys configured.")
            return None

        # Try active key; if quota exhausted, try secondary then tertiary
        while self.active_key_index < len(self.keys):
            current_key = self.keys[self.active_key_index]
            key_label = f"key #{self.active_key_index + 1}"
            headers = {
                "x-goog-api-key": current_key,
                "Content-Type": "application/json"
            }

            payload = {
                "system_instruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            }

            for model_name in self.fallback_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"

                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        await db.record_api_call("gemini")
                        response = await client.post(url, headers=headers, json=payload)

                        if response.status_code == 200:
                            data = response.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                text = candidates[0]["content"]["parts"][0]["text"]
                                return json.loads(text)

                        elif response.status_code in (429, 403) or (response.status_code == 400 and "quota" in response.text.lower()):
                            logger.warning(f"Gemini {key_label} quota / rate limit exhausted (status {response.status_code}).")
                            # Quota exhausted on this key, break model loop to advance key
                            break

                        elif response.status_code in (404, 400) and ("not found" in response.text.lower() or "no longer available" in response.text.lower()):
                            logger.info(f"Gemini model {model_name} unavailable on {key_label}, trying next model...")
                            continue

                        else:
                            logger.error(f"Gemini API returned status {response.status_code}: {response.text[:120]}")
                            break

                except Exception as e:
                    logger.error(f"Gemini API request exception on {key_label} ({model_name}): {e}")
                    continue

            # Advance to next key if this key is exhausted
            self.active_key_index += 1
            if self.active_key_index < len(self.keys):
                logger.info(f"Failing over to Gemini key #{self.active_key_index + 1}...")

        logger.warning("All configured Gemini API keys are exhausted or unavailable.")
        return None
