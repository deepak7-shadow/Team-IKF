import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Sparkles,
  Database,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  FileText,
  Activity,
  Check,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import {
  fetchPredictionsApi,
  fetchPredictionByIdApi,
  createPredictionApi,
  evaluatePredictionApi,
  fetchPredictionAnalyticsApi,
  type PredictionApiRecord,
  type PredictionAnalyticsResponse,
} from "../lib/api";
import { supabase } from "../lib/supabase";

type StatusFilter = "all" | "met" | "not_met" | "partially_met" | "inconclusive" | "pending";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All Forecasts" },
  { id: "met", label: "Target Met" },
  { id: "not_met", label: "Not Met" },
  { id: "partially_met", label: "Partially Met" },
  { id: "inconclusive", label: "Inconclusive" },
  { id: "pending", label: "Pending Deadline" },
];

function getStatusBadgeVariant(status: string): "success" | "danger" | "warning" | "neutral" | "info" {
  switch (status) {
    case "met":
    case "correct":
      return "success";
    case "not_met":
    case "incorrect":
      return "danger";
    case "partially_met":
    case "partial":
      return "info";
    case "inconclusive":
      return "neutral";
    case "pending":
    default:
      return "warning";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "met":
    case "correct":
      return "TARGET MET";
    case "not_met":
    case "incorrect":
      return "NOT MET";
    case "partially_met":
    case "partial":
      return "PARTIALLY MET";
    case "inconclusive":
      return "INCONCLUSIVE";
    case "pending":
      return "PENDING DEADLINE";
    default:
      return status.toUpperCase();
  }
}

