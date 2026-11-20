"""
FINTRUST AI — Deterministic Prediction Tracking & Evaluation Engine

Core Principles:
  • Evaluation Methodology: v1.0.0-deterministic
  • Strict Reproducibility: Given the same target, reference, deadline, and price history,
    the evaluation result is mathematically identical.
  • No Price Fabrication: Inconclusive status is assigned whenever verified market data is missing.
  • Evaluation Statuses:
      - pending
      - met
      - not_met
      - partially_met
      - inconclusive
  • Corporate action variance detection.
  • Preserves audit history and historical price snapshots.
"""

import logging
from datetime import date, datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

EVALUATION_METHODOLOGY_VERSION = "v1.0.0-deterministic"
MIN_SAMPLE_SIZE_FOR_STATS = 3


class EvaluationResult(BaseModel):
    status: str  # met | not_met | partially_met | inconclusive | pending
    evaluation_criteria: str
    evaluation_notes: str
    methodology_version: str = EVALUATION_METHODOLOGY_VERSION
    evaluated_at: str
    price_at_evaluation: Optional[float] = None
    target_price: float
    reference_price: Optional[float] = None
    price_change_pct: Optional[float] = None
    corporate_actions_note: Optional[str] = None


class PredictionCreate(BaseModel):
    asset: str = Field(..., min_length=1, max_length=100)
    ticker_symbol: Optional[str] = None
    direction: str = Field(..., pattern="^(bullish|bearish)$")
    target_price: float = Field(..., gt=0)
    reference_price: Optional[float] = None
    reference_date: Optional[str] = None
    evaluation_date: str = Field(..., min_length=10, max_length=10)  # YYYY-MM-DD
    influencer_name: Optional[str] = "Documented Claim Source"
    influencer_id: Optional[str] = None
    claim_id: Optional[str] = None
    claim_text: Optional[str] = None
    source_url: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class PredictionRecord(BaseModel):
    id: str
    user_id: Optional[str] = None
    asset: str
    ticker_symbol: Optional[str] = None
    direction: str
    target_price: float
    reference_price: Optional[float] = None
    reference_date: Optional[str] = None
    current_price: Optional[float] = None
    market_data_provider: Optional[str] = None
    market_data_status: str = "unavailable"
    market_data_updated_at: Optional[str] = None
    prediction_date: str
    evaluation_date: str
    status: str
    confidence: Optional[float] = None
    notes: Optional[str] = None
    influencer_name: str
    influencer_id: Optional[str] = None
    claim_id: Optional[str] = None
    claim_text: Optional[str] = None
    source_url: Optional[str] = None
    evaluation_criteria: Optional[str] = None
    evaluation_methodology_version: str = EVALUATION_METHODOLOGY_VERSION
    evaluation_notes: Optional[str] = None
    evaluated_at: Optional[str] = None
    price_snapshots: list[dict] = []
    corporate_actions_note: Optional[str] = None
    created_at: str


class PredictionAnalytics(BaseModel):
    total_predictions: int
    pending_predictions: int
    evaluated_predictions: int
    met_predictions: int
    not_met_predictions: int
    partially_met_predictions: int
    inconclusive_predictions: int
    hit_rate_pct: Optional[float] = None
    miss_rate_pct: Optional[float] = None
    has_sufficient_sample_size: bool
    sample_size: int
    minimum_required_sample_size: int = MIN_SAMPLE_SIZE_FOR_STATS
    methodology_version: str = EVALUATION_METHODOLOGY_VERSION
    methodology_explanation: str


