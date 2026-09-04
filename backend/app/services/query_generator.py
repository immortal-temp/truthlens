import logging
import re
from typing import List
from app.models.claim import ExtractedEntities
from app.llm.manager import llm_manager

logger = logging.getLogger(__name__)

QUERY_GEN_SYSTEM_PROMPT = """You are a news search query generator.
From the user's news claim, generate 3 to 4 concise search queries (3 to 6 keywords each) that journalists and news headlines use to report this exact event.
CRITICAL RULES:
- Use concise search keywords (3-6 words per query), NOT full long sentences.
- Include key entities (e.g., organization names, people, locations, action/event).
- Include common acronyms (e.g., CBI for Central Bureau of Investigation, ISRO for Indian Space Research Organisation).
- Output ONLY valid JSON:
{"queries": ["CBI digital arrest crackdown locations", "Central Bureau of Investigation digital arrest", "digital arrest syndicate three arrested"]}"""

def extract_heuristic_keywords(claim: str, entities: ExtractedEntities) -> List[str]:
    """Generates concise fallback keyword queries directly from text and entities."""
    # Strip punctuation
    clean = re.sub(r'[,;:\'"\(\)\[\]\{\}\<\>\\\/|#@!?*~`]', ' ', claim)
    words = clean.split()
    
    queries = []
    
    # 1. First 6-7 words
    if len(words) >= 3:
        queries.append(" ".join(words[:6]))
    
    # 2. Entity combination
    ent_tokens = []
    for ent in (entities.organizations + entities.people + entities.locations + entities.countries):
        if ent and len(ent.strip()) > 2:
            ent_tokens.append(ent.strip())
    
    if ent_tokens:
        queries.append(" ".join(ent_tokens[:4]))
        
    return queries

async def generate_search_queries(claim: str, entities: ExtractedEntities) -> List[str]:
    """
    Generates optimized, concise search phrases to query live news feeds.
    """
    full_claim = claim.strip()
    valid_queries = []

    # 1. Add heuristic keyword queries
    for hq in extract_heuristic_keywords(full_claim, entities):
        if len(hq) >= 5:
            valid_queries.append(hq)

    # 2. Get LLM alternative phrases
    prompt = f"""Generate 3-4 concise search queries (3-6 words each) for this news claim:
Claim: "{full_claim}"
Main Assertion: "{entities.main_claim or full_claim}"
Key Entities: {entities.organizations + entities.people + entities.locations + entities.countries}"""

    data, _ = await llm_manager.execute_with_fallback(
        prompt=prompt,
        system_instruction=QUERY_GEN_SYSTEM_PROMPT
    )

    if data and "queries" in data and isinstance(data["queries"], list):
        for q in data["queries"]:
            if isinstance(q, str):
                cleaned = q.strip().replace('"', '').replace("'", "")
                if re.match(r'^query\s*\d+$', cleaned, re.IGNORECASE) or len(cleaned) < 4:
                    continue
                valid_queries.append(cleaned)

    # 3. Deduplicate queries
    unique_queries = []
    seen = set()
    for q in valid_queries:
        norm = q.lower().strip()
        if norm and norm not in seen:
            seen.add(norm)
            unique_queries.append(q.strip())

    logger.info(f"Generated {len(unique_queries[:6])} search queries: {unique_queries[:6]}")
    return unique_queries[:6]
