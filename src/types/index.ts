export type RiskLevel = "low" | "medium" | "high" | "critical";
export type VerificationStatus = "verified" | "unverified" | "flagged" | "pending";
export type SebiStatus = "verified_registered" | "not_found" | "unable_to_verify" | "pending";
export type IdentityStatus = "verified" | "unverified" | "pending";
export type PredictionStatus =
  | "met"
  | "not_met"
  | "partially_met"
  | "inconclusive"
  | "pending"
  | "correct"
  | "incorrect"
  | "partial";

export interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  plan?: "free" | "pro" | "enterprise";
  createdAt?: string;
}

export interface ClaimAnalysis {
  id: string;
  userId?: string;
  claimText: string;
  submittedAt: string;
  riskLevel: RiskLevel;
  overallScore: number | null;
  status: "analyzing" | "complete" | "failed";
  sources: Source[];
  redFlags: RedFlag[];
  summary: string;
  extractedEntities?: {
    security?: string;
    direction?: string;
    referencePrice?: number | null;
    targetPrice?: number | null;
    deadline?: string | null;
    originalSource?: string | null;
    supportingResearch?: string | null;
  };
}

// Convenient alias
export type Claim = ClaimAnalysis;

export interface Source {
  id: string;
  title: string;
  url: string;
  credibility: number;
  publishedAt: string;
  supports: "supports" | "contradicts" | "neutral";
}

export interface RedFlag {
  id: string;
  text: string;
  severity: RiskLevel;
  category: string;
}

export interface Finfluencer {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  platform: string;
  profileUrl?: string;
  followers: number;
  verificationStatus: VerificationStatus;
  identityStatus?: IdentityStatus;
  sebiStatus?: SebiStatus;
  sebiRegNumber?: string | null;
  sebiRegType?: string | null;
  verificationSource?: string | null;
  verificationNotes?: string | null;
  lastVerifiedAt?: string | null;
  accuracyScore: number | null;
  totalPredictions: number;
  correctPredictions: number;
  riskRating: RiskLevel;
  tags: string[];
  bio: string;
  createdAt?: string;
}

export interface Prediction {
  id: string;
  userId?: string;
  influencerId?: string | null;
  influencerName: string;
  asset: string;
  direction: "bullish" | "bearish";
  targetPrice: number;
  referencePrice?: number | null;
  currentPrice: number | null;
  marketDataProvider?: string | null;
  marketDataStatus?: "live" | "delayed" | "unavailable" | null;
  marketDataUpdatedAt?: string | null;
  predictionDate: string;
  evaluationDate: string;
  status: PredictionStatus;
  confidence: number | null;
  notes?: string | null;
  tickerSymbol?: string | null;
  referenceDate?: string | null;
  claimId?: string | null;
  claimText?: string | null;
  sourceUrl?: string | null;
  evaluationCriteria?: string | null;
  evaluationMethodologyVersion?: string;
  evaluationNotes?: string | null;
  evaluatedAt?: string | null;
  priceSnapshots?: Array<{ timestamp: string; price: number; provider: string; status: string }>;
  corporateActionsNote?: string | null;
  createdAt?: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
}

export interface SavedReport {
  id: string;
  userId?: string;
  title: string;
  type: "claim" | "influencer" | "prediction";
  savedAt: string;
  riskLevel: RiskLevel;
  summary: string;
  dossierData?: any;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  desc: string;
  time: string;
  type: "alert" | "success" | "info";
  isRead?: boolean;
}

// Convenient alias
export type Notification = NotificationItem;
