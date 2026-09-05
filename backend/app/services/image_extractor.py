import io
import json
import base64
import logging
from typing import Dict, Any, Optional
from PIL import Image
import httpx

from app.config import settings
from app.database.mongodb import db

logger = logging.getLogger(__name__)

class ImageOCRExtractor:
    """
    Advanced OCR & Multi-Modal Vision extractor for news screenshots,
    newspaper clippings, social media posts, TV news chyrons, and documents.
    """

    def __init__(self):
        self.gemini_keys = [
            k.strip() for k in [
                settings.GEMINI_API_KEY,
                settings.GEMINI_API_KEY_2,
                settings.GEMINI_API_KEY_3
            ] if k and len(k.strip()) > 5
        ]
        self.active_key_index = 0
        self.primary_model = settings.GEMINI_MODEL or "gemini-3.5-flash"
        self.models_order = [
            self.primary_model,
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
        ]
        self.fallback_models = list(dict.fromkeys(self.models_order))

    def preprocess_image(self, image_bytes: bytes) -> tuple[bytes, str]:
        """
        Validates, orients, and optimizes image for vision OCR.
        Converts all formats to standardized JPEG within 2048x2048 max bounds.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            elif image.mode != "RGB":
                image = image.convert("RGB")

            # Downscale if excessively large to ensure ultra-fast transfer & processing
            max_dimension = 2048
            if max(image.width, image.height) > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=88, optimize=True)
            return buffer.getvalue(), "image/jpeg"
        except Exception as e:
            logger.warning(f"Image preprocessing warning: {e}. Using raw bytes.")
            return image_bytes, "image/jpeg"

    async def extract_claim_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts news headline, claim statement, visible full text, and date
        from an uploaded image.
        """
        processed_bytes, mime_type = self.preprocess_image(image_bytes)
        base64_encoded = base64.b64encode(processed_bytes).decode('utf-8')

        # 1. Try Gemini Vision with multi-key and multi-model fallback
        gemini_result = await self._extract_with_gemini_vision(base64_encoded, mime_type)
        if gemini_result and gemini_result.get("extracted_claim"):
            return gemini_result

        # 2. Try Local EasyOCR fallback if available
        ocr_result = await self._extract_with_local_ocr(processed_bytes)
        if ocr_result and ocr_result.get("extracted_claim"):
            return ocr_result

        # 3. Fallback error if completely unreadable
        raise ValueError("No readable news headline or factual claim could be extracted from the uploaded image. Please ensure the image contains legible text, or paste the text directly.")

    def _clean_and_parse_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """Cleans markdown wrappers and safely parses JSON from model responses."""
        if not raw_text or not raw_text.strip():
            return None

        text = raw_text.strip()
        # Remove markdown code block fences if present
        if "```json" in text:
            text = text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in text:
            text = text.split("```", 1)[1].split("```", 1)[0].strip()

        try:
            return json.loads(text)
        except Exception:
            pass

        # Try to find JSON object substring {...}
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except Exception:
                pass

        # If pure text was returned without JSON, extract first line as headline
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if lines:
            headline = lines[0]
            return {
                "extracted_claim": headline,
                "headline": headline,
                "full_text": text,
                "detected_date": None,
                "publisher": None,
                "confidence": 0.85
            }
        return None

    async def _extract_with_gemini_vision(self, base64_image: str, mime_type: str) -> Optional[Dict[str, Any]]:
        if not self.gemini_keys:
            logger.warning("No Gemini API keys configured for Vision OCR.")
            return None

        prompt = (
            "You are an expert News OCR and Fact-Checking Extraction Engine. Analyze this image (news headline, "
            "newspaper screenshot, social media post, breaking news banner, TV chyron, or document).\n\n"
            "Task:\n"
            "1. Transcribe all legible text from the image accurately into `full_text`.\n"
            "2. Identify the main news headline or assertion into `headline`.\n"
            "3. Formulate a clear, concise, self-contained factual claim statement to verify into `extracted_claim` (10-40 words).\n"
            "4. Extract any visible event or publish date into `detected_date` in YYYY-MM-DD format (or null if none).\n"
            "5. Extract visible publisher or source name into `publisher` (or null if none).\n\n"
            "Return ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "extracted_claim": "The concise claim statement for fact checking",\n'
            '  "headline": "The main headline as read",\n'
            '  "full_text": "All transcribed text from image",\n'
            '  "detected_date": "YYYY-MM-DD or null",\n'
            '  "publisher": "Source name or null",\n'
            '  "confidence": 0.95\n'
            "}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            }
        }

        # Iterate across all configured keys to guarantee full resilience
        for key_idx, current_key in enumerate(self.gemini_keys):
            key_label = f"key #{key_idx + 1}"
            headers = {
                "x-goog-api-key": current_key,
                "Content-Type": "application/json"
            }

            for model_name in self.fallback_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                try:
                    async with httpx.AsyncClient(timeout=25.0) as client:
                        await db.record_api_call("gemini_vision")
                        resp = await client.post(url, headers=headers, json=payload)

                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                text = candidates[0]["content"]["parts"][0]["text"]
                                parsed = self._clean_and_parse_json(text)
                                if parsed:
                                    claim = (
                                        parsed.get("extracted_claim") or 
                                        parsed.get("headline") or 
                                        parsed.get("text") or 
                                        parsed.get("full_text")
                                    )
                                    if claim and len(claim.strip()) > 5:
                                        logger.info(f"Gemini Vision OCR succeeded using {model_name} on {key_label}.")
                                        return {
                                            "extracted_claim": claim.strip(),
                                            "headline": (parsed.get("headline") or claim).strip(),
                                            "full_text": (parsed.get("full_text") or parsed.get("text") or claim).strip(),
                                            "detected_date": parsed.get("detected_date") or parsed.get("updated_on"),
                                            "publisher": parsed.get("publisher") or parsed.get("author"),
                                            "confidence": float(parsed.get("confidence", 0.95)),
                                            "engine": f"Gemini Vision ({model_name})"
                                        }

                        elif resp.status_code in (429, 403) or (resp.status_code == 400 and "quota" in resp.text.lower()):
                            logger.warning(f"Gemini Vision {key_label} quota exhausted (status {resp.status_code}). Trying next key...")
                            break

                        elif resp.status_code in (404, 400) and ("not found" in resp.text.lower() or "no longer available" in resp.text.lower()):
                            continue

                        else:
                            logger.error(f"Gemini Vision API status {resp.status_code}: {resp.text[:120]}")

                except Exception as e:
                    logger.error(f"Gemini Vision OCR request error on {key_label} ({model_name}): {e}")
                    continue

        return None

    async def _extract_with_local_ocr(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Fallback local OCR using easyocr if installed."""
        try:
            import easyocr
            import numpy as np
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            results = reader.readtext(image_np)

            if not results:
                return None

            lines = [str(r[1]).strip() for r in results if r[1] and len(str(r[1]).strip()) > 2]
            if not lines:
                return None

            full_text = " ".join(lines)
            headline = max(lines, key=len) if lines else full_text[:200]
            
            return {
                "extracted_claim": headline,
                "headline": headline,
                "full_text": full_text,
                "detected_date": None,
                "publisher": None,
                "confidence": 0.75,
                "engine": "EasyOCR (Local)"
            }
        except Exception as e:
            logger.warning(f"Local OCR fallback failed: {e}")
            return None

image_ocr_extractor = ImageOCRExtractor()
