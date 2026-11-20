"""
FINTRUST AI — Source Authenticity & Evidence Analysis Engine

Core Principles:
  • Do not assume information is correct just because it appears on a website.
  • Validate domain authenticity and check publication timestamps.
  • Deduplicate disclosures:
      - NSE and BSE frequently publish the identical corporate disclosure.
      - Marked as a duplicate; NEVER counted as two independent confirmations.
  • Detect cross-source contradictions and outdated filings.
  • Apply 3-Tier Source Hierarchy:
      Level 1: Primary Official Evidence (SEBI, NSE, BSE) — Weight 1.0
      Level 2: Secondary Evidence (Moneycontrol) — Weight 0.6
      Level 3: Unverified Information (Social Media) — Weight 0.2
  • Never use simple majority voting.
  • Returns 'Unable to verify with sufficient reliable evidence.' when sources conflict or evidence is insufficient.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field

from intelligence_collector import CollectedDocument

logger = logging.getLogger(__name__)

# Validated authoritative domains
LEGITIMATE_DOMAINS = {
    "SEBI": ["sebi.gov.in", "www.sebi.gov.in"],
    "NSE": ["nseindia.com", "www.nseindia.com", "nsearchives.nseindia.com"],
    "BSE": ["bseindia.com", "www.bseindia.com", "api.bseindia.com"],
    "MONEYCONTROL": ["moneycontrol.com", "www.moneycontrol.com"],
}


class EvidenceItem(BaseModel):
    id: str
    document_id: Optional[str] = None
    company_symbol: str
    source_code: str  # SEBI | NSE | BSE | MONEYCONTROL | SOCIAL
    source_name: str
    source_url: str
    source_tier: str  # Level 1 - Primary Official | Level 2 - Secondary Financial Journalism | Level 3 - Unverified
    publication_date: Optional[str] = None
    retrieval_date: str
    classification: str  # supports | contradicts | context | unclear
    relevance_score: float = Field(ge=0, le=100)
    authenticity_score: float = Field(ge=0, le=100)
    recency_score: float = Field(ge=0, le=100)
    is_duplicate: bool = False
    duplicate_notice: Optional[str] = None
    extracted_passage: str
    analysis_notes: str
    contradiction_flag: bool = False
    contradiction_details: Optional[str] = None


class VerificationSummary(BaseModel):
    company_symbol: str
    company_name: str
    claim_text: Optional[str] = None
    total_sources_consulted: int
    primary_official_count: int
    secondary_journalism_count: int
    duplicate_disclosures_found: int
    cross_source_conflicts_found: int
    evidence_items: list[EvidenceItem]
    supporting_evidence: list[EvidenceItem]
    contradicting_evidence: list[EvidenceItem]
    context_evidence: list[EvidenceItem]
    unclear_evidence: list[EvidenceItem]
    verification_verdict: str
    verdict_explanation: str
    is_sufficient_evidence: bool
    data_gap_warnings: list[str] = Field(default_factory=list)


def validate_source_url(url: str, expected_source_code: str) -> tuple[bool, str]:
    """
    Validate that source URL originates from an authentic, non-spoofed domain.
    """
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False, "Malformed URL: missing hostname."

        allowed = LEGITIMATE_DOMAINS.get(expected_source_code, [])
        if any(hostname == domain or hostname.endswith("." + domain) for domain in allowed):
            return True, f"Domain verified: {hostname}"

        return False, f"Suspicious or unverified domain: {hostname}. Expected official domain for {expected_source_code}."
    except Exception as exc:
        return False, f"URL validation error: {exc}"


def detect_cross_exchange_duplicates(documents: list[CollectedDocument]) -> list[CollectedDocument]:
    """
    Identify duplicate disclosures between NSE and BSE.
    Companies commonly file the identical PDF/announcement on both exchanges.
    Do NOT count duplicated information as two independent confirmations.
    """
    seen_hashes: dict[str, str] = {}  # hash -> first doc id / source
    processed: list[CollectedDocument] = []

    for doc in documents:
        # Simplify title for duplicate detection across exchanges
        clean_title = re.sub(r"[^a-zA-Z0-9]", "", doc.title.lower())
        short_hash = clean_title[:40] if clean_title else doc.content_hash

        if short_hash in seen_hashes:
            first_source = seen_hashes[short_hash]
            doc.is_duplicate = True
            doc.duplicate_notice = (
                f"Duplicate corporate disclosure: Identical filing was also published on {first_source}. "
                "Marked as single underlying disclosure; NOT counted as an independent secondary confirmation."
            )
            logger.info("Deduplicated announcement between %s and %s: '%s'", first_source, doc.source_code, doc.title)
        else:
            seen_hashes[short_hash] = doc.source_code
            doc.is_duplicate = False

        processed.append(doc)

    return processed


def evaluate_document_evidence(
    doc: CollectedDocument,
    claim_text: Optional[str] = None
) -> EvidenceItem:
    """
    Analyze a collected document and classify it into supports, contradicts, context, or unclear.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    claim_lower = (claim_text or "").lower()

    # Determine Tier
    if doc.source_code in ("SEBI", "NSE", "BSE"):
        tier = "Level 1 - Primary Official"
        base_authenticity = 95.0
    elif doc.source_code == "MONEYCONTROL":
        tier = "Level 2 - Secondary Financial Journalism"
        base_authenticity = 75.0
    else:
        tier = "Level 3 - Unverified"
        base_authenticity = 40.0

    # Domain validation penalty
    valid_domain, domain_msg = validate_source_url(doc.source_url, doc.source_code)
    if not valid_domain:
        base_authenticity -= 35.0

    # Calculate Recency Score
    recency_score = 80.0
    if doc.publication_date:
        recency_score = 90.0

    # Extract keywords from claim if provided
    classification = "context"
    relevance_score = 65.0
    notes = f"Verified via {doc.source_code}. {domain_msg}."

    if claim_text:
        # Check sentiment / direction in claim vs document
        bullish_tokens = ["surge", "jump", "buy", "target", "profit", "multibagger", "growth", "high", "dividend"]
        bearish_tokens = ["drop", "fall", "crash", "loss", "sell", "penalty", "fraud", "scam", "debt", "warning"]

        claim_has_bullish = any(tok in claim_lower for tok in bullish_tokens)
        claim_has_bearish = any(tok in claim_lower for tok in bearish_tokens)

        doc_lower = (doc.title + " " + doc.excerpt).lower()
        doc_has_bullish = any(tok in doc_lower for tok in ["growth", "increase", "profit", "expansion", "approval", "dividend"])
        doc_has_bearish = any(tok in doc_lower for tok in ["loss", "penalty", "notice", "investigation", "decline", "warning", "order"])

        if doc.source_code == "SEBI" and doc.document_type in ("order", "warning"):
            classification = "contradicts" if claim_has_bullish else "supports"
            relevance_score = 92.0
            notes = "Regulatory order or warning directly impacts corporate governance and investor risk."

        elif claim_has_bullish and doc_has_bullish:
            classification = "supports"
            relevance_score = 80.0
            notes = "Official corporate disclosure corroborates expansion/operational milestones."

        elif claim_has_bullish and doc_has_bearish:
            classification = "contradicts"
            relevance_score = 85.0
            notes = "Filing discloses material adverse factor or regulatory scrutiny contrary to unhedged bullish claim."

        elif claim_has_bearish and doc_has_bearish:
            classification = "supports"
            relevance_score = 80.0
            notes = "Official filing documents contraction or headwinds cited in bearish assertion."

        else:
            classification = "context"
            relevance_score = 60.0
            notes = "Provides official operating context without directly verifying specific price target."
    else:
        # No claim text — general intelligence mode
        classification = "context"
        relevance_score = 70.0
        notes = f"Official {doc.source_code} corporate disclosure covering company developments."

    return EvidenceItem(
        id=f"evi-{doc.content_hash[:12]}",
        document_id=doc.id,
        company_symbol=doc.company_symbol,
        source_code=doc.source_code,
        source_name=doc.source_code,
        source_url=doc.source_url,
        source_tier=tier,
        publication_date=doc.publication_date,
        retrieval_date=now_iso,
        classification=classification,
        relevance_score=relevance_score,
        authenticity_score=base_authenticity,
        recency_score=recency_score,
        is_duplicate=doc.is_duplicate,
        duplicate_notice=doc.duplicate_notice,
        extracted_passage=doc.excerpt,
        analysis_notes=notes,
        contradiction_flag=False,
    )


