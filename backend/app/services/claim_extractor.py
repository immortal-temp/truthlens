import logging
import re
from typing import Dict, Any, Tuple
from app.models.claim import ExtractedEntities
from app.llm.manager import llm_manager

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a precise news claim entity extractor.
Your task is to extract structured entities from a user-supplied news claim.
CRITICAL RULES:
- Never invent people, places, organizations, or numbers that are not in the claim.
- Use empty lists [] or empty string "" for any field not present.
- Categorize into one of: Politics, Technology, Business, Science, Sports, Entertainment, Education, Health, Environment, International, Other.

Respond ONLY with a JSON object matching this exact schema:
{
  "main_claim": "concise core assertion",
  "people": ["name1"],
  "organizations": ["org1"],
  "locations": ["location1"],
  "events": ["event1"],
  "amounts": ["amount1"],
  "dates": ["date1"],
  "times": ["time1"],
  "countries": ["country1"],
  "category": "Politics",
  "important_keywords": ["keyword1", "keyword2"]
}"""

async def extract_claim_entities(claim: str, date: str, time: str = None) -> Tuple[ExtractedEntities, str]:
    prompt = f"Claim statement: \"{claim}\"\nAssociated input date: \"{date}\"\nAssociated input time: \"{time or 'Not specified'}\""
    
    data, provider_used = await llm_manager.execute_with_fallback(
        prompt=prompt,
        system_instruction=EXTRACTION_SYSTEM_PROMPT
    )

    if data and isinstance(data, dict):
        sanitized = {}
        list_fields = ["people", "organizations", "locations", "events", "amounts", "dates", "times", "countries", "important_keywords"]
        for k, v in data.items():
            if k in list_fields:
                if isinstance(v, list):
                    sanitized[k] = [str(x).strip() for x in v if str(x).strip()]
                elif isinstance(v, str) and v.strip() and v.strip().lower() != "none":
                    sanitized[k] = [v.strip()]
                else:
                    sanitized[k] = []
            elif k in ("main_claim", "category"):
                sanitized[k] = str(v) if v is not None else ""
            else:
                sanitized[k] = v
        for lf in list_fields:
            if lf not in sanitized:
                sanitized[lf] = []
        if "main_claim" not in sanitized or not sanitized["main_claim"]:
            sanitized["main_claim"] = claim.strip()
        if "category" not in sanitized or not sanitized["category"]:
            sanitized["category"] = "Other"

        try:
            return ExtractedEntities(**sanitized), provider_used
        except Exception as e:
            logger.warning(f"Extracted entities schema validation failed: {e}. Using sanitized fallback.")

    # Rule-based fallback extraction if LLM is unavailable
    words = [w for w in re.findall(r'\b[A-Za-z0-9_-]+\b', claim) if len(w) > 3]
    fallback_entities = ExtractedEntities(
        main_claim=claim.strip(),
        people=[],
        organizations=[],
        locations=[],
        events=[],
        amounts=re.findall(r'\$?\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:billion|million|crore|lakh|percent|%))?', claim, re.IGNORECASE),
        dates=[date] if date else [],
        times=[time] if time else [],
        countries=[],
        category="Other",
        important_keywords=words[:6]
    )
    return fallback_entities, provider_used
