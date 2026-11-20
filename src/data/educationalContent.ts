export interface GlossaryItem {
  id: string;
  term: string;
  category: "Valuation" | "Market Dynamics" | "Trading Mechanics" | "Regulation" | "Derivatives";
  definition: string;
  exampleOrFormula?: string;
  regulatoryContext?: string;
}

export interface FandOTopic {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  keyPoints: string[];
  riskWarning: string;
  regulatorySource: string;
}

export interface RiskPrinciple {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  description: string;
  redFlags: string[];
  regulatoryReference: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  excerpt: string;
  fullContent: string;
  category: string;
  readTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  publishedAt: string;
  tags: string[];
  officialSource: string;
  regulatorySection?: string;
}

// ---------------------------------------------------------------------------
// 1. FORENSIC ARTICLES WITH REGULATORY ACCREDITATION
// ---------------------------------------------------------------------------
export const EDUCATIONAL_ARTICLES: EducationArticle[] = [
  {
    id: "art-01",
    title: "How to Spot a Social Media Pump-and-Dump Scheme",
    excerpt: "Learn the forensic warning signs of coordinated market manipulation on Telegram and YouTube, and understand SEBI's strict prohibition of unfair trade practices.",
    fullContent: `
### Executive Summary
Coordinated pump-and-dump operations rely on asymmetric information and retail hype. Unregistered promoters accumulate illiquid small-cap micro-stocks, syndicate aggressive 'multibagger' price targets across social media channels, and liquidate their holdings into the resulting retail buying surge.

### The Anatomy of the Scheme
1. **Accumulation Phase:** Operators quietly accumulate significant equity positions in micro-cap or SME securities with low free-float.
2. **Promotional Syndicate:** Coordinated posts appear across Telegram channels, WhatsApp groups, and Instagram reels claiming 'insider tips', '10x guaranteed returns', or undisclosed corporate turnaround events.
3. **Retail Inflow & Artificial Volume:** Retail investors place market orders, triggering upper circuit limits and creating the illusion of organic demand.
4. **The Dump:** Syndicates execute bulk block sales at the peak, leaving retail investors trapped with illiquid shares hitting consecutive lower circuit limits.

### Regulatory Precedent & SEBI Guidelines
Under Section 12A of the Securities and Exchange Board of India (SEBI) Act, 1992, read with the SEBI (Prohibition of Fraudulent and Unfair Trade Practices relating to Securities Market) Regulations, 2003 (PFUTP):
- Disseminating unverified statements calculated to induce the purchase or sale of securities is a non-bailable regulatory violation.
- Influencers accepting undisclosed consideration from company promoters face disgorgement of illegal gains, market access bans, and financial penalties up to ₹25 crore or 3x the illegitimate profit.
    `,
    category: "Risk Management",
    readTime: 8,
    difficulty: "beginner",
    publishedAt: "2024-11-15",
    tags: ["Pump and Dump", "PFUTP", "Microcaps", "Forensics"],
    officialSource: "SEBI (PFUTP) Regulations, 2003",
    regulatorySection: "Sec 12A SEBI Act / Reg 4(2) PFUTP",
  },
  {
    id: "art-02",
    title: "SEBI Regulations for Investment Advice: RIA vs Research Analyst (RA)",
    excerpt: "A comprehensive breakdown of legal investment advisory standards in India, registration mandates, and the legal distinction between general education and regulated recommendations.",
    fullContent: `
### The Regulatory Boundary
In India, the dissemination of financial opinions is strictly governed by two distinct frameworks under SEBI oversight:
1. **SEBI (Investment Advisers) Regulations, 2013 (IA Regulations)**
2. **SEBI (Research Analysts) Regulations, 2014 (RA Regulations)**

### Key Differences Between RIA and RA
| Parameter | Registered Investment Adviser (RIA) | Research Analyst (RA) | Unregistered Content Creator |
| :--- | :--- | :--- | :--- |
| **Mandate** | Holistic financial planning and client-tailored advice | Research reports, ratings, and price target forecasts | Generic educational commentary only |
| **Fee Structure** | Pure fee-only from client; zero product commissions | Subscription or institutional employer | Social monetization, ad revenue, sponsorships |
| **Fiduciary Duty** | Absolute fiduciary duty to the individual client | Fair research governance & conflict-of-interest disclosure | No statutory fiduciary duty |
| **Price Targets** | Custom risk-profiled asset allocation | Documented methodology & risk factors required | Legally prohibited from issuing buy/sell calls |

### The "Educational Disclaimer" Myth
Many social media creators include disclaimers such as *"For educational purposes only — not financial advice"* while proceeding to give specific stock recommendations, entry levels, and stop-losses. 
SEBI enforcement orders (including rulings against illicit telegram advisory syndicates) have firmly established that **substance takes precedence over form**. Issuing specific buy/sell guidance constitutes regulated investment research regardless of disclaimer boilerplate.
    `,
    category: "Regulation",
    readTime: 12,
    difficulty: "intermediate",
    publishedAt: "2024-11-10",
    tags: ["SEBI", "RIA", "Research Analyst", "Compliance"],
    officialSource: "SEBI (Investment Advisers) Regulations, 2013",
    regulatorySection: "SEBI/HO/MIRSD/DOS3/CIR/P/2018/115",
  },
  {
    id: "art-03",
    title: "Forensic Evaluation of a Finfluencer's Documented Track Record",
    excerpt: "Beyond vanity metrics: how to mathematically evaluate hit rates, survivorship bias, risk-adjusted returns, and authentic P&L statements.",
    fullContent: `
### Common Track Record Illusions
1. **Survivorship Bias:** Creators frequently delete wrong calls from public feeds while relentlessly pinning their rare 2x winners. A 90% claimed hit rate often reduces to 35% when all deleted historical forecasts are tracked.
2. **Inspect Verified Broker P&L Links:** Screenshots of profit numbers can be forged in browser developer tools in under 10 seconds. Only accept cryptographically signed, broker-hosted verified P&L URLs (such as Zerodha Verified P&L or Sensibull Verified Portfolios).
3. **Asymmetric Risk-to-Reward:** A trader winning 8 out of 10 trades can still lose money if their 8 wins average +₹5,000 while their 2 unstopped losses average -₹30,000 each.
4. **Sample Size Requirements:** In quantitative finance, a sample size under 30 trades has near-zero statistical significance ($p > 0.05$). Any claim based on 3 consecutive winning trades is indistinguishable from random coin flips.
    `,
    category: "Due Diligence",
    readTime: 10,
    difficulty: "intermediate",
    publishedAt: "2024-11-05",
    tags: ["Track Record", "Survivorship Bias", "P&L Verification"],
    officialSource: "CFA Institute Standards of Practice Handbook",
    regulatorySection: "Standard III(D) Performance Presentation",
  },
  {
    id: "art-04",
    title: "The Math of Futures & Options: Why 93% of Retail Traders Lose Capital",
    excerpt: "An empirical examination of SEBI's landmark derivatives study detailing average net losses of ₹2 lakh per trader, turnover charges, and structural probability disadvantages.",
    fullContent: `
### The SEBI Landmark Study on Equity Derivatives
In January 2023 and updated in September 2024, SEBI conducted an exhaustive empirical analysis across all active individual retail traders executing trades in the National Stock Exchange (NSE) Equity Derivatives (F&O) segment.

### Key Official Findings
- **93% Loss Ratio:** Over 9 out of 10 individual retail F&O traders incurred net losses over FY22–FY24.
- **Average Loss Size:** Loss-making retail traders incurred an average net loss of **₹2,00,000 (Two Lakh Rupees)** inclusive of transaction costs.
- **Transaction Costs Friction:** For every ₹100 of gross trading loss, retail traders paid an additional **₹28 in transaction fees, STT, exchange turnover charges, and brokerage**.
- **The Top 1% Reality:** Only the top 1% of active individual traders captured over 75% of the total net profits in the derivatives market.

### Structural Hazards of Out-of-the-Money (OTM) Options
Retail investors are routinely enticed by cheap ₹5 or ₹10 'hero or zero' options promoted by social media influencers. Due to rapid **Theta (time decay)**, options expiring out-of-the-money expire at ₹0 with a statistical probability exceeding 80%.
    `,
    category: "Derivatives",
    readTime: 11,
    difficulty: "intermediate",
    publishedAt: "2024-10-30",
    tags: ["F&O", "SEBI Study", "Options", "Theta Decay"],
    officialSource: "SEBI Study on Analysis of Profit and Loss of Individual Traders in Equity F&O Segment",
    regulatorySection: "PR No. 04/2023 & SEBI Consultation Paper 2024",
  },
  {
    id: "art-05",
    title: "Portfolio Diversification & Uncompensated Risk",
    excerpt: "Why placing concentrated capital into single social media stock tips violates the fundamental theorem of modern portfolio theory.",
    fullContent: `
### Specific Risk vs Market Risk
Total investment risk comprises:
$$\\sigma_{\\text{total}}^2 = \\sigma_{\\text{systematic}}^2 + \\sigma_{\\text{idiosyncratic}}^2$$

- **Systematic Risk:** Broad economic events (interest rate shocks, inflation, geopolitical shifts) that affect all equities. This risk cannot be eliminated through diversification.
- **Idiosyncratic (Company-Specific) Risk:** Accounting fraud, promoter pledge defaults, loss of key customers, or governance failures. 

By diversifying across 20–30 uncorrelated securities, idiosyncratic risk is reduced by over 90%. Concentrating savings in 1 or 2 viral stock tips subjects your capital to massive uncompensated risk.
    `,
    category: "Portfolio Management",
    readTime: 9,
    difficulty: "beginner",
    publishedAt: "2024-10-25",
    tags: ["Diversification", "Modern Portfolio Theory", "Risk"],
    officialSource: "Markowitz Modern Portfolio Theory / SEBI Mutual Fund Categorization Guidelines",
    regulatorySection: "SEBI/HO/IMD/DF3/CIR/P/2017/114",
  },
];

