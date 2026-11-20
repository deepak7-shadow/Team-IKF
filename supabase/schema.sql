-- ========================================================================
-- FINTRUST AI — Production Database Schema (Supabase / PostgreSQL)
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    influencer_id UUID,
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
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('correct', 'incorrect', 'partial', 'pending')),
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CLAIMS TABLE
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FINFLUENCERS TABLE
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SAVED REPORTS TABLE
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

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'success', 'info')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finfluencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Allow public read on finfluencers" ON public.finfluencers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on own predictions" ON public.predictions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow authenticated insert on predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow authenticated update on predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow read on own claims" ON public.claims FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow insert on claims" ON public.claims FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow read on own saved reports" ON public.saved_reports FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow delete on own saved reports" ON public.saved_reports FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow read on own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
