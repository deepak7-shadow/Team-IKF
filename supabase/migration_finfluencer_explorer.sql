-- ========================================================================
-- FINTRUST AI — Schema Migration: Finfluencer Explorer & SEBI Verification
-- ========================================================================

ALTER TABLE public.finfluencers
  ADD COLUMN IF NOT EXISTS profile_url TEXT,
  ADD COLUMN IF NOT EXISTS identity_status TEXT DEFAULT 'unverified' CHECK (identity_status IN ('verified', 'unverified', 'pending')),
  ADD COLUMN IF NOT EXISTS sebi_status TEXT DEFAULT 'pending' CHECK (sebi_status IN ('verified_registered', 'not_found', 'unable_to_verify', 'pending')),
  ADD COLUMN IF NOT EXISTS sebi_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS sebi_reg_type TEXT,
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Table linking influencers directly to claims
CREATE TABLE IF NOT EXISTS public.influencer_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id UUID REFERENCES public.finfluencers(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.influencer_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on influencer_claims"
  ON public.influencer_claims FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on influencer_claims"
  ON public.influencer_claims FOR INSERT WITH CHECK (true);
