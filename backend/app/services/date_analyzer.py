import logging
import re
from datetime import datetime
from typing import List, Optional
from app.models.article import NormalizedArticle
from app.models.verification import DateAnalysisResult

logger = logging.getLogger(__name__)

def parse_flexible_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    # Strip time part if present
    clean_str = date_str.split("T")[0].strip()
    
    formats = [
        "%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y",
        "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean_str, fmt)
        except ValueError:
            continue
            
    # Try year regex
    year_match = re.search(r'\b(19\d\d|20\d\d)\b', clean_str)
    if year_match:
        try:
            return datetime(year=int(year_match.group(1)), month=1, day=1)
        except ValueError:
            pass
    return None

def analyze_dates_consistency(
    user_date_str: str,
    claim_mentioned_dates: List[str],
    articles: List[NormalizedArticle]
) -> DateAnalysisResult:
    user_dt = parse_flexible_date(user_date_str)
    
    # Filter to articles that are relevant (similarity >= 0.35 or not unrelated)
    relevant_articles = [
        a for a in articles 
        if (a.semantic_similarity is None or a.semantic_similarity >= 0.35) and 
           a.evidence_classification != "Unrelated"
    ] or articles

    article_dates = [a.published_at for a in relevant_articles if a.published_at]

    # Collect parsed article publish dates
    parsed_article_dts: List[datetime] = []
    for d_str in article_dates:
        dt = parse_flexible_date(d_str)
        if dt:
            parsed_article_dts.append(dt)

    # Collect any explicit year/date in the claim text
    claim_dts = [parse_flexible_date(d) for d in claim_mentioned_dates if parse_flexible_date(d)]

    if not user_dt:
        return DateAnalysisResult(
            user_date=user_date_str,
            extracted_event_dates=claim_mentioned_dates,
            article_publish_dates=article_dates,
            is_date_consistent=True,
            is_old_news_reused=False,
            warning_message=None,
            explanation="User date could not be parsed with high precision; evaluating based on article publication records."
        )

    # Check for Old News Presented As New
    # If article publish dates are significantly earlier than user date (e.g., > 180 days ago)
    is_old_news = False
    warning = None
    explanation = "Dates appear consistent between the claim context and retrieved reporting."

    if parsed_article_dts:
        # Find earliest and latest publication dates
        earliest_art_dt = min(parsed_article_dts)
        gap_days = (user_dt - earliest_art_dt).days

        # Check if the event happened years before the user-claimed date
        if gap_days > 180:
            is_old_news = True
            warning = "⚠️ POSSIBLE OLD NEWS PRESENTED AS NEW"
            explanation = (
                f"The claimed event appears in verified articles published on or around "
                f"{earliest_art_dt.strftime('%B %d, %Y')}, which is {gap_days} days prior to the "
                f"specified date ({user_date_str}). This indicates a past genuine event may have been "
                f"re-circulated as recent news."
            )
        elif gap_days < -180:
            explanation = (
                f"The claim date ({user_date_str}) is set in the future relative to historic reporting "
                f"({earliest_art_dt.strftime('%B %Y')})."
            )
        else:
            explanation = (
                f"The claim date ({user_date_str}) aligns closely with article publication dates "
                f"({earliest_art_dt.strftime('%B %d, %Y')})."
            )

    return DateAnalysisResult(
        user_date=user_date_str,
        extracted_event_dates=claim_mentioned_dates,
        article_publish_dates=article_dates,
        is_date_consistent=not is_old_news,
        is_old_news_reused=is_old_news,
        warning_message=warning,
        explanation=explanation
    )
