from pydantic import BaseModel, Field
from typing import List, Optional

class TimelineEvent(BaseModel):
    date: str
    headline: str
    description: str
    source_name: str
    url: Optional[str] = None

class AIReportResponse(BaseModel):
    executive_summary: str = Field(..., description="2-4 sentence executive summary of findings")
    what_happened: List[str] = Field(default_factory=list, description="Key factual points confirmed or unconfirmed")
    key_people: List[str] = Field(default_factory=list)
    organizations: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    important_numbers: List[str] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    supporting_evidence_summary: str = Field("", description="Summary of evidence supporting the claim")
    contradicting_evidence_summary: str = Field("", description="Summary of evidence contradicting the claim")
    date_analysis: str = Field("", description="Detailed explanation of date consistency and any old-news flags")
    misinformation_type: str = Field("Unverified Claim", description="Classification of misinformation type")
    final_assessment: str = Field(..., description="Conservative, grounded final evaluation")
    limitations: List[str] = Field(default_factory=list, description="Known limitations of this analysis")
