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
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-3.6-flash"

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.warning("Gemini API key is not configured.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
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

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await db.record_api_call("gemini")
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0]["content"]["parts"][0]["text"]
                        return json.loads(text)
                elif response.status_code == 429:
                    logger.warning("Gemini quota / rate limit exceeded (429). Triggering fallback.")
                    return None
                else:
                    logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")
            return None
