import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from app.models.verification import VerificationResult
from app.services.claim_extractor import extract_claim_entities
from app.services.query_generator import generate_search_queries
from app.news.search import search_multi_source_news
from app.services.deduplicator import deduplicate_articles
from app.services.similarity import compute_semantic_similarity
from app.services.credibility import enrich_sources_credibility
from app.services.date_analyzer import analyze_dates_consistency
from app.services.evidence_classifier import enrich_articles_evidence_classification
from app.services.scoring import compute_evidence_score_and_verdict
from app.services.report_generator import generate_ai_report
from app.utils.cache import MongoTTLCache
from app.database.mongodb import db
from app.config import settings

logger = logging.getLogger(__name__)

async def run_verification_pipeline(
    claim: str,
    date: str,
    time: Optional[str] = None,
    language: str = "en",
    source_url_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Orchestrates the complete 12-step TruthLens verification pipeline.
    """
    logger.info(f"Starting verification for claim: '{claim[:60]}...' (Date: {date})")

    # Step 1: Check TTL Cache
    cached_doc = await MongoTTLCache.get_cached_result(claim, date)
    if cached_doc:
        logger.info("Returning cached verification result.")
        return cached_doc

    doc_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(seconds=settings.MONGODB_TTL_SECONDS)

    # Step 2: Claim Extraction (LLM -> Fallback)
    entities, llm_provider_used = await extract_claim_entities(claim, date, time)

    # Step 3: Search Query Generation (LLM -> Fallback)
    queries = await generate_search_queries(claim, entities)
    logger.info(f"Generated {len(queries)} search queries: {queries}")

    # Step 4: Multi-Source News Retrieval
    raw_articles, is_demo = await search_multi_source_news(queries, claim, date)
    logger.info(f"Retrieved {len(raw_articles)} normalized articles (Demo mode: {is_demo}).")

    # Step 5: Deduplication (TF-IDF + Cosine Clustering)
    deduped_articles, total_clusters, distinct_sources = deduplicate_articles(raw_articles)

    # Step 6: Semantic Similarity Scoring (Sentence-Transformers / TF-IDF)
    similar_articles = compute_semantic_similarity(claim, deduped_articles)

    # Step 7: Source Credibility Enrichment
    credible_articles = enrich_sources_credibility(similar_articles)

    # Step 8: Date Consistency & Old-News Detection
    date_analysis = analyze_dates_consistency(date, entities.dates, credible_articles)

    # Step 9: Article Evidence Classification (Supporting / Contradicting)
    classified_articles = enrich_articles_evidence_classification(credible_articles, claim, entities)

    # Step 10: 0-100 Evidence Scoring & Conservative Verdict Engine
    score_breakdown, source_summary, verdict, misinfo_type = compute_evidence_score_and_verdict(
        articles=classified_articles,
        date_analysis=date_analysis,
        total_unique_clusters=total_clusters,
        distinct_sources_count=distinct_sources
    )

    # Step 11: Grounded AI Report Generation
    ai_report, report_provider = await generate_ai_report(
        claim=claim,
        user_date=date,
        entities=entities,
        articles=classified_articles,
        score_breakdown=score_breakdown,
        verdict=verdict,
        misinformation_type=misinfo_type,
        date_analysis=date_analysis,
        source_summary=source_summary,
        language=language
    )

    # Step 12: Assemble Final Result Document
    result_model = VerificationResult(
        id=doc_id,
        claim=claim,
        input_date=date,
        input_time=time,
        language=language,
        category=entities.category or "Other",
        extracted_entities=entities,
        queries_used=queries,
        articles=classified_articles,
        score_breakdown=score_breakdown,
        evidence_score=score_breakdown.total_score,
        verdict=verdict,
        misinformation_type=misinfo_type,
        date_analysis=date_analysis,
        source_analysis=source_summary,
        ai_report=ai_report,
        llm_provider_used=report_provider or llm_provider_used,
        is_demo_mode=is_demo,
        created_at=created_at,
        expires_at=expires_at
    )

    result_dict = result_model.model_dump(mode="json")

    # Persist to MongoDB with 20-minute TTL
    await db.save_verification(result_dict)
    await MongoTTLCache.set_cached_result(claim, date, result_dict)

    logger.info(f"Verification complete for '{claim[:40]}...': Verdict={verdict}, Score={score_breakdown.total_score}/100")
    return result_dict
