import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import {
  fetchClaims,
  fetchPredictions,
  isSupabaseConfigured,
} from "../lib/supabase";
import type { Claim, Prediction } from "../types";

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Coordinated luxury tones for Pie chart
  const luxuryRiskColors = ["#258B65", "#D49A32", "#D6A94F", "#D95353"];

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [loadedClaims, loadedPredictions] = await Promise.all([
          fetchClaims(),
          fetchPredictions(),
        ]);
        setClaims(loadedClaims);
        setPredictions(loadedPredictions);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute live metrics strictly from database records
  const claimsCount = claims.length;

  const avgRiskScore =
    claims.length > 0
      ? (claims.reduce((acc, c) => acc + (c.overallScore || 0), 0) / claims.length).toFixed(1) + " / 10"
      : "—";

  const evaluatedPredictions = predictions.filter(
    (p) => p.status === "met" || p.status === "not_met" || p.status === "partially_met" ||
           p.status === "correct" || p.status === "incorrect"
  );
  const verifiedHits = predictions.filter(
    (p) => p.status === "met" || p.status === "correct"
  ).length;
  const accuracyPercentage =
    evaluatedPredictions.length >= 3
      ? `${((verifiedHits / evaluatedPredictions.length) * 100).toFixed(1)}%`
      : evaluatedPredictions.length > 0
      ? "< 3 evaluated"
      : "—";

  // Compute live risk distribution from real claims
  const riskCounts = {
    low: claims.filter((c) => c.riskLevel === "low").length,
    medium: claims.filter((c) => c.riskLevel === "medium").length,
    high: claims.filter((c) => c.riskLevel === "high").length,
    critical: claims.filter((c) => c.riskLevel === "critical").length,
  };

  const riskDistributionData =
    claimsCount > 0
      ? [
          { name: "Low Risk", value: Math.round((riskCounts.low / claimsCount) * 100) },
          { name: "Medium Risk", value: Math.round((riskCounts.medium / claimsCount) * 100) },
          { name: "High Risk", value: Math.round((riskCounts.high / claimsCount) * 100) },
          { name: "Critical Severity", value: Math.round((riskCounts.critical / claimsCount) * 100) },
        ].filter((d) => d.value > 0)
      : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in w-full overflow-x-hidden">
      {/* Premium Hero Section with Subtle Champagne Gradient */}
      <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden border border-[#E9E1D1] bg-gradient-to-r from-[#FAF7F0] via-[#FAF7F0] to-[#EFE8DA] shadow-warm">
        {/* Soft Ambient Champagne Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 sm:w-96 sm:h-96 bg-[#E4C477]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#D6A94F]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFEFA] border border-[#E4C477] text-[#9E7828] text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
              <span>FINTRUST INTELLIGENCE TERMINAL</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#25251F] tracking-tight leading-snug">
              Audit Financial Claims with{" "}
              <span className="gradient-text font-black">Institutional Precision</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#777365] leading-relaxed font-normal max-w-xl text-balance">
              Forensic verification of social media advice, target price assertions, and creator track records
              benchmarked against official registries and verifiable historical pricing data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/claim-analyzer">
              <Button variant="primary" size="md" className="shadow-gold-glow">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Analyze a Claim
              </Button>
            </Link>
            <Link to="/prediction-tracker">
              <Button variant="secondary" size="md">
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Track Predictions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Large Statistic Cards in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
        <StatCard
          title="Claims Analyzed"
          value={isLoading ? "..." : claimsCount.toString()}
          changeLabel="total recorded in database"
          icon={ShieldCheck}
          iconColor="blue"
          isDemo={false}
        />
        <StatCard
          title="Average Risk Score"
          value={isLoading ? "..." : avgRiskScore}
          changeLabel={claimsCount > 0 ? "based on evaluated claims" : "no claims evaluated yet"}
          icon={AlertTriangle}
          iconColor="warning"
          isDemo={false}
        />
        <StatCard
          title="Predictions Tracked"
          value={isLoading ? "..." : predictions.length.toString()}
          changeLabel="total forecast targets logged"
          icon={Layers}
          iconColor="violet"
          isDemo={false}
        />
        <StatCard
          title="Prediction Accuracy"
          value={isLoading ? "..." : accuracyPercentage}
          changeLabel={
            evaluatedPredictions.length > 0
              ? `${verifiedHits} of ${evaluatedPredictions.length} verified`
              : "awaiting evaluated outcomes"
          }
          icon={TrendingUp}
          iconColor="success"
          isDemo={false}
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Verification Accuracy Trend Area Chart */}
        <Card className="lg:col-span-2 min-w-0 flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>
                <TrendingUp className="w-4 h-4 text-[#C49A45]" />
                Prediction Accuracy & Verification Trends
              </CardTitle>
              <CardDescription>
                Chronological ratio of verifiable outcomes vs unverified speculative forecasts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={evaluatedPredictions.length > 0 ? "success" : "neutral"} size="sm" dot>
                {evaluatedPredictions.length > 0 ? "Database Records" : "Awaiting Data"}
              </Badge>
            </div>
          </CardHeader>

          {evaluatedPredictions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={TrendingUp}
                title="No verification trends recorded yet"
                description="When evaluated financial predictions and outcomes are logged in the database, monthly accuracy trends will automatically render here."
                actionLabel="Track a Prediction"
                actionTo="/prediction-tracker"
                compact
              />
            </div>
          ) : (
            <>
              <div className="h-64 w-full min-w-0 overflow-hidden px-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      {
                        month: "Current",
                        correct: verifiedHits,
                        incorrect: evaluatedPredictions.length - verifiedHits,
                      },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="champagneCorrect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#258B65" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#258B65" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="champagneIncorrect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D95353" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D95353" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="#777365"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E9E1D1" }}
                    />
                    <YAxis
                      stroke="#777365"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E9E1D1" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFEFA",
                        border: "1px solid #E9E1D1",
                        borderRadius: "12px",
                        boxShadow: "0 8px 30px rgba(70,60,45,0.08)",
                        color: "#25251F",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="correct"
                      name="Verified Correct"
                      stroke="#258B65"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#champagneCorrect)"
                    />
                    <Area
                      type="monotone"
                      dataKey="incorrect"
                      name="Debunked / Missed"
                      stroke="#D95353"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#champagneIncorrect)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 p-4 border-t border-[#E9E1D1] text-xs text-[#777365]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#258B65]" />
                  <span>Verified Correct ({verifiedHits})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D95353]" />
                  <span>Debunked / Missed ({evaluatedPredictions.length - verifiedHits})</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Claim Risk Severity Distribution */}
        <Card className="min-w-0 flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>
                <AlertTriangle className="w-4 h-4 text-[#D49A32]" />
                Claim Risk Distribution
              </CardTitle>
              <CardDescription>Categorized by regulatory compliance severity</CardDescription>
            </div>
          </CardHeader>

          {claimsCount === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Layers}
                title="No risk data recorded yet"
                description="Submitted and audited claims will be categorized by SEBI risk severity and visualized here."
                actionLabel="Analyze First Claim"
                actionTo="/claim-analyzer"
                compact
              />
            </div>
          ) : (
            <>
              <div className="h-52 w-full flex items-center justify-center min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistributionData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={luxuryRiskColors[index % luxuryRiskColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFEFA",
                        border: "1px solid #E9E1D1",
                        borderRadius: "10px",
                        color: "#25251F",
                        fontSize: "12px",
                        boxShadow: "0 6px 20px rgba(70,60,45,0.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 p-4 border-t border-[#E9E1D1] text-xs">
                {riskDistributionData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-[#777365]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: luxuryRiskColors[index % luxuryRiskColors.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-[#25251F]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent Analyzed Claims Feed */}
      <Card className="w-full min-w-0">
        <CardHeader>
          <div>
            <CardTitle>Recent Claim Verifications</CardTitle>
            <CardDescription>Live incoming stream of analyzed market assertions</CardDescription>
          </div>
          <Link to="/claim-analyzer">
            <Button variant="ghost" size="sm" className="text-xs text-[#A88032] font-semibold hover:text-[#25251F]">
              View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        {claims.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ShieldCheck}
              title="No claims analyzed yet"
              description="Submit verbatim statements, creator posts, or video transcripts to audit their compliance and evidence base."
              actionLabel="Analyze a Claim"
              actionTo="/claim-analyzer"
              compact
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {claims.slice(0, 5).map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#F1EBDD] border border-[#E9E1D1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        claim.riskLevel === "low"
                          ? "success"
                          : claim.riskLevel === "medium"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      dot
                    >
                      {claim.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <span className="text-[11px] text-[#777365]">
                      Score: {claim.overallScore}/10
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#25251F] line-clamp-1">
                    "{claim.claimText}"
                  </p>
                  <p className="text-[11px] text-[#777365] line-clamp-1">
                    {claim.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to="/claim-analyzer">
                    <Button variant="secondary" size="sm" className="text-xs">
                      Inspect Evidence
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