// ---------------------------------------------------------------------------
// 2. FINANCIAL & REGULATORY GLOSSARY
// ---------------------------------------------------------------------------
export const FINANCIAL_GLOSSARY: GlossaryItem[] = [
  {
    id: "g-01",
    term: "P/E Ratio (Price-to-Earnings)",
    category: "Valuation",
    definition: "The ratio of a company's current share price to its per-share earnings. It indicates how much investors are willing to pay for every ₹1 of profit.",
    exampleOrFormula: "Formula: P/E = Market Price per Share / Earnings Per Share (EPS)",
    regulatoryContext: "SEBI requires listed firms to disclose both Basic and Diluted EPS in quarterly financial submissions.",
  },
  {
    id: "g-02",
    term: "Beta (β)",
    category: "Market Dynamics",
    definition: "A statistical measure of a security's volatility in comparison to the broader market index (e.g. NIFTY 50). A beta > 1.0 implies higher volatility than the benchmark.",
    exampleOrFormula: "Beta = Covariance(Stock, Market) / Variance(Market). A stock with β = 1.5 moves 15% when the index moves 10%.",
    regulatoryContext: "Used in mutual fund scheme information documents to disclose portfolio risk profile.",
  },
  {
    id: "g-03",
    term: "Circuit Breakers & Price Bands",
    category: "Market Dynamics",
    definition: "Exchange-mandated trading halt mechanisms that freeze order execution when a stock or market index experiences extreme price swings (typically 5%, 10%, or 20%) within a single session.",
    exampleOrFormula: "Prevents runaway liquidity collapse or manipulation during panic selling or speculative frenzy.",
    regulatoryContext: "Operated by NSE & BSE under SEBI Circular CIR/MRD/DP/25/2013.",
  },
  {
    id: "g-04",
    term: "Promoter Pledge",
    category: "Valuation",
    definition: "When company founders or controlling shareholders use their personal shareholding as collateral to secure bank loans or corporate debt.",
    exampleOrFormula: "If stock price falls below margin maintenance levels, lenders may invoke the pledge and dump shares on the open market.",
    regulatoryContext: "Listed entities must disclose pledged promoter holdings within 2 working days under SEBI SAST Regulations.",
  },
  {
    id: "g-05",
    term: "Free Float Market Capitalization",
    category: "Market Dynamics",
    definition: "The equity value of shares that are readily available for public trading on stock exchanges, excluding promoter, government, or strategic lock-in holdings.",
    exampleOrFormula: "Free Float = Share Price × (Total Shares - Locked Promoter Shares)",
    regulatoryContext: "Used by NIFTY and SENSEX index calculation methodologies.",
  },
  {
    id: "g-06",
    term: "Options Strike Price",
    category: "Derivatives",
    definition: "The fixed price at which the owner of an options contract can buy (Call option) or sell (Put option) the underlying asset prior to or upon contract expiration.",
    exampleOrFormula: "If NIFTY is trading at 24,000, a 24,200 Call option has a strike price of 24,200.",
    regulatoryContext: "Standardized by exchange clearing corporations (NSE Clearing Ltd).",
  },
  {
    id: "g-07",
    term: "Theta (Time Decay)",
    category: "Derivatives",
    definition: "The rate of decline in the value of an option contract over time. Because options have fixed expiry dates, their extrinsic time value shrinks each day until expiration.",
    exampleOrFormula: "Option Premium = Intrinsic Value + Extrinsic (Time) Value. As days to expiry approach zero, time value collapses to 0.",
    regulatoryContext: "A primary contributor to why 93% of retail option buyers lose money (SEBI Study 2023).",
  },
  {
    id: "g-08",
    term: "Stop-Loss Order",
    category: "Trading Mechanics",
    definition: "A conditional market or limit order placed with a broker to liquidate an open position when the price breaches a predefined threshold to truncate downside loss.",
    exampleOrFormula: "Buy stock at ₹1,000; place Stop-Loss at ₹950 to cap maximum loss to ₹50 (5%).",
    regulatoryContext: "Mandatory risk control recommendation under SEBI Investor Protection guidelines.",
  },
  {
    id: "g-09",
    term: "SEBI Registered Research Analyst (RA)",
    category: "Regulation",
    definition: "An individual or corporate entity registered under SEBI (Research Analysts) Regulations, 2014, certified by NISM Series XV, authorized to issue equity research reports and ratings.",
    exampleOrFormula: "Registration format: INH00000XXXX. Can be independently verified on the official SEBI portal.",
    regulatoryContext: "Subject to capital adequacy, mandatory conflict disclosures, and personal trading blackout periods.",
  },
  {
    id: "g-10",
    term: "Disgorgement of Profits",
    category: "Regulation",
    definition: "An equitable remedy ordered by SEBI requiring violators who earned unlawful gains through front-running, manipulation, or insider trading to forfeit all profits plus interest.",
    exampleOrFormula: "SEBI orders disgorgement into the Investor Protection and Education Fund (IPEF).",
    regulatoryContext: "Section 11B of the SEBI Act, 1992.",
  },
  {
    id: "g-11",
    term: "Free Cash Flow (FCF)",
    category: "Valuation",
    definition: "The cash generated by a business after accounting for cash outflows to support operations and maintain its capital assets.",
    exampleOrFormula: "FCF = Cash from Operations - Capital Expenditures (CapEx)",
    regulatoryContext: "Key forensic metric to identify divergence between reported accounting profits and true cash generation.",
  },
  {
    id: "g-12",
    term: "Margin Call",
    category: "Trading Mechanics",
    definition: "A broker's formal demand for an investor to deposit additional money or securities into their margin trading account to meet minimum maintenance margin requirements.",
    exampleOrFormula: "If margin shortfall is not met within the deadline, the broker will square off the position at market price.",
    regulatoryContext: "Peak margin norms enforced under SEBI Circular SEBI/HO/MIRSD/DOP/CIR/P/2020/146.",
  },
];

