# TruthLens — Technology Stack (Simplified)

Kept to what you're already familiar with. No Redis, no Axios, no multi-database setup — MongoDB Atlas is the only database, and it auto-deletes verification data shortly after use (see "Why a database is needed" below).

## Frontend

| Tech | Purpose | Free hosting |
|---|---|---|
| React + Vite | SPA framework, fast dev/build | Netlify / Vercel (free tier) |
| TypeScript | Type safety across components/services | — |
| Tailwind CSS | Utility-first styling for the dark UI | — |
| Recharts | Verdict distribution, evidence-score charts (Dashboard) | — |
| React Router | Routing between Home / Results / History / Dashboard | — |
| `fetch` (built into the browser) | Calling the FastAPI backend — no extra library needed | — |

## Backend

| Tech | Purpose | Free hosting |
|---|---|---|
| Python 3.11+ | Backend language | — |
| FastAPI | REST API framework — this is what builds the endpoints your frontend's `fetch()` calls hit. Async, auto-generates OpenAPI docs at `/docs` for free (great for testing without Postman) | Render / Railway (free web service tier) |
| Pydantic v2 | Validates every request body and the structured JSON the LLM returns | — |
| httpx | Async HTTP client — how the *backend* calls GNews/Gemini/Groq | — |
| Uvicorn | ASGI server that runs FastAPI | — |
| python-dotenv | Loads API keys from `.env` | — |

## Database

| Tech | Purpose | Free tier |
|---|---|---|
| MongoDB Atlas | The only database. Holds a verification in progress and the finished result long enough to render the page and generate the PDF | M0 free cluster (512MB) |
| Motor or PyMongo (async) | MongoDB driver for FastAPI | — |

**Why it's still needed even though you don't want history kept:** the pipeline takes several seconds to run and the PDF generator reads from a stored document rather than recomputing everything. The fix for "don't keep old results" is a **MongoDB TTL index** — set it once (e.g. `expireAfterSeconds: 3600`), and MongoDB deletes each document automatically an hour after it's created, no cleanup code required. Optionally, fire `DELETE /api/verification/{id}` from the frontend right after the report is downloaded, so it's gone immediately instead of waiting out the TTL.

## AI / LLM Layer

| Tech | Role | Notes |
|---|---|---|
| Gemini API (gemini-1.5-flash or 2.0-flash) | Primary LLM — claim extraction, query generation, report writing | Generous free tier |
| Groq API (llama-3.3-70b or similar) | Fallback LLM when Gemini quota/errors hit | Free tier, very fast inference |
| OpenRouter | Secondary fallback if both Gemini and Groq fail | Optional, pay-as-you-go |
| Sentence-Transformers (`all-MiniLM-L6-v2`) | Local embeddings for semantic similarity — runs on your machine, no API cost | ~80MB model, CPU is fine |

## News Retrieval

| Tech | Purpose | Free tier |
|---|---|---|
| GNews API | Primary news search | 100 requests/day free |
| NewsData.io or NewsAPI.org | Secondary source for cross-verification | Free tiers available (check terms) |
| newspaper3k or trafilatura | Article text extraction for the optional URL-verification mode | — |

## PDF Report

| Tech | Purpose |
|---|---|
| WeasyPrint or ReportLab | Generates the downloadable verification report PDF |

## Deployment (all free)

| Piece | Where |
|---|---|
| Frontend | Netlify or Vercel |
| Backend (FastAPI) | Render or Railway free web service |
| Database | MongoDB Atlas M0 |

## Testing (keep minimal for a first pass)

| Tech | Purpose |
|---|---|
| Pytest | Backend unit/API tests |
| FastAPI's built-in TestClient | Test endpoints without a real server running |

---

### What was removed from the original list, and why
- **Redis** — dropped. It was only there for caching/rate-limit counters, which isn't needed for a single-DB, no-history setup. MongoDB's TTL index covers the "don't keep old data" requirement on its own.
- **Axios** — dropped in favor of the browser's built-in `fetch()`. Same job, one less thing to install.
- Everything else stayed the same — this list is your original stack minus the two things that were adding complexity without adding a feature you actually want.
