"""
FINTRUST AI — OCR Module
Extracts text from uploaded images and PDFs.
Uses Tesseract for local OCR with graceful fallback.
"""

import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def _tesseract_available() -> bool:
    """Check if tesseract binary is in PATH."""
    import shutil
    return shutil.which("tesseract") is not None


def extract_text_from_image_bytes(image_bytes: bytes, filename: str = "") -> str:
    """
    Extract text from image bytes using Tesseract OCR.
    Returns extracted text or empty string on failure.
    Does NOT raise — callers must handle empty return.
    """
    try:
        from PIL import Image
        import pytesseract

        image = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if needed (handles RGBA, palette images)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        text = pytesseract.image_to_string(image, lang="eng", config="--psm 6")
        cleaned = text.strip()
        logger.info(
            "OCR extracted %d characters from %s", len(cleaned), filename or "image"
        )
        return cleaned

    except ImportError:
        logger.warning("pytesseract or PIL not installed — OCR unavailable")
        return ""
    except Exception as exc:
        logger.warning("OCR failed for %s: %s", filename, exc)
        return ""


def extract_text_from_pdf_bytes(pdf_bytes: bytes, filename: str = "") -> str:
    """
    Extract text from PDF bytes using pypdf (if available) or Pillow fallback.
    Returns concatenated page text or empty string on failure.
    """
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages.append(page_text.strip())
        combined = "\n\n".join(p for p in pages if p)
        logger.info(
            "PDF extracted %d characters from %s (%d pages)",
            len(combined),
            filename or "document",
            len(reader.pages),
        )
        return combined

    except ImportError:
        logger.warning("pypdf not installed — PDF text extraction unavailable")
        return ""
    except Exception as exc:
        logger.warning("PDF extraction failed for %s: %s", filename, exc)
        return ""


def extract_text(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Unified entry point: dispatch to PDF or image extractor.
    Returns extracted text, possibly empty string.
    """
    ext = Path(filename).suffix.lower()
    if content_type == "application/pdf" or ext == ".pdf":
        return extract_text_from_pdf_bytes(file_bytes, filename)
    return extract_text_from_image_bytes(file_bytes, filename)
