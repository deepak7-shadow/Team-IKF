"""
FINTRUST AI — AI Claim Analysis Engine
Uses Google Gemini to perform structured financial claim analysis.

SAFETY CONSTRAINTS (hard-coded, never bypassed):
  - Never labels a person as fraudulent based solely on AI output.
  - Never fabricates sources — only surfaces claims present in input.
  - Never gives buy / sell / hold investment recommendations.
  - Marks all AI output as AI interpretation, not verified fact.
"""

import json
import logging
import re
import time
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# GEMINI SYSTEM INSTRUCTION
# ---------------------------------------------------------------------------
_SYSTEM_INSTRUCTION = """
You are FINTRUST AI — a financial claim forensic analysis engine.

Your role:
  • Extract structured information from submitted financial claims or social media posts.
  • Identify risk indicators and compliance concerns.
  • Identify what evidence is cited (if any) and what is missing.
  • Provide a balanced, factual, non-judgmental analysis.

HARD CONSTRAINTS — you MUST follow these without exception:
  1. NEVER label any person as fraudulent, criminal, or dishonest based solely on the claim text.
  2. NEVER fabricate sources, URLs, or research papers. Only reference sources explicitly mentioned in the submitted claim.
  3. NEVER make buy, sell, or hold investment recommendations.
  4. Always mark your output as AI interpretation, not verified financial fact.
  5. When you cannot determine something, output null or an empty list — do not guess.
  6. SEBI (India) and SEC (USA) are cited only as regulatory frameworks, not as endorsements.

Output format: Return ONLY valid JSON matching the schema below. No markdown fences, no explanations outside the JSON.
""".strip()

_ANALYSIS_SCHEMA = """
{
  "security": "string or null — company name, ticker, index, or crypto mentioned",
  "ticker_symbol": "string or null — extracted ticker e.g. RELIANCE, BTC/USD, NIFTY50",
  "direction": "bullish | bearish | neutral | null",
  "target_price_raw": "string or null — verbatim price target from text",
  "target_price_numeric": "number or null — numeric value of target price",
  "timeframe_raw": "string or null — verbatim timeframe mentioned",
  "timeframe_normalized": "string or null — normalized: 'Q3 2025', 'December 2024', '6 months', etc.",
  "reference_price_raw": "string or null — any current/entry price mentioned",
  "supporting_statements": ["list of verbatim supporting statements from the claim"],
  "financial_figures": ["list of key numeric figures with context"],
  "ambiguous_information": ["list of vague or unclear statements"],
  "risk_indicators": [
    {
      "type": "guaranteed_return | urgent_pressure | unsupported_target | missing_evidence | promotional_language | unrealistic_claim | ambiguous_statement | regulatory_concern",
      "description": "clear description of the specific risk indicator found",
      "severity": "low | medium | high | critical",
      "verbatim_excerpt": "exact quote from input that triggered this"
    }
  ],
  "mentioned_sources": [
    {
      "title": "source title or description as mentioned in claim",
      "url": "URL only if explicitly in the claim text, else null",
      "context": "how the source is referenced"
    }
  ],
  "missing_evidence": ["list of evidence types that would be expected but are absent"],
  "ai_summary": "2-3 sentence neutral factual summary of what the claim asserts",
  "compliance_note": "1-2 sentence note about relevant regulatory disclosure requirements, if applicable",
  "risk_level": "low | medium | high | critical",
  "risk_score": "number 0.0 to 10.0",
  "confidence": "number 0 to 100 representing AI confidence in this analysis",
  "uncertainty_notes": "string — what the AI was uncertain about"
}
""".strip()

_FULL_PROMPT_TEMPLATE = """
Analyze the following financial claim or social media post according to your instructions.

SUBMITTED CLAIM:
---
{claim_text}
---

ADDITIONAL CONTEXT (if available):
- Source URL: {source_url}
- Platform: {platform}
- OCR text from uploaded screenshot (may be noisy): {ocr_text}

Respond with ONLY the JSON object matching this exact schema:
{schema}
"""


