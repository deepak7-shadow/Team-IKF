import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileSearch,
  Check,
  X,
  FileImage,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  History,
  Zap,
  Eye,
  WifiOff,
  Globe,
  Database,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { createClaim, createPrediction, createSavedReport } from "../lib/supabase";
import {
  submitClaim,
  fetchClaimHistory,
  fetchClaimById,
  checkBackendHealth,
  createPredictionApi,
  analyzeCompanyIntelligence,
  type ClaimReport,
  type ClaimListItem,
  type MultiSourceIntelligenceResult,
} from "../lib/api";
import type { RiskLevel } from "../types";
import IntelligencePanel from "../components/intelligence/IntelligencePanel";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type FlowState = "submission" | "processing" | "report";
type Platform = "YouTube" | "Instagram" | "Telegram" | "WhatsApp" | "X (Twitter)" | "Other";

const PLATFORMS: Platform[] = ["YouTube", "Instagram", "Telegram", "WhatsApp", "X (Twitter)", "Other"];

const RISK_SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const RISK_TYPE_LABELS: Record<string, string> = {
  guaranteed_return: "Guaranteed Return",
  urgent_pressure: "Urgency / Pressure",
  unsupported_target: "Unsupported Price Target",
  missing_evidence: "Missing Evidence",
  promotional_language: "Promotional Language",
  unrealistic_claim: "Unrealistic Claim",
  ambiguous_statement: "Ambiguous Statement",
  regulatory_concern: "Regulatory Concern",
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function riskVariant(level: string): "danger" | "warning" | "success" | "neutral" {
  if (level === "critical" || level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "neutral";
}

function riskBanner(level: string): string {
  if (level === "critical") return "bg-[#FDE8E8] border-[#D95353]/40";
  if (level === "high") return "bg-[#FDF0D5] border-[#D49A32]/40";
  if (level === "medium") return "bg-[#FDF8EE] border-[#C49A45]/40";
  return "bg-[#D8F3E5]/30 border-[#258B65]/30";
}

function riskIndicatorBg(severity: string): string {
  if (severity === "critical") return "bg-[#FDE8E8] border-[#D95353]/35";
  if (severity === "high") return "bg-[#FDF0D5] border-[#D49A32]/35";
  if (severity === "medium") return "bg-[#FDF8EE] border-[#C49A45]/30";
  return "bg-[#FAF7F0] border-[#E9E1D1]";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

interface UploadDropzoneProps {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}

function UploadDropzone({ file, onFile, disabled }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [disabled, onFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) onFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
        isDragOver
          ? "border-[#C49A45] bg-[#F5EEDB]/60"
          : file
          ? "border-[#258B65]/50 bg-[#D8F3E5]/20"
          : "border-[#E9E1D1] bg-[#FAF7F0] hover:border-[#C49A45] hover:bg-[#F5EEDB]/40"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileImage className="w-6 h-6 text-[#258B65] shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-[#25251F] truncate">{file.name}</p>
              <p className="text-[11px] text-[#777365]">
                {formatFileSize(file.size)} · OCR text extraction enabled
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="p-1 rounded-full hover:bg-[#E9E1D1] transition-colors"
          >
            <X className="w-4 h-4 text-[#777365]" />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud className="w-8 h-8 text-[#A88032] mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#25251F]">
            Drop screenshot, social media capture or PDF
          </p>
          <p className="text-[11px] text-[#777365] mt-0.5">
            PNG, JPG, WEBP, GIF, PDF · Max 25MB · Text extracted automatically via OCR
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HISTORY DRAWER
// ---------------------------------------------------------------------------
interface HistoryDrawerProps {
  items: ClaimListItem[];
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function HistoryDrawer({ items, onSelect, isOpen, onClose }: HistoryDrawerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-[#FFFEFA] border-l border-[#E9E1D1] flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#E9E1D1]">
          <div>
            <h2 className="font-bold text-[#25251F] text-sm">Analysis History</h2>
            <p className="text-[11px] text-[#777365]">{items.length} previous claims</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1EBDD] transition-colors">
            <X className="w-4 h-4 text-[#777365]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-[#777365] text-center pt-8">No previous analyses found.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="w-full text-left p-3 rounded-xl border border-[#E9E1D1] bg-[#FAF7F0] hover:bg-[#F5EEDB] transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={riskVariant(item.risk_level)} size="sm">
                    {item.risk_level.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-[#777365]">
                    {formatDate(item.submitted_at)}
                  </span>
                </div>
                <p className="text-xs text-[#25251F] font-medium line-clamp-2 leading-relaxed">
                  "{item.claim_text}"
                </p>
                {item.ai_summary && (
                  <p className="text-[11px] text-[#777365] line-clamp-1">{item.ai_summary}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function ClaimAnalyzerPage() {
  // Flow state
  const [flowState, setFlowState] = useState<FlowState>("submission");
  const [processingStep, setProcessingStep] = useState(0);

  // Form state
  const [claimInput, setClaimInput] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("Other");
  const [targetDate, setTargetDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // Analysis result
  const [report, setReport] = useState<ClaimReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Post-report actions
  const [isSavedReport, setIsSavedReport] = useState(false);
  const [isTrackedPrediction, setIsTrackedPrediction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ClaimListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Backend status
  const [backendStatus, setBackendStatus] = useState<{
    ok: boolean; gemini: boolean; supabase: boolean; checked: boolean;
  }>({ ok: false, gemini: false, supabase: false, checked: false });

  // Collapsible sections in report
  const [showEntities, setShowEntities] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [showMissing, setShowMissing] = useState(false);

  // Intelligence panel
  const [intelligenceData, setIntelligenceData] = useState<MultiSourceIntelligenceResult | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  // Check backend on mount
  useEffect(() => {
    checkBackendHealth().then((status) => {
      setBackendStatus({ ...status, checked: true });
    });
  }, []);

  // Load history
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await fetchClaimHistory();
      setHistoryItems(items);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryOpen(true);
    loadHistory();
  };

  // Validation
  const validate = (): boolean => {
    if (!claimInput.trim() && !uploadedFile) {
      setValidationError("Please enter a claim statement or upload a screenshot.");
      return false;
    }
    if (claimInput.length > 20_000) {
      setValidationError("Claim text exceeds 20,000 characters. Please shorten it.");
      return false;
    }
    if (uploadedFile && uploadedFile.size > 25 * 1024 * 1024) {
      setValidationError("File exceeds 25MB. Please upload a smaller file.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Start analysis
  const handleStartAnalysis = async () => {
    if (!validate()) return;
    if (!backendStatus.ok && backendStatus.checked) {
      setAnalysisError(
        "The analysis backend is not reachable. Please start the backend server (backend/start.bat) and try again."
      );
      return;
    }

    setFlowState("processing");
    setProcessingStep(1);
    setAnalysisError(null);

    // Animate steps as analysis runs
    const stepTimers = [
      setTimeout(() => setProcessingStep(2), 800),
      setTimeout(() => setProcessingStep(3), 1600),
      setTimeout(() => setProcessingStep(4), 2400),
    ];

    try {
      const result = await submitClaim({
        claimText: claimInput,
        sourceUrl,
        platform,
        targetDate,
        screenshot: uploadedFile,
      });

      stepTimers.forEach(clearTimeout);
      setProcessingStep(5);
      setReport(result);
      if (result.multi_source_intelligence) {
        setIntelligenceData(result.multi_source_intelligence);
      } else {
        const detectedSec =
          result.extracted_entities?.security || result.extracted_entities?.ticker_symbol;
        if (detectedSec) {
          setIntelligenceLoading(true);
          analyzeCompanyIntelligence({
            companyOrTicker: detectedSec,
            claimText: result.claim_text,
          })
            .then((data) => setIntelligenceData(data))
            .catch(() => {})
            .finally(() => setIntelligenceLoading(false));
        } else {
          setIntelligenceData(null);
        }
      }
      setFlowState("report");

      // Mirror to Supabase claims table via frontend client (optional, backend also does this)
      // This ensures the frontend Supabase client also has a record for the dashboard
      try {
        await createClaim({
          claimText: result.claim_text,
          riskLevel: result.risk_level as RiskLevel,
          overallScore: result.risk_score,
          status: "complete",
          sources: (result.mentioned_sources || []).map((s, i) => ({
            id: `src-${i}`,
            title: s.title,
            url: s.url || "",
            credibility: 50,
            publishedAt: new Date().toISOString(),
            supports: "neutral" as const,
          })),
          redFlags: (result.risk_indicators || []).map((r, i) => ({
            id: `rf-${i}`,
            text: r.description,
            severity: r.severity as RiskLevel,
            category: RISK_TYPE_LABELS[r.type] || r.type,
          })),
          summary: result.ai_summary || "",
          extractedEntities: result.extracted_entities
            ? {
                security: result.extracted_entities.security || undefined,
                direction: result.extracted_entities.direction || undefined,
                targetPrice: result.extracted_entities.target_price_numeric ?? null,
                deadline: result.extracted_entities.timeframe_normalized || null,
                originalSource: sourceUrl || null,
              }
            : undefined,
        });
      } catch (dbErr) {
        console.warn("Frontend Supabase mirror failed (non-critical):", dbErr);
      }
    } catch (err) {
      stepTimers.forEach(clearTimeout);
      const errorMsg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      setAnalysisError(errorMsg);
      setFlowState("submission");
    }
  };

  const handleReset = () => {
    setFlowState("submission");
    setReport(null);
    setIntelligenceData(null);
    setIntelligenceLoading(false);
    setAnalysisError(null);
    setValidationError(null);
    setIsSavedReport(false);
    setIsTrackedPrediction(false);
    setClaimInput("");
    setSourceUrl("");
    setPlatform("Other");
    setTargetDate("");
    setUploadedFile(null);
    setProcessingStep(0);
  };

  const handleSaveReport = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      await createSavedReport({
        title: `Claim Audit: ${report.extracted_entities?.security || "Financial Claim"} · ${report.risk_level.toUpperCase()}`,
        summary: report.ai_summary || report.claim_text.slice(0, 200),
        type: "claim",
        riskLevel: report.risk_level as RiskLevel,
        dossierData: { claimId: report.id, riskScore: report.risk_score },
      });
      setIsSavedReport(true);
    } catch (err) {
      console.error("Error saving report:", err);
      setIsSavedReport(true); // Show success even if Supabase not configured
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackPrediction = async () => {
    if (!report || !report.extracted_entities) return;
    setIsSubmitting(true);
    try {
      const e = report.extracted_entities;
      const numericTarget = e.target_price_numeric ?? 0;
      
      // Submit to backend Prediction Tracking Engine
      await createPredictionApi({
        asset: e.security || e.ticker_symbol || "Unknown",
        ticker_symbol: e.ticker_symbol || undefined,
        direction: (e.direction === "bearish" ? "bearish" : "bullish") as "bullish" | "bearish",
        target_price: numericTarget,
        evaluation_date:
          targetDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        influencer_name: "Submitted Claim Source",
        claim_id: report.id,
        claim_text: report.claim_text,
        source_url: sourceUrl || undefined,
        confidence: report.ai_confidence ? Math.round(report.ai_confidence) : undefined,
        notes: `Claim ID: ${report.id}\n\n${report.claim_text.slice(0, 500)}`,
      });
      
      // Also mirror to Supabase if configured
      try {
        await createPrediction({
          influencerName: "Submitted Claim Source",
          influencerId: null,
          asset: e.security || e.ticker_symbol || "Unknown",
          direction: (e.direction === "bearish" ? "bearish" : "bullish") as "bullish" | "bearish",
          targetPrice: numericTarget,
          referencePrice: null,
          currentPrice: null,
          marketDataProvider: null,
          marketDataStatus: "unavailable",
          marketDataUpdatedAt: null,
          predictionDate: new Date().toISOString().split("T")[0],
          evaluationDate:
            targetDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          status: "pending",
          confidence: report.ai_confidence ? Math.round(report.ai_confidence) : null,
          notes: `Claim ID: ${report.id}\n\n${report.claim_text.slice(0, 500)}`,
        });
      } catch {}
      setIsTrackedPrediction(true);
    } catch (err) {
      console.error("Error saving prediction:", err);
      setIsTrackedPrediction(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load a historical claim into the report view
  const handleLoadHistoryItem = async (id: string) => {
    setFlowState("processing");
    setProcessingStep(3);
    setAnalysisError(null);
    try {
      const loaded = await fetchClaimById(id);
      setReport(loaded);
      if (loaded.multi_source_intelligence) {
        setIntelligenceData(loaded.multi_source_intelligence);
      } else {
        const detectedSec =
          loaded.extracted_entities?.security || loaded.extracted_entities?.ticker_symbol;
        if (detectedSec) {
          setIntelligenceLoading(true);
          analyzeCompanyIntelligence({
            companyOrTicker: detectedSec,
            claimText: loaded.claim_text,
          })
            .then((data) => setIntelligenceData(data))
            .catch(() => {})
            .finally(() => setIntelligenceLoading(false));
        } else {
          setIntelligenceData(null);
        }
      }
      setClaimInput(loaded.claim_text);
      setSourceUrl(loaded.source_url || "");
      setFlowState("report");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load claim.";
      setAnalysisError(msg);
      setFlowState("submission");
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/35">
              AI CLAIM AUDITOR
            </span>
            <span className="text-xs text-[#777365]">Multi-Source Intelligence &amp; SEBI Compliance</span>
            {backendStatus.checked && (
              <span
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  backendStatus.ok
                    ? "bg-[#D8F3E5]/50 text-[#258B65] border-[#258B65]/30"
                    : "bg-[#FDE8E8]/60 text-[#D95353] border-[#D95353]/30"
                }`}
              >
                {backendStatus.ok ? (
                  <Zap className="w-2.5 h-2.5" />
                ) : (
                  <WifiOff className="w-2.5 h-2.5" />
                )}
                {backendStatus.ok
                  ? backendStatus.gemini
                    ? "Gemini AI Active"
                    : "Rule Engine Active"
                  : "Backend Offline"}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            Financial Claim Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-[#777365]">
            Submit social posts, video transcripts, or advisory claims for forensic AI verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistory}
            disabled={historyLoading}
            className="gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Button>
          {flowState === "report" && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              New Analysis
            </Button>
          )}
        </div>
      </div>

      {/* ---- Backend offline warning ---- */}
      {backendStatus.checked && !backendStatus.ok && flowState === "submission" && (
        <div className="p-4 rounded-xl bg-[#FDF0D5] border border-[#D49A32]/40 flex items-start gap-3">
          <WifiOff className="w-4 h-4 text-[#D49A32] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#25251F]">Analysis Backend Not Running</p>
            <p className="text-xs text-[#777365] leading-relaxed">
              The FastAPI backend is not reachable at <code className="font-mono text-[#A88032]">http://127.0.0.1:8000</code>.
              Run <code className="font-mono text-[#A88032]">backend/start.bat</code> (or{" "}
              <code className="font-mono text-[#A88032]">uvicorn main:app --reload</code> from the backend folder) to start it.
              Add your Gemini API key to <code className="font-mono text-[#A88032]">backend/.env</code> for AI-powered analysis.
            </p>
          </div>
        </div>
      )}

      {/* ---- Error banner ---- */}
      {analysisError && (
        <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#D95353]/40 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#D95353] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-[#25251F]">Analysis Failed</p>
            <p className="text-xs text-[#777365] mt-0.5 leading-relaxed">{analysisError}</p>
          </div>
          <button onClick={() => setAnalysisError(null)}>
            <X className="w-4 h-4 text-[#777365]" />
          </button>
        </div>
      )}

      {/* ========== STATE 1: SUBMISSION FORM ========== */}
      {flowState === "submission" && (
        <div className="space-y-5">
          <Card className="p-6 space-y-5 border-[#E9E1D1]">
            {/* Multi-Source Intelligence Active Bar */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-[#25251F] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#C49A45]" />
                  Active 4-Source Verification Engine
                </span>
                <span className="text-[10px] text-[#258B65] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#258B65] animate-pulse" />
                  Exchange &amp; Regulatory Feeds Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "SEBI", desc: "Circulars & Orders", type: "Tier 1 Regulatory" },
                  { name: "NSE India", desc: "Corporate Filings", type: "Tier 1 Exchange" },
                  { name: "BSE India", desc: "Company Disclosures", type: "Tier 1 Exchange" },
                  { name: "Moneycontrol", desc: "Financial Journalism", type: "Tier 2 Context" },
                ].map((s) => (
                  <div key={s.name} className="p-2 rounded-lg bg-[#FFFEFA] border border-[#E9E1D1] shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#25251F]">{s.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#258B65]" />
                    </div>
                    <p className="text-[10px] text-[#777365] truncate mt-0.5">{s.desc}</p>
                    <span className="text-[9px] font-medium text-[#C49A45]">{s.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#25251F] uppercase tracking-wider flex items-center justify-between">
                <span>Financial Claim or Post Wording *</span>
                <span className={`text-[11px] font-normal ${claimInput.length > 18000 ? "text-[#D95353]" : "text-[#777365]"}`}>
                  {claimInput.length.toLocaleString()} / 20,000 chars
                </span>
              </label>
              <textarea
                rows={5}
                value={claimInput}
                onChange={(e) => { setClaimInput(e.target.value); setValidationError(null); }}
                placeholder="Paste the verbatim financial claim, social media post, YouTube comment, or video transcript here...&#10;&#10;Example: 'RELIANCE will reach ₹3,500 by December 2025 — 100% guaranteed, all in!'"
                className="w-full bg-[#FAF7F0] border border-[#E9E1D1] rounded-xl p-3.5 text-sm text-[#25251F] placeholder-[#777365]/60 focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] transition-all leading-relaxed resize-none"
              />
            </div>

            {/* Source URL & Platform */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">
                  Original Post URL <span className="text-[#777365] font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://t.me/..."
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] rounded-xl px-3.5 py-2.5 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] rounded-xl px-3.5 py-2.5 text-xs text-[#25251F] focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] transition-all appearance-none cursor-pointer"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">
                  Claim Target Date <span className="text-[#777365] font-normal">(if mentioned)</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] rounded-xl px-3.5 py-2.5 text-xs text-[#25251F] focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] transition-all"
                />
              </div>
            </div>

            {/* Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#25251F]">
                Upload Screenshot <span className="text-[#777365] font-normal">(optional — text extracted automatically via OCR)</span>
              </label>
              <UploadDropzone file={uploadedFile} onFile={setUploadedFile} />
            </div>

            {/* Validation error */}
            {validationError && (
              <div className="flex items-center gap-2 text-xs text-[#D95353]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Submit row */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#777365]">
                <ShieldCheck className="w-4 h-4 text-[#C49A45] shrink-0" />
                <span>Cross-verified across SEBI, NSE, BSE &amp; Moneycontrol</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartAnalysis}
                className="px-8 shadow-gold-glow sm:w-auto w-full"
                disabled={!claimInput.trim() && !uploadedFile}
              >
                <Sparkles className="w-4 h-4 mr-2 text-[#25251F]" />
                Audit &amp; Verify Claim
              </Button>
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex gap-3">
            <Info className="w-4 h-4 text-[#777365] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#777365] leading-relaxed">
              <strong className="text-[#25251F]">AI Analysis Disclaimer:</strong> Results are AI interpretations for research purposes only.
              They do not constitute financial advice, buy/sell recommendations, or legal findings.
              A person is never labeled fraudulent based solely on AI output.
              Always verify with SEBI-registered advisors before making investment decisions.
            </p>
          </div>
        </div>
      )}

      {/* ========== STATE 2: PROCESSING ========== */}
      {flowState === "processing" && (
        <Card className="p-8 max-w-2xl mx-auto my-12 text-center space-y-6 border-[#E9E1D1] bg-[#FFFEFA]">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-[#E9E1D1] border-t-[#C49A45] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#C49A45] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#25251F] tracking-tight">
              Executing Forensic Claim Verification
            </h2>
            <p className="text-xs text-[#777365]">
              {backendStatus.gemini
                ? "Gemini AI is analyzing linguistic entities, risk patterns and regulatory compliance..."
                : "Rule-based engine is analyzing linguistic entities and risk patterns..."}
            </p>
          </div>

          <div className="space-y-3 max-w-md mx-auto text-left pt-2">
            {[
              { step: 1, title: "Extracting linguistic entities", desc: "Parsing security name, ticker, price targets and timeframe" },
              { step: 2, title: "Risk indicator detection", desc: "Identifying guarantee language, urgency pressure and promotional patterns" },
              { step: 3, title: "Evidence & source analysis", desc: "Locating cited evidence and identifying what is missing" },
              { step: 4, title: "Compiling forensic report", desc: "Synthesizing findings and calculating risk classification" },
            ].map((s) => {
              const isDone = processingStep > s.step;
              const isCurrent = processingStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isCurrent
                      ? "bg-[#FAF7F0] border-[#C49A45] shadow-sm"
                      : isDone
                      ? "bg-[#D8F3E5]/40 border-[#258B65]/30"
                      : "bg-[#FFFEFA] border-[#E9E1D1] opacity-60"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#258B65]" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-[#C49A45] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#E9E1D1] text-[9px] flex items-center justify-center text-[#777365]">
                        {s.step}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#25251F]">{s.title}</p>
                    <p className="text-[11px] text-[#777365] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========== STATE 3: REPORT ========== */}
      {flowState === "report" && report && (
        <div className="space-y-5">
          {/* Risk Banner */}
          <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${riskBanner(report.risk_level)}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant={riskVariant(report.risk_level)} size="sm" dot>
                  {report.risk_level.toUpperCase()} RISK
                </Badge>
                {report.risk_score !== null && (
                  <span className="text-[11px] text-[#777365]">
                    Risk Score: <strong className="text-[#25251F]">{report.risk_score.toFixed(1)}</strong> / 10
                  </span>
                )}
                {report.ai_confidence !== null && (
                  <span className="text-[11px] text-[#777365]">
                    · AI Confidence: <strong className="text-[#25251F]">{report.ai_confidence}%</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#777365]">
                <Clock className="w-3 h-3" />
                {formatDate(report.submitted_at)}
                {report.analysis_duration_ms && (
                  <span>· {report.analysis_duration_ms}ms</span>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#25251F] tracking-tight flex items-center gap-2">
              {report.risk_level === "critical" || report.risk_level === "high" ? (
                <AlertTriangle className="w-5 h-5 text-[#D95353] shrink-0" />
              ) : report.risk_level === "medium" ? (
                <AlertCircle className="w-5 h-5 text-[#D49A32] shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#258B65] shrink-0" />
              )}
              {report.risk_indicators.length} Risk Indicator{report.risk_indicators.length !== 1 ? "s" : ""} Detected
            </h2>

            {report.ai_summary && (
              <p className="text-sm text-[#777365] leading-relaxed">{report.ai_summary}</p>
            )}

            {report.compliance_note && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/50 border border-[#C49A45]/20">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C49A45] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#777365] leading-relaxed">{report.compliance_note}</p>
              </div>
            )}

            {/* AI engine tag */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#777365]">
              <Sparkles className="w-3 h-3" />
              <span>Analyzed by: {report.ai_engine}</span>
              {report.uncertainty_notes && (
                <span className="italic truncate max-w-xs" title={report.uncertainty_notes}>
                  · {report.uncertainty_notes.slice(0, 80)}
                  {report.uncertainty_notes.length > 80 ? "..." : ""}
                </span>
              )}
            </div>
          </div>

          {/* Original Claim & Extracted Entities */}
          <Card className="p-5 space-y-5 border-[#E9E1D1]">
            <div>
              <p className="text-xs font-bold text-[#777365] uppercase tracking-wider mb-2">
                Original Submitted Claim
              </p>
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-[#25251F] font-medium text-sm leading-relaxed">
                "{report.claim_text}"
              </div>
              {report.source_url && (
                <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                  <span className="text-[11px] text-[#777365] truncate">
                    Source: <span className="font-mono text-[#A88032]">{report.source_url}</span>
                  </span>
                  <a href={report.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 text-[#777365] hover:text-[#C49A45] transition-colors" />
                  </a>
                </div>
              )}
              {report.platform && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 bg-[#F1EBDD] text-[#777365] rounded border border-[#E9E1D1]">
                  {report.platform}
                </span>
              )}
              {report.ocr_extracted_text && (
                <details className="mt-2">
                  <summary className="text-[11px] text-[#777365] cursor-pointer hover:text-[#25251F] flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View OCR extracted text from screenshot
                  </summary>
                  <div className="mt-1.5 p-3 rounded-xl bg-[#F1EBDD] border border-[#E9E1D1] text-[11px] text-[#777365] font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {report.ocr_extracted_text}
                  </div>
                </details>
              )}
            </div>

            {/* Extracted Entities */}
            {report.extracted_entities && (
              <div>
                <button
                  onClick={() => setShowEntities((v) => !v)}
                  className="flex items-center gap-2 w-full text-left mb-3"
                >
                  <FileSearch className="w-4 h-4 text-[#C49A45]" />
                  <span className="text-sm font-bold text-[#25251F]">Extracted Financial Information</span>
                  {showEntities ? (
                    <ChevronUp className="w-4 h-4 text-[#777365] ml-auto" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777365] ml-auto" />
                  )}
                </button>

                {showEntities && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: "Security / Asset", value: report.extracted_entities.security || report.extracted_entities.ticker_symbol, mono: true },
                        { label: "Ticker Symbol", value: report.extracted_entities.ticker_symbol, mono: true },
                        { label: "Direction", value: report.extracted_entities.direction ? report.extracted_entities.direction.charAt(0).toUpperCase() + report.extracted_entities.direction.slice(1) : null, mono: false },
                        { label: "Target Price", value: report.extracted_entities.target_price_raw || (report.extracted_entities.target_price_numeric != null ? String(report.extracted_entities.target_price_numeric) : null), mono: true },
                        { label: "Timeframe", value: report.extracted_entities.timeframe_normalized || report.extracted_entities.timeframe_raw, mono: false },
                        { label: "Reference Price", value: report.extracted_entities.reference_price_raw, mono: true },
                      ].map(({ label, value, mono }) => (
                        <div key={label} className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                          <p className="text-[10px] font-semibold text-[#777365] uppercase">{label}</p>
                          <p className={`text-xs font-bold text-[#25251F] mt-1 ${mono ? "font-mono" : ""}`}>
                            {value || <span className="text-[#777365] font-normal italic">Not detected</span>}
                          </p>
                        </div>
                      ))}
                    </div>

                    {report.extracted_entities.supporting_statements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#777365] uppercase mb-1.5">Supporting Statements</p>
                        <ul className="space-y-1">
                          {report.extracted_entities.supporting_statements.map((s, i) => (
                            <li key={i} className="text-xs text-[#25251F] p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E9E1D1]">
                              "{s}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.extracted_entities.financial_figures.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#777365] uppercase mb-1.5">Key Financial Figures</p>
                        <div className="flex flex-wrap gap-1.5">
                          {report.extracted_entities.financial_figures.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-mono bg-[#F1EBDD] text-[#A88032] border border-[#E9E1D1]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.extracted_entities.ambiguous_information.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#777365] uppercase mb-1.5">Ambiguous / Unclear Statements</p>
                        <ul className="space-y-1">
                          {report.extracted_entities.ambiguous_information.map((a, i) => (
                            <li key={i} className="text-xs text-[#777365] p-2.5 rounded-lg bg-[#FAF7F0] border border-dashed border-[#E9E1D1]">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Risk Indicators */}
          <Card className="p-5 space-y-4 border-[#E9E1D1]">
            <button
              onClick={() => setShowIndicators((v) => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <AlertCircle className="w-5 h-5 text-[#D49A32]" />
              <span className="text-sm font-bold text-[#25251F]">
                Risk Indicators &amp; Compliance Findings
              </span>
              <span className="ml-1 text-xs text-[#777365]">({report.risk_indicators.length})</span>
              {showIndicators ? (
                <ChevronUp className="w-4 h-4 text-[#777365] ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#777365] ml-auto" />
              )}
            </button>

            {showIndicators && (
              <div className="space-y-3">
                {report.risk_indicators.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#D8F3E5]/30 border border-[#258B65]/30 text-center">
                    <CheckCircle2 className="w-6 h-6 text-[#258B65] mx-auto mb-1" />
                    <p className="text-xs font-semibold text-[#258B65]">No risk indicators detected</p>
                    <p className="text-[11px] text-[#777365] mt-0.5">
                      Always verify SEBI registration and conduct independent research before investing.
                    </p>
                  </div>
                ) : (
                  [...report.risk_indicators]
                    .sort((a, b) => (RISK_SEVERITY_ORDER[b.severity] || 0) - (RISK_SEVERITY_ORDER[a.severity] || 0))
                    .map((indicator, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border space-y-2 ${riskIndicatorBg(indicator.severity)}`}
                      >
                        <div className="flex items-start gap-2 flex-wrap">
                          <Badge variant={riskVariant(indicator.severity)} size="sm">
                            {indicator.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-[#25251F]">
                            {RISK_TYPE_LABELS[indicator.type] || indicator.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#777365] leading-relaxed">{indicator.description}</p>
                        {indicator.verbatim_excerpt && (
                          <p className="text-[11px] italic text-[#777365] border-l-2 border-[#E9E1D1] pl-2">
                            "{indicator.verbatim_excerpt}"
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </Card>

          {/* Sources & Evidence */}
          {(report.mentioned_sources.length > 0 || report.missing_evidence.length > 0) && (
            <Card className="p-5 space-y-4 border-[#E9E1D1]">
              {/* Cited sources */}
              {report.mentioned_sources.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowSources((v) => !v)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                  >
                    <FileSearch className="w-4 h-4 text-[#C49A45]" />
                    <span className="text-sm font-bold text-[#25251F]">Cited Evidence &amp; Sources</span>
                    <span className="text-xs text-[#777365]">({report.mentioned_sources.length} mentioned in claim)</span>
                    {showSources ? (
                      <ChevronUp className="w-4 h-4 text-[#777365] ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#777365] ml-auto" />
                    )}
                  </button>

                  {showSources && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-[#FDF0D5]/60 border border-[#D49A32]/30 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-[#D49A32] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#777365]">
                          Sources below were mentioned in the submitted claim. FINTRUST AI does not independently verify or endorse them.
                        </p>
                      </div>
                      {report.mentioned_sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-3"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#777365] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#25251F]">{src.title}</p>
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-[#A88032] hover:underline break-all"
                              >
                                {src.url}
                              </a>
                            )}
                            {src.context && (
                              <p className="text-[11px] text-[#777365] mt-0.5">{src.context}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Missing evidence */}
              {report.missing_evidence.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowMissing((v) => !v)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#D49A32]" />
                    <span className="text-sm font-bold text-[#25251F]">Missing Evidence</span>
                    <span className="text-xs text-[#777365]">({report.missing_evidence.length} items expected but absent)</span>
                    {showMissing ? (
                      <ChevronUp className="w-4 h-4 text-[#777365] ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#777365] ml-auto" />
                    )}
                  </button>

                  {showMissing && (
                    <ul className="space-y-1.5">
                      {report.missing_evidence.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FAF7F0] border border-dashed border-[#E9E1D1] text-xs text-[#777365]"
                        >
                          <AlertCircle className="w-3 h-3 text-[#D49A32] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Multi-Source Financial Intelligence & Prediction Engine Panel */}
          {intelligenceLoading && (
            <Card className="p-6 border-[#E9E1D1] bg-[#FAF7F0] text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#C49A45] animate-spin mx-auto" />
              <div>
                <p className="text-xs font-bold text-[#25251F]">
                  Gathering Multi-Source Financial Intelligence
                </p>
                <p className="text-[11px] text-[#777365] mt-0.5">
                  Querying SEBI circulars, NSE &amp; BSE filings, and Moneycontrol news...
                </p>
              </div>
            </Card>
          )}

          {(intelligenceData || report.multi_source_intelligence) && (
            <IntelligencePanel
              data={intelligenceData || report.multi_source_intelligence!}
            />
          )}

          {/* Action Row */}
          <Card className="p-5 border-[#E9E1D1]">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={isSavedReport ? "outline" : "primary"}
                size="md"
                className="w-full sm:w-auto shadow-gold-glow"
                disabled={isSubmitting || isSavedReport}
                onClick={handleSaveReport}
              >
                {isSavedReport ? (
                  <><Check className="w-4 h-4 mr-2 text-[#258B65]" />Saved to Dossier</>
                ) : (
                  <><Bookmark className="w-4 h-4 mr-2" />Save Report to Dossier</>
                )}
              </Button>

              {report.extracted_entities?.security || report.extracted_entities?.ticker_symbol ? (
                <Button
                  variant="cyan"
                  size="md"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || isTrackedPrediction}
                  onClick={handleTrackPrediction}
                >
                  {isTrackedPrediction ? (
                    <><Check className="w-4 h-4 mr-2 text-[#258B65]" />Prediction Tracked</>
                  ) : (
                    <><TrendingUp className="w-4 h-4 mr-2" />Track in Prediction Tracker</>
                  )}
                </Button>
              ) : null}

              <Link to="/saved-reports" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Dossiers
                </Button>
              </Link>

              <Button variant="outline" size="md" className="w-full sm:w-auto" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze Another
              </Button>
            </div>

            <p className="mt-4 text-[10px] text-[#777365] leading-relaxed">
              <strong>Disclaimer:</strong> This analysis is generated by AI for research purposes only. It does not constitute financial advice,
              a buy/sell/hold recommendation, or a legal determination. No person is labeled as fraudulent based solely on AI output.
              Consult a SEBI-registered research analyst before making any investment decisions.
            </p>
          </Card>
        </div>
      )}

      {/* History Drawer */}
      <HistoryDrawer
        items={historyItems}
        onSelect={handleLoadHistoryItem}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
