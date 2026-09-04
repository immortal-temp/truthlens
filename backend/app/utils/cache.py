import hashlib
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.database.mongodb import db
from app.config import settings

logger = logging.getLogger(__name__)

class MongoTTLCache:
    """
    Thin caching layer over MongoDB search_cache collection using TTL index.
    No Redis required.
    """
    @staticmethod
    def _hash_key(claim: str, date: str) -> str:
        raw = f"{claim.strip().lower()}::{date.strip().lower()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    async def get_cached_result(cls, claim: str, date: str) -> Optional[Dict[str, Any]]:
        key = cls._hash_key(claim, date)
        if db.is_connected and db.db is not None:
            try:
                doc = await db.db.search_cache.find_one({"cache_key": key}, {"_id": 0})
                if doc and doc.get("result"):
                    logger.info(f"Cache hit for claim: '{claim[:30]}...'")
                    return doc["result"]
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        return None

    @classmethod
    async def set_cached_result(cls, claim: str, date: str, result: Dict[str, Any]):
        key = cls._hash_key(claim, date)
        now = datetime.utcnow()
        if db.is_connected and db.db is not None:
            try:
                await db.db.search_cache.replace_one(
                    {"cache_key": key},
                    {
                        "cache_key": key,
                        "claim_preview": claim[:100],
                        "result": result,
                        "created_at": now
                    },
                    upsert=True
                )
                logger.info(f"Cached result with 20-min TTL for key: {key[:8]}")
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
