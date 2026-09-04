from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class ApiQuotaUsage(BaseModel):
    provider: str
    date_key: str  # e.g., "2026-09-03"
    request_count: int = 0
    limit_per_day: int = 100
    last_request_at: Optional[datetime] = None

class UsageSummaryResponse(BaseModel):
    providers: Dict[str, Dict[str, Any]]
    date: str
