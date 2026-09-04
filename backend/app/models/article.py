from pydantic import BaseModel, Field
from typing import Optional

class NormalizedArticle(BaseModel):
    title: str = Field(..., description="Article headline")
    description: Optional[str] = Field("", description="Article description/snippet")
    url: str = Field(..., description="Original article URL")
    source_name: str = Field(..., description="Publisher name")
    published_at: Optional[str] = Field("", description="Publication ISO timestamp or date string")
    content: Optional[str] = Field("", description="Extracted content text")
    query_used: Optional[str] = Field("", description="Search query that surfaced this article")
    
    # Enrichment fields computed in pipeline
    credibility_tier: Optional[str] = Field("Unknown Publisher", description="High / Medium / Unknown")
    credibility_type: Optional[str] = Field("Unknown Publisher", description="Official/Gov, Established, Regional, Specialized, Unknown")
    semantic_similarity: Optional[float] = Field(0.0, description="Cosine similarity score (0.0 - 1.0)")
    evidence_classification: Optional[str] = Field("Neutral", description="Supporting / Partially Supporting / Contradicting / Neutral / Unrelated")
    cluster_id: Optional[int] = Field(None, description="Deduplication cluster ID")
    is_primary_in_cluster: Optional[bool] = Field(True, description="Whether this article represents its near-duplicate group")
