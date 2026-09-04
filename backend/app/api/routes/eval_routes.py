from fastapi import APIRouter
from app.services.eval_benchmark import run_evaluation_benchmark

router = APIRouter(tags=["Evaluation"])

@router.post("/eval/run")
async def run_evaluation():
    """
    Runs the verification pipeline against the curated 40-60 gold set claims.
    Computes exact-match accuracy, directional accuracy, confusion matrix, and average evidence scores.
    """
    results = await run_evaluation_benchmark()
    return results
