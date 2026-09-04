from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ClaimInput(BaseModel):
    claim: str = Field(..., min_length=5, description="The news claim statement to verify")
    date: str = Field(..., description="Date associated with the event (YYYY-MM-DD or readable)")
    time: Optional[str] = Field(None, description="Optional time associated with the event")
    language: Optional[str] = Field("en", description="Claim language code (en, hi, kn, ta, te, mr, ml)")

class ExtractedEntities(BaseModel):
    main_claim: str = Field("", description="Normalized core claim")
    people: List[str] = Field(default_factory=list)
    organizations: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    events: List[str] = Field(default_factory=list)
    amounts: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    times: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    category: str = Field("Other", description="Politics, Tech, Business, Science, Sports, etc.")
    important_keywords: List[str] = Field(default_factory=list)

class GeneratedQueries(BaseModel):
    queries: List[str] = Field(..., min_length=1, max_length=8, description="3-6 targeted search queries")
