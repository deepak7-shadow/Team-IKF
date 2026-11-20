import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Filter,
  RefreshCw,
  Clock,
  Info,
  FileText,
  AlertTriangle,
  HelpCircle,
  Plus,
  X,
  Share2,
  Check,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { formatNumber } from "../lib/utils";
import {
  fetchInfluencers,
  createInfluencer,
  verifyInfluencerSebi,
  fetchInfluencerClaims,
  fetchInfluencerPredictions,
  type InfluencerApiItem,
  type SebiVerificationAuditResponse,
} from "../lib/api";

type PlatformFilter = "all" | "YouTube" | "Instagram" | "Telegram" | "WhatsApp" | "X (Twitter)" | "Other";
type SebiFilter = "all" | "verified_registered" | "not_found" | "unable_to_verify" | "pending";

const PLATFORM_OPTIONS: { label: string; value: PlatformFilter }[] = [
  { label: "All Platforms", value: "all" },
  { label: "YouTube", value: "YouTube" },
  { label: "Instagram", value: "Instagram" },
  { label: "Telegram", value: "Telegram" },
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "X (Twitter)", value: "X (Twitter)" },
  { label: "Other", value: "Other" },
];

const SEBI_STATUS_TABS: { id: SebiFilter; label: string }[] = [
  { id: "all", label: "All Creators" },
  { id: "verified_registered", label: "SEBI Verified" },
  { id: "not_found", label: "Registration Not Found" },
  { id: "unable_to_verify", label: "Unable to Verify" },
  { id: "pending", label: "Pending Audit" },
];

function getSebiBadgeVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "verified_registered") return "success";
  if (status === "not_found") return "warning";
  if (status === "unable_to_verify") return "neutral";
  return "neutral";
}

function getSebiStatusLabel(status: string): string {
  switch (status) {
    case "verified_registered":
      return "Verified Registered (SEBI)";
    case "not_found":
      return "Registration Not Found";
    case "unable_to_verify":
      return "Unable to Verify";
    case "pending":
      return "Verification Pending";
    default:
      return status;
  }
}

