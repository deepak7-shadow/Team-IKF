import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Calendar,
  Share2,
  Copy,
  Check,
  Building2,
  Globe,
  DollarSign,
  Newspaper,
  Compass,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  fetchTopicNewsInsights,
  type TopicNewsResponse,
  type VerifiedNewsItem,
} from "../lib/api";

const QUICK_TOPICS = [
  { slug: "gold", label: "Gold and Silver", icon: "🪙", category: "Commodities" },
  { slug: "nifty-50", label: "NIFTY 50 and SENSEX", icon: "📈", category: "Benchmark Indices" },
  { slug: "banking-sector", label: "Banking Sector", icon: "🏦", category: "Sectors" },
  { slug: "it-sector", label: "IT Sector", icon: "💻", category: "Sectors" },
  { slug: "crude-oil", label: "Crude Oil", icon: "🛢️", category: "Commodities" },
  { slug: "reliance", label: "Reliance Industries", icon: "🏢", category: "Equities" },
  { slug: "tata-motors", label: "Tata Motors", icon: "🚗", category: "Equities" },
  { slug: "automobile-sector", label: "Automobile Sector", icon: "🚙", category: "Sectors" },
  { slug: "ai-stocks", label: "Artificial Intelligence Stocks", icon: "🤖", category: "Tech" },
  { slug: "cryptocurrency", label: "Cryptocurrency", icon: "⚡", category: "Digital Assets" },
  { slug: "global-markets", label: "Global Financial Markets", icon: "🌐", category: "Macro" },
];

