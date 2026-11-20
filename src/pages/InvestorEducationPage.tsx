import React, { useState, useMemo } from "react";
import {
  Clock,
  ArrowRight,
  BookOpen,
  Search,
  AlertTriangle,
  TrendingDown,
  BookMarked,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import {
  EDUCATIONAL_ARTICLES,
  FINANCIAL_GLOSSARY,
  F_AND_O_TOPICS,
  RISK_PRINCIPLES,
} from "../data/educationalContent";
import type { EducationArticle, GlossaryItem, FandOTopic, RiskPrinciple } from "../data/educationalContent";

type ActiveTab = "articles" | "glossary" | "fo" | "risks";

const DIFFICULTY_COLORS = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
} as const;

const SEVERITY_MAP = {
  critical: { label: "CRITICAL RISK", variant: "danger" as const },
  high: { label: "HIGH RISK", variant: "warning" as const },
  medium: { label: "MODERATE", variant: "info" as const },
};

const LEVEL_COLORS = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
} as const;

const CATEGORIES = [
  "All",
  "Risk Management",
  "Regulation",
  "Due Diligence",
  "Portfolio Management",
  "Fundamental Analysis",
  "Cryptocurrency",
  "Derivatives",
];

const GLOSSARY_CATEGORIES = ["All", "Valuation", "Market Dynamics", "Trading Mechanics", "Regulation", "Derivatives"];

