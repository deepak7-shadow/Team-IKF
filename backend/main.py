"""
FINTRUST AI — FastAPI Backend
Financial Claim Analyzer API

Endpoints:
  POST /api/v1/claims              - Submit a new claim for analysis
  GET  /api/v1/claims              - List user's claims
  GET  /api/v1/claims/{id}         - Get a specific claim
  POST /api/v1/claims/{id}/analyze - Re-trigger analysis on a saved claim
  GET  /api/v1/claims/{id}/report  - Get the full analysis report
  GET  /api/v1/health              - Health check

Authentication: Supabase JWT Bearer token passed in Authorization header.
The backend verifies the JWT using the Supabase service role key.
"""

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any, Optional

import httpx
from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import config
from ai_analyzer import analyze_claim
from ocr import extract_text
from influencers import (
    search_influencers,
    get_influencer_by_id,
    create_or_request_influencer,
    re_verify_influencer_sebi,
    get_influencer_claims,
    get_influencer_predictions_and_performance,
    InfluencerCreate,
    InfluencerResponse,
    SebiVerificationAudit,
    PredictionPerformance,
)
from market_data import fetch_market_price, normalize_symbol
from prediction_engine import (
    evaluate_prediction,
    compute_prediction_analytics,
    PredictionCreate,
    PredictionRecord,
    PredictionAnalytics,
    EvaluationResult,
    EVALUATION_METHODOLOGY_VERSION,
)

# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LIFESPAN
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create upload directory on startup
    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("FINTRUST AI backend started. Upload dir: %s", config.UPLOAD_DIR.resolve())
    logger.info("Supabase configured: %s", config.is_supabase_configured())
    logger.info("Gemini configured: %s", config.is_gemini_configured())
    yield
    logger.info("FINTRUST AI backend shutting down.")


# ---------------------------------------------------------------------------
# APP INIT
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FINTRUST AI — Claim Analyzer API",
    description="Financial claim forensic analysis backend. Powered by Gemini AI.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# PYDANTIC MODELS
# ---------------------------------------------------------------------------
class RiskIndicator(BaseModel):
    type: str
    description: str
    severity: str
    verbatim_excerpt: str = ""


class MentionedSource(BaseModel):
    title: str
    url: Optional[str] = None
    context: str = ""


class ExtractedEntities(BaseModel):
    security: Optional[str] = None
    ticker_symbol: Optional[str] = None
    direction: Optional[str] = None
    target_price_raw: Optional[str] = None
    target_price_numeric: Optional[float] = None
    timeframe_raw: Optional[str] = None
    timeframe_normalized: Optional[str] = None
    reference_price_raw: Optional[str] = None
    supporting_statements: list[str] = []
    financial_figures: list[str] = []
    ambiguous_information: list[str] = []


class ClaimReport(BaseModel):
    id: str
    user_id: Optional[str]
    claim_text: str
    source_url: Optional[str]
    platform: Optional[str]
    ocr_extracted_text: Optional[str]
    submitted_at: str
    status: str
    risk_level: str
    risk_score: Optional[float]
    ai_summary: Optional[str]
    compliance_note: Optional[str]
    uncertainty_notes: Optional[str]
    ai_confidence: Optional[int]
    extracted_entities: Optional[ExtractedEntities]
    risk_indicators: list[RiskIndicator] = []
    mentioned_sources: list[MentionedSource] = []
    missing_evidence: list[str] = []
    analysis_duration_ms: Optional[int] = None
    analyzed_at: Optional[str] = None
    ai_engine: str = "gemini-2.0-flash"


class ClaimListItem(BaseModel):
    id: str
    claim_text: str
    source_url: Optional[str]
    platform: Optional[str]
    submitted_at: str
    status: str
    risk_level: str
    risk_score: Optional[float]
    ai_summary: Optional[str]


# ---------------------------------------------------------------------------
# AUTH: Verify Supabase JWT
# ---------------------------------------------------------------------------
async def get_current_user(authorization: Annotated[str | None, Header()] = None) -> Optional[dict]:
    """
    Verify Supabase JWT token from Authorization: Bearer <token> header.
    Returns user dict {id, email} or None if Supabase is not configured.
    Raises 401 if token is invalid.
    """
    if not config.is_supabase_configured():
        # In development without Supabase, allow unauthenticated requests
        logger.warning("Supabase not configured — running in unauthenticated dev mode")
        return None

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <supabase_jwt>",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{config.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                },
                timeout=10.0,
            )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token. Please log in again.",
            )

        user_data = resp.json()
        return {"id": user_data.get("id"), "email": user_data.get("email")}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Auth verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable.",
        )


