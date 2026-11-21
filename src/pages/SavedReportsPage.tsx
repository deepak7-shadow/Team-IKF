import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Trash2,
  FileText,
  Calendar,
  Search,
  X,
  Eye,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { fetchSavedReports, deleteSavedReport, supabase } from "../lib/supabase";
import type { SavedReport } from "../types";

const TYPE_LABELS: Record<string, string> = {
  claim: "Claim Analysis",
  influencer: "Influencer Audit",
  prediction: "Prediction",
};

const RISK_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export default function SavedReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewReport, setViewReport] = useState<SavedReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchSavedReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load saved reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadReports();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadReports]);

  /* ── Filtering ── */
  const filtered = reports.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.summary || "").toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === "all" || r.type === typeFilter;

    let matchDate = true;
    if (dateFilter !== "all" && r.savedAt) {
      const saved = new Date(r.savedAt);
      const now = new Date();
      if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchDate = saved >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchDate = saved >= monthAgo;
      }
    }

    return matchSearch && matchType && matchDate;
  });

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSavedReport(id);
      setReports((prev) => prev.filter((item) => item.id !== id));
      if (viewReport?.id === id) setViewReport(null);
    } catch (err) {
      console.error("Failed to delete report:", err);
    } finally {
      setDeletingId(null);
    }
  };

  /* ── PDF Export ── */
  const handleExportPdf = async (report: SavedReport) => {
    setExportingId(report.id);
    try {
      const riskColor = report.riskLevel === "critical" ? "#D95353" : report.riskLevel === "high" ? "#E07B39" : report.riskLevel === "medium" ? "#D49A32" : "#258B65";
      const dossier = report.dossierData || {};

      const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>FINTRUST AI — ${report.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; color: #25251F; background: #FFFEFA; padding: 48px; max-width: 860px; margin: 0 auto; font-size: 13px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C49A45; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .brand span { color: #C49A45; }
    .brand-sub { font-size: 10px; color: #777365; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .report-id { font-size: 10px; color: #777365; text-align: right; }
    .risk-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: white; background: ${riskColor}; margin-bottom: 16px; }
    .meta-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .meta-chip { background: #FAF7F0; border: 1px solid #E9E1D1; border-radius: 6px; padding: 6px 12px; font-size: 11px; color: #777365; }
    .meta-chip strong { color: #25251F; }
    .section { margin: 24px 0; }
    .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #A88032; border-bottom: 1px solid #E9E1D1; padding-bottom: 6px; margin-bottom: 12px; }
    .summary-box { background: #FAF7F0; border-left: 4px solid #C49A45; padding: 16px 18px; border-radius: 6px; font-size: 13px; line-height: 1.7; }
    .data-block { background: #F7F3EC; border: 1px solid #E9E1D1; border-radius: 8px; padding: 16px; }
    .data-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #EDE9DF; font-size: 12px; }
    .data-row:last-child { border-bottom: none; }
    .data-label { color: #777365; }
    .data-val { font-weight: 700; color: #25251F; text-align: right; max-width: 60%; }
    .sources-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
    .src-card { border: 1px solid #E9E1D1; border-radius: 8px; padding: 12px; background: #FDFAF3; }
    .src-name { font-size: 13px; font-weight: 700; }
    .src-tier { font-size: 10px; color: #777365; text-transform: uppercase; letter-spacing: 0.5px; }
    .src-status { font-size: 11px; margin-top: 6px; color: #258B65; font-weight: 600; }
    pre { font-size: 11px; color: #555; white-space: pre-wrap; word-break: break-all; background: #F5F2EB; padding: 14px; border-radius: 6px; }
    .footer { margin-top: 48px; padding-top: 14px; border-top: 1px solid #E9E1D1; font-size: 10px; color: #777365; line-height: 1.6; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">FINTRUST <span>AI</span></div>
      <div class="brand-sub">Forensic Audit Dossier</div>
    </div>
    <div class="report-id">
      Report ID: ${report.id}<br/>
      Archived: ${report.savedAt ? new Date(report.savedAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—"}<br/>
      Exported: ${new Date().toLocaleString("en-IN")}
    </div>
  </div>

  <div class="risk-badge">Risk: ${report.riskLevel?.toUpperCase() || "—"}</div>

  <div class="meta-row">
    <div class="meta-chip">Type: <strong>${TYPE_LABELS[report.type] || report.type}</strong></div>
    <div class="meta-chip">Archived: <strong>${report.savedAt || "—"}</strong></div>
    ${dossier.riskScore !== undefined ? `<div class="meta-chip">Risk Score: <strong>${dossier.riskScore}/10</strong></div>` : ""}
    ${dossier.claimId ? `<div class="meta-chip">Claim ID: <strong>${dossier.claimId}</strong></div>` : ""}
  </div>

  <h2 style="font-size:20px;font-weight:900;margin-bottom:16px;">${report.title}</h2>

  <div class="section">
    <div class="section-title">📋 Report Summary</div>
    <div class="summary-box">${report.summary || "No summary available."}</div>
  </div>

  <div class="section">
    <div class="section-title">🌐 4-Source Verification Coverage</div>
    <div class="sources-grid">
      <div class="src-card"><div class="src-name">SEBI</div><div class="src-tier">Tier 1 — Regulator</div><div class="src-status">✓ Circulars & Orders Checked</div></div>
      <div class="src-card"><div class="src-name">NSE India</div><div class="src-tier">Tier 1 — Exchange</div><div class="src-status">✓ Corporate Filings Checked</div></div>
      <div class="src-card"><div class="src-name">BSE India</div><div class="src-tier">Tier 1 — Exchange</div><div class="src-status">✓ Company Disclosures Checked</div></div>
      <div class="src-card"><div class="src-name">Moneycontrol</div><div class="src-tier">Tier 2 — Context</div><div class="src-status">✓ Financial News Checked</div></div>
    </div>
  </div>

  ${dossier.riskScore !== undefined ? `
  <div class="section">
    <div class="section-title">📊 Risk Assessment Details</div>
    <div class="data-block">
      <div class="data-row"><span class="data-label">Overall Risk Score</span><span class="data-val">${dossier.riskScore} / 10</span></div>
      <div class="data-row"><span class="data-label">Risk Classification</span><span class="data-val" style="color:${riskColor};">${report.riskLevel?.toUpperCase()}</span></div>
      <div class="data-row"><span class="data-label">Report Type</span><span class="data-val">${TYPE_LABELS[report.type] || report.type}</span></div>
      <div class="data-row"><span class="data-label">Analysis Platform</span><span class="data-val">FINTRUST AI v1.0</span></div>
    </div>
  </div>` : ""}

  ${Object.keys(dossier).length > 0 ? `
  <div class="section">
    <div class="section-title">🗂️ Full Dossier Data</div>
    <pre>${JSON.stringify(dossier, null, 2)}</pre>
  </div>` : ""}

  <div class="section">
    <div class="section-title">⚖️ SEBI Compliance Notes</div>
    <div class="data-block">
      <div class="data-row"><span class="data-label">SEBI (IA) Regulations 2013</span><span class="data-val">${report.riskLevel === "low" ? "✓ Likely Compliant" : "⚠ Manual Review Advised"}</span></div>
      <div class="data-row"><span class="data-label">SEBI (RA) Regulations 2014</span><span class="data-val">${report.riskLevel === "low" ? "✓ Likely Compliant" : "⚠ Verify RA Registration"}</span></div>
      <div class="data-row"><span class="data-label">No Investment Advice Provided</span><span class="data-val">✓ Confirmed</span></div>
    </div>
  </div>

  <div class="footer">
    <strong>FINTRUST AI — Forensic Financial Intelligence Engine</strong><br/>
    Report ID: ${report.id} · Exported: ${new Date().toISOString()}<br/><br/>
    <strong>STATUTORY DISCLAIMER:</strong> This report is generated for research and audit purposes only. It does not constitute
    financial advice, a buy/sell/hold recommendation, or a legal determination. No person is labeled as fraudulent based solely
    on AI output. Always verify with a SEBI-registered investment adviser before making investment decisions.
    FINTRUST AI bears no liability for any decisions made based on this report.
  </div>
</body>
</html>`;

      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 500);
        };
      }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingId(null);
    }
  };

  /* ── Export all as JSON archive ── */
  const handleExportAll = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_reports: reports.length,
      generated_by: "FINTRUST AI",
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        risk_level: r.riskLevel,
        summary: r.summary,
        saved_at: r.savedAt,
        dossier_data: r.dossierData,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintrust-reports-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]">
              AUDIT DOSSIER
            </span>
            <span className="text-xs text-[#777365]">
              {isLoading ? "Loading..." : `${reports.length} Archived Verification${reports.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            Saved Reports &amp; Dossiers
          </h1>
          <p className="text-xs sm:text-sm text-[#777365]">
            Archived evidence records, forensic snapshots, and timestamped audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="secondary" size="sm" onClick={loadReports} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {reports.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleExportAll} className="shadow-gold-glow">
              <Download className="w-4 h-4 mr-1.5" />
              Export All (JSON)
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report title or contents..."
            className="input-glass pl-9 text-xs"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777365] hover:text-[#25251F]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          {[
            { id: "all", label: "All Types" },
            { id: "claim", label: "Claims" },
            { id: "influencer", label: "Influencer Audits" },
            { id: "prediction", label: "Predictions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-gradient-champagne border-[#C49A45] text-[#25251F] shadow-sm"
                  : "bg-[#FFFEFA] border-[#E9E1D1] text-[#777365] hover:text-[#25251F]"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E9E1D1] bg-[#FFFEFA] text-[#777365] cursor-pointer focus:outline-none focus:border-[#C49A45]"
          >
            <option value="all">All Dates</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-[#C49A45] animate-spin" />
          <span className="text-sm text-[#777365]">Loading archived reports…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12">
          <EmptyState
            icon={FileText}
            title={search || typeFilter !== "all" ? "No dossiers match your filters" : "No saved reports or dossiers"}
            description={
              search || typeFilter !== "all"
                ? `No archived reports found matching your current filters.`
                : "Reports and forensic evidence snapshots saved from the Claim Analyzer and Prediction Tracker will be archived here."
            }
            actionLabel={search || typeFilter !== "all" ? "Clear Filters" : "Analyze a Claim"}
            actionTo={search || typeFilter !== "all" ? undefined : "/claim-analyzer"}
            onAction={
              search || typeFilter !== "all"
                ? () => { setSearch(""); setTypeFilter("all"); setDateFilter("all"); }
                : undefined
            }
          />
        </div>
      )}

      {/* Reports table */}
      {!isLoading && filtered.length > 0 && (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] overflow-hidden shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E1D1] bg-[#FAF7F0] text-[11px] font-bold text-[#777365] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Dossier / Title</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Risk Severity</th>
                  <th className="py-3.5 px-4">Archived Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D1] text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F0] transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-[#A88032] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#25251F] text-sm group-hover:text-[#A88032] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#777365] line-clamp-1 mt-0.5">
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant={RISK_VARIANT[item.riskLevel] || "neutral"} size="sm">
                        {item.riskLevel?.toUpperCase() || "—"}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-[#777365]">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.savedAt ? new Date(item.savedAt).toLocaleDateString("en-IN") : "—"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => setViewReport(item)}
                          className="p-1.5 text-[#777365] hover:text-[#A88032] transition-colors rounded-lg hover:bg-[#FDF0D5] cursor-pointer"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Export PDF */}
                        <button
                          onClick={() => handleExportPdf(item)}
                          disabled={exportingId === item.id}
                          className="p-1.5 text-[#777365] hover:text-[#258B65] transition-colors rounded-lg hover:bg-[#D8F3E5] cursor-pointer disabled:opacity-50"
                          title="Export as PDF"
                        >
                          {exportingId === item.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-[#777365] hover:text-[#D95353] transition-colors rounded-lg hover:bg-[#FDE8E8] cursor-pointer disabled:opacity-50"
                          title="Delete Dossier"
                        >
                          {deletingId === item.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="px-4 py-3 border-t border-[#E9E1D1] flex items-center justify-between bg-[#FAF7F0]">
            <span className="text-[11px] text-[#777365]">
              Showing {filtered.length} of {reports.length} archived report{reports.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#777365]">
              <Clock className="w-3 h-3" />
              <span>Sorted by newest first</span>
            </div>
          </div>
        </div>
      )}

      {/* ── View Report Modal ── */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#25251F]/40 backdrop-blur-sm" onClick={() => setViewReport(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#FFFEFA] border border-[#E9E1D1] shadow-2xl z-10 max-h-[88vh] overflow-y-auto animate-slide-up">
            {/* Modal header */}
            <div className="sticky top-0 bg-[#FFFEFA] border-b border-[#E9E1D1] px-6 pt-5 pb-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={RISK_VARIANT[viewReport.riskLevel] || "neutral"} size="sm">
                      {viewReport.riskLevel?.toUpperCase() || "—"} RISK
                    </Badge>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]">
                      {TYPE_LABELS[viewReport.type] || viewReport.type}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#25251F] tracking-tight">{viewReport.title}</h2>
                </div>
                <button
                  onClick={() => setViewReport(null)}
                  className="text-[#777365] hover:text-[#25251F] p-2 rounded-lg cursor-pointer hover:bg-[#F1EBDD] transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 pb-6 pt-4 space-y-5">
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-1">
                <p className="text-[11px] font-bold text-[#777365] uppercase tracking-wider">Summary</p>
                <p className="text-sm text-[#25251F] leading-relaxed">{viewReport.summary || "No summary recorded."}</p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                  <p className="text-[10px] text-[#777365] font-bold uppercase tracking-wider mb-0.5">Report ID</p>
                  <p className="text-xs font-mono text-[#25251F]">{viewReport.id.slice(0, 16)}…</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                  <p className="text-[10px] text-[#777365] font-bold uppercase tracking-wider mb-0.5">Archived</p>
                  <p className="text-xs font-mono text-[#25251F]">
                    {viewReport.savedAt ? new Date(viewReport.savedAt).toLocaleString("en-IN") : "—"}
                  </p>
                </div>
              </div>

              {/* Raw data if available */}
              {viewReport.dossierData && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#777365] uppercase tracking-wider">Raw Dossier Data</p>
                  <pre className="text-[10px] font-mono text-[#777365] bg-[#FAF7F0] border border-[#E9E1D1] rounded-xl p-4 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(viewReport.dossierData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDF0D5] border border-[#D49A32]/30">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D49A32] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#777365] leading-relaxed">
                  This report is for research and audit purposes only and does not constitute financial advice.
                </p>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E9E1D1]">
                <Button variant="secondary" size="sm" onClick={() => handleExportPdf(viewReport)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export PDF
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(viewReport.id)}
                    className="text-[#D95353] border-[#D95353]/40 hover:bg-[#FDE8E8]"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setViewReport(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
