-- ========================================================================
-- FINTRUST AI — Complete Production Database Schema (Supabase / PostgreSQL)
-- Safe to run repeatedly (Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS)
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. BASE TABLES
-- ------------------------------------------------------------------------

-- 1.1 FINFLUENCERS TABLE
CREATE TABLE IF NOT EXISTS public.finfluencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    avatar TEXT,
    platform TEXT NOT NULL,
    followers NUMERIC DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'flagged', 'pending')),
    accuracy_score NUMERIC CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    total_predictions NUMERIC DEFAULT 0,
    correct_predictions NUMERIC DEFAULT 0,
    risk_rating TEXT NOT NULL DEFAULT 'medium' CHECK (risk_rating IN ('low', 'medium', 'high', 'critical')),
    tags TEXT[] DEFAULT '{}',
    bio TEXT,
    profile_url TEXT,
    identity_status TEXT DEFAULT 'unverified' CHECK (identity_status IN ('verified', 'unverified', 'pending')),
    sebi_status TEXT DEFAULT 'pending' CHECK (sebi_status IN ('verified_registered', 'not_found', 'unable_to_verify', 'pending')),
    sebi_reg_number TEXT,
    sebi_reg_type TEXT,
    verification_source TEXT,
    verification_notes TEXT,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 10),
    status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('analyzing', 'complete', 'failed')),
    summary TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    source_url TEXT,
    platform TEXT,
    ocr_extracted_text TEXT,
    ocr_error TEXT,
    upload_filename TEXT,
    target_date DATE,
    analyzed_at TIMESTAMPTZ,
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES public.finfluencers(id) ON DELETE SET NULL,
    influencer_name TEXT NOT NULL,
    asset TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish')),
    target_price NUMERIC NOT NULL,
    reference_price NUMERIC,
    current_price NUMERIC,
    market_data_provider TEXT,
    market_data_status TEXT DEFAULT 'unavailable' CHECK (market_data_status IN ('live', 'delayed', 'unavailable')),
    market_data_updated_at TIMESTAMPTZ,
    prediction_date DATE NOT NULL,
    evaluation_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
    notes TEXT,
    claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    claim_text TEXT,
    source_url TEXT,
    ticker_symbol TEXT,
    reference_date DATE,
    evaluation_criteria TEXT,
    evaluation_methodology_version TEXT DEFAULT 'v1.0.0-deterministic',
    evaluation_notes TEXT,
    evaluated_at TIMESTAMPTZ,
    price_snapshots JSONB DEFAULT '[]'::jsonb,
    corporate_actions_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 SAVED REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('claim', 'influencer', 'prediction')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    summary TEXT,
    dossier_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'success', 'info')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 CLAIM UPLOADS TABLE
CREATE TABLE IF NOT EXISTS public.claim_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    content_type TEXT,
    file_size_bytes INTEGER,
    ocr_extracted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 INFLUENCER CLAIMS LINKING TABLE