# ---------------------------------------------------------------------------
# IN-MEMORY STORE (used when Supabase is not configured)
# ---------------------------------------------------------------------------
_memory_store: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# SUPABASE DB HELPERS
# ---------------------------------------------------------------------------
def _get_supabase():
    """Return a Supabase client using the service role key (bypasses RLS)."""
    if not config.is_supabase_configured():
        return None
    from supabase import create_client
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)


def _save_claim_to_db(
    claim_data: dict,
    user_id: Optional[str],
    supabase_client=None,
) -> str:
    """
    Insert or update a claim record in Supabase.
    Returns the claim id.
    If Supabase is not configured, stores in memory and returns a local UUID.
    """
    claim_id = claim_data.get("id") or str(uuid.uuid4())
    claim_data["id"] = claim_id

    if supabase_client is None:
        _memory_store[claim_id] = claim_data
        return claim_id

    payload = {
        "id": claim_id,
        "user_id": user_id,
        "claim_text": claim_data.get("claim_text", ""),
        "source_url": claim_data.get("source_url"),
        "platform": claim_data.get("platform"),
        "ocr_extracted_text": claim_data.get("ocr_extracted_text"),
        "risk_level": claim_data.get("risk_level", "medium"),
        "overall_score": claim_data.get("risk_score"),
        "status": claim_data.get("status", "complete"),
        "summary": claim_data.get("ai_summary"),
        "sources": [
            {
                "id": f"src-{i}",
                "title": s.get("title", ""),
                "url": s.get("url"),
                "context": s.get("context", ""),
                "credibility": 50,
                "publishedAt": datetime.utcnow().isoformat(),
                "supports": "neutral",
            }
            for i, s in enumerate(claim_data.get("mentioned_sources", []))
        ],
        "red_flags": [
            {
                "id": f"rf-{i}",
                "text": r.get("description", ""),
                "severity": r.get("severity", "medium"),
                "category": r.get("type", "unknown"),
                "verbatim_excerpt": r.get("verbatim_excerpt", ""),
            }
            for i, r in enumerate(claim_data.get("risk_indicators", []))
        ],
        "extracted_entities": claim_data.get("extracted_entities"),
        "analysis_metadata": {
            "ai_confidence": claim_data.get("ai_confidence"),
            "compliance_note": claim_data.get("compliance_note"),
            "uncertainty_notes": claim_data.get("uncertainty_notes"),
            "missing_evidence": claim_data.get("missing_evidence", []),
            "analysis_duration_ms": claim_data.get("analysis_duration_ms"),
            "analyzed_at": claim_data.get("analyzed_at"),
            "ai_engine": claim_data.get("ai_engine", "gemini-2.0-flash"),
        },
    }

    try:
        result = supabase_client.table("claims").upsert(payload).execute()
        logger.info("Claim %s saved to Supabase", claim_id)
    except Exception as exc:
        logger.error("Failed to save claim to Supabase: %s", exc)
        # Store in memory as fallback
        _memory_store[claim_id] = claim_data

    return claim_id


def _load_claim_from_db(claim_id: str, user_id: Optional[str], supabase_client=None) -> Optional[dict]:
    """Load a claim from Supabase or memory store."""
    if supabase_client is None:
        return _memory_store.get(claim_id)

    try:
        query = supabase_client.table("claims").select("*").eq("id", claim_id)
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.single().execute()
        return result.data
    except Exception as exc:
        logger.error("Failed to load claim %s: %s", claim_id, exc)
        return _memory_store.get(claim_id)


def _list_claims_from_db(user_id: Optional[str], supabase_client=None) -> list[dict]:
    """List all claims for a user."""
    if supabase_client is None:
        return list(_memory_store.values())

    try:
        query = supabase_client.table("claims").select("*").order("created_at", desc=True)
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.execute()
        return result.data or []
    except Exception as exc:
        logger.error("Failed to list claims: %s", exc)
        return []


# ---------------------------------------------------------------------------
# FILE VALIDATION
# ---------------------------------------------------------------------------
def _validate_upload(file: UploadFile) -> None:
    """Validate uploaded file type and name."""
    if file.content_type and file.content_type not in config.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PNG, JPG, WEBP, GIF, PDF.",
        )
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in config.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file extension: {ext}",
            )