export default function PredictionTrackerPage() {
  const [predictions, setPredictions] = useState<PredictionApiRecord[]>([]);
  const [analytics, setAnalytics] = useState<PredictionAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Detailed Prediction Evaluation Modal
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionApiRecord | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Manual Prediction Creation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState("");
  const [newTicker, setNewTicker] = useState("");
  const [newDirection, setNewDirection] = useState<"bullish" | "bearish">("bullish");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [newRefPrice, setNewRefPrice] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCreator, setNewCreator] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        fetchPredictionsApi({ q: search, status: filterStatus }),
        fetchPredictionAnalyticsApi(),
      ]);
      setPredictions(listRes.items || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error("Failed to load predictions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Execute on-demand evaluation
  const handleEvaluateNow = async (id: string) => {
    setIsEvaluating(true);
    try {
      const updated = await evaluatePredictionApi(id);
      setSelectedPrediction(updated);
      setPredictions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      // Refresh analytics
      fetchPredictionAnalyticsApi().then(setAnalytics).catch(() => {});
    } catch (err: any) {
      alert(err.message || "Evaluation failed.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit manual prediction
  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(newTargetPrice);
    if (!newAsset.trim() || isNaN(targetNum) || targetNum <= 0 || !newDeadline) {
      alert("Please provide asset name, valid positive target price, and deadline.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPredictionApi({
        asset: newAsset.trim(),
        ticker_symbol: newTicker.trim() || undefined,
        direction: newDirection,
        target_price: targetNum,
        reference_price: newRefPrice ? parseFloat(newRefPrice) : undefined,
        evaluation_date: newDeadline,
        influencer_name: newCreator.trim() || "Manual Analyst Log",
        notes: newNotes.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setNewAsset("");
      setNewTicker("");
      setNewTargetPrice("");
      setNewRefPrice("");
      setNewDeadline("");
      setNewCreator("");
      setNewNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create prediction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = analytics ? analytics.pending_predictions : 0;
  const evaluatedCount = analytics ? analytics.evaluated_predictions : 0;
  const metCount = analytics ? analytics.met_predictions : 0;
  const notMetCount = analytics ? analytics.not_met_predictions : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/35">
              DATABASE ORACLE
            </span>
            <span className="text-xs text-[#777365]">
              Methodology {analytics?.methodology_version || "v1.0.0-deterministic"}
            </span>
            <span className="text-[10px] text-[#A88032] font-semibold bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#E9E1D1]">
              Live / Delayed Exchange Feed Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            Prediction Outcome Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#777365]">
            Deterministic evaluation of financial forecasts, target prices, and deadlines using verified exchange data.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 ? (
            <Badge variant="warning" size="md" dot>
              {pendingCount} Pending Resolution
            </Badge>
          ) : (
            <Badge variant="neutral" size="md">
              0 Pending Deadlines
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-gold-glow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Track a Prediction
          </Button>
        </div>
      </div>

      {/* KPI Cards (Calculated strictly from database records & deterministic engine) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Evaluated Calls */}
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#777365] uppercase">Evaluated Calls</p>
          <p className="text-2xl font-black text-[#25251F] mt-1">{evaluatedCount}</p>
          <span className="text-[10px] text-[#777365] font-medium">
            {analytics?.total_predictions === 0
              ? "No records in database"
              : `of ${analytics?.total_predictions || 0} total tracked`}
          </span>
        </div>

        {/* Target Met */}
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#777365] uppercase">Target Met</p>
          <p className="text-2xl font-black text-[#258B65] mt-1">{metCount}</p>
          <span className="text-[10px] text-[#777365] font-medium">
            {analytics?.has_sufficient_sample_size && analytics.hit_rate_pct !== null
              ? `${analytics.hit_rate_pct}% verified hit rate`
              : "Sample size < 3 (—)"}
          </span>
        </div>

        {/* Not Met */}
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#777365] uppercase">Not Met</p>
          <p className="text-2xl font-black text-[#D95353] mt-1">{notMetCount}</p>
          <span className="text-[10px] text-[#777365] font-medium">
            {analytics?.has_sufficient_sample_size && analytics.miss_rate_pct !== null
              ? `${analytics.miss_rate_pct}% miss rate`
              : "Sample size < 3 (—)"}
          </span>
        </div>

        {/* Partially Met / Inconclusive */}
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#777365] uppercase">Partial / Inconclusive</p>
          <p className="text-2xl font-black text-[#A88032] mt-1">
            {(analytics?.partially_met_predictions || 0) + (analytics?.inconclusive_predictions || 0)}
          </p>
          <span className="text-[10px] text-[#777365] font-medium">
            {analytics?.partially_met_predictions || 0} partial · {analytics?.inconclusive_predictions || 0} inconclusive
          </span>
        </div>
      </div>

      {/* Methodology & Data Sufficiency Notice */}
      {analytics && (
        <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#A88032] shrink-0 mt-0.5" />
          <div className="text-xs text-[#777365] leading-relaxed space-y-1">
            <p>
              <strong className="text-[#25251F]">Deterministic Evaluation Standard ({analytics.methodology_version}):</strong>{" "}
              {analytics.methodology_explanation}
            </p>
            {!analytics.has_sufficient_sample_size && (
              <p className="text-[11px] text-[#A88032] font-semibold">
                Notice: Statistically significant hit rates are published only when at least 3 evaluated predictions exist. Unresolved pending calls are excluded from percentages.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset, ticker or creator..."
            className="input-glass pl-9 text-xs w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-gradient-champagne border-[#C49A45] text-[#25251F] shadow-sm"
                  : "bg-[#FFFEFA] border-[#E9E1D1] text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Table or Empty State */}
      {loading ? (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#C49A45] animate-spin mx-auto" />
          <p className="text-xs text-[#777365]">Loading records from database &amp; market feeds...</p>
        </div>
      ) : predictions.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No predictions tracked yet."
          description="Start tracking financial predictions to monitor their outcomes objectively over time."
          actionLabel="Analyze a Claim & Track Prediction"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] overflow-hidden shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E1D1] bg-[#FAF7F0] text-[11px] font-bold text-[#777365] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset / Stance</th>
                  <th className="py-3.5 px-4">Influencer / Creator</th>
                  <th className="py-3.5 px-4">Reference &amp; Target Price</th>
                  <th className="py-3.5 px-4">Market Price Feed</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4 text-right">Status / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D1] text-xs">
                {predictions.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedPrediction(item)}
                    className="hover:bg-[#FAF7F0] transition-colors group cursor-pointer"
                  >
                    {/* Asset & Direction */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl border ${
                            item.direction === "bullish"
                              ? "bg-[#D8F3E5] border-[#258B65]/30 text-[#258B65]"
                              : "bg-[#FDE8E8] border-[#D95353]/30 text-[#D95353]"
                          }`}
                        >
                          {item.direction === "bullish" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#25251F] text-sm group-hover:text-[#A88032] transition-colors">
                            {item.asset}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-[#777365] uppercase">
                            {item.ticker_symbol || item.direction}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Influencer */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#25251F]">{item.influencer_name}</p>
                      <span className="text-[11px] text-[#777365]">Documented Source</span>
                    </td>

                    {/* Reference & Target Price */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#777365]">Target:</span>
                          <span className="font-bold text-[#A88032]">
                            ₹{item.target_price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-[#777365]">Ref:</span>
                          <span className="font-medium text-[#25251F]">
                            {item.reference_price !== null && item.reference_price !== undefined
                              ? `₹${item.reference_price.toLocaleString()}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Market Data Feed */}
                    <td className="py-4 px-4">
                      {item.current_price !== null && item.current_price !== undefined ? (
                        <div className="space-y-0.5">
                          <p className="font-bold font-mono text-[#25251F]">
                            ₹{item.current_price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-[#777365]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#258B65]" />
                            <span>{item.market_data_provider || "Public Feed"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1EBDD] text-[#777365]">
                            Feed Unavailable
                          </span>
                          <p className="text-[9px] text-[#9E9988]">No fabricated price</p>
                        </div>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-4 px-4 text-[#777365]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#777365]" />
                        <span className="font-medium text-[#25251F]">{item.evaluation_date || "—"}</span>
                      </div>
                      {item.prediction_date && (
                        <span className="text-[10px] text-[#777365] block mt-0.5">
                          Logged: {item.prediction_date}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-right">
                      <Badge variant={getStatusBadgeVariant(item.status)} size="sm" dot>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED EVALUATION & SNAPSHOTS MODAL */}
      {/* ========================================================================= */}
      {selectedPrediction && (
        <Modal
          isOpen={!!selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
          title={`Forecast Audit: ${selectedPrediction.asset} (${selectedPrediction.direction.toUpperCase()})`}
          description={`Logged by ${selectedPrediction.influencer_name} · Deadline: ${selectedPrediction.evaluation_date}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-[#25251F] text-xs">
            {/* Status & Outcome Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                selectedPrediction.status === "met"
                  ? "bg-[#D8F3E5]/40 border-[#258B65]/40"
                  : selectedPrediction.status === "not_met"
                  ? "bg-[#FDE8E8] border-[#D95353]/40"
                  : selectedPrediction.status === "partially_met"
                  ? "bg-[#EBF3FC] border-[#3978FF]/30"
                  : "bg-[#FAF7F0] border-[#E9E1D1]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#777365]">
                  Deterministic Evaluation Outcome
                </span>
                <Badge variant={getStatusBadgeVariant(selectedPrediction.status)} size="sm" dot>
                  {getStatusLabel(selectedPrediction.status)}
                </Badge>
              </div>

              <p className="font-bold text-[#25251F] text-sm leading-relaxed">
                {selectedPrediction.evaluation_notes ||
                  `Evaluation governed by deterministic rules (${selectedPrediction.evaluation_methodology_version}).`}
              </p>

              {selectedPrediction.evaluation_criteria && (
                <p className="text-[11px] text-[#777365] font-mono bg-white/60 p-2 rounded-lg border border-[#E9E1D1]">
                  Criteria: {selectedPrediction.evaluation_criteria}
                </p>
              )}

              {selectedPrediction.corporate_actions_note && (
                <div className="p-2.5 rounded-lg bg-[#FDF0D5] border border-[#D49A32]/40 text-[#D49A32] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selectedPrediction.corporate_actions_note}</span>
                </div>
              )}
            </div>

            {/* Price Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                <p className="text-[10px] uppercase font-semibold text-[#777365]">Reference Price</p>
                <p className="font-extrabold text-sm font-mono text-[#25251F] mt-1">
                  {selectedPrediction.reference_price != null ? `₹${selectedPrediction.reference_price}` : "—"}
                </p>
                <span className="text-[9px] text-[#777365]">{selectedPrediction.reference_date || "At submission"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                <p className="text-[10px] uppercase font-semibold text-[#777365]">Target Price</p>
                <p className="font-extrabold text-sm font-mono text-[#A88032] mt-1">
                  ₹{selectedPrediction.target_price}
                </p>
                <span className="text-[9px] text-[#777365]">{selectedPrediction.direction.toUpperCase()} target</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                <p className="text-[10px] uppercase font-semibold text-[#777365]">Current Market Price</p>
                <p className="font-extrabold text-sm font-mono text-[#25251F] mt-1">
                  {selectedPrediction.current_price != null ? `₹${selectedPrediction.current_price}` : "Unavailable"}
                </p>
                <span className="text-[9px] text-[#777365]">
                  {selectedPrediction.market_data_provider || "Public Feed"}
                </span>
              </div>
            </div>

            {/* Original Claim Text */}
            {selectedPrediction.claim_text && (
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#777365]">Original Documented Claim</p>
                <p className="text-xs text-[#25251F] leading-relaxed italic">
                  "{selectedPrediction.claim_text}"
                </p>
              </div>
            )}

            {/* Price Snapshots Table */}
            <div>
              <p className="text-[10px] uppercase font-bold text-[#777365] mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C49A45]" />
                Audited Price Snapshots ({selectedPrediction.price_snapshots?.length || 0})
              </p>
              {(!selectedPrediction.price_snapshots || selectedPrediction.price_snapshots.length === 0) ? (
                <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-center text-[#777365]">
                  No snapshots recorded yet. Click "Evaluate Now" to take a live market snapshot.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E9E1D1] bg-[#FAF7F0]">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F1EBDD] border-b border-[#E9E1D1] text-[#777365] font-bold">
                      <tr>
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Recorded Price</th>
                        <th className="py-2 px-3">Feed Provider</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E1D1]">
                      {selectedPrediction.price_snapshots.map((s, idx) => (
                        <tr key={idx} className="font-mono">
                          <td className="py-1.5 px-3">{new Date(s.timestamp).toLocaleString()}</td>
                          <td className="py-1.5 px-3 font-bold text-[#25251F]">₹{s.price}</td>
                          <td className="py-1.5 px-3 text-[#777365]">{s.provider}</td>
                          <td className="py-1.5 px-3">
                            <span className="text-[10px] text-[#258B65] font-semibold">{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E9E1D1] flex items-center justify-between">
              <span className="text-[10px] text-[#777365]">
                Methodology: <strong className="font-mono">{selectedPrediction.evaluation_methodology_version}</strong>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleEvaluateNow(selectedPrediction.id)}
                disabled={isEvaluating}
                className="shadow-gold-glow flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                {isEvaluating ? "Fetching Market Feed..." : "Re-Evaluate Deterministically"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MANUAL TRACK PREDICTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Track a Financial Prediction"
        description="Log an asset price target with deadline for objective deterministic evaluation using exchange feeds."
      >
        <form onSubmit={handleCreatePrediction} className="space-y-4 text-[#25251F] text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Asset / Security Name *</label>
              <input
                type="text"
                required
                value={newAsset}
                onChange={(e) => setNewAsset(e.target.value)}
                placeholder="e.g. RELIANCE, NIFTY 50, BTC"
                className="input-glass w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Ticker Symbol (Optional)</label>
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="e.g. RELIANCE.NS or ^NSEI"
                className="input-glass w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Prediction Direction *</label>
              <select
                value={newDirection}
                onChange={(e) => setNewDirection(e.target.value as any)}
                className="input-glass w-full cursor-pointer"
              >
                <option value="bullish">Bullish (Upside)</option>
                <option value="bearish">Bearish (Downside)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Target Price (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={newTargetPrice}
                onChange={(e) => setNewTargetPrice(e.target.value)}
                placeholder="e.g. 3500"
                className="input-glass w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Reference Entry Price (₹)</label>
              <input
                type="number"
                step="any"
                value={newRefPrice}
                onChange={(e) => setNewRefPrice(e.target.value)}
                placeholder="Defaults to market price"
                className="input-glass w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Target Evaluation Deadline *</label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="input-glass w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Influencer / Creator Name</label>
              <input
                type="text"
                value={newCreator}
                onChange={(e) => setNewCreator(e.target.value)}
                placeholder="e.g. Market Insights India"
                className="input-glass w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#777365]">Supporting Notes / Context</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Thesis or rationale stated in the forecast..."
              className="input-glass w-full"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-[11px] text-[#777365] leading-relaxed">
            <strong>Methodology Standard:</strong> Logging this forecast queries verified market data to record an entry snapshot. The outcome will be objectively evaluated against the deadline using deterministic criteria without price fabrication.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="shadow-gold-glow"
            >
              {isSubmitting ? "Logging Prediction..." : "Log & Monitor Prediction"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
