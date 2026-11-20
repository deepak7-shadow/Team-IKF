-- ========================================================================
-- FINTRUST AI — Schema Migration: Claim Analyzer Extended Fields
-- Run AFTER the base schema.sql to add columns needed by the backend API
-- ========================================================================

-- Add columns to claims table (IF NOT EXISTS guards idempotency)
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS ocr_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_error TEXT,
  ADD COLUMN IF NOT EXISTS upload_filename TEXT,
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}'::jsonb;

-- Allow insert with service role (backend uses service role key)
CREATE POLICY IF NOT EXISTS "Allow service role upsert on claims"
  ON public.claims FOR ALL
  USING (true)
  WITH CHECK (true);

-- Uploaded files reference table (optional, for audit trail)
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

ALTER TABLE public.claim_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read on own uploads"
  ON public.claim_uploads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Allow insert on uploads"
  ON public.claim_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
