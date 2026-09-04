import asyncio
import logging
from typing import List, Tuple
from app.models.article import NormalizedArticle
from app.news.gnews import search_gnews
from app.news.newsdata import search_newsdata, search_newsapi
from app.news.google_news_rss import search_google_news_rss
from fixtures.demo_fixtures import get_demo_articles_for_queries
from app.config import settings

logger = logging.getLogger(__name__)

async def search_multi_source_news(
    queries: List[str],
    claim: str,
    date_context: str = ""
) -> Tuple[List[NormalizedArticle], bool]:
    """
    Executes multi-source search in parallel for all generated queries.
    Queries Google News RSS (Free), GNews, NewsData, and NewsAPI.
    Returns (articles_list, is_demo_mode_used).
    """
    if settings.DEMO_MODE:
        logger.info("DEMO_MODE=true is active. Replaying real frozen news fixtures.")
        demo_articles = get_demo_articles_for_queries(queries, claim)
        return demo_articles, True

    tasks = []
    for query in queries:
        tasks.append(search_google_news_rss(query))
        tasks.append(search_gnews(query))
        tasks.append(search_newsdata(query))
        tasks.append(search_newsapi(query))

    raw_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    merged_articles: List[NormalizedArticle] = []
    seen_urls = set()

    for result in raw_results:
        if isinstance(result, list):
            for art in result:
                if isinstance(art, NormalizedArticle) and art.url not in seen_urls:
                    seen_urls.add(art.url)
                    merged_articles.append(art)
        elif isinstance(result, Exception):
            logger.warning(f"Search subtask error: {result}")

    # Fallback to demo mode if all live APIs returned 0 articles (e.g. invalid or expired keys)
    if not merged_articles:
        logger.warning("No articles returned from live APIs. Using fallback fixture articles.")
        return get_demo_articles_for_queries(queries, claim), True

    return merged_articles, False
