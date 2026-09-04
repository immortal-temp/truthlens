from fastapi import APIRouter
from app.database.mongodb import db

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard")
async def get_dashboard():
    """
    Returns aggregate charts and analytics computed strictly over non-expired records
    in the active 20-minute working window.
    """
    return await db.get_dashboard_stats()
