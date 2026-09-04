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
    api_key = settings.NEWSDATA_API_KEY
    if not api_key:
        return []

    clean_q = sanitize_query(query)
    if not clean_q or len(clean_q) < 3:
        return []

    url = "https://newsdata.io/api/1/news"
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
    except Exception as e:
        logger.error(f"NewsData.io request failed: {e}")
    return []

async def search_newsapi(query: str, max_results: int = 5) -> List[NormalizedArticle]:
    api_key = settings.NEWSAPI_API_KEY
    if not api_key:
        return []

    url = "https://newsapi.org/v2/everything"
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
    except Exception as e:
        logger.error(f"NewsAPI.org request failed: {e}")
    return []
