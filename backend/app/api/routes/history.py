from fastapi import APIRouter, HTTPException, Query
from app.database.mongodb import db

router = APIRouter(tags=["History"])

@router.get("/history")
async def get_history(limit: int = Query(50, ge=1, le=200)):
    """
    Returns stored verification records in reverse chronological order.
    Data is stored persistently until explicitly deleted by the user.
    """
    items = await db.list_active_verifications(limit=limit)
    return {
        "count": len(items),
        "verifications": items
    }

@router.delete("/history")
async def clear_history():
    """
    Permanently deletes all saved verification history upon user request.
    """
    deleted_count = await db.clear_all_verifications()
    return {
        "deleted_count": deleted_count,
        "message": f"Successfully cleared {deleted_count} verification records from storage."
    }