# ---------------------------------------------------------------------------
# RULE-BASED FALLBACK ANALYZER (runs when Gemini is unavailable)
# ---------------------------------------------------------------------------
def _rule_based_analysis(claim_text: str, source_url: str = "", platform: str = "") -> dict[str, Any]:
    """
    Pure-Python rule-based fallback. Performs basic extraction and
    risk indicator detection without AI. Used when Gemini is not configured
    or when the API call fails.
    """
    lower = claim_text.lower()
    risk_indicators = []
    risk_level = "low"
    risk_score = 1.5

    # --- Guaranteed return detection ---
    guarantee_patterns = [
        "guarantee", "guaranteed", "risk-free", "zero risk", "no risk",
        "100% safe", "assured return", "assured profit"
    ]
    if any(p in lower for p in guarantee_patterns):
        risk_indicators.append({
            "type": "guaranteed_return",
            "description": "The claim uses language suggesting guaranteed or risk-free returns. Under SEBI Act Section 12A and SEBI (Investment Advisers) Regulations, guaranteed return claims by unregistered entities are prohibited.",
            "severity": "critical",
            "verbatim_excerpt": next((p for p in guarantee_patterns if p in lower), ""),
        })
        risk_level = "critical"
        risk_score = 9.2

    # --- Urgent pressure ---
    urgency_patterns = ["act now", "limited time", "last chance", "don't miss", "urgent", "today only", "hurry"]
    if any(p in lower for p in urgency_patterns):
        risk_indicators.append({
            "type": "urgent_pressure",
            "description": "The claim uses urgency language designed to pressure immediate investment decisions.",
            "severity": "high",
            "verbatim_excerpt": next((p for p in urgency_patterns if p in lower), ""),
        })
        if risk_score < 7.5:
            risk_level = "high"
            risk_score = 7.5

    # --- Sensationalized multipliers ---
    multiplier_patterns = ["10x", "20x", "100x", "multibagger", "sure shot", "moon", "2x", "3x"]
    if any(p in lower for p in multiplier_patterns):
        risk_indicators.append({
            "type": "unrealistic_claim",
            "description": "The claim contains sensationalized return multipliers (e.g., 10x, multibagger) without supporting financial analysis.",
            "severity": "high",
            "verbatim_excerpt": next((p for p in multiplier_patterns if p in lower), ""),
        })
        if risk_score < 7.0:
            risk_level = "high"
            risk_score = 7.0

    # --- Promotional language ---
    promo_patterns = ["buy now", "subscribe", "join my channel", "my picks", "exclusive", "insider", "tip"]
    if any(p in lower for p in promo_patterns):
        risk_indicators.append({
            "type": "promotional_language",
            "description": "The claim contains promotional language typical of paid advisory or subscription services.",
            "severity": "medium",
            "verbatim_excerpt": next((p for p in promo_patterns if p in lower), ""),
        })
        if risk_score < 5.0:
            risk_level = "medium"
            risk_score = 5.0

    # --- Unregistered advice indicator ---
    if any(p in lower for p in ["target", "price target", "will reach", "will hit", "will breach"]):
        risk_indicators.append({
            "type": "unsupported_target",
            "description": "A specific price target is projected. This requires verification against the creator's SEBI Research Analyst (RA) registration and published research methodology.",
            "severity": "medium",
            "verbatim_excerpt": "",
        })
        if risk_score < 4.5:
            risk_level = "medium"
            risk_score = 4.5

    # Always flag missing evidence
    risk_indicators.append({
        "type": "missing_evidence",
        "description": "No verifiable supporting research, audited track record, or regulatory registration has been confirmed in this submission.",
        "severity": "medium",
        "verbatim_excerpt": "",
    })

    # --- Extract security ---
    security = None
    ticker = None
    if "nifty" in lower:
        security = "NIFTY 50"
        ticker = "NIFTY50"
    elif "btc" in lower or "bitcoin" in lower:
        security = "Bitcoin"
        ticker = "BTC/USD"
    elif "eth" in lower or "ethereum" in lower:
        security = "Ethereum"
        ticker = "ETH/USD"
    elif "gold" in lower:
        security = "Gold"
        ticker = "MCX:GOLD"
    else:
        m = re.search(r"\b([A-Z]{2,10}(?:\.[A-Z]{2})?)\b", claim_text)
        if m and m.group(1) not in {"THE", "FOR", "AND", "WITH", "THIS", "WILL", "FROM", "THAT"}:
            ticker = m.group(1)
            security = ticker

    # --- Extract price ---
    target_price_raw = None
    target_price_numeric = None
    price_match = re.search(r"(?:₹|\$|Rs\.?\s*|INR\s*|USD\s*)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:lakh|k|cr)?", claim_text)
    if price_match:
        target_price_raw = price_match.group(0).strip()
        try:
            target_price_numeric = float(price_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # --- Extract timeframe ---
    timeframe_raw = None
    tf_match = re.search(
        r"(?:by\s+)?(?:Q[1-4]\s*\d{4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d+\s+(?:days?|weeks?|months?|years?))",
        claim_text,
        re.IGNORECASE,
    )
    if tf_match:
        timeframe_raw = tf_match.group(0).strip()

    # Determine direction
    direction = None
    if any(w in lower for w in ["bullish", "rise", "surge", "upside", "buy", "breakout", "rally"]):
        direction = "bullish"
    elif any(w in lower for w in ["bearish", "fall", "drop", "downside", "sell", "crash"]):
        direction = "bearish"

    return {
        "security": security,
        "ticker_symbol": ticker,
        "direction": direction,
        "target_price_raw": target_price_raw,
        "target_price_numeric": target_price_numeric,
        "timeframe_raw": timeframe_raw,
        "timeframe_normalized": timeframe_raw,
        "reference_price_raw": None,
        "supporting_statements": [],
        "financial_figures": [],
        "ambiguous_information": [],
        "risk_indicators": risk_indicators,
        "mentioned_sources": [],
        "missing_evidence": [
            "SEBI Research Analyst registration proof",
            "Audited historical prediction accuracy",
            "Independent market research citation",
            "Mandatory risk disclosure statement",
        ],
        "ai_summary": f"The submitted claim makes a financial assertion about {security or 'an unidentified security or market'}. Rule-based analysis detected {len(risk_indicators)} risk indicator(s). AI-powered analysis is unavailable — this is a fallback assessment.",
        "compliance_note": "Any financial prediction or advisory content published on social media may be subject to SEBI (Investment Advisers) Regulations, 2013 or SEBI (Research Analysts) Regulations, 2014 disclosure requirements.",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "confidence": 40,
        "uncertainty_notes": "This analysis was performed using rule-based logic without AI. Results should be treated as preliminary indicators only.",
    }


# ---------------------------------------------------------------------------
# GEMINI ANALYZER
# ---------------------------------------------------------------------------
def analyze_claim_with_gemini(
    claim_text: str,
    source_url: str = "",
    platform: str = "",
    ocr_text: str = "",
    api_key: str = "",
) -> dict[str, Any]:
    """
    Call Google Gemini to analyze a financial claim.
    Returns structured analysis dict.
    Falls back to rule-based analysis on any failure.
    """
    if not api_key:
        logger.info("Gemini API key not configured — using rule-based fallback")
        return _rule_based_analysis(claim_text, source_url, platform)

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)

        model = genai.GenerativeModel(
            model_name="gemini-3.8-flash",
            system_instruction=_SYSTEM_INSTRUCTION,
        )

        prompt = _FULL_PROMPT_TEMPLATE.format(
            claim_text=claim_text[:8000],  # Cap to avoid token overflow
            source_url=source_url or "Not provided",
            platform=platform or "Not specified",
            ocr_text=(ocr_text[:2000] if ocr_text else "None"),
            schema=_ANALYSIS_SCHEMA,
        )

        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json",
            },
            request_options={"timeout": 8.0},
        )

        raw = response.text.strip()
        # Strip markdown fences if model added them despite instruction
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        logger.info(
            "Gemini analysis complete: risk_level=%s score=%.1f confidence=%s",
            result.get("risk_level"),
            result.get("risk_score", 0),
            result.get("confidence"),
        )
        return result

    except json.JSONDecodeError as exc:
        logger.error("Gemini returned invalid JSON: %s", exc)
        result = _rule_based_analysis(claim_text, source_url, platform)
        result["uncertainty_notes"] = f"Gemini returned malformed JSON. Rule-based fallback used. ({exc})"
        return result

    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        result = _rule_based_analysis(claim_text, source_url, platform)
        result["uncertainty_notes"] = f"AI analysis failed: {exc}. Rule-based fallback used."
        return result


# ---------------------------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------------------------
def analyze_claim(
    claim_text: str,
    source_url: str = "",
    platform: str = "",
    ocr_text: str = "",
    gemini_api_key: str = "",
) -> dict[str, Any]:
    """
    Public entry point for claim analysis.
    Attempts Gemini, falls back to rule-based.
    """
    start = time.monotonic()
    result = analyze_claim_with_gemini(
        claim_text=claim_text,
        source_url=source_url,
        platform=platform,
        ocr_text=ocr_text,
        api_key=gemini_api_key,
    )
    elapsed = time.monotonic() - start
    result["_analysis_duration_ms"] = round(elapsed * 1000)
    return result
