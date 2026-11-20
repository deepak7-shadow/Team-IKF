import React, { useState } from "react";
import {
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Database,
  Info,
  Layers,
  BarChart2,
} from "lucide-react";
import { Card } from "../ui/Card";
import type {
  MultiSourceIntelligenceResult,
  SourceQueryStatus,
  CollectedDocument,
  EvidenceItem,
  MarketOutlookResult,
  VerificationSummary,
} from "../../lib/api";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 32);
  }
}

// ---------------------------------------------------------------------------
// SOURCE STATUS ROW
// ---------------------------------------------------------------------------
function SourceStatusRow({ source }: { source: SourceQueryStatus }) {
  const statusMeta: Record<
    string,
    { color: string; icon: React.ElementType; label: string }
  > = {
    operational: {
      color: "text-[#258B65]",
      icon: CheckCircle2,
      label: "Operational",
    },
    unavailable: { color: "text-[#D95353]", icon: XCircle, label: "Unavailable" },
    no_records_found: {
      color: "text-[#777365]",
      icon: Minus,
      label: "No Records",
    },
    degraded: {
      color: "text-[#D49A32]",
      icon: AlertCircle,
      label: "Partial",
    },
    error: { color: "text-[#D95353]", icon: XCircle, label: "Error" },
  };
  const meta = statusMeta[source.status] ?? statusMeta.error;
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
      <div className="flex items-center gap-2 min-w-0">
        <Globe className="w-3.5 h-3.5 text-[#A39E8F] shrink-0" />
        <span className="text-xs font-semibold text-[#25251F] capitalize truncate">
          {source.source_name}
        </span>
        {source.documents_count > 0 && (
          <span className="text-[10px] text-[#777365] shrink-0">
            {source.documents_count} item{source.documents_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 ${meta.color}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOCUMENT CARD
// ---------------------------------------------------------------------------
function DocumentCard({ doc }: { doc: CollectedDocument }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(doc.source_url || doc.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`p-3 rounded-xl border ${
        doc.is_duplicate
          ? "bg-[#FDF0D5]/60 border-[#D49A32]/30"
          : "bg-[#FAF7F0] border-[#E9E1D1]"
      } space-y-1.5`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#25251F] leading-snug line-clamp-2">
            {doc.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C49A45] bg-[#F5EEDB] px-1.5 py-0.5 rounded border border-[#C49A45]/30">
              {doc.source_code}
            </span>
            {doc.publication_date && (
              <span className="flex items-center gap-1 text-[10px] text-[#777365]">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(doc.publication_date)}
              </span>
            )}
            {doc.is_duplicate && (
              <span className="text-[10px] font-semibold text-[#D49A32] flex items-center gap-1">
                <Copy className="w-2.5 h-2.5" />
                Duplicate
              </span>
            )}
          </div>
        </div>
        {doc.source_url && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={copy}
              className="p-1 rounded text-[#777365] hover:text-[#25251F] hover:bg-[#E9E1D1] transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-[#258B65]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <a
              href={doc.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-[#777365] hover:text-[#C49A45] hover:bg-[#F5EEDB] transition-colors"
              title={domainFromUrl(doc.source_url)}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
      {doc.excerpt && (
        <p className="text-[11px] text-[#777365] leading-relaxed line-clamp-3 italic border-l-2 border-[#C49A45]/30 pl-2">
          {doc.excerpt}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EVIDENCE ITEM
// ---------------------------------------------------------------------------
function EvidenceRow({ item }: { item: EvidenceItem }) {
  const classMeta: Record<
    string,
    { color: string; bg: string; border: string; icon: React.ElementType; label: string }
  > = {
    supports: {
      color: "text-[#258B65]",
      bg: "bg-[#D8F3E5]/50",
      border: "border-[#258B65]/25",
      icon: CheckCircle2,
      label: "Supports",
    },
    contradicts: {
      color: "text-[#D95353]",
      bg: "bg-[#FDE8E8]/50",
      border: "border-[#D95353]/25",
      icon: XCircle,
      label: "Contradicts",
    },
    context: {
      color: "text-[#777365]",
      bg: "bg-[#FAF7F0]",
      border: "border-[#E9E1D1]",
      icon: Info,
      label: "Context",
    },
    unclear: {
      color: "text-[#D49A32]",
      bg: "bg-[#FDF0D5]/50",
      border: "border-[#D49A32]/25",
      icon: AlertCircle,
      label: "Unclear",
    },
  };
  const meta = classMeta[item.classification] ?? classMeta.unclear;
  const Icon = meta.icon;

  return (
    <div
      className={`flex items-start gap-2 p-2.5 rounded-xl ${meta.bg} border ${meta.border}`}
    >
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-[10px] font-semibold text-[#C49A45] bg-[#F5EEDB] px-1.5 rounded border border-[#C49A45]/30 uppercase tracking-wider">
            {item.source_name}
          </span>
          {item.source_tier && (
            <span className="text-[10px] text-[#777365]">Tier {item.source_tier}</span>
          )}
          {item.contradiction_flag && (
            <span className="text-[10px] font-bold text-[#D95353] flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Conflict
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#25251F] leading-relaxed">{item.extracted_passage}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MARKET OUTLOOK SECTION
// ---------------------------------------------------------------------------
function MarketOutlookCard({ outlook }: { outlook: MarketOutlookResult }) {
  const directionMeta = {
    Upward: {
      color: "text-[#258B65]",
      bg: "bg-[#D8F3E5]/60",
      border: "border-[#258B65]/30",
      icon: TrendingUp,
    },
    Downward: {
      color: "text-[#D95353]",
      bg: "bg-[#FDE8E8]/60",
      border: "border-[#D95353]/30",
      icon: TrendingDown,
    },
    Uncertain: {
      color: "text-[#D49A32]",
      bg: "bg-[#FDF0D5]/60",
      border: "border-[#D49A32]/30",
      icon: Minus,
    },
  };
  const dir =
    directionMeta[outlook.expected_direction as keyof typeof directionMeta] ??
    directionMeta.Uncertain;
  const DirIcon = dir.icon;

  return (
    <div className="space-y-3">
      {/* Direction badge + range */}
      <div
        className={`flex items-center justify-between gap-3 p-3 rounded-xl ${dir.bg} border ${dir.border}`}
      >
        <div className="flex items-center gap-2">
          <DirIcon className={`w-4 h-4 ${dir.color}`} />
          <div>
            <p className={`text-xs font-bold ${dir.color}`}>
              Market Direction: {outlook.expected_direction}
            </p>
            <p className="text-[10px] text-[#777365]">
              {outlook.forecast_horizon_days}-day horizon
              {outlook.reference_price != null
                ? ` · Ref: ₹${outlook.reference_price.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}`
                : ""}
              {outlook.reference_timestamp
                ? ` as of ${formatDate(outlook.reference_timestamp)}`
                : ""}
            </p>
          </div>
        </div>
        {outlook.forecast_price_low != null && outlook.forecast_price_high != null && (
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-[#25251F]">
              ₹
              {outlook.forecast_price_low.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
              {" – "}₹
              {outlook.forecast_price_high.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-[10px] text-[#777365]">95% CI range</p>
          </div>
        )}
      </div>

      {/* Key factors */}
      {outlook.main_factors && outlook.main_factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#25251F] uppercase tracking-wider">
            Key Factors
          </p>
          <ul className="space-y-1">
            {outlook.main_factors.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#25251F]">
                <span className="text-[#C49A45] font-bold shrink-0 mt-0.5">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Supporting vs contradicting */}
      <div className="grid grid-cols-2 gap-2">
        {outlook.supporting_evidence && outlook.supporting_evidence.length > 0 && (
          <div className="p-2.5 rounded-xl bg-[#D8F3E5]/30 border border-[#258B65]/20 space-y-1">
            <p className="text-[10px] font-bold text-[#258B65] uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Supporting
            </p>
            {outlook.supporting_evidence.map((s, i) => (
              <p key={i} className="text-[10px] text-[#25251F] leading-snug">
                · {s}
              </p>
            ))}
          </div>
        )}
        {outlook.contradicting_evidence && outlook.contradicting_evidence.length > 0 && (
          <div className="p-2.5 rounded-xl bg-[#FDE8E8]/30 border border-[#D95353]/20 space-y-1">
            <p className="text-[10px] font-bold text-[#D95353] uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Contradicting
            </p>
            {outlook.contradicting_evidence.map((s, i) => (
              <p key={i} className="text-[10px] text-[#25251F] leading-snug">
                · {s}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Risk factors */}
      {outlook.risk_factors && outlook.risk_factors.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FDF0D5]/40 border border-[#D49A32]/25 space-y-1">
          <p className="text-[10px] font-bold text-[#D49A32] uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Risk Factors
          </p>
          {outlook.risk_factors.map((r, i) => (
            <p key={i} className="text-[10px] text-[#25251F] leading-snug">
              · {r}
            </p>
          ))}
        </div>
      )}

      {/* Uncertainty note */}
      {outlook.uncertainty_explanation && (
        <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-2">
          <Info className="w-3 h-3 text-[#777365] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#777365] leading-relaxed">
            {outlook.uncertainty_explanation}
          </p>
        </div>
      )}

      {/* Plain language explanation */}
      {outlook.plain_language_explanation && (
        <div className="p-3 rounded-xl bg-[#F5EEDB]/60 border border-[#C49A45]/25 space-y-1">
          <p className="text-[10px] font-bold text-[#9E7828] uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3" /> Plain Language Summary
          </p>
          <p className="text-xs text-[#25251F] leading-relaxed">
            {outlook.plain_language_explanation}
          </p>
        </div>
      )}

      {/* Model metadata */}
      {outlook.model_name && (
        <div className="flex items-center gap-2 text-[10px] text-[#A39E8F]">
          <BarChart2 className="w-3 h-3" />
          <span>
            {outlook.model_name}
            {outlook.model_version ? ` v${outlook.model_version}` : ""}
            {" · "}{outlook.market_data_provider || "Yahoo Finance"}
          </span>
        </div>
      )}

      {/* Non-advisory disclaimer */}
      <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-2">
        <Shield className="w-3 h-3 text-[#C49A45] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#777365] leading-relaxed">
          <strong className="text-[#25251F]">Non-Advisory Disclaimer:</strong> This is a
          quantitative model estimate based on historical data. It is not financial
          advice, a buy/sell recommendation, or a guaranteed outcome. Always consult a
          SEBI-registered advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PANEL
// ---------------------------------------------------------------------------
interface IntelligencePanelProps {
  data: MultiSourceIntelligenceResult;
  className?: string;
}

export default function IntelligencePanel({
  data,
  className = "",
}: IntelligencePanelProps) {
  const [showDocs, setShowDocs] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showOutlook, setShowOutlook] = useState(true);

  const outlook = data.market_outlook;
  const hasOutlook = outlook && outlook.data_sufficiency_status === "sufficient";
  const insufficient = outlook?.data_sufficiency_status === "insufficient";

  const ev: VerificationSummary | undefined = data.evidence_summary;
  const duplicateCount = ev?.duplicate_disclosures_found ?? 0;
  const conflictCount = ev?.cross_source_conflicts_found ?? 0;
  const evidenceItems = ev?.evidence_items ?? [];

  return (
    <Card className={`border-[#E9E1D1] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E9E1D1] bg-[#FAF7F0] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-champagne flex items-center justify-center border border-[#C49A45]/30 shadow-sm shrink-0">
            <Layers className="w-4 h-4 text-[#25251F]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#25251F]">
              Multi-Source Intelligence Report
            </h3>
            <p className="text-[10px] text-[#777365]">
              {data.company_name || data.company_symbol}
              {data.company_symbol && data.company_name ? ` · ${data.company_symbol}` : ""}
              {data.sector ? ` · ${data.sector}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {duplicateCount > 0 && (
            <span className="text-[10px] font-semibold text-[#D49A32] bg-[#FDF0D5] border border-[#D49A32]/30 px-2 py-0.5 rounded-full">
              {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
            </span>
          )}
          {conflictCount > 0 && (
            <span className="text-[10px] font-semibold text-[#D95353] bg-[#FDE8E8] border border-[#D95353]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {conflictCount} conflict{conflictCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Source Status Grid */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#25251F] uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#C49A45]" />
            Information Sources
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data.sources_status ?? []).map((src) => (
              <SourceStatusRow key={src.source_code} source={src} />
            ))}
          </div>
        </div>

        {/* Evidence Summary Counters */}
        {ev && (
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "Supporting",
                value: ev.supporting_evidence?.length ?? 0,
                color: "text-[#258B65]",
                bg: "bg-[#D8F3E5]/40",
              },
              {
                label: "Contradicting",
                value: ev.contradicting_evidence?.length ?? 0,
                color: "text-[#D95353]",
                bg: "bg-[#FDE8E8]/40",
              },
              {
                label: "Context",
                value: ev.context_evidence?.length ?? 0,
                color: "text-[#777365]",
                bg: "bg-[#FAF7F0]",
              },
              {
                label: "Unclear",
                value: ev.unclear_evidence?.length ?? 0,
                color: "text-[#D49A32]",
                bg: "bg-[#FDF0D5]/40",
              },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className={`${bg} rounded-xl p-2.5 text-center border border-[#E9E1D1]`}
              >
                <p className={`text-lg font-black ${color}`}>{value}</p>
                <p className="text-[9px] text-[#777365] font-semibold uppercase tracking-wider mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Conflict / Duplicate warnings */}
        {conflictCount > 0 && (
          <div className="p-3 rounded-xl bg-[#FDE8E8]/50 border border-[#D95353]/25 space-y-1.5">
            <p className="text-[10px] font-bold text-[#D95353] uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Conflicting Information Detected
            </p>
            <p className="text-[10px] text-[#777365] leading-snug">
              {conflictCount} cross-source conflict{conflictCount !== 1 ? "s" : ""} identified. Review the evidence items below for details.
            </p>
          </div>
        )}

        {duplicateCount > 0 && (
          <div className="p-3 rounded-xl bg-[#FDF0D5]/50 border border-[#D49A32]/25">
            <p className="text-[10px] font-bold text-[#D49A32] flex items-center gap-1 uppercase tracking-wider">
              <Copy className="w-3 h-3" /> Duplicate Disclosures Identified
            </p>
            <p className="text-[10px] text-[#777365] mt-1 leading-snug">
              NSE and BSE may publish the same company filing. {duplicateCount} duplicate
              document{duplicateCount !== 1 ? "s" : ""} identified and{" "}
              <strong>not</strong> counted as independent confirmations.
            </p>
          </div>
        )}

        {/* Collected Documents — collapsible */}
        {data.documents && data.documents.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDocs(!showDocs)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-[#25251F] uppercase tracking-wider hover:text-[#C49A45] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[#C49A45]" />
                Retrieved Documents ({data.documents.length})
              </span>
              {showDocs ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#777365]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#777365]" />
              )}
            </button>
            {showDocs && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.documents.map((doc, i) => (
                  <DocumentCard key={i} doc={doc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evidence Items — collapsible */}
        {evidenceItems.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-[#25251F] uppercase tracking-wider hover:text-[#C49A45] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#C49A45]" />
                Evidence Analysis ({evidenceItems.length})
              </span>
              {showEvidence ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#777365]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#777365]" />
              )}
            </button>
            {showEvidence && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {evidenceItems.map((item, i) => (
                  <EvidenceRow key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verification verdict */}
        {ev?.verification_verdict && (
          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-1">
            <p className="text-[10px] font-bold text-[#25251F] uppercase tracking-wider">
              Verification Verdict
            </p>
            <p className="text-xs font-semibold text-[#25251F]">{ev.verification_verdict}</p>
            {ev.verdict_explanation && (
              <p className="text-[11px] text-[#777365] leading-relaxed">{ev.verdict_explanation}</p>
            )}
            {ev.data_gap_warnings && ev.data_gap_warnings.length > 0 && (
              <ul className="space-y-0.5 mt-1">
                {ev.data_gap_warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1 text-[10px] text-[#D49A32]">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Market Outlook — collapsible */}
        {outlook && (
          <div className="space-y-2">
            <button
              onClick={() => setShowOutlook(!showOutlook)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-[#25251F] uppercase tracking-wider hover:text-[#C49A45] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3 text-[#C49A45]" />
                Market Outlook
              </span>
              {showOutlook ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#777365]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#777365]" />
              )}
            </button>

            {showOutlook && (
              <>
                {insufficient ? (
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#777365] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#25251F]">
                        Insufficient Data to Generate a Reliable Prediction
                      </p>
                      <p className="text-[11px] text-[#777365] mt-0.5 leading-relaxed">
                        {outlook.insufficient_data_reason ||
                          "Not enough historical market data or evidence was available to produce a forecast with acceptable confidence."}
                      </p>
                    </div>
                  </div>
                ) : hasOutlook ? (
                  <MarketOutlookCard outlook={outlook} />
                ) : null}
              </>
            )}
          </div>
        )}

        {/* Retrieval timestamp */}
        {data.query_timestamp && (
          <p className="text-[10px] text-[#A39E8F] flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Retrieved {formatDate(data.query_timestamp)}
          </p>
        )}
      </div>
    </Card>
  );
}
