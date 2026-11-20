-- ========================================================================
-- FINTRUST AI — Schema Migration: Prediction Tracking Engine
-- ========================================================================

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
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

-- Update status check constraint if possible
DO $$
BEGIN
  ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_status_check;
  ALTER TABLE public.predictions ADD CONSTRAINT predictions_status_check 
    CHECK (status IN ('met', 'not_met', 'partially_met', 'inconclusive', 'pending', 'correct', 'incorrect', 'partial'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
