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
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct"

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.warning("OpenRouter API key is not configured.")
            return None

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://truthlens.local",
            "X-Title": "TruthLens"
        }
        
        payload = {
            "model": self.model,
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
                elif response.status_code == 429:
                    logger.warning("OpenRouter rate limit exceeded (429).")
                    return None
                else:
                    logger.error(f"OpenRouter API returned status {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"OpenRouter API request failed: {e}")
            return None