export default function FinfluencerExplorerPage() {
  const [influencers, setInfluencers] = useState<InfluencerApiItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [sebiFilter, setSebiFilter] = useState<SebiFilter>("all");

  // Selected Influencer Modal
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerApiItem | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "claims" | "predictions">("overview");
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [predictionsData, setPredictionsData] = useState<{ predictions: any[]; performance: any } | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [isReVerifying, setIsReVerifying] = useState(false);
  const [reVerifyResult, setReVerifyResult] = useState<SebiVerificationAuditResponse | null>(null);

  // Request Creator Audit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newPlatform, setNewPlatform] = useState("YouTube");
  const [newProfileUrl, setNewProfileUrl] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [newSebiReg, setNewSebiReg] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);

  // Load influencers from backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchInfluencers({
        q: search,
        platform: platformFilter,
        sebiStatus: sebiFilter,
      });
      setInfluencers(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load finfluencers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, platformFilter, sebiFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load claims and predictions when modal tab changes
  useEffect(() => {
    if (!selectedInfluencer) return;

    if (modalTab === "claims") {
      setTabLoading(true);
      fetchInfluencerClaims(selectedInfluencer.id)
        .then((res) => setClaimsList(res.claims || []))
        .catch(() => setClaimsList([]))
        .finally(() => setTabLoading(false));
    } else if (modalTab === "predictions") {
      setTabLoading(true);
      fetchInfluencerPredictions(selectedInfluencer.id)
        .then((res) => setPredictionsData(res))
        .catch(() => setPredictionsData(null))
        .finally(() => setTabLoading(false));
    }
  }, [selectedInfluencer, modalTab]);

  // Re-verify SEBI status
  const handleReVerify = async () => {
    if (!selectedInfluencer) return;
    setIsReVerifying(true);
    try {
      const audit = await verifyInfluencerSebi(selectedInfluencer.id);
      setReVerifyResult(audit);
      // Update local state
      setSelectedInfluencer((prev) =>
        prev
          ? {
              ...prev,
              sebi_status: audit.sebi_status,
              identity_status: audit.identity_status,
              sebi_reg_number: audit.sebi_reg_number,
              sebi_reg_type: audit.sebi_reg_type,
              verification_source: audit.verification_source,
              verification_notes: audit.verification_notes,
              last_verified_at: audit.last_verified_at,
              verification_status:
                audit.sebi_status === "verified_registered" ? "verified" : "unverified",
            }
          : null
      );
      // Refresh directory list in background
      loadData();
    } catch (err) {
      console.error("Re-verify error:", err);
    } finally {
      setIsReVerifying(false);
    }
  };

  // Submit new creator audit
  const handleSubmitNewCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHandle.trim()) {
      alert("Creator name and handle are required.");
      return;
    }

    setIsSubmittingNew(true);
    setAddSuccessMessage(null);
    try {
      const tagsArray = newTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const created = await createInfluencer({
        name: newName.trim(),
        handle: newHandle.trim(),
        platform: newPlatform,
        profile_url: newProfileUrl.trim() || undefined,
        followers: parseInt(newFollowers, 10) || 0,
        bio: newBio.trim(),
        tags: tagsArray,
        sebi_reg_number: newSebiReg.trim() || undefined,
      });

      setAddSuccessMessage(
        `Creator audit registered! SEBI status assessed as "${getSebiStatusLabel(
          created.sebi_status
        )}".`
      );
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccessMessage(null);
        setNewName("");
        setNewHandle("");
        setNewProfileUrl("");
        setNewFollowers("");
        setNewSebiReg("");
        setNewBio("");
        setNewTags("");
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to create creator record.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E1D1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/35">
              SOCIAL RADAR
            </span>
            <span className="text-xs text-[#777365]">
              {totalCount} Documented Profile{totalCount === 1 ? "" : "s"}
            </span>
            <span className="text-[10px] text-[#A88032] font-semibold bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#E9E1D1]">
              SEBI RIA/RA Verification Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            Finfluencer Directory &amp; Audit
          </h1>
          <p className="text-xs sm:text-sm text-[#777365]">
            Examine financial content creators using verified registration records, documented claims, and historical calls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs shadow-gold-glow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Request Creator Audit
          </Button>
        </div>
      </div>

      {/* Statutory Guidance Banner */}
      <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#A88032] shrink-0 mt-0.5" />
        <div className="text-xs text-[#777365] leading-relaxed space-y-1">
          <p>
            <strong className="text-[#25251F]">Statutory Regulatory Notice:</strong> Under SEBI (Research Analysts) Regulations, 2014 &amp; (Investment Advisers) Regulations, 2013, creators publishing stock-specific forecasts or commercial advisory must hold valid registration.
          </p>
          <p className="text-[11px] text-[#9E9988]">
            Important: A name match alone is not sufficient to confirm identity. Not finding a registration record is not proof of fraud. FINTRUST AI distinguishes identity verification from official SEBI registration verification.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input (supports name, handle, profile URL) */}
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, handle, or profile URL (e.g. youtube.com/@...)"
            className="input-glass pl-9 text-xs w-full"
          />
        </div>

        {/* Platform Dropdown Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFEFA] border border-[#E9E1D1] text-[#25251F] focus:outline-none focus:border-[#C49A45] cursor-pointer"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* SEBI Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SEBI_STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSebiFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  sebiFilter === tab.id
                    ? "bg-gradient-champagne border-[#C49A45] text-[#25251F] shadow-sm"
                    : "bg-[#FFFEFA] border-[#E9E1D1] text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Creators Grid or Empty State */}
      {isLoading ? (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12 text-center">
          <RefreshCw className="w-8 h-8 text-[#C49A45] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#25251F]">Searching verified regulatory records...</p>
        </div>
      ) : influencers.length === 0 ? (
        <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-12">
          <EmptyState
            icon={Users}
            title={search ? "No creators matched your search" : "No creators found in this view"}
            description={
              search
                ? `No creator records found matching "${search}". Try adjusting your search query, profile URL, or platform filter.`
                : "No influencers found matching the selected filters. Use '+ Request Creator Audit' to add and audit a public creator."
            }
            actionLabel={search ? "Clear Search" : "+ Request Creator Audit"}
            onAction={
              search
                ? () => setSearch("")
                : () => setIsAddModalOpen(true)
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {influencers.map((inf) => (
            <div
              key={inf.id}
              onClick={() => {
                setSelectedInfluencer(inf);
                setModalTab("overview");
                setReVerifyResult(null);
              }}
              className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-5 cursor-pointer hover:border-[#D6A94F] transition-all duration-300 space-y-4 group relative overflow-hidden shadow-warm hover:shadow-warm-hover"
            >
              {/* Subtle ambient glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#E4C477]/10 rounded-full blur-xl group-hover:bg-[#E4C477]/25 transition-all pointer-events-none" />

              {/* Profile Header */}
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-champagne flex items-center justify-center font-extrabold text-base text-[#25251F] shadow-sm shrink-0 border border-[#C49A45]/30">
                    {inf.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#25251F] truncate group-hover:text-[#A88032] transition-colors">
                        {inf.name}
                      </h3>
                      {inf.sebi_status === "verified_registered" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#258B65] shrink-0" />
                      ) : inf.sebi_status === "not_found" ? (
                        <AlertCircle className="w-4 h-4 text-[#D49A32] shrink-0" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-[#777365] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#777365] font-mono">{inf.handle}</p>
                    <p className="text-[11px] text-[#9E9988] mt-0.5">
                      {inf.platform} • {formatNumber(inf.followers)} followers
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    inf.risk_rating === "low"
                      ? "success"
                      : inf.risk_rating === "medium"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                >
                  {inf.risk_rating.toUpperCase()} RISK
                </Badge>
              </div>

              {/* SEBI Registration Status Badge */}
              <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-[#777365] uppercase font-bold block">
                    SEBI Registration
                  </span>
                  <span className="font-semibold text-[11px] text-[#25251F]">
                    {getSebiStatusLabel(inf.sebi_status)}
                  </span>
                </div>
                <Badge variant={getSebiBadgeVariant(inf.sebi_status)} size="sm">
                  {inf.sebi_status === "verified_registered"
                    ? "REGISTERED"
                    : inf.sebi_status === "not_found"
                    ? "NOT FOUND"
                    : "UNVERIFIED"}
                </Badge>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-xs">
                <div>
                  <span className="text-[10px] text-[#777365] uppercase font-semibold">
                    Evaluated Accuracy
                  </span>
                  <p className="font-extrabold text-base text-[#25251F]">
                    {inf.accuracy_score !== null ? `${inf.accuracy_score}%` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#777365] uppercase font-semibold">
                    Predictions Checked
                  </span>
                  <p className="font-extrabold text-base text-[#25251F]">
                    {inf.total_predictions ?? 0}
                  </p>
                </div>
              </div>

              {/* Public URL (if available) */}
              {inf.profile_url && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#A88032] truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{inf.profile_url}</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(inf.tags || []).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#FAF7F0] text-[#777365] border border-[#E9E1D1]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED CREATOR AUDIT MODAL */}
      {/* ========================================================================= */}
      {selectedInfluencer && (
        <Modal
          isOpen={!!selectedInfluencer}
          onClose={() => {
            setSelectedInfluencer(null);
            setReVerifyResult(null);
          }}
          title={selectedInfluencer.name}
          description={`${selectedInfluencer.handle} • ${selectedInfluencer.platform} • ${formatNumber(
            selectedInfluencer.followers
          )} followers`}
        >
          <div className="space-y-5 text-[#25251F]">
            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#E9E1D1] gap-4 text-xs font-bold">
              {[
                { id: "overview", label: "Overview & SEBI Audit" },
                { id: "claims", label: "Documented Claims" },
                { id: "predictions", label: "Prediction Track Record" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                    modalTab === tab.id
                      ? "border-[#C49A45] text-[#A88032]"
                      : "border-transparent text-[#777365] hover:text-[#25251F]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW & SEBI AUDIT */}
            {modalTab === "overview" && (
              <div className="space-y-4">
                {/* Official SEBI Status Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    selectedInfluencer.sebi_status === "verified_registered"
                      ? "bg-[#D8F3E5]/40 border-[#258B65]/40"
                      : selectedInfluencer.sebi_status === "not_found"
                      ? "bg-[#FDF0D5] border-[#D49A32]/40"
                      : "bg-[#FAF7F0] border-[#E9E1D1]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#777365]">
                      Official SEBI Registration Status
                    </span>
                    <Badge variant={getSebiBadgeVariant(selectedInfluencer.sebi_status)} size="sm">
                      {getSebiStatusLabel(selectedInfluencer.sebi_status).toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm font-bold text-[#25251F]">
                    {selectedInfluencer.sebi_status === "verified_registered"
                      ? `${selectedInfluencer.sebi_reg_type || "Research Analyst (RA)"} — Reg: ${
                          selectedInfluencer.sebi_reg_number
                        }`
                      : selectedInfluencer.sebi_status === "not_found"
                      ? "No Official SEBI Registration Record Found"
                      : "SEBI Status Unable to Verify / Pending Audit"}
                  </p>

                  <p className="text-xs text-[#777365] leading-relaxed">
                    {selectedInfluencer.verification_notes ||
                      "Verification check executed against official SEBI intermediary database structures."}
                  </p>

                  <div className="pt-2 border-t border-[#E9E1D1]/60 flex items-center justify-between text-[11px] text-[#777365] flex-wrap gap-2">
                    <span>
                      Source: <strong>{selectedInfluencer.verification_source || "SEBI Public Database"}</strong>
                    </span>
                    <span>
                      Last Audited:{" "}
                      <strong>
                        {selectedInfluencer.last_verified_at
                          ? new Date(selectedInfluencer.last_verified_at).toLocaleDateString()
                          : "Recently"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Statutory Principles & Safeguards Notice */}
                <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-2 text-xs">
                  <p className="font-bold text-[#25251F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C49A45]" />
                    FINTRUST AI Integrity &amp; Regulatory Safeguards:
                  </p>
                  <ul className="space-y-1 text-[#777365] list-disc list-inside leading-relaxed text-[11px]">
                    <li>
                      <strong>Identity vs. Registration:</strong> Identity is distinguished from SEBI registration. Identity status is currently marked as{" "}
                      <span className="font-semibold text-[#25251F]">
                        {selectedInfluencer.identity_status?.toUpperCase() || "UNVERIFIED"}
                      </span>
                      .
                    </li>
                    <li>
                      <strong>Name Match Limitation:</strong> A name match alone is never sufficient under statutory guidelines to confirm legal identity.
                    </li>
                    <li>
                      <strong>No Assumption of Fraud:</strong> Not finding a registration record does NOT constitute proof of fraud; educational creators often operate without advisory mandates.
                    </li>
                  </ul>
                </div>

                {/* Profile Details & Bio */}
                {selectedInfluencer.bio && (
                  <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-xs space-y-1">
                    <p className="font-bold text-[#777365] uppercase text-[10px]">Creator Biography</p>
                    <p className="text-[#25251F] leading-relaxed">{selectedInfluencer.bio}</p>
                  </div>
                )}

                {/* Public Profile Link */}
                {selectedInfluencer.profile_url && (
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-between text-xs">
                    <span className="text-[#777365]">Public Channel / Profile URL:</span>
                    <a
                      href={selectedInfluencer.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#A88032] flex items-center gap-1 hover:underline truncate max-w-xs"
                    >
                      {selectedInfluencer.profile_url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

                {/* Re-verify Action Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReVerify}
                    disabled={isReVerifying}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReVerifying ? "animate-spin" : ""}`} />
                    {isReVerifying ? "Querying SEBI Registry..." : "Re-Verify SEBI Registration"}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENTED CLAIMS */}
            {modalTab === "claims" && (
              <div className="space-y-3">
                {tabLoading ? (
                  <div className="p-8 text-center text-xs text-[#777365]">
                    <RefreshCw className="w-5 h-5 text-[#C49A45] animate-spin mx-auto mb-2" />
                    Loading documented claims...
                  </div>
                ) : claimsList.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-center space-y-1">
                    <FileText className="w-6 h-6 text-[#777365] mx-auto mb-1 opacity-60" />
                    <p className="text-xs font-semibold text-[#25251F]">No Claims Documented Yet</p>
                    <p className="text-[11px] text-[#777365]">
                      No financial claims from this creator have been submitted to the Claim Analyzer yet.
                    </p>
                  </div>
                ) : (
                  claimsList.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-[#E9E1D1] bg-[#FAF7F0] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            c.risk_level === "low"
                              ? "success"
                              : c.risk_level === "medium"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {c.risk_level?.toUpperCase()} RISK
                        </Badge>
                        <span className="text-[10px] text-[#777365]">
                          {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="font-semibold text-[#25251F] leading-relaxed">"{c.claim_text}"</p>
                      {c.summary && <p className="text-[11px] text-[#777365]">{c.summary}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: HISTORICAL PREDICTIONS */}
            {modalTab === "predictions" && (
              <div className="space-y-4">
                {tabLoading ? (
                  <div className="p-8 text-center text-xs text-[#777365]">
                    <RefreshCw className="w-5 h-5 text-[#C49A45] animate-spin mx-auto mb-2" />
                    Loading prediction track record...
                  </div>
                ) : !predictionsData ? (
                  <div className="p-6 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-center">
                    <p className="text-xs text-[#777365]">Could not load prediction metrics.</p>
                  </div>
                ) : (
                  <>
                    {/* Performance Summary Banner */}
                    <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#25251F]">Prediction Performance Assessment:</span>
                        <Badge
                          variant={predictionsData.performance.has_sufficient_data ? "success" : "neutral"}
                          size="sm"
                        >
                          {predictionsData.performance.has_sufficient_data
                            ? "SUFFICIENT DATA"
                            : "INSUFFICIENT DATA"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center pt-2">
                        <div className="p-2 rounded bg-white border border-[#E9E1D1]">
                          <span className="text-[9px] text-[#777365] block uppercase">Tracked</span>
                          <span className="font-extrabold text-sm text-[#25251F]">
                            {predictionsData.performance.total_tracked}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E9E1D1]">
                          <span className="text-[9px] text-[#777365] block uppercase">Evaluated</span>
                          <span className="font-extrabold text-sm text-[#25251F]">
                            {predictionsData.performance.evaluated_calls}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E9E1D1]">
                          <span className="text-[9px] text-[#777365] block uppercase">Verified Hit</span>
                          <span className="font-extrabold text-sm text-[#258B65]">
                            {predictionsData.performance.verified_correct}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E9E1D1]">
                          <span className="text-[9px] text-[#777365] block uppercase">Hit Rate</span>
                          <span className="font-extrabold text-sm text-[#A88032]">
                            {predictionsData.performance.accuracy_rate !== null
                              ? `${predictionsData.performance.accuracy_rate}%`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#777365] leading-relaxed pt-1">
                        {predictionsData.performance.data_sufficiency_note}
                      </p>
                    </div>

                    {/* Predictions List */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-[#777365] uppercase">
                        Documented Forecasts ({predictionsData.predictions.length})
                      </p>
                      {predictionsData.predictions.length === 0 ? (
                        <p className="text-xs text-[#777365] italic">No forecasts documented yet.</p>
                      ) : (
                        predictionsData.predictions.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl border border-[#E9E1D1] bg-[#FAF7F0] flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-[#25251F]">{p.asset}</p>
                              <p className="text-[11px] text-[#777365]">
                                Direction: {p.direction?.toUpperCase()} · Target: ₹{p.target_price}
                              </p>
                            </div>
                            <Badge
                              variant={
                                p.status === "correct"
                                  ? "success"
                                  : p.status === "incorrect"
                                  ? "danger"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {p.status?.toUpperCase()}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* REQUEST CREATOR AUDIT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Request Public Creator Audit"
        description="Index and audit a financial content creator against official SEBI registration records and documented claims."
      >
        <form onSubmit={handleSubmitNewCreator} className="space-y-4 text-[#25251F] text-xs">
          {addSuccessMessage && (
            <div className="p-3 rounded-xl bg-[#D8F3E5] border border-[#258B65]/40 text-[#258B65] font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {addSuccessMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Creator / Channel Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Market Insights India"
                className="input-glass w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Channel Handle / Username *</label>
              <input
                type="text"
                required
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="e.g. @market_insights_in"
                className="input-glass w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Primary Platform</label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="input-glass w-full cursor-pointer"
              >
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="Telegram">Telegram</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#777365]">Followers / Subscribers</label>
              <input
                type="number"
                value={newFollowers}
                onChange={(e) => setNewFollowers(e.target.value)}
                placeholder="e.g. 150000"
                className="input-glass w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#777365]">Public Channel / Profile URL</label>
            <input
              type="url"
              value={newProfileUrl}
              onChange={(e) => setNewProfileUrl(e.target.value)}
              placeholder="https://youtube.com/@... or https://t.me/..."
              className="input-glass w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#777365]">Claimed SEBI Reg. Number (if claimed by creator)</label>
            <input
              type="text"
              value={newSebiReg}
              onChange={(e) => setNewSebiReg(e.target.value)}
              placeholder="e.g. INH000001234 or leave blank if unregistered"
              className="input-glass w-full"
            />
            <span className="text-[10px] text-[#777365]">
              Will be cross-referenced automatically against official SEBI registry databases.
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#777365]">Asset Tags (comma separated)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Equities, Nifty, Options, Crypto"
              className="input-glass w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#777365]">Channel Bio / Overview</label>
            <textarea
              rows={2}
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Brief description of channel focus and content type..."
              className="input-glass w-full"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] text-[11px] text-[#777365] leading-relaxed">
            <strong>Verification Protocol:</strong> Submitting queues this profile for automated SEBI intermediary database verification. Lack of registration will be marked as "Registration Not Found", not as a finding of fraud.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingNew}
              className="shadow-gold-glow"
            >
              {isSubmittingNew ? "Verifying with SEBI..." : "Audit & Register Creator"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
