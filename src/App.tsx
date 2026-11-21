import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ClaimAnalyzerPage from "./pages/ClaimAnalyzerPage";
import PredictionTrackerPage from "./pages/PredictionTrackerPage";
import InvestorEducationPage from "./pages/InvestorEducationPage";
import SavedReportsPage from "./pages/SavedReportsPage";
import SettingsPage from "./pages/SettingsPage";
import MarketInsightsPage from "./pages/MarketInsightsPage";

export default function App() {
  // Real auth state: null = loading, false = not signed in, true = signed in
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Dev mode — allow navigation without auth
      setIsAuthenticated(true);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data?.session?.user);
    }).catch(() => {
      setIsAuthenticated(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state — prevents flash of wrong route
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8F5EC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E4C477] to-[#C49A45] flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <span className="text-[#25251F] font-black text-sm">FT</span>
          </div>
          <p className="text-xs text-[#777365]">Authenticating session…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {isAuthenticated ? (
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/claim-analyzer" element={<ClaimAnalyzerPage />} />
          <Route path="/prediction-tracker" element={<PredictionTrackerPage />} />
          <Route path="/market-insights" element={<MarketInsightsPage />} />
          <Route path="/news" element={<Navigate to="/market-insights" replace />} />
          <Route path="/investor-education" element={<InvestorEducationPage />} />
          <Route path="/saved-reports" element={<SavedReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
