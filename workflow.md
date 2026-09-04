# TruthLens — End-to-End Workflow

## 1. High-level pipeline

```
USER INPUT (claim + date [+ time])
        │
        ▼
INPUT PREPROCESSING & VALIDATION
        │
        ▼
CLAIM EXTRACTION (Gemini → Groq → OpenRouter fallback)
   → main_claim, people, orgs, locations, events,
     amounts, dates, category, keywords
        │
        ▼
SEARCH QUERY GENERATION (LLM)
   → 3–6 targeted queries from extracted entities
        │
        ▼
MULTI-SOURCE NEWS RETRIEVAL
   → GNews (primary) + secondary provider, run in parallel per query
        │
        ▼
ARTICLE NORMALIZATION
   → common schema: title, description, url, source, published_at, content
        │
        ▼
DEDUPLICATION
   → TF-IDF/cosine + sentence-transformer similarity groups near-duplicate articles
        │
        ▼
SEMANTIC SIMILARITY SCORING
   → embed claim + each unique article, cosine similarity
        │
        ▼
EVIDENCE CLASSIFICATION (per article)
   → Supporting / Partially Supporting / Contradicting / Neutral / Unrelated
        │
        ▼
DATE CONSISTENCY ANALYSIS
   → compare user date vs claim-mentioned dates vs article publish/event dates
   → flag "old news presented as new" pattern
        │
        ▼
SOURCE CREDIBILITY ANALYSIS
   → classify each source: Official/Gov, Established, Regional, Specialized, Unknown
        │
        ▼
EVIDENCE SCORING ENGINE (0–100, weighted, configurable)
   → Source Agreement 25% · Date Consistency 15% · Semantic Similarity 20%
     Source Quality 20% · Cross-source Agreement 10% · Contradiction 10%
        │
        ▼
VERDICT ENGINE (conservative, rule-based on score + evidence counts)
   → LIKELY_TRUE / PARTIALLY_TRUE / MISLEADING / LIKELY_FALSE
     / UNVERIFIED / INSUFFICIENT_EVIDENCE
        │
        ▼
MISINFORMATION TYPE CLASSIFICATION
        │
        ▼
GEMINI EVIDENCE-BASED REPORT GENERATION
   → fed ONLY the retrieved evidence + computed scores, never asked to "just say if it's fake"
   → structured JSON output, validated with Pydantic
        │
        ▼
PERSIST TO MONGODB (verifications, articles, llm_reports, usage_logs)
        │
        ▼
RESPONSE TO FRONTEND
   → verdict → evidence score → summary → sources → date analysis
     → timeline → full AI report → technical details (progressive disclosure)
```

## 2. Request lifecycle (sequence)

```
Frontend                Backend (FastAPI)         External services
   │  POST /api/verify        │                          │
   │ ────────────────────────▶│                          │
   │                          │  validate input           │
   │                          │  check cache (Redis) ─────┼──▶ hit? return cached
   │                          │  claim_extractor.py ───────┼──▶ Gemini
   │                          │  query_generator.py ───────┼──▶ Gemini
   │                          │  news_search.py ────────────┼──▶ GNews + secondary API (parallel)
   │                          │  article_normalizer.py     │
   │                          │  deduplicator.py           │
   │                          │  embeddings.py              │
   │                          │  date_analyzer.py           │
   │                          │  source_analyzer.py         │
   │                          │  scoring.py                 │
   │                          │  evidence_analyzer.py ──────┼──▶ Gemini (→Groq→OpenRouter on failure)
   │                          │  report_generator.py        │
   │                          │  mongodb.py — persist        │
   │  ◀────────────────────── │  JSON response              │
   │  render progressive UI   │                              │
```

## 3. LLM fallback flow

```
Try Gemini
   │
   ├── success ──▶ continue pipeline
   │
   └── fail (quota / 429 / error)
         │
         ▼
      Try Groq
         │
         ├── success ──▶ continue pipeline
         │
         └── fail
               │
               ▼
            Try OpenRouter
               │
               ├── success ──▶ continue pipeline
               │
               └── fail ──▶ return evidence-only results,
                            no AI report, no fabricated text
```

## 4. Old-news detection flow

```
Claim date (from user) ──┐
Event date (from claim)  ├──▶ compare ──▶ match?
Article publish dates   ─┤                 │
Event dates in articles ─┘          ┌───────┴───────┐
                                    yes             no
                                     │               │
                              date consistent   check gap size
                                                      │
                                          large gap + event confirmed
                                          real ──▶ flag "OLD NEWS
                                          PRESENTED AS NEW" + explain
```

## 5. Frontend progressive disclosure order

```
1. Verdict badge (color-coded)
2. Evidence score (0–100, with ring/progress indicator)
3. 2–4 sentence executive summary
4. Key supporting/contradicting evidence (top 3–5 cards)
5. Full source list (expandable, filterable)
6. Date analysis panel
7. Timeline visualization
8. Full AI report (expandable sections: what happened, people, orgs, limitations)
9. Technical details (raw scores, queries used, article counts) — collapsed by default
```

## 6. Caching strategy

```
Incoming claim
     │
     ▼
Normalize claim text (lowercase, strip, hash)
     │
     ▼
Check Redis for hash key
     │
  ┌──┴──┐
 hit   miss
  │      │
  │      ▼
  │   run full pipeline
  │      │
  │      ▼
  │   store result in Redis (TTL configurable, e.g. 6–24h)
  │      │
  └──────┴──▶ return result
```
