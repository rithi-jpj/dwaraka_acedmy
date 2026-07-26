"""FRIDAY OCR Processing Module

Provides Optical Character Recognition for extracting text from images,
documents, and screenshots.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import List, Optional, Tuple

from loguru import logger

from backend.config.settings import settings


class OCRProcessor:
    """Extracts text from images using OCR engines.

    Supports EasyOCR (primary) and Tesseract (fallback).
    """

    def __init__(self, language: str = "eng"):
        self.language = language or settings.OCR_LANGUAGE
        self._reader = None

    def _init_reader(self):
        """Initialize the OCR reader."""
        if self._reader is not None:
            return

        # Try EasyOCR first
        try:
            import easyocr
            self._reader = easyocr.Reader(
                [self.language.split("-")[0]],
                gpu=False,
            )
            logger.info(f"✅ EasyOCR initialized (language: {self.language})")
            return
        except ImportError:
            logger.debug("EasyOCR not available, trying Tesseract")

        # Try Tesseract as fallback
        try:
            import pytesseract
            # Verify Tesseract is installed
            pytesseract.get_tesseract_version()
            self._reader = "tesseract"
            logger.info(f"✅ Tesseract OCR initialized")
            return
        except ImportError:
            logger.warning("No OCR engine available. Install easyocr or pytesseract.")

    def extract_text(self, image_bytes: bytes) -> Tuple[str, float]:
        """Extract text from an image.

        Args:
            image_bytes: Raw image bytes (PNG, JPEG, etc.).

        Returns:
            Tuple of (extracted_text, confidence_score).
        """
        self._init_reader()

        if self._reader is None:
            return ("OCR not available. Install easyocr or pytesseract.", 0.0)

        try:
            if hasattr(self._reader, "readtext"):
                # EasyOCR
                results = self._reader.readtext(image_bytes)
                text = " ".join([result[1] for result in results])
                confidence = (
                    sum(result[2] for result in results) / max(len(results), 1)
                    if results else 0.0
                )
                return (text.strip(), confidence)
            else:
                # Tesseract
                from PIL import Image
                img = Image.open(io.BytesIO(image_bytes))
                text = pytesseract.image_to_string(img, lang=self.language)
                return (text.strip(), 0.8)  # Tesseract doesn't provide confidence easily

        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ("", 0.0)

    def extract_text_from_file(self, file_path: Path) -> Tuple[str, float]:
        """Extract text from an image file.

        Args:
            file_path: Path to the image file.

        Returns:
            Tuple of (extracted_text, confidence_score).
        """
        if not file_path.exists():
            return ("", 0.0)

        image_bytes = file_path.read_bytes()
        return self.extract_text(image_bytes)

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from a PDF document.

        Args:
            pdf_bytes: Raw PDF file bytes.

        Returns:
            Extracted text from all pages.
        """
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text_parts = []

            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text_parts.append(page.extract_text())

            return "\n\n".join(text_parts)

        except ImportError:
            logger.warning("PyPDF2 not available for PDF text extraction")
            return "PDF text extraction requires PyPDF2"
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            return ""

    def extract_text_from_document(self, file_path: Path) -> str:
        """Extract text from various document formats.

        Supports: PDF, images (PNG, JPG, etc.)

        Args:
            file_path: Path to the document.

        Returns:
            Extracted text.
        """
        extension = file_path.suffix.lower()

        if extension == ".pdf":
            return self.extract_text_from_pdf(file_path.read_bytes())[0]

        elif extension in (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"):
            text, confidence = self.extract_text_from_file(file_path)
            return text

        else:
            return f"Unsupported file format: {extension}"
