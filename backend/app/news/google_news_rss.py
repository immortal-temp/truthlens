import logging
import re
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Optional
import httpx
from datetime import datetime
from email.utils import parsedate_to_datetime
from app.models.article import NormalizedArticle
from app.database.mongodb import db

logger = logging.getLogger(__name__)

def parse_rss_pubdate(pub_date_str: str) -> str:
    """Parses RFC 822 format (e.g. 'Thu, 07 Sep 2023 07:00:00 GMT') to ISO string."""
    if not pub_date_str:
        return ""
    try:
        dt = parsedate_to_datetime(pub_date_str)
        return dt.isoformat()
    except Exception:
        return pub_date_str

import html

def clean_html(raw_html: str) -> str:
    """Removes HTML tags and decodes HTML entities."""
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    return " ".join(clean.split()).strip()

def clean_rss_query(q: str) -> str:
    """Removes special punctuation that causes Google News RSS search to fail."""
    clean = re.sub(r'[,;:\'"\(\)\[\]\{\}\<\>\\\/|#@!?*~`]', ' ', q)
    words = clean.split()
    # If query is too long, prioritize first 8 key terms
    if len(words) > 8:
        return " ".join(words[:8])
    return " ".join(words).strip()

async def search_google_news_rss(query: str, max_results: int = 10) -> List[NormalizedArticle]:
    """
    Retrieves real-time news from Google News Public RSS feed.
    100% Free, zero API key required, zero quota limits.
    """
    cleaned_q = clean_rss_query(query)
    if not cleaned_q or len(cleaned_q.strip()) < 3:
        return []

    encoded_query = urllib.parse.quote(cleaned_q.strip())
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
    }

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            await db.record_api_call("google_news_rss")
            resp = await client.get(url, headers=headers)
            
            if resp.status_code != 200:
                logger.warning(f"Google News RSS returned status {resp.status_code}")
                return []

            root = ET.fromstring(resp.text)
            items = root.findall(".//item")
            
            articles: List[NormalizedArticle] = []
            
            for item in items[:max_results]:
                title_raw = (item.findtext("title") or "").strip()
                title = html.unescape(title_raw).strip()
                link = (item.findtext("link") or "").strip()
                pub_date = (item.findtext("pubDate") or "").strip()
                description_raw = (item.findtext("description") or "").strip()
                
                # Source element: <source url="...">Publisher Name</source>
                source_elem = item.find("source")
                source_name = ""
                if source_elem is not None and source_elem.text:
                    source_name = source_elem.text.strip()
                
                # If title ends with " - Source Name", extract source if missing
                if not source_name and " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0].strip()
                    source_name = parts[1].strip()
                elif source_name and title.endswith(f" - {source_name}"):
                    title = title[:-len(f" - {source_name}")].strip()

                if not title or not link:
                    continue

                clean_desc = clean_html(description_raw)
                iso_date = parse_rss_pubdate(pub_date)

                articles.append(NormalizedArticle(
                    title=title,
                    description=clean_desc,
                    url=link,
                    source_name=source_name or "Google News",
                    published_at=iso_date,
                    content=clean_desc,
                    query_used=query
                ))

            logger.info(f"Retrieved {len(articles)} articles from Google News RSS for query: '{query[:30]}...'")
            return articles

    except Exception:
        logger.error("Google News RSS search request failed.")
        return []
