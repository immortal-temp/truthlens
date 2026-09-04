import json
import re
import logging
import httpx
from typing import Dict, Any, Optional
from app.llm.provider import LLMProvider
from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

def clean_json_text(text: str) -> str:
    """Strips <think>...</think> tags and markdown code blocks from LLM output."""
    if not text:
        return ""
    # Remove reasoning model <think>...</think> blocks
    clean = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.DOTALL)
    # Remove markdown code fences
    clean = re.sub(r'^```(?:json)?\s*', '', clean.strip(), flags=re.MULTILINE)
    clean = re.sub(r'```\s*$', '', clean.strip(), flags=re.MULTILINE)
    return clean.strip()

class GroqProvider(LLMProvider):
    name = "groq"

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL or "openai/gpt-oss-120b"

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.warning("Groq API key is not configured.")
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": f"{system_instruction}\nRespond ONLY in valid raw JSON format."},
                {"role": "user", "content": f"{prompt}\nReturn JSON."}
            ],
            "max_tokens": 4096,
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                await db.record_api_call("groq")
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0]["message"].get("content", "")
                        clean_content = clean_json_text(content)
                        idx = clean_content.find('{')
                        if idx != -1:
                            try:
                                obj, _ = json.JSONDecoder().raw_decode(clean_content[idx:])
                                return obj
                            except Exception:
                                pass
                        return json.loads(clean_content)
                elif response.status_code == 429:
                    logger.warning("Groq rate limit exceeded (429). Triggering fallback.")
                    return None
                else:
                    logger.error(f"Groq API returned status {response.status_code}")
                    return None
        except Exception:
            logger.error("Groq API request failed.")
            return None
