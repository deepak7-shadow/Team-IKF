/**
 * FINTRUST AI — Backend API Client
 * Communicates with the FastAPI backend at http://127.0.0.1:8000
 *
 * All endpoints require a valid Supabase JWT Bearer token when
 * the backend is configured with Supabase credentials.
 */

import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedEntities {
  security: string | null;
  ticker_symbol: string | null;
  direction: "bullish" | "bearish" | "neutral" | null;
  target_price_raw: string | null;
  target_price_numeric: number | null;
  timeframe_raw: string | null;
  timeframe_normalized: string | null;
  reference_price_raw: string | null;
  supporting_statements: string[];
  financial_figures: string[];
  ambiguous_information: string[];
}

export interface RiskIndicator {
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  verbatim_excerpt: string;
}

export interface MentionedSource {
  title: string;
  url: string | null;
  context: string;
}

export interface ClaimReport {
  id: string;
  user_id: string | null;
  claim_text: string;
  source_url: string | null;
  platform: string | null;
  ocr_extracted_text: string | null;
  submitted_at: string;
  status: "analyzing" | "complete" | "failed";
  risk_level: "low" | "medium" | "high" | "critical";
  risk_score: number | null;
  ai_summary: string | null;
  compliance_note: string | null;
  uncertainty_notes: string | null;
  ai_confidence: number | null;
  extracted_entities: ExtractedEntities | null;
  risk_indicators: RiskIndicator[];
  mentioned_sources: MentionedSource[];
  missing_evidence: string[];
  analysis_duration_ms: number | null;
  analyzed_at: string | null;
  ai_engine: string;
  multi_source_intelligence?: MultiSourceIntelligenceResult | null;
  evidence_summary?: VerificationSummary | null;
  market_outlook?: MarketOutlookResult | null;
}

export interface ClaimListItem {
  id: string;
  claim_text: string;
  source_url: string | null;
  platform: string | null;
  submitted_at: string;
  status: string;
  risk_level: string;
  risk_score: number | null;
  ai_summary: string | null;
}

export interface ApiError {
  detail: string;
}

// ---------------------------------------------------------------------------
// Auth Header Helper
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Session not available — backend will handle unauthenticated mode
  }
  return headers;
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...headers },
  });

  if (!resp.ok) {
    const err: ApiError = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || `Request failed: ${resp.status}`);
  }

  return resp.json();
}

async function apiPost<T>(path: string, body: FormData | object): Promise<T> {
  const headers = await getAuthHeaders();

  const isFormData = body instanceof FormData;
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: isFormData
      ? headers // Don't set Content-Type for FormData — browser sets it with boundary
      : { "Content-Type": "application/json", ...headers },
    body: isFormData ? body : JSON.stringify(body),
  });

  if (!resp.ok) {
    const err: ApiError = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || `Request failed: ${resp.status}`);
  }

  return resp.json();
}

// ---------------------------------------------------------------------------
// Claim Analyzer API
// ---------------------------------------------------------------------------

export interface SubmitClaimParams {
  claimText: string;
  sourceUrl?: string;
  platform?: string;
  targetDate?: string;
  screenshot?: File | null;
}

/**
 * Submit a claim for AI analysis.
 * Sends as multipart/form-data to support optional file upload.
 */
export async function submitClaim(params: SubmitClaimParams): Promise<ClaimReport> {
  const form = new FormData();
  form.append("claim_text", params.claimText || "");
  form.append("source_url", params.sourceUrl || "");
  form.append("platform", params.platform || "Other");
  form.append("target_date", params.targetDate || "");
  if (params.screenshot) {
    form.append("screenshot", params.screenshot, params.screenshot.name);
  }
  return apiPost<ClaimReport>("/api/v1/claims", form);
}

/** List all claims for the current user. */
export async function fetchClaimHistory(): Promise<ClaimListItem[]> {
  return apiGet<ClaimListItem[]>("/api/v1/claims");
}

/** Get a full claim report by ID. */
export async function fetchClaimById(id: string): Promise<ClaimReport> {
  return apiGet<ClaimReport>(`/api/v1/claims/${id}`);
}

/** Re-trigger AI analysis on an existing claim. */
export async function reAnalyzeClaim(id: string): Promise<ClaimReport> {
  return apiPost<ClaimReport>(`/api/v1/claims/${id}/analyze`, {});
}

