import logging
import re
from typing import List, Tuple
from urllib.parse import urlparse
from app.models.article import NormalizedArticle

logger = logging.getLogger(__name__)

# Known public reference domains
OFFICIAL_GOV_DOMAINS = {
    "who.int", "un.org", "nasa.gov", "gov.in", "pib.gov.in", "isro.gov.in",
    "cdc.gov", "nih.gov", "europa.eu", "whitehouse.gov", "gov.uk", "sci.gov.in"
}

ESTABLISHED_NEWS_DOMAINS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "thehindu.com",
    "nytimes.com", "wsj.com", "washingtonpost.com", "theguardian.com",
    "bloomberg.com", "nature.com", "sciencedirect.com", "timesofindia.indiatimes.com",
    "indianexpress.com", "hindustantimes.com", "lemonde.fr", "aljazeera.com",
    "afp.com", "dw.com", "economist.com", "livelaw.in", "barandbench.com",
    "indiatoday.in", "ndtv.com", "livemint.com", "economictimes.indiatimes.com"
}

RECOGNIZED_PUBLISHER_NAMES = {
    "livelaw", "bar & bench", "bar and bench", "the hindu", "ndtv",
    "times of india", "hindustan times", "indian express", "india today",
    "reuters", "associated press", "ap news", "bbc", "bbc news", "cnn",
    "ani", "pti", "mint", "livemint", "the economic times", "economic times",
    "bloomberg", "the guardian", "supreme court observer", "snopes", "politifact",
    "alt news", "boom live", "the quint", "the print", "wire", "scroll.in"
}

REGIONAL_OR_SPECIALIZED = {
    "techcrunch.com", "theverge.com", "arstechnica.com", "thequint.com",
    "altnews.in", "boomlive.in", "snopes.com", "politifact.com",
    "news18.com", "firstpost.com", "theprint.in"
}

def classify_source_credibility(article: NormalizedArticle) -> Tuple[str, str]:
    """
    Evaluates source credibility signal based on domain authority and publisher type.
    """
    url = article.url or ""
    source_name = (article.source_name or "").lower().strip()
    
    domain = ""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")
    except Exception:
        domain = ""

    # Check Government / Official
    if any(domain.endswith(gov) or gov in domain for gov in OFFICIAL_GOV_DOMAINS) or "government" in source_name or "isro" in source_name or "who" in source_name or "pib" in source_name:
        return "High", "Official/Government"

    # Check Recognized Brand Names (crucial for Google News RSS where URL is google.com)
    if any(pub in source_name for pub in RECOGNIZED_PUBLISHER_NAMES):
        return "High", "Established News Organization"

    # Check Established Domain
    if any(domain == est or domain.endswith("." + est) for est in ESTABLISHED_NEWS_DOMAINS):
        return "High", "Established News Organization"

    # Check Regional or Specialized
    if any(domain == reg or domain.endswith("." + reg) for reg in REGIONAL_OR_SPECIALIZED):
        return "Medium", "Specialized Publication"

    if len(domain) > 3 or len(source_name) > 2:
        return "Medium", "Regional Publication"

    return "Unknown", "Unknown Publisher"

def enrich_sources_credibility(articles: List[NormalizedArticle]) -> List[NormalizedArticle]:
    for a in articles:
        tier, ctype = classify_source_credibility(a)
        a.credibility_tier = tier
        a.credibility_type = ctype
    return articles
