import logging
import httpx
from typing import List
from app.models.article import NormalizedArticle
from app.news.normalizer import normalize_gnews_article
from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

import re

def sanitize_query(q: str) -> str:
    # Remove syntax-breaking characters for GNews
    clean = re.sub(r'[:;"\'\(\)\[\]\{\}\<\>\\\/|#@]', ' ', q)
    return " ".join(clean.split()).strip()

async def search_gnews(query: str, max_results: int = 8) -> List[NormalizedArticle]:
    api_key = settings.GNEWS_API_KEY
    if not api_key:
        logger.debug("GNews API key not configured.")
        return []

    clean_q = sanitize_query(query)
    if not clean_q or len(clean_q) < 3:
        return []

    url = "https://gnews.io/api/v4/search"
    params = {
        "q": clean_q,
        "token": api_key,
        "lang": "en",
        "max": max_results,
        "sortby": "relevance"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await db.record_api_call("gnews")
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                articles_raw = data.get("articles", [])
                results = []
                for item in articles_raw:
                    norm = normalize_gnews_article(item, query_used=query)
                    if norm:
                        results.append(norm)
                return results
            elif resp.status_code == 429:
                logger.warning("GNews rate limit exceeded (429).")
            else:
                logger.error(f"GNews error {resp.status_code}")
    except Exception:
        logger.error("GNews request failed.")
    return []
