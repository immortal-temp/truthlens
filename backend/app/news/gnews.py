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
    keys = [
        k.strip() for k in [
            settings.GNEWS_API_KEY,
            settings.GNEWS_API_KEY_2,
            settings.GNEWS_API_KEY_3
        ] if k and len(k.strip()) > 5
    ]
    if not keys:
        logger.debug("GNews API has no keys configured.")
        return []

    clean_q = sanitize_query(query)
    if not clean_q or len(clean_q) < 3:
        return []

    url = "https://gnews.io/api/v4/search"

    for idx, api_key in enumerate(keys):
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
                elif resp.status_code in (429, 403):
                    logger.warning(f"GNews key #{idx + 1} quota/rate limit reached ({resp.status_code}). Failing over to next key...")
                    continue
                else:
                    logger.error(f"GNews error with key #{idx + 1}: {resp.status_code}")
                    continue
        except Exception:
            logger.error(f"GNews request failed for key #{idx + 1}.")
            continue

    return []
