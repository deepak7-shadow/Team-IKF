-- ========================================================================
-- FINTRUST AI — Multi-Source Financial Intelligence & Prediction Schema
-- ========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FINANCIAL SOURCES TABLE
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

-- 2. COLLECTED FINANCIAL DOCUMENTS TABLE
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

-- 3. EVIDENCE RECORDS TABLE
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

-- 4. COMPANY FINANCIAL METRICS TABLE
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

-- 5. MARKET PRICE HISTORY TABLE
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

-- 6. PREDICTION RESULTS TABLE (Evidence-Based Market Outlook)
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

-- 7. PREDICTION EVALUATION HISTORY TABLE
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

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.financial_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_evaluation_history ENABLE ROW LEVEL SECURITY;

-- 1. financial_sources
DROP POLICY IF EXISTS "Public read on financial sources" ON public.financial_sources;
CREATE POLICY "Public read on financial sources" ON public.financial_sources FOR SELECT USING (true);

-- 2. collected_financial_documents
DROP POLICY IF EXISTS "Read collected financial documents" ON public.collected_financial_documents;
CREATE POLICY "Read collected financial documents" ON public.collected_financial_documents
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert collected financial documents" ON public.collected_financial_documents;
CREATE POLICY "Insert collected financial documents" ON public.collected_financial_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. evidence_records
DROP POLICY IF EXISTS "Read evidence records" ON public.evidence_records;
CREATE POLICY "Read evidence records" ON public.evidence_records
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert evidence records" ON public.evidence_records;
CREATE POLICY "Insert evidence records" ON public.evidence_records
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4. company_financial_metrics
DROP POLICY IF EXISTS "Public read company financial metrics" ON public.company_financial_metrics;
CREATE POLICY "Public read company financial metrics" ON public.company_financial_metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert company financial metrics" ON public.company_financial_metrics;
CREATE POLICY "Insert company financial metrics" ON public.company_financial_metrics FOR INSERT WITH CHECK (true);

-- 5. market_price_history
DROP POLICY IF EXISTS "Public read market price history" ON public.market_price_history;
CREATE POLICY "Public read market price history" ON public.market_price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert market price history" ON public.market_price_history;
CREATE POLICY "Insert market price history" ON public.market_price_history FOR INSERT WITH CHECK (true);

-- 6. prediction_results
DROP POLICY IF EXISTS "Read prediction results" ON public.prediction_results;
CREATE POLICY "Read prediction results" ON public.prediction_results
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Insert prediction results" ON public.prediction_results;
CREATE POLICY "Insert prediction results" ON public.prediction_results
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 7. prediction_evaluation_history
DROP POLICY IF EXISTS "Read prediction evaluation history" ON public.prediction_evaluation_history;
CREATE POLICY "Read prediction evaluation history" ON public.prediction_evaluation_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert prediction evaluation history" ON public.prediction_evaluation_history;
CREATE POLICY "Insert prediction evaluation history" ON public.prediction_evaluation_history FOR INSERT WITH CHECK (true);
