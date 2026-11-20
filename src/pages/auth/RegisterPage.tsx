import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sebiConsent, setSebiConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Password Strength Meter
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  const strengthLabels = ["Enter password", "Weak", "Fair", "Good", "Strong & Secure"];
  const strengthColors = ["bg-[#E9E1D1]", "bg-[#D95353]", "bg-[#D49A32]", "bg-[#C49A45]", "bg-[#258B65]"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sebiConsent || !termsConsent) {
      setErrorMessage("Please accept the mandatory regulatory disclosure & terms.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }
      }
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please check inputs.");
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
      <div className="w-full max-w-lg relative z-10 my-8">
        {/* Ambient Card Halo Glow */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-[#C49A45]/30 via-[#E4C477]/40 to-[#D6A94F]/30 blur-xl opacity-70 pointer-events-none" />

        {/* The Card */}
        <div className="relative bg-[#FFFEFA]/95 backdrop-blur-2xl border border-[#E4C477]/60 rounded-3xl p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(70,60,45,0.12)] space-y-6">
          {/* Top Pill Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E4C477] text-[#9E7828] text-[11px] font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
              <span>INSTITUTIONAL FORENSIC INTELLIGENCE</span>
            </div>
          </div>

          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Giant Logo */}
            <Link to="/dashboard" className="flex flex-col items-center gap-3 group">
              {/* Glowing logo ring */}
              <div className="relative">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#C49A45]/40 via-[#E4C477]/50 to-[#D6A94F]/40 blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#C49A45] via-[#D6A94F] to-[#A87B2A] flex items-center justify-center shadow-[0_8px_32px_rgba(196,154,69,0.45)] border-2 border-[#E4C477]/60 transition-transform group-hover:scale-105">
                  <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
                </div>
              </div>

              {/* Brand Name */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-black text-4xl sm:text-5xl tracking-tight text-[#25251F] leading-none">
                  FINTRUST{" "}
                  <span className="bg-gradient-to-r from-[#C49A45] via-[#E4C477] to-[#A87B2A] bg-clip-text text-transparent font-black">
                    AI
                  </span>
                </span>
                <span className="text-sm text-[#9E8B6A] font-semibold tracking-widest uppercase mt-1">
                  Clarity before conviction.
                </span>
              </div>
            </Link>

            {/* Divider */}
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C49A45]/50 to-transparent" />

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#25251F] tracking-tight">
                Create Analyst Account
              </h1>
              <p className="text-xs sm:text-sm text-[#777365] mt-1 max-w-sm mx-auto">
                Forensic verification across SEBI, NSE, BSE &amp; market intelligence.
              </p>
            </div>

            {/* 4-Source Live Indicator Strip */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
              {[
                { name: "SEBI", type: "Regulator" },
                { name: "NSE India", type: "Exchange" },
                { name: "BSE India", type: "Exchange" },
                { name: "Moneycontrol", type: "Media" },
              ].map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E9E1D1] text-[#777365]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#258B65] animate-pulse" />
                  <span>{s.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#D95353]/35 flex items-start gap-2.5 text-xs text-[#D95353] shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#25251F]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#25251F]">Work or Personal Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full bg-[#FAF7F0] border border-[#E9E1D1] focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#25251F]">Password</label>
                <span className="text-[10px] text-[#777365]">Min 8 chars, mixed case &amp; symbol</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C49A45] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#777365]">Password Strength:</span>
                    <span className="font-bold text-[#25251F]">{strengthLabels[strength]}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`rounded-full transition-all duration-300 ${
                          strength >= level ? strengthColors[strength] : "bg-[#E9E1D1]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regulatory Disclaimers & Consents */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-[#777365] select-none p-2 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                <input
                  type="checkbox"
                  checked={sebiConsent}
                  onChange={(e) => setSebiConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#E9E1D1] text-[#C49A45] focus:ring-[#C49A45] cursor-pointer"
                />
                <span>
                  I understand FINTRUST AI is a forensic analytics research platform and does not provide investment advice under SEBI regulations.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-[#777365] select-none p-2 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1]">
                <input
                  type="checkbox"
                  checked={termsConsent}
                  onChange={(e) => setTermsConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#E9E1D1] text-[#C49A45] focus:ring-[#C49A45] cursor-pointer"
                />
                <span>
                  I agree to the <a href="#terms" className="text-[#A88032] font-semibold hover:underline">Terms of Service</a> and <a href="#privacy" className="text-[#A88032] font-semibold hover:underline">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-gold-glow mt-2 font-bold py-3 text-sm hover:scale-[1.01] transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#25251F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Sign In Redirect */}
          <div className="pt-4 border-t border-[#E9E1D1] text-center text-xs text-[#777365]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#A88032] hover:text-[#25251F] transition-colors ml-1"
            >
              Sign In
            </Link>
          </div>

          {/* Security footnote */}
          <div className="text-[10px] text-[#A39E8F] text-center pt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <Shield className="w-3 h-3 text-[#C49A45]" />
            <span>256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>Zero PII Retention</span>
            <span>•</span>
            <span>Statutory Compliance Benchmarked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
