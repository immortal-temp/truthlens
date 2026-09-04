import pytest
from app.services.deduplicator import deduplicate_articles
from app.services.date_analyzer import analyze_dates_consistency
from app.services.credibility import classify_source_credibility
from app.services.scoring import compute_evidence_score_and_verdict
from app.services.pipeline import run_verification_pipeline
from app.models.article import NormalizedArticle
from app.models.verification import DateAnalysisResult
from app.services.pdf_generator import generate_pdf_report

def test_deduplication():
    articles = [
        NormalizedArticle(
            title="India lands Chandrayaan-3 on Moon south pole",
            description="Historic lunar touchdown achieved by ISRO spacecraft.",
            url="https://bbc.com/news/1",
            source_name="BBC"
        ),
        NormalizedArticle(
            title="India lands Chandrayaan-3 on Moon south pole in historic feat",
            description="Historic lunar touchdown achieved by ISRO spacecraft today.",
            url="https://thehindu.com/news/2",
            source_name="The Hindu"
        ),
        NormalizedArticle(
            title="NASA launches new satellite to monitor ocean temperatures",
            description="New climate satellite operational.",
            url="https://nasa.gov/news/3",
            source_name="NASA"
        )
    ]
    deduped, clusters, sources = deduplicate_articles(articles)
    assert len(deduped) == 3
    assert clusters == 2  # The 2 Chandrayaan articles cluster together, 1 NASA is separate
    assert sources == 3

def test_date_analysis_old_news_detection():
    articles = [
        NormalizedArticle(
            title="Paris Notre Dame fire blazes",
            description="Cathedral engulfed in flames.",
            url="https://reuters.com/1",
            source_name="Reuters",
            published_at="2019-04-15"
        )
    ]
    # User provides current date (e.g. 2026-09-03)
    res = analyze_dates_consistency("2026-09-03", ["2026-09-03"], articles)
    assert res.is_old_news_reused is True
    assert "POSSIBLE OLD NEWS" in (res.warning_message or "")

def test_credibility_classification():
    gov_art = NormalizedArticle(
        title="Official statement",
        url="https://www.who.int/news/item/1",
        source_name="WHO"
    )
    tier, ctype = classify_source_credibility(gov_art)
    assert tier == "High"
    assert ctype == "Official/Government"

    est_art = NormalizedArticle(
        title="Global news update",
        url="https://www.reuters.com/world/1",
        source_name="Reuters"
    )
    tier, ctype = classify_source_credibility(est_art)
    assert tier == "High"
    assert ctype == "Established News Organization"

def test_pdf_generation():
    doc = {
        "id": "test-doc-1234",
        "claim": "Chandrayaan-3 landed on the Moon",
        "input_date": "2023-08-23",
        "category": "Science",
        "verdict": "LIKELY_TRUE",
        "evidence_score": 88.5,
        "score_breakdown": {
            "source_agreement": 22.0,
            "date_consistency": 15.0,
            "semantic_similarity": 18.0,
            "source_quality": 18.5,
            "cross_source_agreement": 10.0,
            "contradictory_penalty": 10.0,
            "total_score": 88.5
        },
        "date_analysis": {"explanation": "Dates match historical record."},
        "source_analysis": {"total_articles_retrieved": 3, "distinct_sources_count": 2},
        "ai_report": {
            "executive_summary": "The mission was confirmed successful on August 23, 2023.",
            "limitations": ["Verified against 3 public articles."]
        },
        "articles": [
            {
                "title": "Chandrayaan-3 Lands",
                "source_name": "BBC",
                "published_at": "2023-08-23",
                "evidence_classification": "Supporting"
            }
        ]
    }
    pdf_bytes = generate_pdf_report(doc)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")

@pytest.mark.asyncio
async def test_full_pipeline_demo_mode():
    res = await run_verification_pipeline(
        claim="India's Chandrayaan-3 landed on the Moon south pole",
        date="2023-08-23",
        language="en"
    )
    assert "id" in res
    assert res["verdict"] in ["LIKELY_TRUE", "PARTIALLY_TRUE"]
    assert res["evidence_score"] >= 60.0
    assert len(res["articles"]) > 0
    assert isinstance(res["is_demo_mode"], bool)

@pytest.mark.asyncio
async def test_google_news_rss_retrieval():
    from app.news.google_news_rss import search_google_news_rss
    articles = await search_google_news_rss("James Webb space telescope", max_results=5)
    assert len(articles) > 0
    assert articles[0].title != ""
    assert articles[0].url.startswith("http")