/** Get the full report for a claim (alias for fetchClaimById). */
export async function fetchClaimReport(id: string): Promise<ClaimReport> {
  return apiGet<ClaimReport>(`/api/v1/claims/${id}/report`);
}

/** Health check — returns true if the backend is reachable. */
export async function checkBackendHealth(): Promise<{ ok: boolean; gemini: boolean; supabase: boolean }> {
  try {
    const data = await apiGet<{
      status: string;
      gemini_configured: boolean;
      supabase_configured: boolean;
    }>("/api/v1/health");
    return {
      ok: data.status === "ok",
      gemini: data.gemini_configured,
      supabase: data.supabase_configured,
    };
  } catch {
    return { ok: false, gemini: false, supabase: false };
  }
}

// ---------------------------------------------------------------------------
// Finfluencer Explorer API
// ---------------------------------------------------------------------------

export interface InfluencerApiItem {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  platform: string;
  profile_url: string | null;
  followers: number;
  verification_status: string;
  identity_status: string;
  sebi_status: string;
  sebi_reg_number: string | null;
  sebi_reg_type: string | null;
  verification_source: string | null;
  verification_notes: string | null;
  last_verified_at: string | null;
  accuracy_score: number | null;
  total_predictions: number;
  correct_predictions: number;
  risk_rating: string;
  tags: string[];
  bio: string;
  created_at: string;
}

export interface InfluencerListResponse {
  items: InfluencerApiItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SebiVerificationAuditResponse {
  sebi_status: string;
  identity_status: string;
  sebi_reg_number: string | null;
  sebi_reg_type: string | null;
  verification_source: string;
  verification_notes: string;
  last_verified_at: string;
  compliance_warning: string;
  name_match_disclaimer: string;
}

export interface InfluencerClaimsResponse {
  influencer_id: string;
  influencer_name: string;
  claims: Array<{
    id: string;
    claim_text: string;
    submitted_at: string;
    risk_level: string;
    risk_score: number | null;
    summary: string | null;
    source_url: string | null;
    platform: string | null;
  }>;
}

export interface InfluencerPredictionsResponse {
  influencer_id: string;
  influencer_name: string;
  predictions: any[];
  performance: {
    total_tracked: number;
    evaluated_calls: number;
    verified_correct: number;
    incorrect_missed: number;
    pending_resolution: number;
    accuracy_rate: number | null;
    has_sufficient_data: boolean;
    data_sufficiency_note: string;
  };
}

export interface SearchInfluencersParams {
  q?: string;
  platform?: string;
  sebiStatus?: string;
  page?: number;
  limit?: number;
}

export async function fetchInfluencers(params: SearchInfluencersParams = {}): Promise<InfluencerListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.platform && params.platform !== "all") query.set("platform", params.platform);
  if (params.sebiStatus && params.sebiStatus !== "all") query.set("sebi_status", params.sebiStatus);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiGet<InfluencerListResponse>(`/api/v1/influencers${qs ? `?${qs}` : ""}`);
}

export async function fetchInfluencerById(id: string): Promise<InfluencerApiItem> {
  return apiGet<InfluencerApiItem>(`/api/v1/influencers/${id}`);
}

export interface CreateInfluencerParams {
  name: string;
  handle: string;
  platform?: string;
  profile_url?: string;
  followers?: number;
  bio?: string;
  tags?: string[];
  sebi_reg_number?: string;
}

export async function createInfluencer(payload: CreateInfluencerParams): Promise<InfluencerApiItem> {
  return apiPost<InfluencerApiItem>("/api/v1/influencers", payload);
}

export async function verifyInfluencerSebi(id: string, claimedRegNo?: string): Promise<SebiVerificationAuditResponse> {
  return apiPost<SebiVerificationAuditResponse>(`/api/v1/influencers/${id}/verify-sebi`, {
    claimed_sebi_reg_number: claimedRegNo || null,
  });
}

export async function fetchInfluencerClaims(id: string): Promise<InfluencerClaimsResponse> {
  return apiGet<InfluencerClaimsResponse>(`/api/v1/influencers/${id}/claims`);
}

export async function fetchInfluencerPredictions(id: string): Promise<InfluencerPredictionsResponse> {
  return apiGet<InfluencerPredictionsResponse>(`/api/v1/influencers/${id}/predictions`);
}

