import logging
import re
from typing import List
from app.models.claim import ExtractedEntities
from app.llm.manager import llm_manager

logger = logging.getLogger(__name__)

QUERY_GEN_SYSTEM_PROMPT = """You are a news search query generator.
From the user's news claim, generate alternative search phrases that news agencies use.
CRITICAL RULES:
- Never return placeholder words like "query 1", "query 2".
- Return real topical phrases using the actual entities, countries, and events from the claim.
- Output ONLY valid JSON:
{"queries": ["complete search phrase 1", "alternative search phrase 2"]}"""

async def generate_search_queries(claim: str, entities: ExtractedEntities) -> List[str]:
    """
    Sends the complete full claim statement directly, plus LLM alternative variations.
    """
    full_claim = claim.strip()
    
    # 1. Primary Query: The complete original claim statement as-is
    valid_queries = [full_claim]

    # 2. Get LLM alternative phrases
    prompt = f"""Generate search queries for this exact news claim:
Claim: "{full_claim}"
Main Assertion: "{entities.main_claim or full_claim}"
Key Entities: {entities.people + entities.organizations + entities.locations + entities.countries}"""

    data, _ = await llm_manager.execute_with_fallback(
        prompt=prompt,
        system_instruction=QUERY_GEN_SYSTEM_PROMPT
    )

    if data and "queries" in data and isinstance(data["queries"], list):
        for q in data["queries"]:
            if isinstance(q, str):
                cleaned = q.strip().replace('"', '').replace("'", "")
                if re.match(r'^query\s*\d+$', cleaned, re.IGNORECASE) or len(cleaned) < 5:
                    continue
                valid_queries.append(cleaned)

    # 3. Deduplicate while preserving the complete original claim as the top priority
    unique_queries = []
    seen = set()
    for q in valid_queries:
        norm = q.lower().strip()
        if norm and norm not in seen:
            seen.add(norm)
            unique_queries.append(q.strip())

    logger.info(f"Final search queries (Total {len(unique_queries[:5])}): {unique_queries[:5]}")
    return unique_queries[:5]
