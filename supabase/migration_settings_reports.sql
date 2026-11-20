-- ============================================================
-- FINTRUST AI — Supplementary Migration
-- Covers: saved_reports insert policy, user profile metadata table
-- Run in Supabase SQL Editor
-- ============================================================

-- Allow authenticated users to insert their own saved reports
CREATE POLICY IF NOT EXISTS "Allow insert on own saved reports"
  ON public.saved_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to update their own saved reports
CREATE POLICY IF NOT EXISTS "Allow update on own saved reports"
  ON public.saved_reports
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- User preferences table (notification settings etc.)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    sebi_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    pump_dump_detection BOOLEAN NOT NULL DEFAULT TRUE,
    email_digest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on own preferences"
  ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert on own preferences"
  ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update on own preferences"
  ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
