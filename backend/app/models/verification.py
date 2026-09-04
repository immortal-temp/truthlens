from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.article import NormalizedArticle
from app.models.claim import ExtractedEntities
from app.models.report import AIReportResponse

class ScoreBreakdown(BaseModel):
    source_agreement: float = Field(0.0, description="Max 25 pts")
    date_consistency: float = Field(0.0, description="Max 15 pts")
    semantic_similarity: float = Field(0.0, description="Max 20 pts")
    source_quality: float = Field(0.0, description="Max 20 pts")
    cross_source_agreement: float = Field(0.0, description="Max 10 pts")
    contradictory_penalty: float = Field(0.0, description="Max 10 pts")
    total_score: float = Field(0.0, description="0 to 100 Evidence Score")

class DateAnalysisResult(BaseModel):
    user_date: str
    extracted_event_dates: List[str] = Field(default_factory=list)
    article_publish_dates: List[str] = Field(default_factory=list)
    is_date_consistent: bool = True
    is_old_news_reused: bool = False
    warning_message: Optional[str] = None
    explanation: str = ""

class SourceAnalysisSummary(BaseModel):
    total_articles_retrieved: int = 0
    unique_article_groups: int = 0
    distinct_sources_count: int = 0
    supporting_count: int = 0
    contradicting_count: int = 0
    neutral_count: int = 0
    high_credibility_count: int = 0
    medium_credibility_count: int = 0
    unknown_credibility_count: int = 0

class VerificationResult(BaseModel):
    id: str = Field(..., description="Unique verification ID")
    claim: str
    input_date: str
    input_time: Optional[str] = None
    language: str = "en"
    category: str = "Other"
    
    # Analysis & Engine Outputs
    extracted_entities: ExtractedEntities
    queries_used: List[str] = Field(default_factory=list)
    articles: List[NormalizedArticle] = Field(default_factory=list)
    score_breakdown: ScoreBreakdown
    evidence_score: float = 0.0
    verdict: str = Field("INSUFFICIENT_EVIDENCE", description="LIKELY_TRUE, PARTIALLY_TRUE, MISLEADING, LIKELY_FALSE, UNVERIFIED, INSUFFICIENT_EVIDENCE")
    misinformation_type: str = "Unverified Claim"
    
    date_analysis: DateAnalysisResult
    source_analysis: SourceAnalysisSummary
    ai_report: Optional[AIReportResponse] = None
    
    # System metadata
    llm_provider_used: str = "gemini"
    is_demo_mode: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
