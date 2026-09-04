from fastapi import APIRouter
from app.database.mongodb import db

router = APIRouter(tags=["Usage"])

@router.get("/usage")
async def get_usage():
    """Returns today's API request counts and remaining limits."""
    return await db.get_usage_summary()
