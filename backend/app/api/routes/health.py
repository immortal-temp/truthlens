from fastapi import APIRouter
from app.database.mongodb import db
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TruthLens News Verification API",
        "database_connected": db.is_connected,
        "ttl_seconds": settings.MONGODB_TTL_SECONDS,
        "demo_mode": settings.DEMO_MODE,
        "environment": settings.ENVIRONMENT
    }
