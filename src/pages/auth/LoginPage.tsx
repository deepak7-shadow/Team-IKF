import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
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
      setErrorMessage(err?.message || "Authentication failed. Please check inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F5EC] text-[#25251F] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto font-sans">
      {/* Background ambient luxury decorative glows & warm micro-grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top radial warm champagne glow */}
        <div className="absolute -top-40 left-1/3 w-[700px] h-[500px] bg-[#E4C477]/25 rounded-full blur-[140px]" />
        {/* Soft amber glow bottom-right */}
        <div className="absolute -bottom-40 right-10 w-[650px] h-[500px] bg-[#D6A94F]/20 rounded-full blur-[160px]" />
        {/* Delicate ivory accent left */}
        <div className="absolute top-1/2 -left-40 w-[450px] h-[450px] bg-[#F1EBDD]/80 rounded-full blur-[140px]" />
        {/* Subtle warm micro-grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E9E1D140_1px,transparent_1px),linear-gradient(to_bottom,#E9E1D140_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-45" />
      </div>

      {/* Luxury Glowing Outer Border Wrapper */}
      <div className="w-full max-w-md relative z-10 my-8">
        {/* Ambient Card Halo Glow */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-[#C49A45]/30 via-[#E4C477]/40 to-[#D6A94F]/30 blur-xl opacity-70 pointer-events-none" />

        {/* The Card */}
        <div className="relative bg-[#FFFEFA]/95 backdrop-blur-2xl border border-[#E4C477]/60 rounded-3xl p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(70,60,45,0.12)] space-y-6">
          {/* Top Pill Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E4C477] text-[#9E7828] text-[11px] font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
              <span>FORENSIC FINANCIAL AUDITING</span>
            </div>
          </div>

          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center space-y-3.5">
            <Link to="/dashboard" className="flex items-center gap-3.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow border border-[#C49A45]/40 shrink-0 transition-transform group-hover:scale-105">
                <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[#25251F]" />
              </div>
              <div className="text-left">
                <span className="font-black text-2xl sm:text-3xl tracking-tight text-[#25251F] block leading-none">
                  FINTRUST <span className="gradient-text font-black">AI</span>
                </span>
                <span className="text-xs sm:text-sm text-[#777365] font-medium leading-none mt-1.5 block">
                  Clarity before conviction.
                </span>
              </div>
            </Link>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
                Sign In to Platform
              </h1>
              <p className="text-xs sm:text-sm text-[#777365] mt-1 max-w-xs mx-auto">
                Enter your credentials to access the forensic verification platform.
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#D95353]/35 flex items-start gap-2.5 text-xs text-[#D95353] shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#25251F]">Work or Personal Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@firm.com"
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none transition-all shadow-xs"
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
                  className="text-[#A88032] hover:text-[#25251F] font-semibold text-[11px]"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777365] hover:text-[#25251F] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-[#777365] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E9E1D1] text-[#C49A45] focus:ring-[#C49A45] cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-gold-glow mt-1 font-bold py-3 text-sm hover:scale-[1.01] transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#25251F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Platform <ArrowRight className="w-4 h-4 ml-2" />
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
              Request Platform Access
            </Link>
          </div>

          {/* Security footnote */}
          <div className="text-[10px] text-[#A39E8F] text-center pt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <Shield className="w-3 h-3 text-[#C49A45]" />
            <span>Evidence Over Opinion</span>
            <span>•</span>
            <span>Statutory Compliance Benchmarked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
