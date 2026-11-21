-- ============================================================================
-- FINTRUST AI — LIVE FINANCIAL NEWS & MARKET INSIGHTS DATABASE SCHEMA
-- Migration: 20261121_news_insights.sql
-- ============================================================================

-- 1. News Sources Registry
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'sebi', 'nse', 'bse', 'moneycontrol', 'rbi', 'reuters_feed'
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('tier_1_regulatory', 'tier_1_exchange', 'tier_2_financial_media', 'tier_3_global_macro')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_crawled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'degraded', 'unavailable'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Predefined & Discovered Financial Topics
CREATE TABLE IF NOT EXISTS public.news_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'gold', 'crude-oil', 'it-sector', 'banking-sector', 'reliance', 'nifty-50'
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('commodity', 'equity', 'sector', 'index', 'crypto', 'macro')),
    default_symbol TEXT NOT NULL, -- 'GC=F', 'CL=F', '^CNXIT', '^NSEBANK', 'RELIANCE.NS', '^NSEI'
    currency TEXT NOT NULL DEFAULT 'INR',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Verified Collected Financial News
CREATE TABLE IF NOT EXISTS public.financial_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code TEXT NOT NULL, -- references news_sources(code)
    publisher TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    original_url TEXT NOT NULL UNIQUE,
    published_at TIMESTAMPTZ,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    topic_slug TEXT NOT NULL,
    related_entities TEXT[] NOT NULL DEFAULT '{}',
    evidence_tier TEXT NOT NULL DEFAULT 'tier_2_financial_media',
    source_type TEXT NOT NULL DEFAULT 'secondary', -- 'primary' (direct exchange/regulator) or 'secondary' (press)
    content_hash TEXT NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT false,
    duplicate_of_url TEXT,
    is_contradictory BOOLEAN NOT NULL DEFAULT false,
    contradiction_detail TEXT,
    sentiment_tag TEXT NOT NULL DEFAULT 'neutral', -- 'positive', 'negative', 'neutral', 'mixed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Real-Time & Historical Market Snapshots
CREATE TABLE IF NOT EXISTS public.market_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    normalized_ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    market TEXT NOT NULL, -- 'NSE', 'BSE', 'COMEX', 'NYMEX', 'CRYPTO'
    currency TEXT NOT NULL DEFAULT 'INR',
    unit TEXT, -- 'per 10g', 'per troy oz', 'per barrel', 'points', 'per share'
    current_price NUMERIC(15, 4),
    previous_close NUMERIC(15, 4),
    change_value NUMERIC(15, 4),
    change_percent NUMERIC(8, 4),
    high_today NUMERIC(15, 4),
    low_today NUMERIC(15, 4),
    volume NUMERIC(20, 2),
    is_delayed BOOLEAN NOT NULL DEFAULT true,
    provider TEXT NOT NULL DEFAULT 'Public Market Feed',
    market_status TEXT NOT NULL DEFAULT 'active', -- 'open', 'closed', 'holiday'
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI-Powered News & Market Impact Explanations
CREATE TABLE IF NOT EXISTS public.news_impact_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_slug TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    market_trend TEXT NOT NULL CHECK (market_trend IN ('increasing', 'decreasing', 'sideways', 'mixed', 'volatile')),
    what_is_happening TEXT NOT NULL,
    why_it_is_happening TEXT NOT NULL,
    positive_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    negative_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_to_watch JSONB NOT NULL DEFAULT '[]'::jsonb,
    indian_market_impact TEXT NOT NULL,
    overall_sentiment TEXT NOT NULL CHECK (overall_sentiment IN ('Potentially Positive', 'Potentially Negative', 'Neutral', 'Mixed', 'Uncertain')),
    short_term_outlook TEXT,
    long_term_outlook TEXT,
    affected_sectors TEXT[] NOT NULL DEFAULT '{}',
    affected_companies TEXT[] NOT NULL DEFAULT '{}',
    supporting_evidence_count INT NOT NULL DEFAULT 0,
    contradiction_flag BOOLEAN NOT NULL DEFAULT false,
    model_version TEXT NOT NULL DEFAULT 'v1.0-evidence-engine',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Topic Search History
