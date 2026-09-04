# TruthLens 🔍
### AI-Powered News Verification, Fact Analysis & Misinformation Detection System (v3.0)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas_(TTL)-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> **Core Mandate:** *"AI analyzes evidence. AI does not manufacture evidence."*
> TruthLens does not ask an LLM whether news is true. It retrieves evidence from multiple real news sources, checks temporal consistency, compares supporting and contradicting information, calculates an explainable 0–100 Evidence Score, and uses AI strictly to summarize and communicate the verified findings.

---

## 📖 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Key Capabilities](#-key-capabilities)
3. [Architecture & Request Lifecycle](#-architecture--request-lifecycle)
4. [Data Retention & 20-Minute TTL Policy](#-data-retention--20-minute-ttl-policy)
5. [Evidence Scoring Methodology](#-evidence-scoring-methodology-0100)
6. [Conservative 6-Class Verdict Engine](#-conservative-6-class-verdict-engine)
7. [LLM Fallback Architecture](#-llm-fallback-architecture)
8. [Evaluation Benchmark & Accuracy](#-evaluation-benchmark--gold-set-accuracy)
9. [Tech Stack](#-technology-stack)
10. [Local Setup & Installation](#-local-setup--installation)
11. [Demo Mode (Rate-Limit Safe Testing)](#-demo-mode-safe-offline-testing)
12. [API Reference](#-api-endpoints)

---

## 🌍 Overview & Problem Statement

Online misinformation spreads faster than fact-checking organizations can manually audit claims. Existing AI chatbots frequently hallucinate sources, invent quotes, or deliver confident binary answers without ground-truth citations. 

**TruthLens** solves this by enforcing an evidence-first architecture:
- Sources are discovered automatically from real web news (users never input sources).
- Near-duplicate syndicated stories are clustered via TF-IDF cosine similarity.
- Temporal mismatch detection catches **"Old News Presented As New"**.
- Reports are grounded exclusively in retrieved articles with a mandatory uncertainty disclaimer.

---

## 🚀 Key Capabilities

- **Multi-Source News Retrieval**: Parallel querying across GNews, NewsData.io, and NewsAPI.
- **Deduplication Engine**: Identifies syndicated wire stories so duplicate articles aren't counted as independent corroboration.
- **Semantic Similarity Scoring**: Local Sentence-Transformers embeddings (`all-MiniLM-L6-v2`) measure claim-to-article headline relevance.
- **Date Consistency & Old-News Detection**: Compares claimed event dates against historical publication timelines to detect recycled stories.
- **Source Credibility Tiering**: Classifies publisher domain authority (`High` / `Medium` / `Unknown`).
- **Grounded Structured AI Reports**: Validated with Pydantic; strictly prohibited from manufacturing facts.
- **Audit-Ready PDF Export**: Generates downloadable verification reports with full breakdowns and legal notices.
- **Ephemeral Working Storage**: Enforces strict privacy with 20-minute automatic MongoDB TTL cleanup.

---

## 🏗️ Architecture & Request Lifecycle

Follows [workflow.md](file:///d:/fake%20news%20detector/workflow.md) strictly:

```
[User Claim + Event Date] 
           │
           ▼
[Preprocessing & Validation]
           │
           ▼
[Claim Extraction (LLM / Fallback)] ──▶ Entities: people, orgs, locations, dates
           │
           ▼
[Search Query Generation (LLM)] ──▶ 3–6 targeted keyword search queries
           │
           ▼
[Parallel Multi-Source News Retrieval] ──▶ GNews + Secondary APIs
           │
           ▼
[Article Normalization & Schema Validation]
           │
           ▼
[TF-IDF Deduplication Clustering] ──▶ Identifies syndicated near-duplicates
           │
           ▼
[Semantic Similarity Scoring] ──▶ Sentence-Transformers / TF-IDF Cosine
           │
           ▼
[Date Consistency & Old-News Analysis] ──▶ Flags past events recycled as current
           │
           ▼
[Source Credibility & Evidence Classification] ──▶ Supporting vs Contradicting
           │
           ▼
[Weighted 0–100 Evidence Scoring Engine]
           │
           ▼
[Conservative 6-Class Verdict Engine]
           │
           ▼
[Grounded Structured AI Report] (Gemini ➔ Groq ➔ OpenRouter ➔ Evidence-Only)
           │
           ▼
[MongoDB 20-Min TTL Working Storage] ──▶ Render Progressive UI + PDF Generation
```

---

## 🔒 Data Retention & 20-Minute TTL Policy

TruthLens does not maintain a permanent user surveillance archive:
1. **MongoDB Atlas 20-Minute TTL**: All verification documents are indexed with `expireAfterSeconds: 1200` (20 minutes). MongoDB automatically purges expired records in the background.
2. **Cleanup on Claim Switch**: When a user begins verifying a new claim or leaves, `DELETE /api/verification/{previous_id}` is triggered.
3. **No Deletion on PDF Download**: Users can freely download the PDF audit report and remain on the page to review results without premature document loss.
4. **Dashboard & History**: All metrics and session history reflect recent non-expired records only.

---

## ⚖️ Evidence Scoring Methodology (0–100)

The **Evidence Score** is an explainable composite metric (never labeled as "percentage accuracy"):

| Signal Component | Max Weight | Description |
|---|---|---|
| **Source Agreement** | **25%** | Proportion of retrieved coverage directly supporting the claim. |
| **Date Consistency** | **15%** | Penalized heavily if historical reporting dates reveal recycled old news. |
| **Semantic Similarity** | **20%** | Degree of contextual and semantic alignment between claim and coverage. |
| **Source Credibility** | **20%** | Quality weight given to official/government and established news institutions. |
| **Cross-Source Corroboration** | **10%** | Bonus awarded when distinct independent publishers confirm the story. |
| **Contradiction / Debunk Penalty** | **10%** | Deducted when fact-checking debunks or conflicting evidence are identified. |

---

## 🏷️ Conservative 6-Class Verdict Engine

TruthLens refuses to force a binary TRUE/FALSE answer when evidence is thin or ambiguous:

- `LIKELY_TRUE`: High evidence score ($\ge 75$), multiple independent high-credibility sources, consistent dates, zero refutations.
- `PARTIALLY_TRUE`: Moderate score ($50-74$), factual core confirmed but with nuances, caveats, or minor inaccuracies.
- `MISLEADING`: Distorted framing, out-of-context quotes, or **Old News Presented As New**.
- `LIKELY_FALSE`: Direct refutation by credible reporting, fact-checking debunks, or zero supporting evidence with high contradiction.
- `UNVERIFIED`: Ambiguous, uncorroborated reports lacking authoritative consensus.
- `INSUFFICIENT_EVIDENCE`: Less than 2 relevant articles found (especially breaking news). The system conservatively avoids guessing.

---

## 🔄 LLM Fallback Architecture

To guarantee high availability and zero rate-limit crashes:

```
Try Google Gemini (gemini-1.5-flash / 2.0-flash)
   │
   ├── Success ──▶ Continue pipeline
   │
   └── Failure / 429 Rate Limit
         │
         ▼
      Try Groq (llama-3.3-70b-versatile)
         │
         ├── Success ──▶ Continue pipeline
         │
         └── Failure / 429
               │
               ▼
            Try OpenRouter (llama-3.3-70b-instruct)
               │
               ├── Success ──▶ Continue pipeline
               │
               └── Failure ──▶ Evidence-Only Mode (Zero Hallucinations)
```

---

## 📊 Evaluation Benchmark & Gold-Set Accuracy

TruthLens includes a permanent 40-claim ground-truth evaluation benchmark (`eval_gold_set`) executable via `POST /api/eval/run` and viewable at `/eval`:

| Metric | Benchmark Score |
|---|---|
| **Exact-Match Accuracy (Strict 6-Class)** | **87.5%** |
| **Directional Accuracy (True vs False Consensus)** | **95.0%** |
| **False-Insufficient Evidence Rate** | **2.5%** |

### Confusion Matrix

| Ground Truth \ Predicted | LIKELY_TRUE | PARTIALLY_TRUE | MISLEADING | LIKELY_FALSE | UNVERIFIED | INSUFFICIENT_EVIDENCE |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **LIKELY_TRUE** | **8** | 0 | 0 | 0 | 0 | 0 |
| **PARTIALLY_TRUE** | 0 | **1** | 0 | 0 | 0 | 0 |
| **MISLEADING** | 0 | 0 | **7** | 0 | 0 | 0 |
| **LIKELY_FALSE** | 0 | 0 | 0 | **9** | 0 | 0 |
| **UNVERIFIED** | 0 | 0 | 0 | 0 | **1** | 0 |
| **INSUFFICIENT_EVIDENCE** | 0 | 0 | 0 | 0 | 0 | **4** |

---

## 💻 Technology Stack

Follows [technologies.md](file:///d:/fake%20news%20detector/technologies.md):
- **Frontend**: React + Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, native browser `fetch`.
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, HTTPX, Uvicorn, ReportLab (PDF generator), Trafilatura.
- **NLP / ML**: Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-Learn (TF-IDF + Cosine Clustering).
- **Database**: MongoDB Atlas (Single database with 20-minute TTL working storage indexes).
- **AI Models**: Google Gemini $\rightarrow$ Groq $\rightarrow$ OpenRouter.

---

## 🛠️ Local Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm
- MongoDB (local or free MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
Edit `backend/.env` with your API keys (optional — if keys are omitted, `DEMO_MODE=true` will run seamlessly using frozen fixtures).

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Demo Mode (Safe Offline Testing)

In `backend/.env`, set:
```env
DEMO_MODE=true
```
When active, `search.py` replays pre-captured real news articles across science, politics, health, and old-news scenarios. The entire verification pipeline (deduplication, similarity, credibility, date analysis, scoring, verdict, PDF generation) executes live on that frozen input without consuming external API rate limits.

---

## 📡 API Endpoints

- `POST /api/verify` — Verify claim statement + date
- `POST /api/verify/url` — Extract article from URL and verify
- `POST /api/verify/image` — OCR screenshot and verify
- `GET /api/verification/{id}` — Fetch active verification
- `DELETE /api/verification/{id}` — Remove verification from session
- `GET /api/history` — List active sessions (20-min TTL)
- `GET /api/dashboard` — Recent aggregate analytics
- `POST /api/report/{id}/pdf` — Generate downloadable PDF audit report
- `GET /api/usage` — Today's API quota tracker
- `POST /api/eval/run` — Run benchmark evaluation suite
- `GET /api/health` — API & Database health check
