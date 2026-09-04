import logging
import re
from typing import List
from app.models.article import NormalizedArticle
from app.models.claim import ExtractedEntities

logger = logging.getLogger(__name__)

CONTRADICTION_PATTERNS = [
    r'\bfact[-\s]?check\b', r'\bhoax\b', r'\bfake\b', r'\bfalse\b', r'\bdebunk(?:ed)?\b',
    r'\bno evidence\b', r'\bnever happened\b', r'\bdenies\b', r'\brefutes\b',
    r'\bmisleading\b', r'\bclarification\b', r'\bunfounded\b', r'\bfabricated\b',
    r'\bdid not\b', r'\bnot true\b', r'\bbaseless\b'
]

def classify_article_evidence(
    article: NormalizedArticle,
    claim: str,
    entities: ExtractedEntities
) -> str:
    text = f"{article.title} {article.description or ''} {article.content or ''}".lower()
    claim_lower = claim.lower()
    
    sim = article.semantic_similarity or 0.0
    
    # If semantic similarity is very low, it's unrelated
    if sim < 0.12:
        return "Unrelated"

    # Check for direct contradiction / debunking markers
    is_contradiction = any(re.search(pat, text) for pat in CONTRADICTION_PATTERNS)
    
    if is_contradiction:
        # Check if the debunking is specifically targeting the subject of the claim
        keywords = [k.lower() for k in entities.important_keywords if len(k) > 3]
        if any(k in text for k in keywords) or sim > 0.25:
            return "Contradicting"

    # Supporting vs Partially Supporting
    if sim >= 0.35:
        return "Supporting"
    elif sim >= 0.20:
        return "Partially Supporting"
    elif sim >= 0.12:
        return "Neutral"

    return "Unrelated"

def enrich_articles_evidence_classification(
    articles: List[NormalizedArticle],
    claim: str,
    entities: ExtractedEntities
) -> List[NormalizedArticle]:
    for a in articles:
        a.evidence_classification = classify_article_evidence(a, claim, entities)
    return articles