# ---------------------------------------------------------------------------
# HELPER: Build ClaimReport from raw analysis dict
# ---------------------------------------------------------------------------
def _build_report(raw_data: dict, claim_id: str, user_id: Optional[str]) -> ClaimReport:
    ai = raw_data.get("ai_analysis", {}) or {}

    entities = ai.get("extracted_entities") or {
        "security": ai.get("security"),
        "ticker_symbol": ai.get("ticker_symbol"),
        "direction": ai.get("direction"),
        "target_price_raw": ai.get("target_price_raw"),
        "target_price_numeric": ai.get("target_price_numeric"),
        "timeframe_raw": ai.get("timeframe_raw"),
        "timeframe_normalized": ai.get("timeframe_normalized"),
        "reference_price_raw": ai.get("reference_price_raw"),
        "supporting_statements": ai.get("supporting_statements", []),
        "financial_figures": ai.get("financial_figures", []),
        "ambiguous_information": ai.get("ambiguous_information", []),
    }

    return ClaimReport(
        id=claim_id,
        user_id=user_id,
        claim_text=raw_data.get("claim_text", ""),
        source_url=raw_data.get("source_url"),
        platform=raw_data.get("platform"),
        ocr_extracted_text=raw_data.get("ocr_extracted_text"),
        submitted_at=raw_data.get("submitted_at", datetime.utcnow().isoformat()),
        status=raw_data.get("status", "complete"),
        risk_level=ai.get("risk_level", raw_data.get("risk_level", "medium")),
        risk_score=ai.get("risk_score"),
        ai_summary=ai.get("ai_summary"),
        compliance_note=ai.get("compliance_note"),
        uncertainty_notes=ai.get("uncertainty_notes"),
        ai_confidence=ai.get("confidence"),
        extracted_entities=ExtractedEntities(**entities) if entities else None,
        risk_indicators=[RiskIndicator(**r) for r in ai.get("risk_indicators", [])],
        mentioned_sources=[MentionedSource(**s) for s in ai.get("mentioned_sources", [])],
        missing_evidence=ai.get("missing_evidence", []),
        analysis_duration_ms=ai.get("_analysis_duration_ms"),
        analyzed_at=raw_data.get("analyzed_at"),
        ai_engine="gemini-2.0-flash" if config.is_gemini_configured() else "rule-based-fallback",
    )


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "supabase_configured": config.is_supabase_configured(),
        "gemini_configured": config.is_gemini_configured(),
        "version": "1.0.0",
    }