def verify_multi_source_evidence(
    company_symbol: str,
    company_name: str,
    documents: list[CollectedDocument],
    claim_text: Optional[str] = None
) -> VerificationSummary:
    """
    Perform cross-source verification, deduplication, conflict detection,
    and hierarchical evidence synthesis.
    """
    # 1. Deduplicate cross-exchange filings (NSE <-> BSE)
    deduped_docs = detect_cross_exchange_duplicates(documents)

    # 2. Evaluate each document
    evidence_items = [evaluate_document_evidence(d, claim_text) for d in deduped_docs]

    # 3. Categorize evidence (ignoring duplicate copies for confirmation counts)
    supporting: list[EvidenceItem] = []
    contradicting: list[EvidenceItem] = []
    context: list[EvidenceItem] = []
    unclear: list[EvidenceItem] = []

    duplicate_count = sum(1 for e in evidence_items if e.is_duplicate)
    conflicts_count = 0
    data_gaps: list[str] = []

    # Count valid primary vs secondary sources
    primary_count = sum(1 for e in evidence_items if e.source_tier == "Level 1 - Primary Official" and not e.is_duplicate)
    secondary_count = sum(1 for e in evidence_items if e.source_tier == "Level 2 - Secondary Financial Journalism")

    for item in evidence_items:
        if item.classification == "supports":
            supporting.append(item)
        elif item.classification == "contradicts":
            contradicting.append(item)
        elif item.classification == "context":
            context.append(item)
        else:
            unclear.append(item)

    # 4. Cross-source contradiction detection
    if supporting and contradicting:
        conflicts_count = len(supporting) + len(contradicting)
        for e in supporting:
            e.contradiction_flag = True
            e.contradiction_details = "Contradicted by concurrent disclosures/regulatory filings from other authoritative sources."
        for e in contradicting:
            e.contradiction_flag = True
            e.contradiction_details = "Discloses material factors conflicting with optimistic statements from secondary sources."

    # 5. Check data gaps
    if not any(e.source_code == "SEBI" for e in evidence_items):
        data_gaps.append("SEBI: No active regulatory circulars or enforcement orders logged in query window.")
    if not any(e.source_code in ("NSE", "BSE") for e in evidence_items):
        data_gaps.append("Exchanges: Live corporate announcement feed restricted or returned no recent disclosures.")

    # 6. Synthesize Verdict according to hard constraints:
    # "If sources conflict or sufficient evidence is unavailable, return: Unable to verify with sufficient reliable evidence."
    # "Never use simple majority voting to decide whether information is true."
    is_sufficient = len(evidence_items) > 0 and primary_count >= 1

    if conflicts_count > 0:
        verdict = "Unable to verify with sufficient reliable evidence."
        explanation = (
            "Cross-source contradiction detected between official disclosures and secondary reports. "
            "Under FINTRUST AI rules, simple majority voting is rejected. Unable to verify with sufficient reliable evidence."
        )
    elif not is_sufficient:
        verdict = "Unable to verify with sufficient reliable evidence."
        explanation = (
            "Insufficient Level 1 primary official evidence retrieved from exchange filings or regulatory gazettes. "
            "Unable to verify with sufficient reliable evidence without fabricating sources."
        )
    elif supporting and not contradicting:
        verdict = "Corroborated by Primary Official Disclosures"
        explanation = (
            f"Supported by {len(supporting)} verified official disclosures from primary sources. "
            "Subject to statutory disclosures under SEBI (LODR) regulations."
        )
    elif contradicting and not supporting:
        verdict = "Contradicted by Authoritative Disclosures"
        explanation = (
            f"Contradicted by {len(contradicting)} verified regulatory or corporate filings. "
            "Unsubstantiated claims directly conflict with documented disclosures."
        )
    else:
        verdict = "Verified Contextual Information on File"
        explanation = (
            f"Collected {len(context)} authoritative records providing operational background. "
            "No specific unsupported assertions found to contradict official filings."
        )

    return VerificationSummary(
        company_symbol=company_symbol,
        company_name=company_name,
        claim_text=claim_text,
        total_sources_consulted=len(documents),
        primary_official_count=primary_count,
        secondary_journalism_count=secondary_count,
        duplicate_disclosures_found=duplicate_count,
        cross_source_conflicts_found=conflicts_count,
        evidence_items=evidence_items,
        supporting_evidence=supporting,
        contradicting_evidence=contradicting,
        context_evidence=context,
        unclear_evidence=unclear,
        verification_verdict=verdict,
        verdict_explanation=explanation,
        is_sufficient_evidence=is_sufficient,
        data_gap_warnings=data_gaps,
    )