def evaluate_prediction(
    direction: str,
    target_price: float,
    reference_price: Optional[float],
    current_price: Optional[float],
    evaluation_date_str: str,
    as_of_date: Optional[date] = None,
    highest_seen_price: Optional[float] = None,
    lowest_seen_price: Optional[float] = None,
) -> EvaluationResult:
    """
    Deterministic evaluation of a financial forecast.
    Enforces strict objectivity and reproducible criteria.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    today = as_of_date or date.today()

    # Step 1: Validate essential inputs
    if target_price <= 0:
        return EvaluationResult(
            status="inconclusive",
            evaluation_criteria="Target price must be a positive numerical value.",
            evaluation_notes="Cannot evaluate prediction: target price is missing or zero.",
            evaluated_at=now_iso,
            target_price=target_price,
            reference_price=reference_price,
        )

    try:
        deadline = datetime.strptime(evaluation_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return EvaluationResult(
            status="inconclusive",
            evaluation_criteria="Evaluation deadline must be a valid ISO YYYY-MM-DD date.",
            evaluation_notes="Cannot evaluate prediction: invalid deadline format.",
            evaluated_at=now_iso,
            target_price=target_price,
            reference_price=reference_price,
        )

    criteria = (
        f"Direction: {direction.upper()} | Target: {target_price} | "
        f"Deadline: {evaluation_date_str} | Reference: {reference_price or 'None'}"
    )

    # Step 2: Check price availability
    if current_price is None or current_price <= 0:
        is_past_deadline = today > deadline
        return EvaluationResult(
            status="inconclusive" if is_past_deadline else "pending",
            evaluation_criteria=criteria,
            evaluation_notes=(
                "Market data feed is unavailable. Under FINTRUST AI integrity standards, "
                "predictions are never evaluated with fabricated or simulated market prices."
            ),
            evaluated_at=now_iso,
            target_price=target_price,
            reference_price=reference_price,
        )

    # Calculate price change if reference price is known
    price_change_pct = None
    if reference_price and reference_price > 0:
        price_change_pct = round(((current_price - reference_price) / reference_price) * 100, 2)

    # Check for possible stock split or corporate action discrepancy
    corp_note = None
    if reference_price and reference_price > 0:
        ratio = current_price / reference_price
        if ratio < 0.35 or ratio > 3.0:
            corp_note = (
                f"Large variance detected ({price_change_pct}%). "
                "Please verify if a corporate action (stock split, bonus issue, or demerger) occurred."
            )

    is_past_deadline = today >= deadline
    effective_high = max(highest_seen_price or current_price, current_price)
    effective_low = min(lowest_seen_price or current_price, current_price)

    # Step 3: Evaluation logic by direction
    if direction.lower() == "bullish":
        # Check if target was hit (either at current price or highest observed price)
        if current_price >= target_price or effective_high >= target_price:
            return EvaluationResult(
                status="met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Target price of {target_price} was successfully met or exceeded "
                    f"(Current/Peak: {max(current_price, effective_high)})."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

        if not is_past_deadline:
            return EvaluationResult(
                status="pending",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Target not yet reached (Current: {current_price}, Target: {target_price}). "
                    f"Deadline ({evaluation_date_str}) is in the future."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

        # Deadline has passed without reaching target
        if reference_price and reference_price > 0 and current_price > reference_price:
            # Gained value in predicted direction, but missed full target
            return EvaluationResult(
                status="partially_met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Asset gained {price_change_pct}% (from {reference_price} to {current_price}), "
                    f"moving in the predicted bullish direction, but did not reach the target of {target_price} by the deadline."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )
        else:
            return EvaluationResult(
                status="not_met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Bullish target of {target_price} was not met by deadline ({evaluation_date_str}). "
                    f"Current price closed at {current_price}."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

    elif direction.lower() == "bearish":
        # Bearish: target price is expected to fall to or below target_price
        if current_price <= target_price or effective_low <= target_price:
            return EvaluationResult(
                status="met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Bearish downside target of {target_price} was met "
                    f"(Current/Trough: {min(current_price, effective_low)})."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

        if not is_past_deadline:
            return EvaluationResult(
                status="pending",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Downside target not yet reached (Current: {current_price}, Target: {target_price}). "
                    f"Deadline ({evaluation_date_str}) is in the future."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

        # Deadline passed
        if reference_price and reference_price > 0 and current_price < reference_price:
            return EvaluationResult(
                status="partially_met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Asset fell {abs(price_change_pct)}% (from {reference_price} to {current_price}), "
                    f"moving in the predicted bearish direction, but did not reach the downside target of {target_price}."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )
        else:
            return EvaluationResult(
                status="not_met",
                evaluation_criteria=criteria,
                evaluation_notes=(
                    f"Bearish target of {target_price} was not met by deadline ({evaluation_date_str}). "
                    f"Current price closed at {current_price}."
                ),
                evaluated_at=now_iso,
                price_at_evaluation=current_price,
                target_price=target_price,
                reference_price=reference_price,
                price_change_pct=price_change_pct,
                corporate_actions_note=corp_note,
            )

    return EvaluationResult(
        status="inconclusive",
        evaluation_criteria=criteria,
        evaluation_notes=f"Unknown prediction direction: '{direction}'. Must be 'bullish' or 'bearish'.",
        evaluated_at=now_iso,
        target_price=target_price,
        reference_price=reference_price,
    )


def compute_prediction_analytics(predictions: list[dict]) -> PredictionAnalytics:
    """Compute statistically rigorous prediction analytics with sample size checks."""
    total = len(predictions)
    met = 0
    not_met = 0
    partially_met = 0
    inconclusive = 0
    pending = 0

    for p in predictions:
        st = (p.get("status") or "pending").lower()
        if st in ("met", "correct"):
            met += 1
        elif st in ("not_met", "incorrect"):
            not_met += 1
        elif st in ("partially_met", "partial"):
            partially_met += 1
        elif st == "inconclusive":
            inconclusive += 1
        else:
            pending += 1

    evaluated = met + not_met + partially_met
    has_sufficient = evaluated >= MIN_SAMPLE_SIZE_FOR_STATS

    hit_rate = None
    miss_rate = None
    if has_sufficient and evaluated > 0:
        hit_rate = round((met / evaluated) * 100, 1)
        miss_rate = round((not_met / evaluated) * 100, 1)

    explanation = (
        f"Evaluation Methodology {EVALUATION_METHODOLOGY_VERSION}: "
        f"Hit rate is calculated as [Met / (Met + Not Met + Partially Met)] * 100. "
        f"A minimum sample size of {MIN_SAMPLE_SIZE_FOR_STATS} evaluated predictions is required before displaying a calculated percentage. "
        "Pending and Inconclusive predictions are excluded from the hit rate denominator to prevent statistical distortion."
    )

    return PredictionAnalytics(
        total_predictions=total,
        pending_predictions=pending,
        evaluated_predictions=evaluated,
        met_predictions=met,
        not_met_predictions=not_met,
        partially_met_predictions=partially_met,
        inconclusive_predictions=inconclusive,
        hit_rate_pct=hit_rate,
        miss_rate_pct=miss_rate,
        has_sufficient_sample_size=has_sufficient,
        sample_size=evaluated,
        minimum_required_sample_size=MIN_SAMPLE_SIZE_FOR_STATS,
        methodology_version=EVALUATION_METHODOLOGY_VERSION,
        methodology_explanation=explanation,
    )
