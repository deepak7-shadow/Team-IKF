"""
FINTRUST AI — Multi-Source Intelligence & Prediction Database Layer
Saves and queries collected documents, evidence records, and prediction results.
Supports Supabase PostgreSQL with resilient in-memory local caching fallback.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from config import get_supabase_client, is_supabase_configured
from evidence_verifier import VerificationSummary
from forecasting_engine import MarketOutlookResult
from intelligence_collector import CollectedDocument, SourceQueryStatus

logger = logging.getLogger(__name__)

# In-memory storage fallback for local execution / dev mode
_MEMORY_DOCUMENTS: list[dict[str, Any]] = []
_MEMORY_EVIDENCE: list[dict[str, Any]] = []
_MEMORY_PREDICTIONS: list[dict[str, Any]] = []


async def save_intelligence_analysis(
    collection_result: Any,
    verification: VerificationSummary,
    outlook: MarketOutlookResult,
    user_id: Optional[str] = None
) -> dict[str, Any]:
    """
    Persist collected documents, evidence records, and prediction results to Supabase.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    analysis_id = str(uuid.uuid4())
    client = get_supabase_client()

    saved_doc_ids: list[str] = []

    # 1. Save Collected Documents
    for doc in collection_result.documents:
        doc_id = str(uuid.uuid4())
        doc.id = doc_id
        doc_payload = {
            "id": doc_id,
            "user_id": user_id,
            "company_symbol": doc.company_symbol,
            "company_name": doc.company_name,
            "source_code": doc.source_code,
            "source_url": doc.source_url,
            "title": doc.title,
            "document_type": doc.document_type,
            "publication_date": doc.publication_date,
            "retrieval_date": doc.retrieval_date,
            "raw_content": doc.raw_content,
            "excerpt": doc.excerpt,
            "content_hash": doc.content_hash,
            "is_duplicate": doc.is_duplicate,
            "metadata": doc.metadata,
        }
        _MEMORY_DOCUMENTS.append(doc_payload)
        saved_doc_ids.append(doc_id)

        if client and is_supabase_configured():
            try:
                client.table("collected_financial_documents").insert(doc_payload).execute()
            except Exception as e:
                logger.debug("Supabase doc insert error (non-fatal): %s", e)

    # 2. Save Evidence Records
    for item in verification.evidence_items:
        evi_payload = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "company_symbol": item.company_symbol,
            "classification": item.classification,
            "confidence_score": item.authenticity_score,
            "relevance_score": item.relevance_score,
            "recency_score": item.recency_score,
            "authenticity_score": item.authenticity_score,
            "source_tier": item.source_tier,
            "extracted_passage": item.extracted_passage,
            "analysis_notes": item.analysis_notes,
            "is_conflicting": item.contradiction_flag,
            "conflict_details": item.contradiction_details,
        }
        _MEMORY_EVIDENCE.append(evi_payload)
        if client and is_supabase_configured():
            try:
                client.table("evidence_records").insert(evi_payload).execute()
            except Exception as e:
                logger.debug("Supabase evidence insert error (non-fatal): %s", e)

    # 3. Save Prediction Result
    pred_payload = {
        "id": analysis_id,
        "user_id": user_id,
        "company_symbol": outlook.company_symbol,
        "company_name": outlook.company_name,
        "reference_price": outlook.reference_price,
        "reference_timestamp": outlook.reference_timestamp,
        "expected_direction": outlook.expected_direction,
        "forecast_price_low": outlook.forecast_price_low,
        "forecast_price_high": outlook.forecast_price_high,
        "forecast_horizon_days": outlook.forecast_horizon_days,
        "model_name": outlook.model_name,
        "model_version": outlook.model_version,
        "prediction_methodology": outlook.prediction_methodology,
        "confidence_score": outlook.confidence_score,
        "uncertainty_level": outlook.uncertainty_level,
        "uncertainty_explanation": outlook.uncertainty_explanation,
        "main_factors": outlook.main_factors,
        "supporting_evidence": outlook.supporting_evidence,
        "contradicting_evidence": outlook.contradicting_evidence,
        "risk_factors": outlook.risk_factors,
        "plain_language_explanation": outlook.plain_language_explanation,
        "historical_facts": outlook.historical_facts,
        "verified_company_info": outlook.verified_company_info,
        "news_and_context": outlook.news_and_context,
        "model_estimates": outlook.model_estimates,
        "data_sufficiency_status": outlook.data_sufficiency_status,
        "created_at": now_iso,
    }
    _MEMORY_PREDICTIONS.append(pred_payload)

    if client and is_supabase_configured():
        try:
            client.table("prediction_results").insert(pred_payload).execute()
        except Exception as e:
            logger.debug("Supabase prediction insert error (non-fatal): %s", e)

    return {"analysis_id": analysis_id, "saved_documents": len(saved_doc_ids)}


def get_stored_company_sources(symbol: str) -> list[dict[str, Any]]:
    """Retrieve collected documents for a specific company."""
    clean_sym = symbol.strip().upper()
    client = get_supabase_client()
    if client and is_supabase_configured():
        try:
            res = client.table("collected_financial_documents").select("*").eq("company_symbol", clean_sym).order("retrieval_date", desc=True).limit(20).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.debug("Supabase query error: %s", e)

    return [d for d in _MEMORY_DOCUMENTS if d.get("company_symbol") == clean_sym]


def get_stored_company_evidence(symbol: str) -> list[dict[str, Any]]:
    """Retrieve verified evidence records for a company."""
    clean_sym = symbol.strip().upper()
    client = get_supabase_client()
    if client and is_supabase_configured():
        try:
            res = client.table("evidence_records").select("*").eq("company_symbol", clean_sym).order("created_at", desc=True).limit(20).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.debug("Supabase query error: %s", e)

    return [e for e in _MEMORY_EVIDENCE if e.get("company_symbol") == clean_sym]


def get_stored_predictions_history(symbol: str) -> list[dict[str, Any]]:
    """Retrieve past forecasts for a company."""
    clean_sym = symbol.strip().upper()
    client = get_supabase_client()
    if client and is_supabase_configured():
        try:
            res = client.table("prediction_results").select("*").eq("company_symbol", clean_sym).order("created_at", desc=True).limit(20).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.debug("Supabase query error: %s", e)

    return [p for p in _MEMORY_PREDICTIONS if p.get("company_symbol") == clean_sym]
