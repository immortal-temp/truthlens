import logging
from typing import List, Tuple
from app.models.article import NormalizedArticle
from app.models.verification import (
    ScoreBreakdown,
    DateAnalysisResult,
    SourceAnalysisSummary
)

logger = logging.getLogger(__name__)

def compute_evidence_score_and_verdict(
    articles: List[NormalizedArticle],
    date_analysis: DateAnalysisResult,
    total_unique_clusters: int,
    distinct_sources_count: int
) -> Tuple[ScoreBreakdown, SourceAnalysisSummary, str, str]:
    """
    Computes weighted 0-100 evidence score, summarizes source distributions,
    and applies calibrated verdict logic based on confirmed news coverage.
    """
    total_articles = len(articles)
    
    if total_articles == 0:
        breakdown = ScoreBreakdown(total_score=0.0)
        summary = SourceAnalysisSummary()
        return breakdown, summary, "INSUFFICIENT_EVIDENCE", "Insufficient Evidence"

    # Classifications
    supporting = [a for a in articles if a.evidence_classification == "Supporting"]
    partially_sup = [a for a in articles if a.evidence_classification == "Partially Supporting"]
    contradicting = [a for a in articles if a.evidence_classification == "Contradicting"]
    neutral = [a for a in articles if a.evidence_classification in ["Neutral", "Unrelated"]]

    high_cred = [a for a in articles if a.credibility_tier == "High"]
    med_cred = [a for a in articles if a.credibility_tier == "Medium"]
    unk_cred = [a for a in articles if a.credibility_tier == "Unknown"]

    summary = SourceAnalysisSummary(
        total_articles_retrieved=total_articles,
        unique_article_groups=total_unique_clusters,
        distinct_sources_count=distinct_sources_count,
        supporting_count=len(supporting) + len(partially_sup),
        contradicting_count=len(contradicting),
        neutral_count=len(neutral),
        high_credibility_count=len(high_cred),
        medium_credibility_count=len(med_cred),
        unknown_credibility_count=len(unk_cred)
    )

    # 1. Source Agreement (Max 25 pts)
    # Calibrated by number and proportion of supporting evidence
    sup_count = len(supporting)
    part_count = len(partially_sup)
    if sup_count >= 4:
        pts_source_agreement = 25.0
    elif sup_count == 3:
        pts_source_agreement = 23.0
    elif sup_count == 2:
        pts_source_agreement = 20.0
    elif sup_count == 1:
        pts_source_agreement = 15.0 + min(5.0, part_count * 2.0)
    elif part_count >= 2:
        pts_source_agreement = 12.0
    elif part_count == 1:
        pts_source_agreement = 7.0
    else:
        pts_source_agreement = 2.0

    # 2. Date Consistency (Max 15 pts)
    if date_analysis.is_old_news_reused:
        pts_date_consistency = 3.0  # Significant penalty for old news reuse
    elif date_analysis.is_date_consistent:
        pts_date_consistency = 15.0
    else:
        pts_date_consistency = 10.0

    # 3. Semantic Similarity (Max 20 pts)
    # Average of the top 5 most relevant articles (avoids dilution from broad search)
    sims = sorted([a.semantic_similarity or 0.0 for a in articles], reverse=True)
    top_sims = sims[:5]
    avg_top_sim = (sum(top_sims) / len(top_sims)) if top_sims else 0.0
    pts_semantic_similarity = round(min(20.0, avg_top_sim * 22.0), 1)

    # 4. Source Quality (Max 20 pts)
    # Check credibility of supporting/confirming sources
    supporting_and_partial = supporting + partially_sup
    sup_high = len([a for a in supporting_and_partial if a.credibility_tier == "High"])
    sup_med = len([a for a in supporting_and_partial if a.credibility_tier == "Medium"])

    if sup_high >= 2:
        pts_source_quality = 20.0
    elif sup_high == 1:
        pts_source_quality = 16.0 + min(4.0, sup_med * 2.0)
    elif sup_med >= 2:
        pts_source_quality = 14.0
    elif sup_med == 1:
        pts_source_quality = 10.0
    else:
        pts_source_quality = 6.0

    # 5. Cross-source Agreement (Max 10 pts)
    distinct_supporting_sources = len(set(a.source_name for a in supporting_and_partial if a.source_name))
    if distinct_supporting_sources >= 3:
        pts_cross_source = 10.0
    elif distinct_supporting_sources == 2:
        pts_cross_source = 8.0
    elif distinct_supporting_sources == 1:
        pts_cross_source = 5.0
    else:
        pts_cross_source = 1.0

    # 6. Contradictory Penalty / Score (Max 10 pts)
    contra_count = len(contradicting)
    if contra_count > 0:
        pts_contradiction = 0.0
    else:
        pts_contradiction = 10.0

    total_score = round(
        pts_source_agreement +
        pts_date_consistency +
        pts_semantic_similarity +
        pts_source_quality +
        pts_cross_source +
        pts_contradiction,
        1
    )
    total_score = max(0.0, min(100.0, total_score))

    breakdown = ScoreBreakdown(
        source_agreement=pts_source_agreement,
        date_consistency=pts_date_consistency,
        semantic_similarity=pts_semantic_similarity,
        source_quality=pts_source_quality,
        cross_source_agreement=pts_cross_source,
        contradictory_penalty=pts_contradiction,
        total_score=total_score
    )

    # Verdict Engine (Calibrated Logic)
    verdict = "INSUFFICIENT_EVIDENCE"
    misinformation_type = "Insufficient Evidence"

    if contra_count >= 1 and (len(supporting) == 0 or contra_count >= len(supporting)):
        verdict = "LIKELY_FALSE"
        misinformation_type = "Fabricated Claim"
    elif total_score >= 75.0:
        verdict = "LIKELY_TRUE"
        misinformation_type = "Verified Genuine News"
    elif date_analysis.is_old_news_reused:
        verdict = "MISLEADING"
        misinformation_type = "Old News Presented as New"
    elif total_articles < 2 or total_unique_clusters < 1:
        verdict = "INSUFFICIENT_EVIDENCE"
        misinformation_type = "Insufficient Evidence"
    elif total_score >= 50.0 and (len(supporting) >= 1 or len(partially_sup) >= 1):
        verdict = "PARTIALLY_TRUE"
        misinformation_type = "Partially True"
    elif total_score >= 35.0:
        verdict = "MISLEADING"
        misinformation_type = "Out-of-Context"
    elif contra_count > 0 or total_score < 35.0:
        verdict = "LIKELY_FALSE"
        misinformation_type = "False Information"
    else:
        verdict = "UNVERIFIED"
        misinformation_type = "Unverified Claim"

    return breakdown, summary, verdict, misinformation_type

