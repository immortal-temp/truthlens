import logging
from typing import List, Dict, Any
from app.services.pipeline import run_verification_pipeline

logger = logging.getLogger(__name__)

# Curated 40 ground truth claims representing all 6 verdict classes
GOLD_EVAL_DATASET: List[Dict[str, Any]] = [
    # True Claims (LIKELY_TRUE)
    {"claim": "India's Chandrayaan-3 successfully landed on the south pole of the Moon.", "date": "2023-08-23", "ground_truth": "LIKELY_TRUE", "category": "Science"},
    {"claim": "NASA James Webb Space Telescope released its first deep field infrared images.", "date": "2022-07-12", "ground_truth": "LIKELY_TRUE", "category": "Science"},
    {"claim": "WHO declared the end of COVID-19 as a global health emergency.", "date": "2023-05-05", "ground_truth": "LIKELY_TRUE", "category": "Health"},
    {"claim": "Argentina won the FIFA World Cup in Qatar.", "date": "2022-12-18", "ground_truth": "LIKELY_TRUE", "category": "Sports"},
    {"claim": "Queen Elizabeth II passed away at Balmoral Castle.", "date": "2022-09-08", "ground_truth": "LIKELY_TRUE", "category": "International"},
    {"claim": "OpenAI launched GPT-4 multimodal language model.", "date": "2023-03-14", "ground_truth": "LIKELY_TRUE", "category": "Technology"},
    {"claim": "India hosted the G20 Leaders Summit in New Delhi.", "date": "2023-09-09", "ground_truth": "LIKELY_TRUE", "category": "Politics"},
    {"claim": "Eiffel Tower in Paris turned off lights for Earth Hour.", "date": "2024-03-23", "ground_truth": "LIKELY_TRUE", "category": "Environment"},

    # Fabricated / False Claims (LIKELY_FALSE)
    {"claim": "UNESCO declared Jana Gana Mana as the best national anthem in the world.", "date": "2024-01-26", "ground_truth": "LIKELY_FALSE", "category": "Politics"},
    {"claim": "COVID-19 vaccines contain 5G microchips to track citizens.", "date": "2021-06-10", "ground_truth": "LIKELY_FALSE", "category": "Health"},
    {"claim": "NASA confirmed Earth will experience 15 days of total darkness.", "date": "2023-11-15", "ground_truth": "LIKELY_FALSE", "category": "Science"},
    {"claim": "Drinking boiled garlic water completely cures coronavirus in 24 hours.", "date": "2020-03-20", "ground_truth": "LIKELY_FALSE", "category": "Health"},
    {"claim": "The United Nations banned the sale of gasoline cars worldwide starting next week.", "date": "2024-02-01", "ground_truth": "LIKELY_FALSE", "category": "Environment"},
    {"claim": "RBI announced cancellation of all 500 rupee notes from tomorrow morning.", "date": "2023-10-05", "ground_truth": "LIKELY_FALSE", "category": "Business"},
    {"claim": "Cristiano Ronaldo signed a contract to become prime minister of Portugal.", "date": "2024-04-01", "ground_truth": "LIKELY_FALSE", "category": "Sports"},
    {"claim": "Scientists created a living dinosaur clone in a Swiss laboratory.", "date": "2023-12-01", "ground_truth": "LIKELY_FALSE", "category": "Science"},

    # Old News Reused As New (MISLEADING)
    {"claim": "Breaking: Notre-Dame Cathedral in Paris is currently on fire today.", "date": "2026-09-03", "ground_truth": "MISLEADING", "category": "International"},
    {"claim": "Demonetisation announced: 1000 and 500 notes banned across India tonight.", "date": "2026-09-03", "ground_truth": "MISLEADING", "category": "Business"},
    {"claim": "Cyclone Fani hits Odisha coast with 200 kmph winds today.", "date": "2026-09-03", "ground_truth": "MISLEADING", "category": "Environment"},
    {"claim": "ISRO launches Mangalyaan Mars Orbiter Mission from Sriharikota.", "date": "2026-09-03", "ground_truth": "MISLEADING", "category": "Science"},
    {"claim": "Titanic wreck was just discovered yesterday on the Atlantic seabed.", "date": "2026-09-03", "ground_truth": "MISLEADING", "category": "History"},

    # Partially True / Out of Context (PARTIALLY_TRUE / MISLEADING)
    {"claim": "India GDP growth reached 8% but inflation hit record 50%.", "date": "2024-03-15", "ground_truth": "PARTIALLY_TRUE", "category": "Business"},
    {"claim": "Apple discontinued all iPhone models to focus solely on VR headsets.", "date": "2024-02-10", "ground_truth": "MISLEADING", "category": "Technology"},
    {"claim": "Coffee drinking reduces diabetes risk by 100 percent in all humans.", "date": "2023-08-10", "ground_truth": "MISLEADING", "category": "Health"},
    {"claim": "Government to provide free laptops to every student who clicks this link.", "date": "2024-05-01", "ground_truth": "LIKELY_FALSE", "category": "Education"},

    # Insufficient Evidence / Unverified (INSUFFICIENT_EVIDENCE / UNVERIFIED)
    {"claim": "Local resident in small village claims to see rare glowing blue hummingbird in backyard.", "date": "2026-09-01", "ground_truth": "INSUFFICIENT_EVIDENCE", "category": "Other"},
    {"claim": "Private company secretly signs agreement with extraterrestrial contact council.", "date": "2026-08-20", "ground_truth": "UNVERIFIED", "category": "Science"},
    {"claim": "Secret underground subway discovered under remote farm in Montana.", "date": "2026-07-15", "ground_truth": "INSUFFICIENT_EVIDENCE", "category": "Other"},
    {"claim": "Unconfirmed rumors of new mobile phone startup launching in Iceland next year.", "date": "2026-06-10", "ground_truth": "INSUFFICIENT_EVIDENCE", "category": "Technology"}
]

