import { createClient } from "@supabase/supabase-js";
import type { Prediction, ClaimAnalysis, Finfluencer, SavedReport, NotificationItem } from "../types";

// Read Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    !supabaseUrl.includes("placeholder")
  );
}

export const SUPABASE_CONFIGURED = isSupabaseConfigured();

// Fallback to a mock-safe URL if unconfigured to prevent client creation crash
export const supabase = createClient(
  SUPABASE_CONFIGURED ? supabaseUrl : "https://placeholder-project.supabase.co",
  SUPABASE_CONFIGURED ? supabaseAnonKey : "placeholder-anon-key"
);

// ==========================================
// PREDICTIONS SERVICE
// ==========================================
export async function fetchPredictions(): Promise<Prediction[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchPredictions error:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      influencerId: row.influencer_id || null,
      influencerName: row.influencer_name || "Unknown Creator",
      asset: row.asset || "N/A",
      direction: row.direction || "bullish",
      targetPrice: Number(row.target_price) || 0,
      referencePrice: row.reference_price !== null && row.reference_price !== undefined ? Number(row.reference_price) : null,
      currentPrice: row.current_price !== null && row.current_price !== undefined ? Number(row.current_price) : null,
      marketDataProvider: row.market_data_provider || null,
      marketDataStatus: row.market_data_status || "unavailable",
      marketDataUpdatedAt: row.market_data_updated_at || null,
      predictionDate: row.prediction_date || "",
      evaluationDate: row.evaluation_date || "",
      status: row.status || "pending",
      confidence: row.confidence !== null && row.confidence !== undefined ? Number(row.confidence) : null,
      notes: row.notes || null,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("fetchPredictions exception:", err);
    return [];
  }
}

export async function createPrediction(prediction: Omit<Prediction, "id" | "createdAt">): Promise<Prediction | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured. Prediction cannot be saved to database.");
    return null;
  }

  try {
    const payload = {
      influencer_name: prediction.influencerName,
      influencer_id: prediction.influencerId || null,
      asset: prediction.asset,
      direction: prediction.direction,
      target_price: prediction.targetPrice,
      reference_price: prediction.referencePrice || null,
      current_price: prediction.currentPrice || null,
      market_data_provider: prediction.marketDataProvider || null,
      market_data_status: prediction.marketDataStatus || "unavailable",
      market_data_updated_at: prediction.marketDataUpdatedAt || null,
      prediction_date: prediction.predictionDate,
      evaluation_date: prediction.evaluationDate,
      status: prediction.status,
      confidence: prediction.confidence || null,
      notes: prediction.notes || null,
    };

    const { data, error } = await supabase
      .from("predictions")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating prediction in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      influencerId: data.influencer_id,
      influencerName: data.influencer_name,
      asset: data.asset,
      direction: data.direction,
      targetPrice: Number(data.target_price),
      referencePrice: data.reference_price ? Number(data.reference_price) : null,
      currentPrice: data.current_price ? Number(data.current_price) : null,
      marketDataProvider: data.market_data_provider,
      marketDataStatus: data.market_data_status,
      marketDataUpdatedAt: data.market_data_updated_at,
      predictionDate: data.prediction_date,
      evaluationDate: data.evaluation_date,
      status: data.status,
      confidence: data.confidence ? Number(data.confidence) : null,
      notes: data.notes,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error("createPrediction exception:", err);
    return null;
  }
}

// ==========================================
// CLAIMS SERVICE
// ==========================================
export async function fetchClaims(): Promise<ClaimAnalysis[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchClaims error:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      claimText: row.claim_text || "",
      submittedAt: row.created_at || new Date().toISOString(),
      riskLevel: row.risk_level || "medium",
      overallScore: row.overall_score !== null && row.overall_score !== undefined ? Number(row.overall_score) : null,
      status: row.status || "complete",
      sources: Array.isArray(row.sources) ? row.sources : [],
      redFlags: Array.isArray(row.red_flags) ? row.red_flags : [],
      summary: row.summary || "",
      extractedEntities: row.extracted_entities || undefined,
    }));
  } catch (err) {
    console.error("fetchClaims exception:", err);
    return [];
  }
}

