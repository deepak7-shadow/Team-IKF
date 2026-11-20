import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }
      }
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] text-[#25251F] flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Background ambient luxury glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#E4C477]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-[#D6A94F]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* LEFT: Brand & Evidence Illustration Sidecar */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10 border-r border-[#E9E1D1] bg-[#F1EBDD]/80 backdrop-blur-2xl">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow border border-[#C49A45]/30">
            <ShieldCheck className="w-6 h-6 text-[#25251F]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#25251F]">
              FINTRUST <span className="text-[#A88032] font-black">AI</span>
            </span>
            <p className="text-xs text-[#777365]">Clarity before conviction.</p>
          </div>
        </div>

        {/* Center Illustration: Forensic Claim Verification Dossier Card */}
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFEFA] border border-[#E4C477] text-[#9E7828] text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
              <span>FORENSIC FINANCIAL AUDITING</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#25251F] tracking-tight leading-tight">
              Evidence over opinion. Explain uncertainty.
            </h2>
            <p className="text-sm text-[#777365] leading-relaxed">
              Verify viral social media stock claims, price targets and finfluencer track records
              benchmarked against official regulatory registries and verifiable historical pricing data.
            </p>
          </div>

          {/* Mini Interactive Forensic Preview */}
          <div className="glass-card bg-[#FFFEFA] border border-[#E9E1D1] p-5 space-y-3 shadow-warm">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="success" size="sm" dot>
                AUDIT ENGINE ACTIVE
              </Badge>
              <span className="text-[11px] text-[#777365]">SEBI Compliance Radar</span>
            </div>
            <p className="text-xs font-semibold text-[#25251F]">
              Autonomous verification of advisory disclaimers, price projections & promoter disclosures.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E9E1D1] text-[#777365]">
              <span>Direct Database Integration</span>
              <span className="text-[#258B65] font-mono font-bold">Institutional Precision</span>
            </div>
          </div>
        </div>

        {/* Footer Principles */}
        <div className="flex items-center gap-6 text-xs text-[#777365] font-medium">
          <span>• Evidence over opinion</span>
          <span>• Explain uncertainty</span>
          <span>• Educate, never advise</span>
        </div>
      </div>

      {/* RIGHT: Authentication Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow border border-[#C49A45]/30">
              <ShieldCheck className="w-5 h-5 text-[#25251F]" />
            </div>
            <span className="font-extrabold text-lg text-[#25251F]">
              FINTRUST <span className="text-[#A88032]">AI</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
              Sign In to Terminal
            </h1>
            <p className="text-xs sm:text-sm text-[#777365]">
              Enter your credentials to access the forensic verification platform.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#D95353]/35 flex items-start gap-2.5 text-xs text-[#D95353]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#25251F] flex items-center justify-between">
                <span>Work or Personal Email</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@firm.com"
                  className="input-glass pl-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#25251F]">Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password reset instructions sent if email exists.");
                  }}
                  className="text-[#A88032] hover:text-[#25251F] font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-glass pl-10 pr-10 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777365] hover:text-[#25251F] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#777365] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E9E1D1] text-[#C49A45] focus:ring-[#C49A45] cursor-pointer"
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-gold-glow mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#25251F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate & Launch Terminal <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Registration Redirect */}
          <div className="pt-4 border-t border-[#E9E1D1] text-center text-xs text-[#777365]">
            Need a FINTRUST verification account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#A88032] hover:text-[#25251F] transition-colors ml-1"
            >
              Request Analyst Terminal Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
