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
      {/* Background ambient luxury glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[650px] h-[450px] bg-[#E4C477]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-10 w-[600px] h-[450px] bg-[#D6A94F]/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-[#F1EBDD]/60 rounded-full blur-[140px]" />
      </div>

      {/* Single Centered Luxury Card */}
      <div className="w-full max-w-lg bg-[#FFFEFA] border border-[#E9E1D1] rounded-3xl p-6 sm:p-8 shadow-warm space-y-6 relative z-10 my-8">
        {/* Brand & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow border border-[#C49A45]/30">
              <ShieldCheck className="w-6 h-6 text-[#25251F]" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl tracking-tight text-[#25251F] block leading-none">
                FINTRUST <span className="text-[#A88032] font-black">AI</span>
              </span>
              <span className="text-[11px] text-[#777365] font-medium leading-none mt-1 block">
                Clarity before conviction.
              </span>
            </div>
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
              Create Analyst Account
            </h1>
            <p className="text-xs sm:text-sm text-[#777365] mt-1 max-w-sm mx-auto">
              Forensic verification across SEBI, NSE, BSE &amp; market intelligence.
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#D95353]/35 flex items-start gap-2.5 text-xs text-[#D95353]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#25251F]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input-glass pl-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#25251F]">Work or Personal Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@domain.com"
                className="input-glass pl-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[#25251F]">Password</label>
              <span className="text-[10px] text-[#777365]">Min 8 chars, mixed case &amp; symbol</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#777365]">Strength:</span>
                  <span className="font-bold text-[#25251F]">{strengthLabels[strength]}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
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
            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#777365] select-none">
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

            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#777365] select-none">
              <input
                type="checkbox"
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-0.5 rounded border-[#E9E1D1] text-[#C49A45] focus:ring-[#C49A45] cursor-pointer"
              />
              <span>
                I agree to the <a href="#terms" className="text-[#A88032] hover:underline">Terms of Service</a> and <a href="#privacy" className="text-[#A88032] hover:underline">Privacy Policy</a>.
              </span>
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
      </div>
    </div>
  );
}
