import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, PyMongoError
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None
    is_connected: bool = False
    
    # In-memory persistent storage fallback if MongoDB is unreachable
    _memory_store: Dict[str, Dict[str, Any]] = {}
    _usage_store: Dict[str, Dict[str, int]] = {}

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI} (DB: {settings.MONGODB_DB_NAME})...")
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Ping database to verify connection
            await self.client.admin.command('ping')
            self.is_connected = True
            logger.info("MongoDB connection successfully established (Persistent Storage enabled).")
        except Exception as e:
            self.is_connected = False
            logger.warning(f"MongoDB connection failed: {e}. Falling back to in-memory persistent storage.")

    async def close(self):
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")

    # --- Verification Operations ---
    async def save_verification(self, data: Dict[str, Any]) -> str:
        doc_id = data.get("id")
        created_at_val = data.get("created_at")
        
        if isinstance(created_at_val, str):
            try:
                created_at = datetime.fromisoformat(created_at_val.replace("Z", "+00:00"))
            except Exception:
                created_at = datetime.utcnow()
        elif isinstance(created_at_val, datetime):
            created_at = created_at_val
        else:
            created_at = datetime.utcnow()

        data["created_at"] = created_at.isoformat()

        if self.is_connected and self.db is not None:
            try:
                await self.db.verifications.replace_one({"id": doc_id}, data, upsert=True)
                return doc_id
            except PyMongoError as e:
                logger.error(f"MongoDB save failed: {e}. Storing in memory.")

        # Fallback in-memory
        self._memory_store[doc_id] = data
        return doc_id

    async def get_verification(self, doc_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                doc = await self.db.verifications.find_one({"id": doc_id}, {"_id": 0})
                if doc:
                    return doc
            except PyMongoError as e:
                logger.error(f"MongoDB read failed: {e}")

        # Fallback in-memory
        return self._memory_store.get(doc_id)

    async def delete_verification(self, doc_id: str) -> bool:
        deleted = False
        if self.is_connected and self.db is not None:
            try:
                result = await self.db.verifications.delete_one({"id": doc_id})
                if result.deleted_count > 0:
                    deleted = True
            except PyMongoError as e:
                logger.error(f"MongoDB delete failed: {e}")

        if doc_id in self._memory_store:
            del self._memory_store[doc_id]
            deleted = True

        return deleted

    async def clear_all_verifications(self) -> int:
        count = 0
        if self.is_connected and self.db is not None:
            try:
                result = await self.db.verifications.delete_many({})
                count += result.deleted_count
            except PyMongoError as e:
                logger.error(f"MongoDB clear failed: {e}")

        count += len(self._memory_store)
        self._memory_store.clear()
        return count

    async def list_active_verifications(self, limit: int = 100) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.verifications.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
                docs = await cursor.to_list(length=limit)
                return docs
            except PyMongoError as e:
                logger.error(f"MongoDB list failed: {e}")

        # In-memory items
        items = list(self._memory_store.values())
        items.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return items[:limit]

    # --- Cache Operations ---
    async def get_search_cache(self, query: str) -> Optional[List[Dict[str, Any]]]:
        if self.is_connected and self.db is not None:
            try:
                cache_doc = await self.db.search_cache.find_one({"query": query}, {"_id": 0})
                if cache_doc and "articles" in cache_doc:
                    return cache_doc["articles"]
            except PyMongoError as e:
                logger.error(f"Cache read error: {e}")
        return None

    async def set_search_cache(self, query: str, articles: List[Dict[str, Any]]):
        if self.is_connected and self.db is not None:
            try:
                doc = {
                    "query": query,
                    "articles": articles,
                    "created_at": datetime.utcnow().isoformat()
                }
                await self.db.search_cache.replace_one({"query": query}, doc, upsert=True)
            except PyMongoError as e:
                logger.error(f"Cache write error: {e}")

    # --- Rate Limiting / Usage Logging ---
    async def record_api_call(self, provider: str, cost: float = 0.0):
        await self.log_api_call(provider, cost)

    async def log_api_call(self, provider: str, cost: float = 0.0):
        day_str = datetime.utcnow().strftime("%Y-%m-%d")
        if self.is_connected and self.db is not None:
            try:
                await self.db.usage_logs.update_one(
                    {"provider": provider, "date": day_str},
                    {
                        "$inc": {"calls": 1, "total_cost": cost},
                        "$setOnInsert": {"created_at": datetime.utcnow().isoformat()}
                    },
                    upsert=True
                )
                return
            except PyMongoError as e:
                logger.error(f"Usage logging error: {e}")

        # In-memory logging
        if day_str not in self._usage_store:
            self._usage_store[day_str] = {}
        self._usage_store[day_str][provider] = self._usage_store[day_str].get(provider, 0) + 1

    async def get_daily_usage(self, provider: str) -> int:
        day_str = datetime.utcnow().strftime("%Y-%m-%d")
        if self.is_connected and self.db is not None:
            try:
                doc = await self.db.usage_logs.find_one({"provider": provider, "date": day_str})
                if doc:
                    return doc.get("calls", 0)
            except PyMongoError as e:
                logger.error(f"Usage read error: {e}")

        return self._usage_store.get(day_str, {}).get(provider, 0)

    async def get_usage_summary(self) -> Dict[str, Any]:
        day_str = datetime.utcnow().strftime("%Y-%m-%d")
        gemini_calls = await self.get_daily_usage("gemini")
        groq_calls = await self.get_daily_usage("groq")
        rss_calls = await self.get_daily_usage("google_news_rss")
        return {
            "date": day_str,
            "providers": {
                "gemini": {"used": gemini_calls, "limit": 1500},
                "groq": {"used": groq_calls, "limit": 14400},
                "google_news_rss": {"used": rss_calls, "limit": "unlimited"}
            }
        }

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        docs = await self.list_active_verifications(limit=500)
        total = len(docs)
        verdicts: Dict[str, int] = {}
        categories: Dict[str, int] = {}
        for d in docs:
            v = d.get("verdict", "UNVERIFIED")
            verdicts[v] = verdicts.get(v, 0) + 1
            c = d.get("category", "General")
            categories[c] = categories.get(c, 0) + 1
        return {
            "total_verifications": total,
            "verdict_distribution": verdicts,
            "category_distribution": categories,
            "recent": docs[:10]
        }

db = Database()

