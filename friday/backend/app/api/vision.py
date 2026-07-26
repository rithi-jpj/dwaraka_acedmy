"""FRIDAY Vision API Routes

Handles screenshot analysis, webcam input, OCR,
image understanding, and screen monitoring.
"""

from __future__ import annotations

import base64
import io
from typing import Optional, List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from pydantic import BaseModel, Field

from backend.config.settings import settings
from backend.database.models import User
from backend.app.security.auth import get_current_user

router = APIRouter()


# --- Schemas ---

class ImageAnalysisRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded image")
    prompt: str = Field(default="Describe this image in detail", max_length=2000)


class ImageAnalysisResponse(BaseModel):
    description: str
    objects: list = []
    text_detected: Optional[str] = None
    processing_time_ms: float


class OCRResponse(BaseModel):
    text: str
    confidence: float
    bounding_boxes: list = []


class ScreenshotResponse(BaseModel):
    image: str  # base64
    width: int
    height: int
    timestamp: str


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    request: ImageAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze an image using AI vision capabilities."""
    try:
        image_bytes = base64.b64decode(request.image)

        import time
        start = time.time()

        result = await _analyze_with_ai(image_bytes, request.prompt)
        processing_time = (time.time() - start) * 1000

        return ImageAnalysisResponse(
            description=result.get("description", "Analysis complete"),
            objects=result.get("objects", []),
            text_detected=result.get("text"),
            processing_time_ms=processing_time,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}",
        )


@router.post("/ocr", response_model=OCRResponse)
async def perform_ocr(
    file: UploadFile = File(...),
    language: str = Form(default="eng"),
    current_user: User = Depends(get_current_user),
):
    """Extract text from an image using OCR."""
    try:
        image_bytes = await file.read()
        text, confidence, boxes = await _extract_text(image_bytes, language)

        return OCRResponse(
            text=text,
            confidence=confidence,
            bounding_boxes=boxes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR failed: {str(e)}",
        )


@router.post("/screenshot", response_model=ScreenshotResponse)
async def capture_screenshot(
    current_user: User = Depends(get_current_user),
):
    """Capture and return a screenshot of the current screen."""
    try:
        import pyautogui
        import time

        screenshot = pyautogui.screenshot()
        width, height = screenshot.size

        buffer = io.BytesIO()
        screenshot.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()

        return ScreenshotResponse(
            image=image_base64,
            width=width,
            height=height,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Screenshot failed: {str(e)}",
        )


@router.post("/webcam")
async def capture_webcam(
    current_user: User = Depends(get_current_user),
):
    """Capture an image from the webcam."""
    try:
        import cv2
        import time

        cap = cv2.VideoCapture(settings.WEBCAM_DEVICE)
        if not cap.isOpened():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not open webcam",
            )

        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not capture frame",
            )

        _, buffer = cv2.imencode(".jpg", frame)
        image_base64 = base64.b64encode(buffer.tobytes()).decode()

        return {
            "image": image_base64,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Webcam support requires OpenCV (opencv-python)",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webcam capture failed: {str(e)}",
        )


@router.post("/detect-objects")
async def detect_objects(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Detect objects in an image."""
    try:
        image_bytes = await file.read()
        objects = await _detect_objects_in_image(image_bytes)

        return {
            "objects": objects,
            "count": len(objects),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Object detection failed: {str(e)}",
        )


async def _analyze_with_ai(image_bytes: bytes, prompt: str) -> dict:
    """Analyze an image using available AI vision models.

    Tries multimodal AI models first, falls back to basic analysis.
    """
    result = {"description": "Image analysis unavailable", "objects": []}

    # Try OpenAI vision
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            import base64

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            response = await client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )

            result["description"] = response.choices[0].message.content or ""
            return result
        except Exception as e:
            pass

    # Try Gemini vision
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            import base64

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            response = await model.generate_content_async([
                prompt,
                {"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}
            ])

            result["description"] = response.text
            return result
        except Exception:
            pass

    # Fallback: OCR + basic metadata
    import time
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        mode = img.mode
        format = img.format

        result["description"] = (
            f"Image dimensions: {width}x{height}, "
            f"Format: {format}, Mode: {mode}. "
            "For detailed analysis, configure an AI vision provider (OpenAI or Gemini)."
        )
    except Exception:
        result["description"] = f"Image received ({len(image_bytes)} bytes). Configure a vision AI provider."

    return result


async def _extract_text(image_bytes: bytes, language: str = "eng") -> tuple[str, float, list]:
    """Extract text from an image using OCR.

    Tries EasyOCR first, falls back to Tesseract.
    """
    try:
        import easyocr
        reader = easyocr.Reader([language.split("-")[0]])
        results = reader.readtext(image_bytes)

        text = " ".join([result[1] for result in results])
        confidence = sum(result[2] for result in results) / max(len(results), 1)
        boxes = [result[0] for result in results]

        return text, confidence, boxes
    except ImportError:
        pass

    try:
        import pytesseract
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img, lang=language)
        confidence = 0.8  # Tesseract doesn't provide per-document confidence easily
        return text.strip(), confidence, []
    except ImportError:
        pass

    return "OCR not available. Install easyocr or pytesseract.", 0.0, []


async def _detect_objects_in_image(image_bytes: bytes) -> list:
    """Detect objects in an image.

    Currently returns basic image info.
    Full object detection requires YOLO or similar.
    """
    return [
        {"label": "Image received", "confidence": 1.0, "box": [0, 0, 0, 0]}
    ]