export default function InvestorEducationPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("articles");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [glossaryCategory, setGlossaryCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState<EducationArticle | null>(null);
  const [expandedGlossary, setExpandedGlossary] = useState<string | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  /* ── Filtered lists ── */
  const filteredArticles = useMemo(() => {
    return EDUCATIONAL_ARTICLES.filter((a) => {
      const matchCat = selectedCategory === "All" || a.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const filteredGlossary = useMemo(() => {
    return FINANCIAL_GLOSSARY.filter((g) => {
      const matchCat = glossaryCategory === "All" || g.category === glossaryCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [glossaryCategory, searchQuery]);

  const TABS = [
    { id: "articles" as ActiveTab, label: "Education Articles", icon: BookOpen, count: EDUCATIONAL_ARTICLES.length },
    { id: "glossary" as ActiveTab, label: "Financial Glossary", icon: BookMarked, count: FINANCIAL_GLOSSARY.length },
    { id: "fo" as ActiveTab, label: "Futures & Options", icon: TrendingDown, count: F_AND_O_TOPICS.length },
    { id: "risks" as ActiveTab, label: "Risk Principles", icon: AlertTriangle, count: RISK_PRINCIPLES.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30">
              INVESTOR SHIELD
            </span>
            <span className="text-xs text-[#777365]">SEBI &amp; SEC Financial Literacy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            Investor Education &amp; Due Diligence
          </h1>
          <p className="text-xs sm:text-sm text-[#777365]">
            Regulatory guides, forensic checklists, financial glossary, and F&amp;O risk warnings.
          </p>
        </div>
      </div>

      {/* ── Critical Warning Banner ── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#FDF0D5] via-[#FFFEFA] to-[#FAF7F0] border border-[#D49A32]/40 shadow-warm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="danger" size="sm" dot>
              CRITICAL REGULATORY NOTICE
            </Badge>
            <span className="text-[11px] text-[#777365]">SEBI Act Sec 12A | PFUTP Reg 4</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#25251F] tracking-tight">
            Guaranteed Returns Are Legally Prohibited Under Market Regulations
          </h2>
          <p className="text-xs sm:text-sm text-[#777365] leading-relaxed">
            No registered investment adviser or research analyst can promise fixed, guaranteed returns.
            Learn how to identify social media manipulation schemes before they reach your portfolio.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="shrink-0 shadow-gold-glow"
          onClick={() => setActiveArticle(EDUCATIONAL_ARTICLES[0])}
        >
          Read Anti-Fraud Guide <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* ── Global Search ── */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles, glossary terms..."
          className="input-glass pl-9 text-xs w-full"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777365] hover:text-[#25251F]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E9E1D1] pb-3">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === id
                ? "bg-gradient-champagne border border-[#C49A45]/40 text-[#25251F] shadow-sm"
                : "text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === id ? "bg-[#C49A45]/20 text-[#8B6914]" : "bg-[#E9E1D1] text-[#777365]"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1 — EDUCATION ARTICLES
      ═══════════════════════════════════════════ */}
      {activeTab === "articles" && (
        <div className="space-y-5">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === c
                    ? "bg-gradient-champagne border-[#C49A45] text-[#25251F] shadow-sm"
                    : "bg-[#FFFEFA] border-[#E9E1D1] text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12">
              <EmptyState
                icon={BookOpen}
                title="No articles match your search"
                description={`No results found for "${searchQuery}" in category "${selectedCategory}".`}
                actionLabel="Clear Filters"
                onAction={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setActiveArticle(art)}
                  className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-5 cursor-pointer hover:border-[#D6A94F] transition-all duration-300 space-y-4 flex flex-col justify-between group relative overflow-hidden shadow-warm hover:shadow-warm-hover"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="info" size="sm">{art.category}</Badge>
                      <div className="flex items-center gap-1 text-[11px] text-[#777365]">
                        <Clock className="w-3 h-3" />
                        <span>{art.readTime} min</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#25251F] tracking-tight group-hover:text-[#A88032] transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#777365] line-clamp-3 leading-relaxed">{art.excerpt}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#E9E1D1]">
                    <div className="flex items-center justify-between">
                      <Badge variant={DIFFICULTY_COLORS[art.difficulty]} size="sm">{art.difficulty}</Badge>
                      <span className="text-[10px] text-[#777365]">{art.publishedAt}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {art.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#A88032] font-bold pt-1">
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2 — FINANCIAL GLOSSARY
      ═══════════════════════════════════════════ */}
      {activeTab === "glossary" && (
        <div className="space-y-5">
          {/* Category filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {GLOSSARY_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setGlossaryCategory(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  glossaryCategory === c
                    ? "bg-gradient-champagne border-[#C49A45] text-[#25251F] shadow-sm"
                    : "bg-[#FFFEFA] border-[#E9E1D1] text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {filteredGlossary.length === 0 ? (
            <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12">
              <EmptyState icon={BookMarked} title="No terms found" description={`No glossary terms match "${searchQuery}".`} actionLabel="Clear" onAction={() => setSearchQuery("")} />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGlossary.map((item: GlossaryItem) => (
                <div key={item.id} className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] overflow-hidden shadow-warm">
                  <button
                    onClick={() => setExpandedGlossary(expandedGlossary === item.id ? null : item.id)}
                    className="w-full p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F0] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-[#25251F]">{item.term}</span>
                      <Badge variant="info" size="sm">{item.category}</Badge>
                    </div>
                    {expandedGlossary === item.id ? (
                      <ChevronDown className="w-4 h-4 text-[#777365] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#777365] shrink-0" />
                    )}
                  </button>

                  {expandedGlossary === item.id && (
                    <div className="px-5 pb-5 space-y-3 border-t border-[#E9E1D1]">
                      <p className="text-sm text-[#25251F] leading-relaxed pt-3">{item.definition}</p>
                      {item.exampleOrFormula && (
                        <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                          <p className="text-[11px] font-bold text-[#777365] uppercase tracking-wider mb-1">Example / Formula</p>
                          <p className="text-xs text-[#25251F] leading-relaxed font-mono">{item.exampleOrFormula}</p>
                        </div>
                      )}
                      {item.regulatoryContext && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDF0D5] border border-[#D49A32]/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D49A32] shrink-0 mt-0.5" />
                          <p className="text-[11px] text-[#777365] leading-relaxed">
                            <strong className="text-[#25251F]">Regulatory Context:</strong> {item.regulatoryContext}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 3 — FUTURES & OPTIONS BASICS
      ═══════════════════════════════════════════ */}
      {activeTab === "fo" && (
        <div className="space-y-5">
          {/* SEBI Study Banner */}
          <div className="rounded-xl p-5 bg-[#FDE8E8] border border-[#D95353]/40 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-[#D95353] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#D95353]">SEBI Empirical Finding (Sept 2024)</p>
              <p className="text-xs text-[#25251F] leading-relaxed mt-1">
                <strong>93% of individual retail F&amp;O traders incurred net losses</strong> over a 3-year observation period.
                Average net loss per trader was approximately ₹2,00,000.
                Source: SEBI Study on Analysis of Profit and Loss of Individual Traders in Equity F&amp;O Segment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {F_AND_O_TOPICS.map((topic: FandOTopic) => (
              <div key={topic.id} className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-6 space-y-4 shadow-warm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-[#25251F] tracking-tight leading-snug">{topic.title}</h3>
                  <Badge variant={LEVEL_COLORS[topic.level]} size="sm">{topic.level}</Badge>
                </div>

                <p className="text-xs text-[#777365] leading-relaxed">{topic.summary}</p>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#25251F] uppercase tracking-wider">Key Points</p>
                  <ul className="space-y-1.5">
                    {topic.keyPoints.map((pt, idx) => (
                      <li key={idx} className="text-xs text-[#777365] leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C49A45] mt-1.5 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-[#FDE8E8] border border-[#D95353]/30 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D95353] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#D95353] font-semibold leading-relaxed">{topic.riskWarning}</p>
                </div>

                <p className="text-[10px] text-[#777365] border-t border-[#E9E1D1] pt-3">
                  Source: {topic.regulatorySource}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 4 — RISK PRINCIPLES
      ═══════════════════════════════════════════ */}
      {activeTab === "risks" && (
        <div className="space-y-4">
          {RISK_PRINCIPLES.map((rp: RiskPrinciple) => {
            const sev = SEVERITY_MAP[rp.severity];
            return (
              <div key={rp.id} className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] overflow-hidden shadow-warm">
                <button
                  onClick={() => setExpandedRisk(expandedRisk === rp.id ? null : rp.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F0] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={sev.variant} size="sm" dot>{sev.label}</Badge>
                    <span className="text-sm font-bold text-[#25251F] truncate">{rp.title}</span>
                  </div>
                  {expandedRisk === rp.id ? (
                    <ChevronDown className="w-4 h-4 text-[#777365] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#777365] shrink-0" />
                  )}
                </button>

                {expandedRisk === rp.id && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#E9E1D1]">
                    <p className="text-sm text-[#25251F] leading-relaxed pt-3">{rp.description}</p>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-[#D95353] uppercase tracking-wider">🚩 Red Flags to Watch For</p>
                      <ul className="space-y-2">
                        {rp.redFlags.map((flag, idx) => (
                          <li key={idx} className="text-xs text-[#777365] leading-relaxed flex items-start gap-2 p-2 rounded-lg bg-[#FAF7F0] border border-[#E9E1D1]">
                            <span className="text-[#D95353] font-bold shrink-0">!</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                      <ExternalLink className="w-3.5 h-3.5 text-[#777365] shrink-0" />
                      <p className="text-[11px] text-[#777365]">
                        <strong className="text-[#25251F]">Regulatory Reference:</strong> {rp.regulatoryReference}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ARTICLE DETAIL MODAL
      ═══════════════════════════════════════════ */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#25251F]/40 backdrop-blur-sm"
            onClick={() => setActiveArticle(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#FFFEFA] border border-[#E9E1D1] shadow-2xl z-10 max-h-[88vh] overflow-y-auto space-y-5 animate-slide-up text-[#25251F]">
            <div className="sticky top-0 bg-[#FFFEFA] border-b border-[#E9E1D1] px-6 pt-6 pb-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">{activeArticle.category}</Badge>
                    <Badge variant={DIFFICULTY_COLORS[activeArticle.difficulty]} size="sm">{activeArticle.difficulty}</Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#25251F] tracking-tight leading-snug">
                    {activeArticle.title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-[#777365] hover:text-[#25251F] p-2 rounded-lg cursor-pointer hover:bg-[#F1EBDD] transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-6">
              <p className="text-sm text-[#A88032] font-semibold leading-relaxed italic">
                "{activeArticle.excerpt}"
              </p>

              {/* Full content rendered as text sections */}
              <div className="space-y-4 text-sm text-[#25251F] leading-relaxed">
                {activeArticle.fullContent.trim().split("\n").map((line, i) => {
                  if (line.startsWith("### ")) {
                    return <h3 key={i} className="text-base font-bold text-[#25251F] mt-4">{line.replace("### ", "")}</h3>;
                  }
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <p key={i} className="font-bold">{line.replace(/\*\*/g, "")}</p>;
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div key={i} className="flex items-start gap-2 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C49A45] mt-2 shrink-0" />
                        <span className="text-[#777365] text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#25251F]">$1</strong>') }} />
                      </div>
                    );
                  }
                  if (line.startsWith("|")) {
                    return null; // skip table lines for simplicity
                  }
                  if (line.trim() === "") return null;
                  return <p key={i} className="text-xs text-[#777365] leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#25251F]">$1</strong>') }} />;
                })}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {activeArticle.tags.map((t) => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#777365]">
                <div className="space-y-0.5">
                  <p>Published: {activeArticle.publishedAt} · FINTRUST Regulatory Desk</p>
                  {activeArticle.officialSource && (
                    <p className="font-semibold text-[#25251F]">Source: {activeArticle.officialSource}</p>
                  )}
                  {activeArticle.regulatorySection && (
                    <p className="font-mono text-[10px]">Ref: {activeArticle.regulatorySection}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveArticle(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
