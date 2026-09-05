from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
from app.models.claim import ClaimInput
from app.models.verification import VerificationResult
from app.database.mongodb import db
from app.services.pipeline import run_verification_pipeline
from app.services.pdf_generator import generate_pdf_report
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Verification"])

@router.post("/verify")
async def verify_claim(payload: ClaimInput):
    """
    Main verification pipeline endpoint.
    Retrieves evidence, computes scores, assigns verdict, and persists to 20-min TTL storage.
    """
    try:
        result = await run_verification_pipeline(
            claim=payload.claim,
            date=payload.date,
            time=payload.time,
            language=payload.language or "en"
        )
        return result
    except Exception as e:
        logger.error(f"Verification pipeline failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.post("/verify/url")
async def verify_url(url: str = Form(...), date: str = Form(...), time: Optional[str] = Form(None)):
    """Extracts article text from a URL and runs the verification pipeline."""
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            raise HTTPException(status_code=400, detail="Could not extract content from the provided URL. Please copy and paste the text manually.")
        
        extracted_text = trafilatura.extract(downloaded)
        if not extracted_text or len(extracted_text.strip()) < 20:
            raise HTTPException(status_code=400, detail="Extracted text is too short or protected. Please paste the claim directly.")

        # Take headline / first 300 characters as claim statement
        headline_claim = extracted_text.strip().split("\n")[0][:300]
        result = await run_verification_pipeline(
            claim=headline_claim,
            date=date,
            time=time,
            language="en",
            source_url_context=url
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL verification failed: {e}")
        raise HTTPException(status_code=500, detail=f"URL verification failed: {str(e)}")

from app.services.image_extractor import image_ocr_extractor

@router.post("/extract/image")
async def extract_image_text(file: UploadFile = File(...)):
    """
    Extracts headline, factual claim statement, transcribed text, and detected date from image.
    Allows user to preview or edit extracted text before running verification.
    """
    try:
        content = await file.read()
        if not content or len(content) < 50:
            raise HTTPException(status_code=400, detail="The uploaded image file is empty or corrupted.")
        
        result = await image_ocr_extractor.extract_claim_from_image(content)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image OCR extraction failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify/image")
async def verify_image(
    file: UploadFile = File(...),
    date: str = Form(...),
    time: Optional[str] = Form(None)
):
    """
    Performs high-precision Vision OCR on uploaded news screenshot/image,
    extracts the core factual claim statement, and runs the verification pipeline.
    """
    try:
        content = await file.read()
        if not content or len(content) < 50:
            raise HTTPException(status_code=400, detail="The uploaded image file is empty or corrupted.")
        
        ocr_data = await image_ocr_extractor.extract_claim_from_image(content)
        extracted_claim = ocr_data.get("extracted_claim") or ocr_data.get("headline")
        if not extracted_claim or len(extracted_claim.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Could not detect a clear news claim or headline in the uploaded image. Please ensure the text is legible or paste the claim directly."
            )
        
        result = await run_verification_pipeline(
            claim=extracted_claim.strip(),
            date=date,
            time=time,
            language="en"
        )
        if isinstance(result, dict):
            result["ocr_metadata"] = {
                "headline": ocr_data.get("headline"),
                "full_text": ocr_data.get("full_text"),
                "publisher": ocr_data.get("publisher"),
                "engine": ocr_data.get("engine"),
                "confidence": ocr_data.get("confidence")
            }
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image OCR verification failed: {str(e)}")

@router.get("/verification/{doc_id}")
async def get_verification_by_id(doc_id: str):
    """Fetch an active, non-expired verification record by ID."""
    doc = await db.get_verification(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Verification not found or expired from 20-minute session storage.")
    return doc

@router.delete("/verification/{doc_id}")
async def delete_verification_by_id(doc_id: str):
    """
    Called when the user shifts to verify a new news claim or navigates away.
    Immediately cleans up the previous verification from working storage.
    """
    success = await db.delete_verification(doc_id)
    return {"id": doc_id, "deleted": success, "message": "Verification record removed from session storage."}

@router.post("/report/{doc_id}/pdf")
async def get_pdf_report(doc_id: str):
    """
    Generates a structured, evidence-based PDF report from the verification document.
    Does NOT trigger immediate document deletion (user can keep viewing and reviewing).
    """
    doc = await db.get_verification(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Verification record not found or expired.")

    pdf_bytes = generate_pdf_report(doc)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=truthlens_report_{doc_id[:8]}.pdf"
        }
    )