export default function MarketInsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopic = searchParams.get("topic") || "gold";

  const [searchQuery, setSearchQuery] = useState(initialTopic);
  const [currentQuery, setCurrentQuery] = useState(initialTopic);
  const [data, setData] = useState<TopicNewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>("all");
  const [copiedLink, setCopiedLink] = useState(false);

  // Load insights for selected topic
  const loadInsights = useCallback(async (topic: string, forceRefresh: boolean = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetchTopicNewsInsights(topic, forceRefresh);
      setData(res);
      setCurrentQuery(topic);
      setSearchParams({ topic });
    } catch (err: any) {
      console.error("Failed to load topic insights:", err);
      setError(err?.message || "Failed to retrieve real-time market news. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    loadInsights(initialTopic);
  }, [initialTopic, loadInsights]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    loadInsights(searchQuery.trim());
  };

  const handleQuickTopicClick = (slug: string) => {
    setSearchQuery(slug);
    loadInsights(slug);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter news items
  const filteredNews = data?.news_items.filter((item) => {
    if (activeSourceFilter === "all") return true;
    if (activeSourceFilter === "regulatory") return item.evidence_tier === "tier_1_regulatory";
    if (activeSourceFilter === "exchange") return item.evidence_tier === "tier_1_exchange";
    if (activeSourceFilter === "media") return item.evidence_tier === "tier_2_financial_media";
    if (activeSourceFilter === "primary") return item.source_type === "primary";
    return true;
  }) || [];

  const snap = data?.market_snapshot;
  const analysis = data?.impact_analysis;

  // Sentiment colors
  const sentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "Potentially Positive":
        return { text: "text-[#258B65]", bg: "bg-[#D8F3E5]", border: "border-[#258B65]/30", icon: TrendingUp };
      case "Potentially Negative":
        return { text: "text-[#D95353]", bg: "bg-[#FDE8E8]", border: "border-[#D95353]/30", icon: TrendingDown };
      case "Mixed":
        return { text: "text-[#D49A32]", bg: "bg-[#FEF3D6]", border: "border-[#D49A32]/30", icon: HelpCircle };
      default:
        return { text: "text-[#777365]", bg: "bg-[#FAF7F0]", border: "border-[#E9E1D1]", icon: Minus };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/35 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#258B65] animate-pulse" />
              LIVE MARKET INTELLIGENCE
            </span>
            <span className="text-xs text-[#777365]">SEBI · NSE · BSE · Moneycontrol · Global Wire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25251F]">
            Financial News &amp; Market Insights
          </h1>
          <p className="text-xs sm:text-sm text-[#777365] mt-1 max-w-2xl">
            Real-time multi-source financial journalism, exchange disclosures, and evidence-grounded explanations of market movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-[#E9E1D1] hover:border-[#C49A45] text-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 mr-1 text-[#258B65]" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
            {copiedLink ? "Link Copied" : "Share"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInsights(currentQuery, true)}
            disabled={isRefreshing || isLoading}
            className="border-[#E9E1D1] hover:border-[#C49A45] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-[#C49A45]" : ""}`} />
            Refresh Feeds
          </Button>
        </div>
      </div>

      {/* Topic Search & Quick Filters */}
      <Card className="p-5 border-[#E9E1D1] bg-[#FFFEFA] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <Search className="w-5 h-5 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any stock, commodity, sector or theme (e.g. Gold, Crude Oil, Banking, Reliance, TCS)..."
            className="w-full bg-[#FAF7F0] border border-[#E9E1D1] focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 rounded-xl pl-11 pr-28 py-3 text-sm text-[#25251F] placeholder-[#777365]/60 focus:outline-none transition-all"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 shadow-xs"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Explore"}
          </Button>
        </form>

        {/* Quick Topic Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#777365] uppercase tracking-wider">
              Popular Market Themes
            </span>
            <span className="text-[11px] text-[#A88032] font-semibold">
              Instant Multi-Source Audit
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
            {QUICK_TOPICS.map((item) => {
              const isActive = currentQuery.toLowerCase() === item.slug.toLowerCase() ||
                               data?.topic_slug === item.slug;
              return (
                <button
                  key={item.slug}
                  onClick={() => handleQuickTopicClick(item.slug)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-gradient-champagne text-[#25251F] border-[#C49A45] shadow-xs font-bold"
                      : "bg-[#FAF7F0] text-[#777365] border-[#E9E1D1] hover:border-[#C49A45]/60 hover:text-[#25251F]"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <Card className="p-6 border-[#E9E1D1] animate-pulse">
            <div className="h-6 bg-[#E9E1D1]/60 rounded w-1/4 mb-4" />
            <div className="h-10 bg-[#E9E1D1]/40 rounded w-1/2 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="h-16 bg-[#E9E1D1]/30 rounded" />
              <div className="h-16 bg-[#E9E1D1]/30 rounded" />
              <div className="h-16 bg-[#E9E1D1]/30 rounded" />
              <div className="h-16 bg-[#E9E1D1]/30 rounded" />
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 bg-[#E9E1D1]/30 rounded-2xl animate-pulse" />
              <div className="h-48 bg-[#E9E1D1]/30 rounded-2xl animate-pulse" />
            </div>
            <div className="h-96 bg-[#E9E1D1]/30 rounded-2xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <Card className="p-6 border-[#D95353]/30 bg-[#FDE8E8]/50 text-center">
          <AlertTriangle className="w-8 h-8 text-[#D95353] mx-auto mb-2" />
          <h3 className="font-bold text-[#D95353] text-sm">Data Retrieval Interrupted</h3>
          <p className="text-xs text-[#777365] mt-1 max-w-md mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInsights(currentQuery, true)}
            className="mt-4 border-[#D95353]/40 text-[#D95353]"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Main Content Area */}
      {!isLoading && data && snap && analysis && (
        <div className="space-y-6">
          {/* 1. Live Market Snapshot Hero Banner */}
          <Card className="p-6 border-[#E4C477]/60 bg-gradient-to-br from-[#FFFEFA] via-[#FDFAF3] to-[#FBF6EA] relative overflow-hidden shadow-xs">
            {/* Top ambient highlight */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E4C477]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Asset Name & Core Quote */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-[#C49A45] text-[#9E7828] font-bold text-[10px]">
                    {data.category.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[#777365] font-semibold">
                    {snap.market} · {snap.symbol}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#258B65] bg-[#D8F3E5] px-2 py-0.5 rounded-full border border-[#258B65]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#258B65]" />
                    {snap.is_delayed ? "15-Min Delayed Feed" : "Live Exchange Feed"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#25251F] tracking-tight">
                  {data.topic_name}
                </h2>

                <div className="flex items-baseline gap-3">
                  {snap.current_price !== null && snap.current_price !== undefined ? (
                    <>
                      <span className="text-3xl sm:text-4xl font-black text-[#25251F] tracking-tight">
                        {snap.currency} {snap.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-[#777365] font-medium">
                        {snap.unit}
                      </span>
                      {snap.change_percent !== null && snap.change_percent !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-lg ${
                            snap.change_percent >= 0
                              ? "bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30"
                              : "bg-[#FDE8E8] text-[#D95353] border border-[#D95353]/30"
                          }`}
                        >
                          {snap.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {snap.change_percent >= 0 ? "+" : ""}{snap.change_percent.toFixed(2)}%
                          {snap.change_value !== null && snap.change_value !== undefined && (
                            <span className="text-xs opacity-75">
                              ({snap.currency} {snap.change_value >= 0 ? "+" : ""}{snap.change_value.toFixed(2)})
                            </span>
                          )}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-bold text-[#777365]">
                      Exchange Quote Updating (Market Closed or Restructuring)
                    </span>
                  )}
                </div>
              </div>

              {/* Day High / Low / 52W Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3 rounded-xl">
                  <div className="text-[10px] text-[#777365] uppercase font-bold tracking-wider">Day High</div>
                  <div className="text-sm font-extrabold text-[#25251F] mt-0.5">
                    {snap.high_today ? `${snap.currency} ${snap.high_today.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>

                <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3 rounded-xl">
                  <div className="text-[10px] text-[#777365] uppercase font-bold tracking-wider">Day Low</div>
                  <div className="text-sm font-extrabold text-[#25251F] mt-0.5">
                    {snap.low_today ? `${snap.currency} ${snap.low_today.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>

                <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3 rounded-xl">
                  <div className="text-[10px] text-[#777365] uppercase font-bold tracking-wider">52-Week Range</div>
                  <div className="text-xs font-bold text-[#25251F] mt-1">
                    {snap.fifty_two_week_low ? `${snap.currency} ${snap.fifty_two_week_low.toLocaleString("en-IN")}` : "—"} –{" "}
                    {snap.fifty_two_week_high ? `${snap.currency} ${snap.fifty_two_week_high.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>

                <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3 rounded-xl">
                  <div className="text-[10px] text-[#777365] uppercase font-bold tracking-wider">Session Bias</div>
                  <div className="text-xs font-bold capitalize mt-1 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        snap.trend === "increasing"
                          ? "bg-[#258B65]"
                          : snap.trend === "decreasing"
                          ? "bg-[#D95353]"
                          : "bg-[#D49A32]"
                      }`}
                    />
                    {snap.trend}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Footer Bar */}
            <div className="mt-4 pt-3 border-t border-[#E9E1D1] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#777365] gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C49A45]" />
                <span>{snap.provider}</span>
                <span>·</span>
                <span>As of {new Date(snap.last_updated_at).toLocaleTimeString("en-IN")} IST</span>
              </div>
              <div className="text-[10px]">
                {snap.notes || "Strictly non-fabricated pricing data. Delayed by 15 mins for non-direct feeds."}
              </div>
            </div>
          </Card>

          {/* 2. Main Two-Column Layout: AI Analysis (Left) & Verified Feed (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT 2 COLUMNS: Structured 6-Section AI Explanation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Impact & Outlook Card */}
              <Card className="p-6 border-[#E9E1D1] bg-[#FFFEFA]">
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E9E1D1]">
                  <div>
                    <span className="text-[10px] font-bold text-[#777365] uppercase tracking-wider block">
                      SYNTHESIZED MARKET OUTLOOK
                    </span>
                    <h3 className="font-extrabold text-base text-[#25251F]">
                      Evidence-Based Impact Assessment
                    </h3>
                  </div>

                  {(() => {
                    const sb = sentimentBadge(analysis.overall_sentiment);
                    const Icon = sb.icon;
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sb.bg} ${sb.text} ${sb.border}`}>
                        <Icon className="w-4 h-4" />
                        <span>{analysis.overall_sentiment}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88032] block">
                      Short-Term Horizon (1–30 Days)
                    </span>
                    <p className="text-xs text-[#25251F] font-medium mt-1 leading-relaxed">
                      {analysis.short_term_outlook}
                    </p>
                  </div>

                  <div className="bg-[#FAF7F0] border border-[#E9E1D1] p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88032] block">
                      Long-Term Horizon (1–12 Months)
                    </span>
                    <p className="text-xs text-[#25251F] font-medium mt-1 leading-relaxed">
                      {analysis.long_term_outlook}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Section A: What's Happening? */}
              <Card className="p-6 border-[#E9E1D1] bg-[#FFFEFA]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-center text-xs font-black text-[#C49A45]">
                    A
                  </span>
                  <h3 className="font-extrabold text-base text-[#25251F]">
                    {analysis.what_is_happening.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#25251F] leading-relaxed">
                  {analysis.what_is_happening.content}
                </p>
                {analysis.what_is_happening.bullet_points.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F0EBE0] space-y-1.5">
                    {analysis.what_is_happening.bullet_points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#777365]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C49A45] mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Section B: Why Is It Happening? */}
              <Card className="p-6 border-[#E9E1D1] bg-[#FFFEFA]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-center text-xs font-black text-[#C49A45]">
                    B
                  </span>
                  <h3 className="font-extrabold text-base text-[#25251F]">
                    {analysis.why_it_is_happening.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#25251F] leading-relaxed">
                  {analysis.why_it_is_happening.content}
                </p>
                {analysis.why_it_is_happening.bullet_points.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F0EBE0] space-y-2">
                    {analysis.why_it_is_happening.bullet_points.map((pt, i) => (
                      <div key={i} className="bg-[#FAF7F0] border border-[#E9E1D1] p-2.5 rounded-lg text-xs text-[#25251F] font-medium">
                        {pt}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Sections C & D: Positive Factors (Tailwinds) & Negative Factors (Headwinds) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Positive Factors */}
                <Card className="p-5 border-[#258B65]/30 bg-[#F4FBF7]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-[#D8F3E5] flex items-center justify-center text-xs font-black text-[#258B65]">
                      C
                    </span>
                    <h3 className="font-bold text-sm text-[#258B65]">
                      Positive Factors (Tailwinds)
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.positive_factors.map((pos, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#25251F] leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#258B65] shrink-0 mt-0.5" />
                        <span>{pos}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Negative Factors */}
                <Card className="p-5 border-[#D95353]/30 bg-[#FFF8F8]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-[#FDE8E8] flex items-center justify-center text-xs font-black text-[#D95353]">
                      D
                    </span>
                    <h3 className="font-bold text-sm text-[#D95353]">
                      Negative Factors (Headwinds)
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.negative_factors.map((neg, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#25251F] leading-relaxed">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D95353] shrink-0 mt-0.5" />
                        <span>{neg}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Section E: What Should Investors Watch? */}
              <Card className="p-6 border-[#E9E1D1] bg-[#FFFEFA]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-center text-xs font-black text-[#C49A45]">
                    E
                  </span>
                  <h3 className="font-extrabold text-base text-[#25251F]">
                    What Should Investors Watch? (Key Catalysts)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {analysis.what_to_watch.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-[#C49A45] shrink-0 mt-0.5" />
                      <span className="text-xs text-[#25251F] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Section F: Indian Market Impact */}
              <Card className="p-6 border-[#C49A45]/40 bg-[#FDFAF3]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-[#FAF7F0] border border-[#C49A45] flex items-center justify-center text-xs font-black text-[#C49A45]">
                    F
                  </span>
                  <h3 className="font-extrabold text-base text-[#25251F]">
                    {analysis.indian_market_impact.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#25251F] leading-relaxed">
                  {analysis.indian_market_impact.content}
                </p>
                {analysis.indian_market_impact.bullet_points.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E9E1D1] space-y-1.5">
                    {analysis.indian_market_impact.bullet_points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#777365]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C49A45] mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Direct Bridge to Claim Analyzer */}
              <Card className="p-6 border-[#C49A45] bg-gradient-to-r from-[#FAF7F0] to-[#F5EEDB]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black text-[#9E7828] uppercase tracking-wider block">
                      HAVE YOU SEEN A TIP OR TARGET PRICE ON THIS TOPIC?
                    </span>
                    <h4 className="text-base font-extrabold text-[#25251F] mt-0.5">
                      Audit a Specific Claim on {data.topic_name}
                    </h4>
                    <p className="text-xs text-[#777365] mt-1">
                      Check viral WhatsApp/Telegram tips against SEBI regulations, historical price drift, and forensic red flags.
                    </p>
                  </div>
                  <Link to={`/claim-analyzer?query=${encodeURIComponent(data.topic_name)}`}>
                    <Button variant="primary" size="md" className="shadow-gold-glow shrink-0">
                      Audit a Claim Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Verified Multi-Source News Feed */}
            <div className="space-y-4">
              <Card className="p-5 border-[#E9E1D1] bg-[#FFFEFA]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#C49A45]" />
                    <h3 className="font-bold text-sm text-[#25251F]">Verified News Stream</h3>
                  </div>
                  <span className="text-xs text-[#777365] font-semibold">
                    {data.news_items.length} Articles
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 text-[11px]">
                  {[
                    { id: "all", label: "All" },
                    { id: "primary", label: "Primary Filings" },
                    { id: "exchange", label: "NSE/BSE" },
                    { id: "media", label: "Press" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSourceFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        activeSourceFilter === tab.id
                          ? "bg-[#C49A45] text-white font-bold"
                          : "bg-[#FAF7F0] text-[#777365] hover:text-[#25251F]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Source Status Indicators */}
                <div className="flex items-center gap-2 flex-wrap pb-3 mb-3 border-b border-[#F0EBE0] text-[10px]">
                  <span className="text-[#777365]">Checked Sources:</span>
                  {Object.entries(data.sources_summary).map(([src, st]) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1 font-semibold text-[#777365] uppercase"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st === "checked" ? "bg-[#258B65]" : "bg-[#D49A32]"}`} />
                      {src}
                    </span>
                  ))}
                </div>

                {/* News Article List */}
                <div className="space-y-3.5">
                  {filteredNews.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#777365]">
                      No news items matched the current filter.
                    </div>
                  ) : (
                    filteredNews.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] hover:border-[#C49A45]/70 transition-all space-y-2 group"
                      >
                        {/* Meta Header */}
                        <div className="flex items-center justify-between text-[10px] gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#25251F]">{item.publisher}</span>
                            <span className="text-[#777365]">·</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                item.source_type === "primary"
                                  ? "bg-[#D8F3E5] text-[#258B65]"
                                  : "bg-[#F5EEDB] text-[#9E7828]"
                              }`}
                            >
                              {item.source_type}
                            </span>
                          </div>

                          {item.published_at && (
                            <span className="text-[#777365] shrink-0">
                              {new Date(item.published_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#25251F] group-hover:text-[#A88032] transition-colors leading-snug">
                          {item.title}
                        </h4>

                        {/* Summary */}
                        <p className="text-[11px] text-[#777365] line-clamp-3 leading-relaxed">
                          {item.summary}
                        </p>

                        {/* Badges: Duplicate / Contradiction / Sentiment */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                          {item.is_duplicate && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FEF3D6] text-[#D49A32] font-semibold border border-[#D49A32]/30">
                              Duplicate ({item.co_reported_by.length} outlets)
                            </span>
                          )}

                          {item.is_contradictory && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FDE8E8] text-[#D95353] font-bold border border-[#D95353]/30">
                              ⚠ Contradictory Narrative
                            </span>
                          )}

                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold capitalize ${
                              item.sentiment_tag === "positive"
                                ? "bg-[#D8F3E5] text-[#258B65]"
                                : item.sentiment_tag === "negative"
                                ? "bg-[#FDE8E8] text-[#D95353]"
                                : "bg-[#FAF7F0] text-[#777365]"
                            }`}
                          >
                            {item.sentiment_tag}
                          </span>

                          <a
                            href={item.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#C49A45] hover:text-[#9E7828] cursor-pointer"
                          >
                            Read Original
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Disclaimers & Methodology Card */}
              <Card className="p-4 border-[#E9E1D1] bg-[#FAF7F0] text-[11px] text-[#777365] space-y-2 leading-relaxed">
                <div className="font-bold text-[#25251F] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C49A45]" />
                  <span>Audit &amp; Compliance Standards</span>
                </div>
                <p>
                  <strong>No Investment Advice:</strong> All news analysis and market observations are synthesized from verified public feeds for research purposes only.
                  Causation is explicitly separated from correlation.
                </p>
                <p>
                  <strong>Primary vs. Secondary Data:</strong> Statutory filings on NSE/BSE and SEBI orders are classified as Tier 1 Primary disclosures. News commentary is classified as Tier 2 Secondary.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