CREATE TABLE IF NOT EXISTS public.influencer_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id UUID REFERENCES public.finfluencers(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    sebi_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    pump_dump_detection BOOLEAN NOT NULL DEFAULT TRUE,
    email_digest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 2. ENSURE ALL EXTENDED COLUMNS EXIST (IN CASE TABLES WERE ALREADY CREATED)
-- ------------------------------------------------------------------------

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS ocr_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_error TEXT,
  ADD COLUMN IF NOT EXISTS upload_filename TEXT,
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.finfluencers
  ADD COLUMN IF NOT EXISTS profile_url TEXT,
  ADD COLUMN IF NOT EXISTS identity_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS sebi_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sebi_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS sebi_reg_type TEXT,
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS claim_id UUID,
  ADD COLUMN IF NOT EXISTS claim_text TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS ticker_symbol TEXT,
  ADD COLUMN IF NOT EXISTS reference_date DATE,
  ADD COLUMN IF NOT EXISTS evaluation_criteria TEXT,
  ADD COLUMN IF NOT EXISTS evaluation_methodology_version TEXT DEFAULT 'v1.0.0-deterministic',
  ADD COLUMN IF NOT EXISTS evaluation_notes TEXT,
  ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_snapshots JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS corporate_actions_note TEXT;

-- Safely update status constraint on predictions
DO $$
BEGIN
  ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_status_check;
  ALTER TABLE public.predictions ADD CONSTRAINT predictions_status_check 
    CHECK (status IN ('met', 'not_met', 'partially_met', 'inconclusive', 'pending', 'correct', 'incorrect', 'partial'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------------------

ALTER TABLE public.finfluencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------

-- 4.1 FINFLUENCERS POLICIES
DROP POLICY IF EXISTS "Allow public read on finfluencers" ON public.finfluencers;
CREATE POLICY "Allow public read on finfluencers"
  ON public.finfluencers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on finfluencers" ON public.finfluencers;
CREATE POLICY "Allow authenticated insert on finfluencers"
  ON public.finfluencers FOR INSERT WITH CHECK (true);

-- 4.2 CLAIMS POLICIES
DROP POLICY IF EXISTS "Allow read on own claims" ON public.claims;
CREATE POLICY "Allow read on own claims"
  ON public.claims FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow insert on claims" ON public.claims;
CREATE POLICY "Allow insert on claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow update on own claims" ON public.claims;
CREATE POLICY "Allow update on own claims"
  ON public.claims FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow service role upsert on claims" ON public.claims;
CREATE POLICY "Allow service role upsert on claims"
  ON public.claims FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4.3 PREDICTIONS POLICIES
DROP POLICY IF EXISTS "Allow authenticated read on own predictions" ON public.predictions;
CREATE POLICY "Allow authenticated read on own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow authenticated insert on predictions" ON public.predictions;
CREATE POLICY "Allow authenticated insert on predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow authenticated update on predictions" ON public.predictions;
CREATE POLICY "Allow authenticated update on predictions"
  ON public.predictions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4.4 SAVED REPORTS POLICIES
DROP POLICY IF EXISTS "Allow read on own saved reports" ON public.saved_reports;
CREATE POLICY "Allow read on own saved reports"
  ON public.saved_reports FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow insert on own saved reports" ON public.saved_reports;
CREATE POLICY "Allow insert on own saved reports"
  ON public.saved_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow update on own saved reports" ON public.saved_reports;
CREATE POLICY "Allow update on own saved reports"
  ON public.saved_reports FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow delete on own saved reports" ON public.saved_reports;
CREATE POLICY "Allow delete on own saved reports"
  ON public.saved_reports FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4.5 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Allow read on own notifications" ON public.notifications;
CREATE POLICY "Allow read on own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4.6 CLAIM UPLOADS POLICIES
DROP POLICY IF EXISTS "Allow read on own uploads" ON public.claim_uploads;
CREATE POLICY "Allow read on own uploads"
  ON public.claim_uploads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow insert on uploads" ON public.claim_uploads;
CREATE POLICY "Allow insert on uploads"
  ON public.claim_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4.7 INFLUENCER CLAIMS POLICIES
DROP POLICY IF EXISTS "Allow public read on influencer_claims" ON public.influencer_claims;
CREATE POLICY "Allow public read on influencer_claims"
  ON public.influencer_claims FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on influencer_claims" ON public.influencer_claims;
CREATE POLICY "Allow authenticated insert on influencer_claims"
  ON public.influencer_claims FOR INSERT WITH CHECK (true);

-- 4.8 USER PREFERENCES POLICIES
DROP POLICY IF EXISTS "Allow read on own preferences" ON public.user_preferences;
CREATE POLICY "Allow read on own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert on own preferences" ON public.user_preferences;
CREATE POLICY "Allow insert on own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update on own preferences" ON public.user_preferences;
CREATE POLICY "Allow update on own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------
-- 5. MULTI-SOURCE FINANCIAL INTELLIGENCE & PREDICTION ENGINE TABLES
-- ------------------------------------------------------------------------

-- 5.1 FINANCIAL SOURCES TABLE
CREATE TABLE IF NOT EXISTS public.financial_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_code TEXT NOT NULL UNIQUE, -- 'SEBI', 'NSE', 'BSE', 'MONEYCONTROL'
    source_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    hierarchy_level TEXT NOT NULL CHECK (hierarchy_level IN ('Level 1 - Primary Official', 'Level 2 - Secondary Financial Journalism', 'Level 3 - Unverified')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'unreachable', 'standby')),
    status_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed authoritative sources if not present
INSERT INTO public.financial_sources (source_code, source_name, base_url, hierarchy_level, status, status_details)
VALUES
    ('SEBI', 'Securities and Exchange Board of India', 'https://www.sebi.gov.in/', 'Level 1 - Primary Official', 'operational', 'Authoritative regulatory announcements, orders, and circulars'),
    ('NSE', 'National Stock Exchange of India', 'https://www.nseindia.com/', 'Level 1 - Primary Official', 'operational', 'Official exchange disclosures, corporate filings, and announcements'),
    ('BSE', 'Bombay Stock Exchange', 'https://www.bseindia.com/', 'Level 1 - Primary Official', 'operational', 'Official exchange disclosures, corporate filings, and announcements'),
    ('MONEYCONTROL', 'Moneycontrol Financial News', 'https://www.moneycontrol.com/', 'Level 2 - Secondary Financial Journalism', 'operational', 'Secondary financial news, sector developments, and market context')
ON CONFLICT (source_code) DO UPDATE SET
    updated_at = NOW();

-- 5.2 COLLECTED FINANCIAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.collected_financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    source_code TEXT NOT NULL REFERENCES public.financial_sources(source_code) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'announcement' CHECK (document_type IN ('circular', 'order', 'warning', 'announcement', 'financial_result', 'corporate_action', 'news', 'disclosure', 'other')),
    publication_date TIMESTAMPTZ,
    retrieval_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_content TEXT,
    excerpt TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of_id UUID REFERENCES public.collected_financial_documents(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.3 EVIDENCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.evidence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_symbol TEXT NOT NULL,
    document_id UUID REFERENCES public.collected_financial_documents(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    classification TEXT NOT NULL CHECK (classification IN ('supports', 'contradicts', 'context', 'unclear')),
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
    relevance_score NUMERIC CHECK (relevance_score >= 0 AND relevance_score <= 100),
    recency_score NUMERIC CHECK (recency_score >= 0 AND recency_score <= 100),
    authenticity_score NUMERIC CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
    source_tier TEXT NOT NULL CHECK (source_tier IN ('Level 1 - Primary Official', 'Level 2 - Secondary Financial Journalism', 'Level 3 - Unverified')),
    extracted_passage TEXT NOT NULL,
    analysis_notes TEXT,
    is_conflicting BOOLEAN NOT NULL DEFAULT FALSE,
    conflict_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.4 COMPANY FINANCIAL METRICS TABLE
CREATE TABLE IF NOT EXISTS public.company_financial_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    reporting_period TEXT NOT NULL,
    revenue NUMERIC,
    revenue_growth_yoy NUMERIC,
    net_profit NUMERIC,
    net_profit_growth_yoy NUMERIC,
    debt_to_equity NUMERIC,
    operating_margin_pct NUMERIC,
    pe_ratio NUMERIC,
    market_cap_cr NUMERIC,
    source_document_id UUID REFERENCES public.collected_financial_documents(id) ON DELETE SET NULL,
    source_disclosure_url TEXT,
    filing_date DATE,
    verified_from_exchange BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.5 MARKET PRICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.market_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_symbol TEXT NOT NULL,
    exchange TEXT NOT NULL,
    trade_date DATE NOT NULL,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    close_price NUMERIC NOT NULL,
    volume BIGINT,
    provider TEXT NOT NULL,
    data_provenance TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_symbol_date_exchange UNIQUE (company_symbol, trade_date, exchange)
);

-- 5.6 PREDICTION RESULTS TABLE (Evidence-Based Market Outlook)
CREATE TABLE IF NOT EXISTS public.prediction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    reference_price NUMERIC,
    reference_timestamp TIMESTAMPTZ NOT NULL,
    expected_direction TEXT NOT NULL CHECK (expected_direction IN ('Upward', 'Downward', 'Uncertain')),
    forecast_price_low NUMERIC,
    forecast_price_high NUMERIC,
    forecast_horizon_days INT NOT NULL DEFAULT 30,
    model_name TEXT NOT NULL DEFAULT 'Drift-Adjusted Empirical Volatility Forecasting',
    model_version TEXT NOT NULL DEFAULT 'v1.2.0-quantitative',
    prediction_methodology TEXT NOT NULL,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
    uncertainty_level TEXT NOT NULL CHECK (uncertainty_level IN ('low', 'moderate', 'high', 'severe')),
    uncertainty_explanation TEXT NOT NULL,
    main_factors JSONB DEFAULT '[]'::jsonb,
    supporting_evidence JSONB DEFAULT '[]'::jsonb,
    contradicting_evidence JSONB DEFAULT '[]'::jsonb,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    plain_language_explanation TEXT NOT NULL,
    historical_facts JSONB DEFAULT '{}'::jsonb,
    verified_company_info JSONB DEFAULT '{}'::jsonb,
    news_and_context JSONB DEFAULT '{}'::jsonb,
    model_estimates JSONB DEFAULT '{}'::jsonb,
    data_sufficiency_status TEXT NOT NULL CHECK (data_sufficiency_status IN ('sufficient', 'insufficient')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.7 PREDICTION EVALUATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.prediction_evaluation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_result_id UUID REFERENCES public.prediction_results(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actual_price NUMERIC,
    evaluation_status TEXT NOT NULL CHECK (evaluation_status IN ('met', 'not_met', 'partially_met', 'inconclusive', 'pending')),
    variance_pct NUMERIC,
    methodology_version TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 6. POLICIES FOR INTELLIGENCE TABLES
-- ------------------------------------------------------------------------

ALTER TABLE public.financial_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_evaluation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on financial sources" ON public.financial_sources;
CREATE POLICY "Public read on financial sources" ON public.financial_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Read collected financial documents" ON public.collected_financial_documents;
CREATE POLICY "Read collected financial documents" ON public.collected_financial_documents
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert collected financial documents" ON public.collected_financial_documents;
CREATE POLICY "Insert collected financial documents" ON public.collected_financial_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Read evidence records" ON public.evidence_records;
CREATE POLICY "Read evidence records" ON public.evidence_records
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert evidence records" ON public.evidence_records;
CREATE POLICY "Insert evidence records" ON public.evidence_records
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Public read company financial metrics" ON public.company_financial_metrics;
CREATE POLICY "Public read company financial metrics" ON public.company_financial_metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert company financial metrics" ON public.company_financial_metrics;
CREATE POLICY "Insert company financial metrics" ON public.company_financial_metrics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read market price history" ON public.market_price_history;
CREATE POLICY "Public read market price history" ON public.market_price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert market price history" ON public.market_price_history;
CREATE POLICY "Insert market price history" ON public.market_price_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Read prediction results" ON public.prediction_results;
CREATE POLICY "Read prediction results" ON public.prediction_results
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert prediction results" ON public.prediction_results;
CREATE POLICY "Insert prediction results" ON public.prediction_results
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Read prediction evaluation history" ON public.prediction_evaluation_history;
CREATE POLICY "Read prediction evaluation history" ON public.prediction_evaluation_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert prediction evaluation history" ON public.prediction_evaluation_history;
CREATE POLICY "Insert prediction evaluation history" ON public.prediction_evaluation_history FOR INSERT WITH CHECK (true);
