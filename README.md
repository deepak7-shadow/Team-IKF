# FINTRUST AI — Multi-Source Financial Intelligence & Prediction Engine

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-black?logo=vercel&logoColor=white)](https://vercel.com/)

> **"Clarity before conviction. Evidence over opinion. Educate, never advise."**  
> FINTRUST AI is a forensic financial intelligence and evidence-based prediction platform designed to verify viral stock advice, claims, and price projections against authoritative market regulators and exchange filings.

---

## 🌟 Key Capabilities

### 1. Multi-Source Financial Intelligence Engine
When a financial claim or security symbol (e.g. `RELIANCE`, `TCS`, `INFY`) is submitted, the platform cross-examines four authoritative information sources concurrently:

- **🏛️ Source 1: SEBI (Securities and Exchange Board of India)**
  - Apex regulatory portal (`sebi.gov.in`).
  - Scans official regulatory circulars, investor warnings, intermediary registers (RIA/RA), and enforcement orders under PFUTP Regulations.
  - Never fabricates regulatory violations—reports source connectivity honestly.
- **📈 Source 2: NSE India (National Stock Exchange)**
  - Primary equity exchange (`nseindia.com`).
  - Automated ingestion of official corporate announcements, Regulation 30 (LODR) material events, board meeting outcomes, and audited financial statements.
- **🏢 Source 3: BSE India (Bombay Stock Exchange)**
  - Comprehensive corporate filings portal (`bseindia.com`).
  - Tracks corporate disclosures, shareholding patterns, and surveillance measure lists (**ASM** & **GSM**).
- **📰 Source 4: Moneycontrol & Financial Journalism**
  - Respected market context (`moneycontrol.com`).
  - Ingests earnings call transcripts, analyst target consensus, and sector news via live RSS feeds as **Level 2 Secondary Evidence**.

---

### 2. Source Authenticity & Cross-Exchange Deduplication
- **Deduplication:** Identical filings published across both NSE and BSE are recognized via title tokenization and content hashing. Duplicates are flagged and **not** counted as separate independent confirmations.
- **Evidence Hierarchy:**
  - **Level 1 (Primary Official):** SEBI orders, NSE announcements, BSE filings.
  - **Level 2 (Secondary Journalism):** Moneycontrol and verified financial press.
  - **Level 3 (Unverified):** Social media posts, forum tips, and promotional hype.
- **Contradiction Detection:** Detects opposing assertions (e.g., promotional growth claims vs. actual quarterly profit contraction or debt escalation).
- **Fallback Inconclusive State:** Returns `"Unable to verify with sufficient reliable evidence."` when evidence is conflicting or insufficient.

---

### 3. Quantitative Evidence-Based Forecasting Engine
- **Model:** *Drift-Adjusted Empirical Volatility Forecasting* (`v1.2.0-quantitative`).
- **Provider:** Real-time Yahoo Finance (`yfinance`) 6-month daily OHLCV trading bars.
- **Forecasting Methodology:**
  - Calculates 20-day and 50-day Exponential Moving Averages (EMA-20 / EMA-50).
  - Measures annualized realized volatility ($\sigma$).
  - Adjusts drift ($\mu$) based on Bayesian evidence weighting (+0.12 for official supporting filings, −0.45 for regulatory sanctions, −0.15 for contradictory disclosures).
  - Computes a mathematical **95% Confidence Interval** price range for the target horizon.
- **Strict Guardrail:** LLMs are **never** used alone to calculate prices; they solely synthesize plain-language explanations. If market liquidity is insufficient, the system displays: `"Insufficient data to generate a reliable prediction."`

---

## 🏗️ Architecture & Tech Stack

```
FINTRUST AI
├── Frontend (SPA) ─────────── React 18 + TypeScript + Vite + Tailwind CSS
│   ├── UI Components          Custom luxury design system (Champagne Gold / Cream)
│   ├── Client State           Supabase JS Client + Session Auth
│   └── API Client             Type-safe REST client (src/lib/api.ts)
│
├── Backend (API) ──────────── Python 3.11 + FastAPI + Uvicorn
│   ├── intelligence_collector Conconcurrent SEBI, NSE, BSE & Moneycontrol fetchers
│   ├── evidence_verifier      Cross-exchange deduplication & contradiction analysis
│   ├── forecasting_engine     Drift-adjusted empirical volatility quantitative model
│   ├── intelligence_db        PostgreSQL persistence via Supabase client
│   └── main.py                FastAPI application routes and Gemini AI analysis
│
└── Database ───────────────── Supabase (PostgreSQL with Row Level Security)
    ├── financial_sources
    ├── collected_financial_documents
    ├── evidence_records
    ├── company_financial_metrics
    ├── market_price_history
    ├── prediction_results
    └── prediction_evaluation_history
```

---

## 🚀 Deploying Frontend to Vercel

The frontend is fully configured for zero-configuration deployment to **Vercel**.

### Step 1: Push Code to GitHub
Ensure all latest changes are pushed to your repository:
```bash
git push origin main
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository (`Team-IKF` or `FINTRUST-AI`).
4. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Configure Environment Variables in Vercel
In the Vercel project settings, navigate to **Settings** → **Environment Variables** and add:

| Variable Name | Description | Example / Source |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public publishable anonymous key | `sb_publishable_...` |
| `VITE_API_URL` | Deployed FastAPI backend URL | `https://your-backend.onrender.com` |

> [!NOTE]
> For local development, `VITE_API_URL` points to `http://127.0.0.1:8000`. For production on Vercel, set it to your deployed backend URL.

### Step 4: Deploy
Click **Deploy**. Vercel will build your app and provide your live URL (e.g. `https://fintrust-ai.vercel.app`).

Client-side routing is handled automatically via [`vercel.json`](file:///c:/Users/Admin/FINTRUST%20AI/vercel.json):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ⚙️ Deploying the Backend (Render / Railway / Fly.io / AWS)

The Python FastAPI backend can be hosted on any cloud provider with Python 3.11 support (e.g., Render, Railway, Fly.io, or VPS).

### Backend Environment Variables (`backend/.env`)

```env
# Supabase Database & Auth (From Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Key (From https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# Security & CORS (Set your Vercel URL in production)
CORS_ORIGINS=["http://localhost:5173","https://your-app.vercel.app"]

# Upload configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=25
```

### Backend Startup Command
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🗄️ Supabase Database Migration

The project uses Supabase PostgreSQL with pre-configured schemas and Row Level Security.

1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Open [`supabase/migration_intelligence_engine.sql`](file:///c:/Users/Admin/FINTRUST%20AI/supabase/migration_intelligence_engine.sql).
3. Copy all contents and execute the script in the SQL Editor.
4. The migration will create:
   - `financial_sources` (Seeds SEBI, NSE, BSE, Moneycontrol)
   - `collected_financial_documents` (Raw filings, hashes, duplicate flags)
   - `evidence_records` (Supporting, contradicting, context, unclear classifications)
   - `company_financial_metrics` (Fundamental financial data)
   - `market_price_history` (OHLCV prices and timestamps)
   - `prediction_results` (Volatility models, 95% CI bands, horizons)
   - `prediction_evaluation_history` (Track record auditing)

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/deepak7-shadow/Team-IKF.git
cd Team-IKF
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# App runs at: http://127.0.0.1:5173
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
# API documentation available at: http://127.0.0.1:8000/docs
```

---

## 🧭 Navigation Sitemap

| Route | View | Description |
|---|---|---|
| `/dashboard` | **Dashboard Overview** | Executive summary, active market claims, analytics, and risk distribution. |
| `/claim-analyzer` | **Financial Claim Analyzer** | Interactive forensic audit tool checking claims across SEBI, NSE, BSE & Moneycontrol. |
| `/prediction-tracker` | **Prediction Tracker** | Quantitative forecast tracking, price target accuracy benchmarks, and historical records. |
| `/investor-education` | **Investor Education** | Four-source due diligence guides, regulatory checklists, F&O loss data, and financial glossary. |
| `/saved-reports` | **Saved Reports** | Permanent exportable forensic dossiers and evidence logs. |
| `/settings` | **System Settings** | Profile identity header, active session badges, and audit sensitivity preferences. |
| `/login` | **Authentication** | Single centered luxury login card with SSL encryption. |
| `/register` | **Registration** | Single centered luxury analyst registration card with regulatory consent. |

---

## ⚖️ Statutory Compliance & Non-Advisory Notice

> **IMPORTANT DISCLAIMER:**  
> FINTRUST AI is an independent academic and forensic market analytics research technology. It is **not** a SEBI-registered Investment Adviser (RIA), Research Analyst (RA), or Portfolio Manager.  
> 
> Outputs generated by this engine—including risk scores, evidence summaries, and quantitative price forecasts—are mathematical estimates for research and due diligence purposes only. They do not constitute financial advice, solicitation, endorsement, or guaranteed outcomes. Always consult a licensed SEBI-registered financial professional before executing capital allocation decisions.