// ---------------------------------------------------------------------------
// Prediction Tracking Engine API
// ---------------------------------------------------------------------------

export interface PredictionApiRecord {
  id: string;
  user_id: string | null;
  asset: string;
  ticker_symbol: string | null;
  direction: "bullish" | "bearish";
  target_price: number;
  reference_price: number | null;
  reference_date: string | null;
  current_price: number | null;
  market_data_provider: string | null;
  market_data_status: "live" | "delayed" | "unavailable";
  market_data_updated_at: string | null;
  prediction_date: string;
  evaluation_date: string;
  status: "met" | "not_met" | "partially_met" | "inconclusive" | "pending" | "correct" | "incorrect" | "partial";
  confidence: number | null;
  notes: string | null;
  influencer_name: string;
  influencer_id: string | null;
  claim_id: string | null;
  claim_text: string | null;
  source_url: string | null;
  evaluation_criteria: string | null;
  evaluation_methodology_version: string;
  evaluation_notes: string | null;
  evaluated_at: string | null;
  price_snapshots: Array<{
    timestamp: string;
    price: number;
    provider: string;
    status: string;
    notes?: string;
  }>;
  corporate_actions_note: string | null;
  created_at: string;
}

export interface PredictionListApiResponse {
  items: PredictionApiRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PredictionAnalyticsResponse {
  total_predictions: number;
  pending_predictions: number;
  evaluated_predictions: number;
  met_predictions: number;
  not_met_predictions: number;
  partially_met_predictions: number;
  inconclusive_predictions: number;
  hit_rate_pct: number | null;
  miss_rate_pct: number | null;
  has_sufficient_sample_size: boolean;
  sample_size: number;
  minimum_required_sample_size: number;
  methodology_version: string;
  methodology_explanation: string;
}

export interface CreatePredictionParams {
  asset: string;
  ticker_symbol?: string;
  direction: "bullish" | "bearish";
  target_price: number;
  reference_price?: number;
  reference_date?: string;
  evaluation_date: string;
  influencer_name?: string;
  influencer_id?: string;
  claim_id?: string;
  claim_text?: string;
  source_url?: string;
  confidence?: number;
  notes?: string;
}

export interface SearchPredictionsParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function fetchPredictionsApi(params: SearchPredictionsParams = {}): Promise<PredictionListApiResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiGet<PredictionListApiResponse>(`/api/v1/predictions${qs ? `?${qs}` : ""}`);
}

export async function fetchPredictionByIdApi(id: string): Promise<PredictionApiRecord> {
  return apiGet<PredictionApiRecord>(`/api/v1/predictions/${id}`);
}

export async function createPredictionApi(payload: CreatePredictionParams): Promise<PredictionApiRecord> {
  return apiPost<PredictionApiRecord>("/api/v1/predictions", payload);
}

export async function evaluatePredictionApi(id: string): Promise<PredictionApiRecord> {
  return apiPost<PredictionApiRecord>(`/api/v1/predictions/${id}/evaluate`, {});
}

export async function fetchPredictionAnalyticsApi(): Promise<PredictionAnalyticsResponse> {
  return apiGet<PredictionAnalyticsResponse>("/api/v1/predictions/analytics");
}

// ---------------------------------------------------------------------------
// Multi-Source Financial Intelligence & Prediction Engine API
// ---------------------------------------------------------------------------

export interface SourceQueryStatus {
  source_code: string;
  source_name: string;
  base_url: string;
  hierarchy_level: string;
  status: "operational" | "degraded" | "unavailable" | "no_records_found";
  retrieval_timestamp: string;
  status_details: string;
  documents_count: number;
}

export interface CollectedDocument {
  id?: string;
  company_symbol: string;
  company_name: string;
  source_code: string;
  source_url: string;
  title: string;
  document_type: string;
  publication_date?: string | null;
  retrieval_date: string;
  excerpt: string;
  content_hash: string;
  is_duplicate: boolean;
  duplicate_notice?: string | null;
  metadata?: Record<string, any>;
}

export interface EvidenceItem {
  id: string;
  document_id?: string | null;
  company_symbol: string;
  source_code: string;
  source_name: string;
  source_url: string;
  source_tier: string;
  publication_date?: string | null;
  retrieval_date: string;
  classification: "supports" | "contradicts" | "context" | "unclear";
  relevance_score: number;
  authenticity_score: number;
  recency_score: number;
  is_duplicate: boolean;
  duplicate_notice?: string | null;
  extracted_passage: string;
  analysis_notes: string;
  contradiction_flag: boolean;
  contradiction_details?: string | null;
}

export interface VerificationSummary {
  company_symbol: string;
  company_name: string;
  claim_text?: string | null;
  total_sources_consulted: number;
  primary_official_count: number;
  secondary_journalism_count: number;
  duplicate_disclosures_found: number;
  cross_source_conflicts_found: number;
  evidence_items: EvidenceItem[];
  supporting_evidence: EvidenceItem[];
  contradicting_evidence: EvidenceItem[];
  context_evidence: EvidenceItem[];
  unclear_evidence: EvidenceItem[];
  verification_verdict: string;
  verdict_explanation: string;
  is_sufficient_evidence: boolean;
  data_gap_warnings: string[];
}

export interface MarketOutlookResult {
  company_symbol: string;
  company_name: string;
  reference_price?: number | null;
  reference_timestamp: string;
  market_data_provider: string;
  data_sufficiency_status: "sufficient" | "insufficient";
  insufficient_data_reason?: string | null;
  expected_direction: "Upward" | "Downward" | "Uncertain";
  forecast_horizon_days: number;
  forecast_price_low?: number | null;
  forecast_price_high?: number | null;
  forecast_price_expected?: number | null;
  model_name: string;
  model_version: string;
  prediction_methodology: string;
  confidence_score: number;
  uncertainty_level: "low" | "moderate" | "high" | "severe";
  uncertainty_explanation: string;
  historical_facts: Record<string, any>;
  verified_company_info: Record<string, any>;
  news_and_context: Record<string, any>;
  model_estimates: Record<string, any>;
  main_factors: string[];
  supporting_evidence: string[];
  contradicting_evidence: string[];
  risk_factors: string[];
  plain_language_explanation: string;
}

export interface MultiSourceIntelligenceResult {
  company_symbol: string;
  company_name: string;
  sector?: string | null;
  query_timestamp: string;
  sources_status: SourceQueryStatus[];
  documents: CollectedDocument[];
  evidence_summary: VerificationSummary;
  market_outlook: MarketOutlookResult;
}

/** Analyze company multi-source financial intelligence across SEBI, NSE, BSE, and Moneycontrol. */
export async function analyzeCompanyIntelligence(params: {
  companyOrTicker: string;
  claimText?: string;
  horizonDays?: number;
}): Promise<MultiSourceIntelligenceResult> {
  return apiPost<MultiSourceIntelligenceResult>("/api/intelligence/analyze", {
    company_or_ticker: params.companyOrTicker,
    claim_text: params.claimText || null,
    horizon_days: params.horizonDays || 30,
  });
}

/** Retrieve all indexed source documents for a company. */
export async function fetchCompanySources(company: string): Promise<{
  company_symbol: string;
  company_name: string;
  total_documents: number;
  documents: CollectedDocument[];
}> {
  return apiGet(`/api/intelligence/sources/${encodeURIComponent(company)}`);
}

/** Retrieve verified evidence records for a company. */
export async function fetchCompanyEvidence(company: string): Promise<{
  company_symbol: string;
  company_name: string;
  total_evidence_records: number;
  evidence_records: EvidenceItem[];
}> {
  return apiGet(`/api/intelligence/evidence/${encodeURIComponent(company)}`);
}

/** Generate an evidence-based quantitative price forecast using real historical market data. */
export async function generateCompanyPrediction(params: {
  companyOrTicker: string;
  horizonDays?: number;
}): Promise<MarketOutlookResult> {
  return apiPost<MarketOutlookResult>("/api/predictions/generate", {
    company_or_ticker: params.companyOrTicker,
    horizon_days: params.horizonDays || 30,
  });
}

/** Fetch latest market outlook for a company. */
export async function fetchLatestPrediction(company: string): Promise<MarketOutlookResult> {
  return apiGet<MarketOutlookResult>(`/api/predictions/${encodeURIComponent(company)}`);
}

/** Fetch prediction history for a company. */
export async function fetchPredictionHistoryForCompany(company: string): Promise<{
  company_symbol: string;
  company_name: string;
  total_predictions: number;
  history: MarketOutlookResult[];
}> {
  return apiGet(`/api/predictions/history/${encodeURIComponent(company)}`);
}