@app.post("/api/v1/claims", response_model=ClaimReport, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    background_tasks: BackgroundTasks,
    claim_text: Annotated[str, Form()] = "",
    source_url: Annotated[str, Form()] = "",
    platform: Annotated[str, Form()] = "Other",
    target_date: Annotated[str, Form()] = "",
    screenshot: Annotated[Optional[UploadFile], File()] = None,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Submit a financial claim for analysis.
    Accepts: claim text (required), source URL, platform, target date, optional screenshot.
    Returns full analysis report immediately.
    """
    # Validation
    claim_text = claim_text.strip()
    if not claim_text and screenshot is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least a claim text or an uploaded screenshot.",
        )

    if len(claim_text) > 20_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Claim text exceeds 20,000 characters. Please shorten the submission.",
        )

    # --- OCR from screenshot ---
    ocr_text = ""
    ocr_error = None
    saved_filename = None

    if screenshot and screenshot.filename:
        _validate_upload(screenshot)
        file_bytes = await screenshot.read()

        if len(file_bytes) > config.MAX_FILE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {config.MAX_FILE_SIZE_MB}MB.",
            )

        # Save file with safe name
        safe_stem = uuid.uuid4().hex
        ext = Path(screenshot.filename).suffix.lower() or ".png"
        saved_filename = f"{safe_stem}{ext}"
        save_path = config.UPLOAD_DIR / saved_filename
        save_path.write_bytes(file_bytes)
        logger.info("Saved upload: %s (%d bytes)", saved_filename, len(file_bytes))

        # Attempt OCR
        try:
            ocr_text = extract_text(file_bytes, screenshot.filename, screenshot.content_type or "")
        except Exception as exc:
            ocr_error = str(exc)
            logger.warning("OCR failed: %s", exc)
            ocr_text = ""

        # Merge OCR text into claim_text if claim_text is empty
        if not claim_text and ocr_text:
            claim_text = ocr_text
        elif ocr_text:
            claim_text = f"{claim_text}\n\n[OCR from screenshot]: {ocr_text}"

    if not claim_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from the uploaded file and no claim text was provided. Please enter the claim manually.",
        )

    # --- AI Analysis ---
    claim_id = str(uuid.uuid4())
    submitted_at = datetime.utcnow().isoformat()

    ai_result = analyze_claim(
        claim_text=claim_text,
        source_url=source_url,
        platform=platform,
        ocr_text=ocr_text,
        gemini_api_key=config.GEMINI_API_KEY,
    )

    # --- Build storage payload ---
    raw_data: dict[str, Any] = {
        "id": claim_id,
        "claim_text": claim_text,
        "source_url": source_url or None,
        "platform": platform or "Other",
        "ocr_extracted_text": ocr_text or None,
        "ocr_error": ocr_error,
        "submitted_at": submitted_at,
        "analyzed_at": datetime.utcnow().isoformat(),
        "status": "complete",
        "risk_level": ai_result.get("risk_level", "medium"),
        "risk_score": ai_result.get("risk_score"),
        "ai_analysis": ai_result,
        "target_date": target_date or None,
        "upload_filename": saved_filename,
    }

    # --- Persist to DB in background ---
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None

    background_tasks.add_task(_save_claim_to_db, raw_data, user_id, db)
    # Also keep in memory immediately for instant GET
    _memory_store[claim_id] = raw_data

    return _build_report(raw_data, claim_id, user_id)


@app.get("/api/v1/claims", response_model=list[ClaimListItem])
async def list_claims(current_user: Optional[dict] = Depends(get_current_user)):
    """List all claims for the authenticated user."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    rows = _list_claims_from_db(user_id, db)

    result = []
    for row in rows:
        # Handle both Supabase DB rows and in-memory dicts
        ai = row.get("ai_analysis", {}) or {}
        result.append(
            ClaimListItem(
                id=row.get("id", ""),
                claim_text=(row.get("claim_text") or "")[:300],
                source_url=row.get("source_url"),
                platform=row.get("platform"),
                submitted_at=row.get("submitted_at") or row.get("created_at", ""),
                status=row.get("status", "complete"),
                risk_level=ai.get("risk_level") or row.get("risk_level", "medium"),
                risk_score=ai.get("risk_score") or row.get("overall_score"),
                ai_summary=ai.get("ai_summary") or row.get("summary"),
            )
        )
    return result


@app.get("/api/v1/claims/{claim_id}", response_model=ClaimReport)
async def get_claim(claim_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    """Get a specific claim by ID."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    row = _load_claim_from_db(claim_id, user_id, db)

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")

    return _build_report(row, claim_id, user_id)


@app.post("/api/v1/claims/{claim_id}/analyze", response_model=ClaimReport)
async def re_analyze_claim(
    claim_id: str,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Re-trigger AI analysis on an existing claim."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    row = _load_claim_from_db(claim_id, user_id, db)

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")

    claim_text = row.get("claim_text", "")
    if not claim_text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No claim text to analyze.")

    ai_result = analyze_claim(
        claim_text=claim_text,
        source_url=row.get("source_url", ""),
        platform=row.get("platform", ""),
        ocr_text=row.get("ocr_extracted_text", ""),
        gemini_api_key=config.GEMINI_API_KEY,
    )

    row["ai_analysis"] = ai_result
    row["risk_level"] = ai_result.get("risk_level", "medium")
    row["analyzed_at"] = datetime.utcnow().isoformat()
    row["status"] = "complete"

    _memory_store[claim_id] = row
    background_tasks.add_task(_save_claim_to_db, row, user_id, db)

    return _build_report(row, claim_id, user_id)


@app.get("/api/v1/claims/{claim_id}/report", response_model=ClaimReport)
async def get_claim_report(claim_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    """Alias for GET /claims/{id} — returns the full analysis report."""
    return await get_claim(claim_id, current_user)


# ===========================================================================
# FINFLUENCER EXPLORER & SEBI VERIFICATION ENDPOINTS
# ===========================================================================

class InfluencerListResponse(BaseModel):
    items: list[InfluencerResponse]
    total: int
    page: int
    limit: int


@app.get("/api/v1/influencers", response_model=InfluencerListResponse)
async def list_influencers(
    q: str = "",
    platform: str = "all",
    sebi_status: str = "all",
    page: int = 1,
    limit: int = 20,
):
    """
    Search creators across name, handle, profile URL, or tags.
    Supports filtering by platform and SEBI status with pagination.
    """
    db = _get_supabase()
    items, total = search_influencers(
        query=q,
        platform=platform,
        sebi_status=sebi_status,
        page=page,
        limit=limit,
        supabase_client=db,
    )
    return InfluencerListResponse(
        items=[InfluencerResponse(**it) for it in items],
        total=total,
        page=page,
        limit=limit,
    )


@app.post("/api/v1/influencers", response_model=InfluencerResponse, status_code=status.HTTP_201_CREATED)
async def create_influencer(payload: InfluencerCreate):
    """Register or request an audit for a public creator profile."""
    db = _get_supabase()
    created = create_or_request_influencer(payload, supabase_client=db)
    return InfluencerResponse(**created)


@app.get("/api/v1/influencers/{inf_id}", response_model=InfluencerResponse)
async def get_influencer(inf_id: str):
    """Get creator profile and official SEBI registration audit."""
    db = _get_supabase()
    inf = get_influencer_by_id(inf_id, supabase_client=db)
    if not inf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Influencer not found.")
    return InfluencerResponse(**inf)


class VerifySebiPayload(BaseModel):
    claimed_sebi_reg_number: Optional[str] = None


@app.post("/api/v1/influencers/{inf_id}/verify-sebi", response_model=SebiVerificationAudit)
async def verify_influencer_sebi(inf_id: str, payload: Optional[VerifySebiPayload] = None):
    """Re-run official SEBI registry verification for a creator."""
    db = _get_supabase()
    reg_no = payload.claimed_sebi_reg_number if payload else None
    audit = re_verify_influencer_sebi(inf_id, claimed_reg_no=reg_no, supabase_client=db)
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Influencer not found.")
    return audit


@app.get("/api/v1/influencers/{inf_id}/claims")
async def get_claims_for_influencer(inf_id: str):
    """Get documented claims linked to this creator."""
    db = _get_supabase()
    inf = get_influencer_by_id(inf_id, supabase_client=db)
    if not inf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Influencer not found.")
    claims = get_influencer_claims(inf_id, inf["name"], supabase_client=db)
    return {"influencer_id": inf_id, "influencer_name": inf["name"], "claims": claims}


@app.get("/api/v1/influencers/{inf_id}/predictions")
async def get_predictions_for_influencer(inf_id: str):
    """Get documented predictions and statistical accuracy evaluation."""
    db = _get_supabase()
    inf = get_influencer_by_id(inf_id, supabase_client=db)
    if not inf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Influencer not found.")
    preds, perf = get_influencer_predictions_and_performance(inf_id, inf["name"], supabase_client=db)
    return {
        "influencer_id": inf_id,
        "influencer_name": inf["name"],
        "predictions": preds,
        "performance": perf,
    }


# ===========================================================================
# PREDICTION TRACKING ENGINE ENDPOINTS
# ===========================================================================

_predictions_store: dict[str, dict] = {}


def _save_prediction_record(pred: dict, user_id: Optional[str], supabase_client=None) -> str:
    pid = pred.get("id") or str(uuid.uuid4())
    pred["id"] = pid
    _predictions_store[pid] = pred

    if supabase_client is not None:
        try:
            payload = {
                "id": pid,
                "user_id": user_id,
                "influencer_id": pred.get("influencer_id"),
                "influencer_name": pred.get("influencer_name", "Documented Claim Source"),
                "asset": pred.get("asset"),
                "ticker_symbol": pred.get("ticker_symbol"),
                "direction": pred.get("direction"),
                "target_price": pred.get("target_price"),
                "reference_price": pred.get("reference_price"),
                "reference_date": pred.get("reference_date"),
                "current_price": pred.get("current_price"),
                "market_data_provider": pred.get("market_data_provider"),
                "market_data_status": pred.get("market_data_status", "unavailable"),
                "market_data_updated_at": pred.get("market_data_updated_at"),
                "prediction_date": pred.get("prediction_date"),
                "evaluation_date": pred.get("evaluation_date"),
                "status": pred.get("status", "pending"),
                "confidence": pred.get("confidence"),
                "notes": pred.get("notes"),
                "claim_id": pred.get("claim_id"),
                "claim_text": pred.get("claim_text"),
                "source_url": pred.get("source_url"),
                "evaluation_criteria": pred.get("evaluation_criteria"),
                "evaluation_methodology_version": pred.get("evaluation_methodology_version", EVALUATION_METHODOLOGY_VERSION),
                "evaluation_notes": pred.get("evaluation_notes"),
                "evaluated_at": pred.get("evaluated_at"),
                "price_snapshots": pred.get("price_snapshots", []),
                "corporate_actions_note": pred.get("corporate_actions_note"),
            }
            supabase_client.table("predictions").upsert(payload).execute()
        except Exception as exc:
            logger.error("Failed to save prediction to Supabase: %s", exc)

    return pid


def _load_prediction_record(pid: str, user_id: Optional[str], supabase_client=None) -> Optional[dict]:
    if pid in _predictions_store:
        return _predictions_store[pid]

    if supabase_client is not None:
        try:
            res = supabase_client.table("predictions").select("*").eq("id", pid).single().execute()
            if res.data:
                _predictions_store[pid] = res.data
                return res.data
        except Exception as exc:
            logger.warning("Failed to load prediction from Supabase: %s", exc)

    return None


def _list_all_predictions(user_id: Optional[str], supabase_client=None) -> list[dict]:
    if supabase_client is not None:
        try:
            res = supabase_client.table("predictions").select("*").order("created_at", desc=True).execute()
            if res.data:
                for row in res.data:
                    _predictions_store[row["id"]] = row
                return res.data
        except Exception as exc:
            logger.warning("Failed to list predictions from Supabase: %s", exc)

    return list(_predictions_store.values())


class PredictionListResponse(BaseModel):
    items: list[PredictionRecord]
    total: int
    page: int
    limit: int


@app.post("/api/v1/predictions", response_model=PredictionRecord, status_code=status.HTTP_201_CREATED)
async def create_prediction_endpoint(
    payload: PredictionCreate,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Create a new prediction record from an extracted financial claim or manual input.
    Automatically queries the market data feed for initial baseline prices and records a snapshot.
    """
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    pred_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Fetch initial market quote
    quote = await fetch_market_price(payload.asset)
    snapshots = []
    if quote.price is not None:
        snapshots.append({
            "timestamp": now_iso,
            "price": quote.price,
            "provider": quote.provider,
            "status": quote.status,
            "notes": "Initial snapshot at prediction creation",
        })

    # Reference price defaults to quote if not explicitly supplied
    ref_price = payload.reference_price
    if ref_price is None and quote.price is not None:
        ref_price = quote.price

    # Initial deterministic evaluation check
    eval_res = evaluate_prediction(
        direction=payload.direction,
        target_price=payload.target_price,
        reference_price=ref_price,
        current_price=quote.price,
        evaluation_date_str=payload.evaluation_date,
    )

    record_data = {
        "id": pred_id,
        "user_id": user_id,
        "asset": payload.asset,
        "ticker_symbol": payload.ticker_symbol or quote.normalized_ticker,
        "direction": payload.direction,
        "target_price": payload.target_price,
        "reference_price": ref_price,
        "reference_date": payload.reference_date or today_str,
        "current_price": quote.price,
        "market_data_provider": quote.provider,
        "market_data_status": quote.status,
        "market_data_updated_at": quote.timestamp if quote.price is not None else None,
        "prediction_date": today_str,
        "evaluation_date": payload.evaluation_date,
        "status": eval_res.status,
        "confidence": payload.confidence,
        "notes": payload.notes,
        "influencer_name": payload.influencer_name or "Documented Claim Source",
        "influencer_id": payload.influencer_id,
        "claim_id": payload.claim_id,
        "claim_text": payload.claim_text,
        "source_url": payload.source_url,
        "evaluation_criteria": eval_res.evaluation_criteria,
        "evaluation_methodology_version": EVALUATION_METHODOLOGY_VERSION,
        "evaluation_notes": eval_res.evaluation_notes,
        "evaluated_at": eval_res.evaluated_at,
        "price_snapshots": snapshots,
        "corporate_actions_note": eval_res.corporate_actions_note,
        "created_at": now_iso,
    }

    _save_prediction_record(record_data, user_id, db)
    return PredictionRecord(**record_data)


@app.get("/api/v1/predictions", response_model=PredictionListResponse)
async def list_predictions_endpoint(
    q: str = "",
    status: str = "all",
    page: int = 1,
    limit: int = 50,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List tracked predictions with search, status filtering, and pagination."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    all_preds = _list_all_predictions(user_id, db)

    # Filter
    filtered = []
    q_lower = q.strip().lower()
    for p in all_preds:
        if q_lower:
            asset_match = q_lower in p.get("asset", "").lower()
            creator_match = q_lower in p.get("influencer_name", "").lower()
            ticker_match = q_lower in (p.get("ticker_symbol") or "").lower()
            if not (asset_match or creator_match or ticker_match):
                continue

        p_status = p.get("status", "pending")
        if status != "all":
            # Match status aliases
            if status in ("met", "correct") and p_status not in ("met", "correct"):
                continue
            elif status in ("not_met", "incorrect") and p_status not in ("not_met", "incorrect"):
                continue
            elif status in ("partially_met", "partial") and p_status not in ("partially_met", "partial"):
                continue
            elif status == "pending" and p_status != "pending":
                continue
            elif status == "inconclusive" and p_status != "inconclusive":
                continue
            elif p_status != status and status not in ("met", "not_met", "partially_met"):
                continue

        filtered.append(p)

    total = len(filtered)
    start = max(0, (page - 1) * limit)
    end = start + limit
    paginated = filtered[start:end]

    return PredictionListResponse(
        items=[PredictionRecord(**p) for p in paginated],
        total=total,
        page=page,
        limit=limit,
    )


@app.get("/api/v1/predictions/analytics", response_model=PredictionAnalytics)
async def get_prediction_analytics_endpoint(current_user: Optional[dict] = Depends(get_current_user)):
    """Calculate statistically rigorous prediction performance metrics across all tracked forecasts."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    all_preds = _list_all_predictions(user_id, db)
    return compute_prediction_analytics(all_preds)


@app.get("/api/v1/predictions/{pred_id}", response_model=PredictionRecord)
async def get_prediction_endpoint(
    pred_id: str,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Retrieve full prediction record with price snapshots and evaluation metadata."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    pred = _load_prediction_record(pred_id, user_id, db)
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found.")
    return PredictionRecord(**pred)


@app.post("/api/v1/predictions/{pred_id}/evaluate", response_model=PredictionRecord)
async def evaluate_prediction_endpoint(
    pred_id: str,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Execute deterministic evaluation on a prediction.
    Fetches fresh market feed quote, stores snapshot, and computes reproducible outcome.
    """
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    pred = _load_prediction_record(pred_id, user_id, db)
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found.")

    # Refresh market quote
    quote = await fetch_market_price(pred["asset"])
    now_iso = datetime.now(timezone.utc).isoformat()

    snapshots = pred.get("price_snapshots") or []
    if quote.price is not None:
        snapshots.append({
            "timestamp": now_iso,
            "price": quote.price,
            "provider": quote.provider,
            "status": quote.status,
            "notes": "Snapshot recorded during on-demand evaluation",
        })
        pred["current_price"] = quote.price
        pred["market_data_provider"] = quote.provider
        pred["market_data_status"] = quote.status
        pred["market_data_updated_at"] = quote.timestamp
    else:
        # If live quote fails, use most recent snapshot price if available
        if snapshots:
            latest = snapshots[-1]
            logger.info("Using latest snapshot price for %s: %s", pred["asset"], latest.get("price"))

    # Extract historical extremes from snapshots
    high_seen = max([s["price"] for s in snapshots if "price" in s], default=pred.get("current_price"))
    low_seen = min([s["price"] for s in snapshots if "price" in s], default=pred.get("current_price"))

    # Run deterministic evaluation
    eval_res = evaluate_prediction(
        direction=pred["direction"],
        target_price=float(pred["target_price"]),
        reference_price=float(pred["reference_price"]) if pred.get("reference_price") else None,
        current_price=pred.get("current_price"),
        evaluation_date_str=pred["evaluation_date"],
        highest_seen_price=high_seen,
        lowest_seen_price=low_seen,
    )

    pred["status"] = eval_res.status
    pred["evaluation_criteria"] = eval_res.evaluation_criteria
    pred["evaluation_methodology_version"] = eval_res.methodology_version
    pred["evaluation_notes"] = eval_res.evaluation_notes
    pred["evaluated_at"] = eval_res.evaluated_at
    pred["price_snapshots"] = snapshots
    if eval_res.corporate_actions_note:
        pred["corporate_actions_note"] = eval_res.corporate_actions_note

    _save_prediction_record(pred, user_id, db)
    return PredictionRecord(**pred)


# ---------------------------------------------------------------------------
# SAVED REPORTS ENDPOINTS
# ---------------------------------------------------------------------------

class SavedReportCreate(BaseModel):
    title: str
    type: str = "claim"  # claim | influencer | prediction
    risk_level: str = "medium"  # low | medium | high | critical
    summary: str = ""
    dossier_data: Optional[dict] = None


class SavedReportRecord(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    type: str
    risk_level: str
    summary: str
    dossier_data: Optional[dict] = None
    created_at: str


# In-memory fallback store for saved reports when Supabase is not configured
_saved_reports_store: dict[str, dict] = {}


def _save_report_record(record: dict, user_id: Optional[str], db) -> None:
    if db:
        try:
            payload = {k: v for k, v in record.items() if v is not None}
            db.table("saved_reports").upsert(payload).execute()
        except Exception as e:
            logger.warning("Supabase saved_reports upsert failed: %s. Falling back to memory store.", e)
    _saved_reports_store[record["id"]] = record


def _list_saved_reports(user_id: Optional[str], db) -> list[dict]:
    if db:
        try:
            query = db.table("saved_reports").select("*").order("created_at", desc=True)
            if user_id:
                query = query.eq("user_id", user_id)
            result = query.execute()
            if result.data:
                return result.data
        except Exception as e:
            logger.warning("Supabase list saved_reports failed: %s", e)
    return [r for r in _saved_reports_store.values() if not user_id or r.get("user_id") == user_id]


def _delete_report_record(report_id: str, user_id: Optional[str], db) -> bool:
    if db:
        try:
            query = db.table("saved_reports").delete().eq("id", report_id)
            if user_id:
                query = query.eq("user_id", user_id)
            query.execute()
        except Exception as e:
            logger.warning("Supabase delete saved_report failed: %s", e)
    _saved_reports_store.pop(report_id, None)
    return True


@app.post("/api/v1/reports", response_model=SavedReportRecord, status_code=status.HTTP_201_CREATED)
async def create_saved_report_endpoint(
    payload: SavedReportCreate,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Save a claim analysis, influencer audit, or prediction report as a dossier."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    report_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    record = {
        "id": report_id,
        "user_id": user_id,
        "title": payload.title,
        "type": payload.type,
        "risk_level": payload.risk_level,
        "summary": payload.summary,
        "dossier_data": payload.dossier_data,
        "created_at": now_iso,
    }

    _save_report_record(record, user_id, db)
    return SavedReportRecord(**record)


@app.get("/api/v1/reports", response_model=list[SavedReportRecord])
async def list_saved_reports_endpoint(
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List all saved reports for the authenticated user."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    reports = _list_saved_reports(user_id, db)
    return [SavedReportRecord(**r) for r in reports]


@app.delete("/api/v1/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_report_endpoint(
    report_id: str,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a user-owned saved report."""
    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None
    _delete_report_record(report_id, user_id, db)
    return None


# ---------------------------------------------------------------------------
# DASHBOARD STATS ENDPOINT
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    claims_analyzed: int
    risk_indicators_identified: int
    influencers_monitored: int
    predictions_tracked: int
    evaluated_predictions: int
    met_predictions: int
    not_met_predictions: int
    pending_predictions: int
    hit_rate_pct: Optional[float] = None
    has_sufficient_sample: bool
    sample_size: int


@app.get("/api/v1/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Aggregate dashboard statistics from real database records only. No invented data."""
    from influencers import _influencers_store

    db = _get_supabase()
    user_id = current_user.get("id") if current_user else None

    all_claims = _list_claims_from_db(user_id, db)
    all_preds = _list_all_predictions(user_id, db)
    all_infs = list(_influencers_store.values())

    risk_indicators = sum(
        len(c.get("risk_indicators", []) if isinstance(c.get("risk_indicators"), list) else [])
        for c in all_claims
    )

    evaluated = [
        p for p in all_preds
        if p.get("status") in ("met", "not_met", "partially_met", "correct", "incorrect")
    ]
    met = len([p for p in all_preds if p.get("status") in ("met", "correct")])
    not_met = len([p for p in all_preds if p.get("status") in ("not_met", "incorrect")])
    pending = len([p for p in all_preds if p.get("status") == "pending"])

    sample_size = len(evaluated)
    hit_rate = None
    if sample_size >= 3 and len(evaluated) > 0:
        hit_rate = round((met / len(evaluated)) * 100, 1)

    return DashboardStats(
        claims_analyzed=len(all_claims),
        risk_indicators_identified=risk_indicators,
        influencers_monitored=len(all_infs),
        predictions_tracked=len(all_preds),
        evaluated_predictions=sample_size,
        met_predictions=met,
        not_met_predictions=not_met,
        pending_predictions=pending,
        hit_rate_pct=hit_rate,
        has_sufficient_sample=sample_size >= 3,
        sample_size=sample_size,
    )


# ---------------------------------------------------------------------------
# GLOBAL ERROR HANDLER
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )
