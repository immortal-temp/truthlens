import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.article import NormalizedArticle
from app.models.claim import ExtractedEntities
from app.models.verification import (
    ScoreBreakdown,
    DateAnalysisResult,
    SourceAnalysisSummary
)
from app.models.report import AIReportResponse, TimelineEvent
from app.llm.manager import llm_manager

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """You are an evidence-analysis assistant for TruthLens.
CRITICAL MANDATE:
Analyze ONLY the supplied evidence. Do not invent facts, sources, URLs, dates, statistics, quotes, or events.
If evidence is insufficient, explicitly state that it is insufficient.
Do not assume or extrapolate beyond what is stated in the retrieved articles.

Respond ONLY with a JSON object matching this exact schema:
{
  "executive_summary": "2-4 sentence summary of what the evidence shows regarding the claim",
  "what_happened": ["factual point 1 from evidence", "factual point 2 from evidence"],
  "key_people": ["person1"],
  "organizations": ["org1"],
  "locations": ["location1"],
  "important_numbers": ["100 million", "2023"],
  "timeline": [
    {
      "date": "YYYY-MM-DD or readable date",
      "headline": "event headline",
      "description": "brief detail",
      "source_name": "Publisher Name",
      "url": "https://..."
    }
  ],
  "supporting_evidence_summary": "summary of supporting sources",
  "contradicting_evidence_summary": "summary of contradicting sources or state 'None found'",
  "date_analysis": "explanation of date consistency or mismatch",
  "misinformation_type": "type name",
  "final_assessment": "concise, conservative evaluation",
  "limitations": ["Retrieved 4 articles from 2 sources", "No official government report indexed"]
}"""

async def generate_ai_report(
    claim: str,
    user_date: str,
    entities: ExtractedEntities,
    articles: List[NormalizedArticle],
    score_breakdown: ScoreBreakdown,
    verdict: str,
    misinformation_type: str,
    date_analysis: DateAnalysisResult,
    source_summary: SourceAnalysisSummary,
    language: str = "en"
) -> Tuple[AIReportResponse, str]:
    """
    Generates grounded report using LLM fallback sequence.
    If LLMs are unavailable, produces evidence-grounded fallback response.
    """
    articles_payload = []
    for a in articles[:8]:
        articles_payload.append({
            "title": a.title,
            "source": a.source_name,
            "date": a.published_at,
            "url": a.url,
            "classification": a.evidence_classification,
            "credibility": a.credibility_tier,
            "similarity": a.semantic_similarity,
            "snippet": (a.description or "")[:200]
        })

    prompt = f"""
CLAIM TO VERIFY: "{claim}"
USER-SUPPLIED DATE: "{user_date}"
LANGUAGE REQUESTED: "{language}"

COMPUTED METRICS:
- Evidence Score: {score_breakdown.total_score}/100
- Algorithmic Verdict: {verdict}
- Misinformation Classification: {misinformation_type}
- Date Analysis: {date_analysis.explanation}
- Total Articles: {source_summary.total_articles_retrieved}
- Supporting: {source_summary.supporting_count} | Contradicting: {source_summary.contradicting_count}

RETRIEVED EVIDENCE SOURCES:
{json.dumps(articles_payload, indent=2)}

INSTRUCTIONS:
Produce a comprehensive, grounded verification report based strictly on the evidence above.
"""

    data, provider_used = await llm_manager.execute_with_fallback(
        prompt=prompt,
        system_instruction=REPORT_SYSTEM_PROMPT
    )

    if data and isinstance(data, dict):
        sanitized = dict(data)
        list_fields = ["what_happened", "key_people", "organizations", "locations", "important_numbers", "limitations"]
        for lf in list_fields:
            v = sanitized.get(lf)
            if isinstance(v, list):
                sanitized[lf] = [str(x).strip() for x in v if str(x).strip()]
            elif isinstance(v, str) and v.strip():
                sanitized[lf] = [v.strip()]
            else:
                sanitized[lf] = []

        if not isinstance(sanitized.get("timeline"), list):
            sanitized["timeline"] = []

        try:
            return AIReportResponse(**sanitized), provider_used
        except Exception as e:
            logger.warning(f"AI Report schema parsing error: {e}. Building deterministic grounded report.")

    # Grounded evidence-only fallback report (zero hallucinations)
    timeline_events = []
    for a in articles[:4]:
        timeline_events.append(TimelineEvent(
            date=a.published_at or "Unknown date",
            headline=a.title,
            description=a.description or "Reported article details.",
            source_name=a.source_name,
            url=a.url
        ))

    sup_sources = [a.source_name for a in articles if a.evidence_classification == "Supporting"]
    contra_sources = [a.source_name for a in articles if a.evidence_classification == "Contradicting"]

    fallback_report = AIReportResponse(
        executive_summary=(
            f"Based on {len(articles)} retrieved news articles, the claim '{claim[:80]}...' receives an "
            f"evidence score of {score_breakdown.total_score}/100 with a verdict of {verdict}."
        ),
        what_happened=[a.title for a in articles[:3]] if articles else ["No direct reporting found."],
        key_people=entities.people,
        organizations=entities.organizations,
        locations=entities.locations,
        important_numbers=entities.amounts,
        timeline=timeline_events,
        supporting_evidence_summary=f"Supporting coverage found across: {', '.join(set(sup_sources))}" if sup_sources else "No clear supporting articles identified.",
        contradicting_evidence_summary=f"Contradicting coverage identified in: {', '.join(set(contra_sources))}" if contra_sources else "No explicit contradiction or debunking reports found.",
        date_analysis=date_analysis.explanation,
        misinformation_type=misinformation_type,
        final_assessment=f"Verdict is assessed as {verdict} based on {source_summary.distinct_sources_count} distinct sources.",
        limitations=[
            f"Analysis is limited to {len(articles)} articles retrieved at time of search.",
            "Evidence score reflects algorithmic weighting of source agreement, credibility, and semantic similarity."
        ]
    )

    return fallback_report, provider_used