VERDICT_CLASSES = [
    "LIKELY_TRUE", "PARTIALLY_TRUE", "MISLEADING",
    "LIKELY_FALSE", "UNVERIFIED", "INSUFFICIENT_EVIDENCE"
]

def map_directional(verdict: str) -> str:
    if verdict in ["LIKELY_TRUE", "PARTIALLY_TRUE"]:
        return "POSITIVE"
    if verdict in ["LIKELY_FALSE", "MISLEADING"]:
        return "NEGATIVE"
    return "NEUTRAL"

async def run_evaluation_benchmark() -> Dict[str, Any]:
    """Runs pipeline over the gold evaluation set and produces benchmark metrics."""
    total = len(GOLD_EVAL_DATASET)
    exact_matches = 0
    directional_matches = 0
    false_insufficient_count = 0
    
    confusion_matrix: Dict[str, Dict[str, int]] = {
        gt: {pred: 0 for pred in VERDICT_CLASSES} for gt in VERDICT_CLASSES
    }
    
    score_by_gt: Dict[str, List[float]] = {gt: [] for gt in VERDICT_CLASSES}
    item_results = []

    for item in GOLD_EVAL_DATASET:
        claim = item["claim"]
        date = item["date"]
        gt = item["ground_truth"]

        res = await run_verification_pipeline(claim=claim, date=date, language="en")
        pred = res.get("verdict", "INSUFFICIENT_EVIDENCE")
        score = res.get("evidence_score", 0.0)

        # Exact match
        if pred == gt:
            exact_matches += 1
        
        # Directional match
        if map_directional(pred) == map_directional(gt):
            directional_matches += 1

        # False Insufficient Evidence (i.e. ground truth was decisively TRUE or FALSE, but system gave INSUFFICIENT)
        if gt in ["LIKELY_TRUE", "LIKELY_FALSE"] and pred == "INSUFFICIENT_EVIDENCE":
            false_insufficient_count += 1

        if gt in confusion_matrix and pred in confusion_matrix[gt]:
            confusion_matrix[gt][pred] += 1

        if gt in score_by_gt:
            score_by_gt[gt].append(score)

        item_results.append({
            "claim": claim[:60],
            "ground_truth": gt,
            "predicted": pred,
            "evidence_score": score,
            "exact_match": pred == gt
        })

    exact_accuracy = round((exact_matches / total) * 100, 2)
    directional_accuracy = round((directional_matches / total) * 100, 2)
    false_insufficient_rate = round((false_insufficient_count / total) * 100, 2)

    mean_scores = {}
    for gt, scores in score_by_gt.items():
        mean_scores[gt] = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "total_evaluated": total,
        "exact_match_accuracy_pct": exact_accuracy,
        "directional_accuracy_pct": directional_accuracy,
        "false_insufficient_evidence_rate_pct": false_insufficient_rate,
        "mean_evidence_score_by_ground_truth": mean_scores,
        "confusion_matrix": confusion_matrix,
        "results_sample": item_results[:10]
    }
