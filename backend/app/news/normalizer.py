import logging
from typing import Dict, Any, Optional
from datetime import datetime
from app.models.article import NormalizedArticle

logger = logging.getLogger(__name__)

def normalize_gnews_article(item: Dict[str, Any], query_used: str = "") -> Optional[NormalizedArticle]:
    try:
        title = item.get("title", "").strip()
        url = item.get("url", "").strip()
        if not title or not url:
            return None

        source_info = item.get("source", {})
        source_name = source_info.get("name", "Unknown Outlet") if isinstance(source_info, dict) else str(source_info)

        return NormalizedArticle(
            title=title,
            description=item.get("description", "").strip(),
            url=url,
            source_name=source_name or "Unknown Source",
            published_at=item.get("publishedAt", ""),
            content=item.get("content", "").strip(),
            query_used=query_used
        )
    except Exception as e:
        logger.error(f"Error normalizing GNews article: {e}")
        return None

def normalize_newsdata_article(item: Dict[str, Any], query_used: str = "") -> Optional[NormalizedArticle]:
    try:
        title = item.get("title", "").strip()
        url = item.get("link", "").strip() or item.get("url", "").strip()
        if not title or not url:
            return None

        source_name = item.get("source_id", "") or item.get("source_name", "Unknown Source")
        
        return NormalizedArticle(
            title=title,
            description=item.get("description", "") or "",
            url=url,
            source_name=str(source_name).capitalize(),
            published_at=item.get("pubDate", "") or item.get("published_at", ""),
            content=item.get("content", "") or "",
            query_used=query_used
        )
    except Exception as e:
        logger.error(f"Error normalizing NewsData article: {e}")
        return None

def normalize_newsapi_article(item: Dict[str, Any], query_used: str = "") -> Optional[NormalizedArticle]:
    try:
        title = item.get("title", "").strip()
        url = item.get("url", "").strip()
        if not title or not url or title == "[Removed]":
            return None

        source_info = item.get("source", {})
        source_name = source_info.get("name", "Unknown Source") if isinstance(source_info, dict) else "Unknown Source"

        return NormalizedArticle(
            title=title,
            description=item.get("description", "") or "",
            url=url,
            source_name=source_name,
            published_at=item.get("publishedAt", "") or "",
            content=item.get("content", "") or "",
            query_used=query_used
        )
    except Exception as e:
        logger.error(f"Error normalizing NewsAPI article: {e}")
        return None