// ---------------------------------------------------------------------------
// 3. FUTURES & OPTIONS (F&O) BASICS & RISK WARNINGS
// ---------------------------------------------------------------------------
export const F_AND_O_TOPICS: FandOTopic[] = [
  {
    id: "fo-01",
    title: "Call vs. Put Options Explained",
    level: "Beginner",
    summary: "A Call option grants the buyer the right (not obligation) to buy an asset at the strike price before expiry. A Put option grants the right to sell.",
    keyPoints: [
      "Buyers pay a non-refundable upfront premium to the option seller (writer).",
      "Maximum loss for an option buyer is limited to 100% of the premium paid.",
      "Maximum loss for an naked option seller is theoretically unlimited.",
      "Option prices are influenced by underlying price, time to expiry, implied volatility, and interest rates.",
    ],
    riskWarning: "Buying short-dated out-of-the-money options is mathematically equivalent to lottery tickets with negative expected value (-EV).",
    regulatorySource: "NSE Equity Derivatives Investor Education Manual",
  },
  {
    id: "fo-02",
    title: "The Greeks: Delta, Gamma, Theta & Vega",
    level: "Intermediate",
    summary: "The four primary risk sensitivity metrics used to price derivatives and calculate hedging ratios.",
    keyPoints: [
      "Delta (Δ): Measures the rate of change of option price per ₹1 move in the underlying asset.",
      "Gamma (Γ): Measures the rate of change of Delta itself. Accelerates near expiry.",
      "Theta (Θ): Quantifies daily time decay. Accelerates exponentially in the final 7 trading days.",
      "Vega (ν): Measures price sensitivity to shifts in market Implied Volatility (IV).",
    ],
    riskWarning: "High-IV environments lead to inflated option premiums. An IV collapse post-earnings destroys option value even if the direction is right.",
    regulatorySource: "National Institute of Securities Markets (NISM) Series VIII: Equity Derivatives",
  },
  {
    id: "fo-03",
    title: "The 93% Loss Reality: Empirical Findings from SEBI",
    level: "Intermediate",
    summary: "An official analysis of 45.8 lakh individual retail derivative traders revealing that 93% lose capital over a 3-year observation window.",
    keyPoints: [
      "Average net loss per retail trader was approximately ₹2,00,000.",
      "Over 75% of traders with losses continued trading into the subsequent year.",
      "Algorithmic institutional desks and proprietary firms captured the counterpart profits.",
      "High turnover generates heavy charges (Securities Transaction Tax, stamp duty, brokerage) that erode capital regardless of win rate.",
    ],
    riskWarning: "Retail traders should never trade derivatives with borrowed funds or essential living capital.",
    regulatorySource: "SEBI Study on Profit & Loss of Individual Traders (Sept 2024)",
  },
  {
    id: "fo-04",
    title: "Futures Contracts & Leverage Mechanics",
    level: "Advanced",
    summary: "Futures are binding legal agreements to buy or sell an asset at an agreed price on a specified future date with mandatory daily Mark-to-Market (MTM) settlement.",
    keyPoints: [
      "Unlike options, futures have symmetric two-way risk: buyers and sellers both face unlimited loss potential.",
      "Traders deposit a fraction of contract value (SPAN margin + Exposure margin), typically 15%–25%.",
      "A 20% margin gives 5x leverage: a 4% adverse move in the stock eliminates 20% of deposited capital.",
      "Daily MTM losses are directly debited from the client's trading ledger by the end of each session.",
    ],
    riskWarning: "Sudden gap-down openings can exceed available margins, forcing immediate liquidation and leaving the client in debt to the broker.",
    regulatorySource: "SEBI Master Circular for Stock Exchanges and Clearing Corporations (2024)",
  },
];

