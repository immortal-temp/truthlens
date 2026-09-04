import logging
import re
from typing import List
from app.models.article import NormalizedArticle
from app.models.claim import ExtractedEntities

logger = logging.getLogger(__name__)

FACT_CHECK_SOURCES = {
    "alt news", "boom live", "pib fact check", "factly", "vishvas news",
    "the quint", "snopes", "politifact", "factcheck.org", "reuters fact check",
    "afp fact check", "bbc reality check", "indiatoday fact check", "newschecker"
}

FACT_CHECK_HEADLINE_PATTERNS = [
    r'\bfact[-\s]?check\b',
    r'\bdebunk(?:ed)?\b',
    r'\bhoax\b',
    r'\bfake news\b',
    r'\bfalse claim\b',
    r'\bmisleading claim\b',
    r'\bclaim debunked\b',
    r'\bviral claim is false\b'
]

def classify_article_evidence(
    article: NormalizedArticle,
    claim: str,
    entities: ExtractedEntities
) -> str:
    title_lower = (article.title or "").lower()
    text_lower = f"{title_lower} {(article.description or '').lower()} {(article.content or '').lower()}"
    src_lower = (article.source_name or "").lower()
    sim = article.semantic_similarity or 0.0

    # If semantic similarity is very low, it's unrelated
    if sim < 0.12:
        return "Unrelated"

    # Check if article is an authentic fact-check / debunking refutation
    is_from_fact_checker = any(fc in src_lower for fc in FACT_CHECK_SOURCES)
    has_fact_check_title = any(re.search(pat, title_lower) for pat in FACT_CHECK_HEADLINE_PATTERNS)

    if (is_from_fact_checker or has_fact_check_title) and sim >= 0.22:
        return "Contradicting"

    # Supporting vs Partially Supporting based on semantic similarity and relevance
    if sim >= 0.35:
        return "Supporting"
    elif sim >= 0.18:
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