export async function createClaim(claim: Omit<ClaimAnalysis, "id" | "submittedAt">): Promise<ClaimAnalysis | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const payload = {
      claim_text: claim.claimText,
      risk_level: claim.riskLevel,
      overall_score: claim.overallScore,
      status: claim.status,
      sources: claim.sources,
      red_flags: claim.redFlags,
      summary: claim.summary,
      extracted_entities: claim.extractedEntities || null,
    };

    const { data, error } = await supabase
      .from("claims")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating claim in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      claimText: data.claim_text,
      submittedAt: data.created_at,
      riskLevel: data.risk_level,
      overallScore: data.overall_score ? Number(data.overall_score) : null,
      status: data.status,
      sources: data.sources || [],
      redFlags: data.red_flags || [],
      summary: data.summary,
      extractedEntities: data.extracted_entities,
    };
  } catch (err) {
    console.error("createClaim exception:", err);
    return null;
  }
}

// ==========================================
// FINFLUENCERS SERVICE
// ==========================================
export async function fetchFinfluencers(): Promise<Finfluencer[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("finfluencers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchFinfluencers error:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name || "Unnamed Creator",
      handle: row.handle || "@unknown",
      avatar: row.avatar || undefined,
      platform: row.platform || "Web",
      profileUrl: row.profile_url || undefined,
      followers: Number(row.followers) || 0,
      verificationStatus: row.verification_status || "unverified",
      identityStatus: row.identity_status || "unverified",
      sebiStatus: row.sebi_status || "pending",
      sebiRegNumber: row.sebi_reg_number || null,
      sebiRegType: row.sebi_reg_type || null,
      verificationSource: row.verification_source || null,
      verificationNotes: row.verification_notes || null,
      lastVerifiedAt: row.last_verified_at || null,
      accuracyScore: row.accuracy_score !== null && row.accuracy_score !== undefined ? Number(row.accuracy_score) : null,
      totalPredictions: Number(row.total_predictions) || 0,
      correctPredictions: Number(row.correct_predictions) || 0,
      riskRating: row.risk_rating || "medium",
      tags: Array.isArray(row.tags) ? row.tags : [],
      bio: row.bio || "",
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("fetchFinfluencers exception:", err);
    return [];
  }
}

// ==========================================
// SAVED REPORTS SERVICE
// ==========================================
export async function fetchSavedReports(): Promise<SavedReport[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchSavedReports error:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title || "Untitled Dossier",
      type: row.type || "claim",
      savedAt: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "",
      riskLevel: row.risk_level || "low",
      summary: row.summary || "",
      dossierData: row.dossier_data || null,
    }));
  } catch (err) {
    console.error("fetchSavedReports exception:", err);
    return [];
  }
}

export async function createSavedReport(report: Omit<SavedReport, "id" | "savedAt">): Promise<SavedReport | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const payload = {
      title: report.title,
      type: report.type,
      risk_level: report.riskLevel,
      summary: report.summary,
      dossier_data: report.dossierData || null,
    };

    const { data, error } = await supabase
      .from("saved_reports")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating saved report in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      type: data.type,
      savedAt: data.created_at ? new Date(data.created_at).toISOString().split("T")[0] : "",
      riskLevel: data.risk_level,
      summary: data.summary,
      dossierData: data.dossier_data,
    };
  } catch (err) {
    console.error("createSavedReport exception:", err);
    return null;
  }
}

export async function deleteSavedReport(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .from("saved_reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting saved report:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteSavedReport exception:", err);
    return false;
  }
}

// ==========================================
// NOTIFICATIONS SERVICE
// ==========================================
export async function fetchNotifications(): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.warn("Supabase fetchNotifications error:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title || "",
      desc: row.description || row.desc || "",
      time: row.created_at ? formatTimeAgo(new Date(row.created_at)) : "",
      type: row.type || "info",
      isRead: row.is_read || false,
    }));
  } catch (err) {
    console.error("fetchNotifications exception:", err);
    return [];
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(seconds / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
