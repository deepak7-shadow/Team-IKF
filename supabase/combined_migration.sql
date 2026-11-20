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
