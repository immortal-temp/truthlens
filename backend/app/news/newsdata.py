import logging
import httpx
from typing import List
from app.models.article import NormalizedArticle
from app.news.normalizer import normalize_newsdata_article, normalize_newsapi_article
from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

import re

def sanitize_query(q: str) -> str:
    clean = re.sub(r'[:;"\'\(\)\[\]\{\}\<\>\\\/|#@]', ' ', q)
    return " ".join(clean.split()).strip()

async def search_newsdata(query: str, max_results: int = 5) -> List[NormalizedArticle]:
    keys = [
        k.strip() for k in [
            settings.NEWSDATA_API_KEY,
            settings.NEWSDATA_API_KEY_2,
            settings.NEWSDATA_API_KEY_3
        ] if k and len(k.strip()) > 5
    ]
    if not keys:
        return []

    clean_q = sanitize_query(query)
    if not clean_q or len(clean_q) < 3:
        return []

    url = "https://newsdata.io/api/1/news"

    for idx, api_key in enumerate(keys):
        params = {
            "apikey": api_key,
            "q": clean_q,
            "language": "en"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await db.record_api_call("newsdata")
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data.get("results", []):
                        norm = normalize_newsdata_article(item, query_used=query)
                        if norm:
                            results.append(norm)
                    return results[:max_results]
                elif resp.status_code in (429, 403):
                    logger.warning(f"NewsData key #{idx + 1} quota/rate limit reached ({resp.status_code}). Failing over to next key...")
                    continue
                else:
                    logger.error(f"NewsData error with key #{idx + 1}: {resp.status_code}")
                    continue
        except Exception:
            logger.error(f"NewsData.io request failed for key #{idx + 1}.")
            continue

    return []

async def search_newsapi(query: str, max_results: int = 5) -> List[NormalizedArticle]:
    keys = [
        k.strip() for k in [
            settings.NEWSAPI_API_KEY,
            settings.NEWSAPI_API_KEY_2,
            settings.NEWSAPI_API_KEY_3
        ] if k and len(k.strip()) > 5
    ]
    if not keys:
        return []

    url = "https://newsapi.org/v2/everything"

    for idx, api_key in enumerate(keys):
        params = {
            "apiKey": api_key,
            "q": query,
            "language": "en",
            "pageSize": max_results,
            "sortBy": "relevancy"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await db.record_api_call("newsapi")
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data.get("articles", []):
                        norm = normalize_newsapi_article(item, query_used=query)
                        if norm:
                            results.append(norm)
                    return results
                elif resp.status_code in (429, 403, 402):
                    logger.warning(f"NewsAPI key #{idx + 1} quota/rate limit reached ({resp.status_code}). Failing over to next key...")
                    continue
                else:
                    logger.error(f"NewsAPI error with key #{idx + 1}: {resp.status_code}")
                    continue
        except Exception:
            logger.error(f"NewsAPI.org request failed for key #{idx + 1}.")
            continue

    return []
