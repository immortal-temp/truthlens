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
        self.keys = [
            k.strip() for k in [
                settings.GROQ_API_KEY,
                settings.GROQ_API_KEY_2,
                settings.GROQ_API_KEY_3
            ] if k and len(k.strip()) > 5
        ]
        self.active_key_index = 0
        self.primary_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self.fallback_models = [
            self.primary_model,
            "openai/gpt-oss-20b",
            "qwen/qwen3.8-27b",
            "groq/compound-mini"
        ]

    async def is_available(self) -> bool:
        return len(self.keys) > 0

    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        if not await self.is_available():
            logger.debug("Groq API has no valid keys configured.")
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"

        # Try active key; if quota exhausted, try secondary then tertiary
        while self.active_key_index < len(self.keys):
            current_key = self.keys[self.active_key_index]
            key_label = f"key #{self.active_key_index + 1}"
            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json"
            }

            for model_name in self.fallback_models:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": f"{system_instruction}\nRespond ONLY in valid raw JSON format."},
                        {"role": "user", "content": f"{prompt}\nReturn JSON."}
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.1
                }

                try:
                    async with httpx.AsyncClient(timeout=25.0) as client:
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

                        elif response.status_code in (429, 402) or (response.status_code == 400 and "quota" in response.text.lower()):
                            logger.warning(f"Groq {key_label} quota / rate limit exhausted (status {response.status_code}).")
                            # Break model loop to switch to next key
                            break

                        elif response.status_code in (404, 400) and ("model" in response.text.lower() or "decommissioned" in response.text.lower()):
                            logger.info(f"Groq model {model_name} unavailable on {key_label}, trying fallback model...")
                            continue

                        elif response.status_code == 401:
                            logger.error(f"Groq {key_label} unauthorized/invalid. Trying next key...")
                            break

                        else:
                            logger.error(f"Groq API returned status {response.status_code}: {response.text[:120]}")
                            break

                except Exception as e:
                    logger.error(f"Groq API request exception on {key_label} ({model_name}): {e}")
                    continue

            # If quota was exhausted on this key, advance to next key
            self.active_key_index += 1
            if self.active_key_index < len(self.keys):
                logger.info(f"Failing over to Groq key #{self.active_key_index + 1}...")

        logger.warning("All configured Groq API keys are exhausted or unavailable.")
        return None
