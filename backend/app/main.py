from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.database.mongodb import db
from app.api.routes import verify, history, dashboard, usage, health, eval_routes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("truthlens")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up TruthLens Backend Engine...")
    await db.connect()
    yield
    logger.info("Shutting down TruthLens Backend Engine...")
    await db.close()

app = FastAPI(
    title="TruthLens API",
    description="AI-Powered News Verification, Fact Analysis & Misinformation Detection System",
    version="3.0.0",
    lifespan=lifespan
)

# CORS configuration - Allow all web origins (localhost, Render, Vercel, Netlify)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(verify.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(eval_routes.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "TruthLens News Verification API",
        "version": "3.0.0",
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