// ---------------------------------------------------------------------------
// 4. FINANCIAL RISK PRINCIPLES & RED FLAGS
// ---------------------------------------------------------------------------
export const RISK_PRINCIPLES: RiskPrinciple[] = [
  {
    id: "rp-01",
    title: "The Guaranteed Return Fallacy",
    severity: "critical",
    description: "In market economies, return is compensation for bearing risk. Any individual or scheme promising risk-free, guaranteed returns above the sovereign benchmark (RBI repo rate ~6.5%) is deceptive.",
    redFlags: [
      "Promises of '1% daily profit' or '20% monthly fixed return'",
      "Claims of '100% winning accuracy with no stop-loss needed'",
      "Pressure to deposit funds into private personal UPI addresses or crypto wallets",
    ],
    regulatoryReference: "Banning of Unregulated Deposit Schemes Act, 2019 (BUDS Act)",
  },
  {
    id: "rp-02",
    title: "Asymmetric Information & Promotional Shilling",
    severity: "high",
    description: "Influencers often receive equity warrants, cash retainers, or private placement shares from company promoters in exchange for publishing promotional videos disguised as authentic personal research.",
    redFlags: [
      "Sudden multi-influencer coverage of an obscure SME or micro-cap stock with no institutional ownership",
      "Emphasis on 'future multi-billion dollar contracts' without audited BSE/NSE corporate announcements",
      "Lack of SEBI Research Analyst registration number in video description or screen footer",
    ],
    regulatoryReference: "Advertising Standards Council of India (ASCI) Influencer Guidelines & SEBI PFUTP Reg 4",
  },
  {
    id: "rp-03",
    title: "The Leverage Trap",
    severity: "high",
    description: "Using leverage amplifies losses proportionally. With 10x leverage, a 10% decline wipes out 100% of total capital, preventing the investor from participating in future recovery.",
    redFlags: [
      "Advisors urging you to borrow personal loans or credit card advances to fund intraday setups",
      "Offshore unregistered brokers offering 100x or 500x leverage on crypto and CFDs",
      "Failure to utilize strict stop-loss orders on every leveraged trade",
    ],
    regulatoryReference: "SEBI Peak Margin Regulations & RBI Guidelines on Unauthorized Forex Trading Platforms",
  },
];