CREATE TABLE IF NOT EXISTS public.topic_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    query_text TEXT NOT NULL,
    resolved_topic_slug TEXT,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_financial_news_topic ON public.financial_news(topic_slug, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_news_hash ON public.financial_news(content_hash);
CREATE INDEX IF NOT EXISTS idx_financial_news_url ON public.financial_news(original_url);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol ON public.market_snapshots(symbol, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_impact_topic ON public.news_impact_analysis(topic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_search_history_time ON public.topic_search_history(searched_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_impact_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_search_history ENABLE ROW LEVEL SECURITY;

-- Read policies for public / authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on news_sources') THEN
        CREATE POLICY "Allow public read on news_sources" ON public.news_sources FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on news_topics') THEN
        CREATE POLICY "Allow public read on news_topics" ON public.news_topics FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on financial_news') THEN
        CREATE POLICY "Allow public read on financial_news" ON public.financial_news FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on market_snapshots') THEN
        CREATE POLICY "Allow public read on market_snapshots" ON public.market_snapshots FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on news_impact_analysis') THEN
        CREATE POLICY "Allow public read on news_impact_analysis" ON public.news_impact_analysis FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert on topic_search_history') THEN
        CREATE POLICY "Allow insert on topic_search_history" ON public.topic_search_history FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read on topic_search_history') THEN
        CREATE POLICY "Allow read on topic_search_history" ON public.topic_search_history FOR SELECT USING (true);
    END IF;
END $$;

-- Seed Predefined Sources
INSERT INTO public.news_sources (code, name, url, tier, status, description)
VALUES
    ('sebi', 'Securities and Exchange Board of India', 'https://www.sebi.gov.in', 'tier_1_regulatory', 'operational', 'Official regulatory orders, circulars, and notifications'),
    ('nse', 'National Stock Exchange of India', 'https://www.nseindia.com', 'tier_1_exchange', 'operational', 'Official exchange corporate filings, announcements, and LODR disclosures'),
    ('bse', 'Bombay Stock Exchange', 'https://www.bseindia.com', 'tier_1_exchange', 'operational', 'Official corporate announcements and scrip disclosures'),
    ('moneycontrol', 'Moneycontrol Financial Media', 'https://www.moneycontrol.com', 'tier_2_financial_media', 'operational', 'Real-time financial journalism, company earnings, and market reports'),
    ('rbi', 'Reserve Bank of India', 'https://www.rbi.org.in', 'tier_1_regulatory', 'operational', 'Monetary policy statements, sovereign gold bond issues, repo rate circulars'),
    ('reuters_macro', 'Reuters & Global Financial Wire', 'https://www.reuters.com', 'tier_3_global_macro', 'operational', 'Global macro, US Federal Reserve policy, and commodity pricing')
ON CONFLICT (code) DO NOTHING;

-- Seed Major Supported Topics
INSERT INTO public.news_topics (slug, name, category, default_symbol, currency, keywords, description, is_trending)
VALUES
    ('gold', 'Gold and Silver', 'commodity', 'GC=F', 'INR', ARRAY['gold', 'silver', 'bullion', 'mcx', 'sovereign gold bond', 'jewellery', 'precious metals', 'goldbees'], 'International & domestic gold bullion and silver prices and policy', true),
    ('nifty-50', 'NIFTY 50 and SENSEX', 'index', '^NSEI', 'INR', ARRAY['nifty', 'sensex', 'nifty 50', 'bse', 'stock market', 'dalal street', 'indian markets', 'fii', 'dii'], 'Benchmark Indian equity indices and market breadth', true),
    ('banking-sector', 'Banking Sector', 'sector', '^NSEBANK', 'INR', ARRAY['bank', 'banking', 'bank nifty', 'hdfc bank', 'sbi', 'icici bank', 'rbi repo rate', 'npa', 'credit growth', 'nim'], 'Public and private Indian banking institutions, credit growth, and RBI policy', true),
    ('it-sector', 'IT Sector', 'sector', '^CNXIT', 'INR', ARRAY['it stocks', 'information technology', 'tcs', 'infosys', 'wipro', 'hcl tech', 'tech spending', 'ai adoption', 'us tech'], 'Indian technology services, software exports, and global enterprise spending', true),
    ('crude-oil', 'Crude Oil & Energy', 'commodity', 'CL=F', 'USD', ARRAY['crude oil', 'brent', 'wti', 'opec', 'petroleum', 'fuel prices', 'ongc', 'reliance petroleum'], 'Global crude benchmarks, OPEC+ supply quotas, and energy imports', true),
    ('reliance', 'Reliance Industries', 'equity', 'RELIANCE.NS', 'INR', ARRAY['reliance', 'ril', 'mukesh ambani', 'jio', 'reliance retail', 'oil to chemicals'], 'India’s largest conglomerate spanning retail, telecom, and energy', true),
    ('tata-motors', 'Tata Motors', 'equity', 'TATAMOTORS.NS', 'INR', ARRAY['tata motors', 'jlr', 'jaguar land rover', 'electric vehicle', 'commercial vehicle'], 'Automotive giant specializing in passenger EV, commercial transport, and JLR', true),
    ('automobile-sector', 'Automobile Sector', 'sector', '^CNXAUTO', 'INR', ARRAY['auto', 'automobile', 'maruti', 'tata motors', 'mahindra', 'bajaj auto', 'two wheeler', 'ev adoption'], 'Indian vehicle manufacturers, monthly sales volume, and mobility trends', true),
    ('ai-stocks', 'Artificial Intelligence Stocks', 'sector', 'TCS.NS', 'INR', ARRAY['ai', 'artificial intelligence', 'machine learning', 'generative ai', 'tech capex', 'semiconductors'], 'Companies investing in or deploying AI infrastructure and services', true),
    ('cryptocurrency', 'Cryptocurrency & Digital Assets', 'crypto', 'BTC-USD', 'USD', ARRAY['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'rbi crypto stance'], 'Decentralized digital currencies and regulatory frameworks', false),
    ('global-markets', 'Global Financial Markets', 'macro', '^GSPC', 'USD', ARRAY['global markets', 'wall street', 's&p 500', 'nasdaq', 'federal reserve', 'us treasury yields', 'dollar index'], 'US and European benchmark indices, US Treasury yields, and central bank rates', true)
ON CONFLICT (slug) DO NOTHING;
