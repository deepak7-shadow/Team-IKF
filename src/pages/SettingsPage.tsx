import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Bell,
  Save,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

type TabId = "profile" | "alerts";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* ── User state ── */
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarInitials, setAvatarInitials] = useState("AN");

  /* ── Profile edit state ── */
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Password change ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Alert preferences (local only — no backend for this yet) ── */
  const [sebiAlerts, setSebiAlerts] = useState(true);
  const [pumpDumpDetection, setPumpDumpDetection] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  /* ── Load session ── */
  const loadUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const u = data.user;
        setUserId(u.id);
        setUserEmail(u.email || "");
        const name = u.user_metadata?.full_name || u.email?.split("@")[0] || "Analyst";
        setUserName(name);
        setEditName(name);
        setAvatarInitials(name.slice(0, 2).toUpperCase());
      }
    } catch {
      // Supabase not configured — silent
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  /* ── Save profile name ── */
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      if (isSupabaseConfigured() && editName.trim()) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: editName.trim() },
        });
        if (error) throw error;
        setUserName(editName.trim());
        setAvatarInitials(editName.trim().slice(0, 2).toUpperCase());
        setProfileMsg({ ok: true, text: "Profile name updated successfully." });
      } else if (!isSupabaseConfigured()) {
        // Dev mode — just update local state
        setUserName(editName.trim());
        setAvatarInitials(editName.trim().slice(0, 2).toUpperCase());
        setProfileMsg({ ok: true, text: "Name updated (Supabase not configured — changes are local only)." });
      }
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err?.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setSavingPassword(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPasswordMsg({ ok: true, text: "Password changed successfully. You remain signed in." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setPasswordMsg({ ok: true, text: "Password change simulated (Supabase not configured)." });
      }
    } catch (err: any) {
      setPasswordMsg({ ok: false, text: err?.message || "Password change failed." });
    } finally {
      setSavingPassword(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    navigate("/login");
  };

  const passwordStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength(newPassword);
  const strengthColors = ["bg-[#E9E1D1]", "bg-[#D95353]", "bg-[#D49A32]", "bg-[#C49A45]", "bg-[#258B65]"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "alerts", label: "Audit Sensitivity", icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in text-[#25251F]">
      {/* Header */}
      <div className="border-b border-[#E9E1D1] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#777365]">
          Manage your profile, password security, and audit sensitivity preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E9E1D1] pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === id
                ? "bg-gradient-champagne border border-[#C49A45]/40 text-[#25251F] shadow-sm"
                : "text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB 1: PROFILE & ACCOUNT
      ══════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profile card */}
          <Card className="p-6 space-y-6 border-[#E9E1D1]">
            {/* Formatted Identity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E9E1D1]">
              <div className="flex items-center gap-4">
                {/* Avatar with Status Ring */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-champagne flex items-center justify-center text-lg font-black text-[#25251F] shadow-sm border border-[#C49A45]/40 select-none">
                    {avatarInitials}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#258B65] border-2 border-white shadow-xs"
                    title="Active Session"
                  />
                </div>

                {/* Name, Badges & Email */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#25251F] tracking-tight">
                      {userName || "Analyst"}
                    </h3>
                    <Badge variant="gradient" size="sm">
                      VERIFIED ANALYST
                    </Badge>
                    <Badge
                      variant={isSupabaseConfigured() ? "success" : "neutral"}
                      size="sm"
                      dot
                    >
                      {isSupabaseConfigured() ? "Live Session" : "Dev Mode"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#777365]">
                    <Mail className="w-3.5 h-3.5 text-[#C49A45] shrink-0" />
                    <span className="font-mono text-[11px] sm:text-xs text-[#524E42]">
                      {userEmail || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institutional Tier indicator */}
              <div className="hidden sm:flex flex-col sm:items-end text-right text-[11px] text-[#777365] space-y-0.5 shrink-0 pl-2">
                <span className="font-bold text-[#25251F] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C49A45]" />
                  Institutional Access
                </span>
                <span className="text-[10px] text-[#A88032] font-semibold tracking-wide">
                  SEBI Forensic Tier
                </span>
              </div>
            </div>

            {/* Name edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E9E1D1]">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-glass text-xs"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="input-glass text-xs pl-9 opacity-70 cursor-not-allowed"
                    title="Email changes are managed through Supabase Auth"
                  />
                </div>
                <p className="text-[10px] text-[#777365]">Email changes require re-verification via Supabase Auth.</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${profileMsg.ok ? "bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30" : "bg-[#FDE8E8] text-[#D95353] border border-[#D95353]/30"}`}>
                {profileMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </Card>

          {/* Password change card */}
          <Card className="p-6 space-y-5 border-[#E9E1D1]">
            <h3 className="text-base font-bold text-[#25251F] tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C49A45]" />
              Change Password
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-glass text-xs pr-9"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777365] hover:text-[#25251F] cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-[#E9E1D1]"}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${["", "text-[#D95353]", "text-[#D49A32]", "text-[#C49A45]", "text-[#258B65]"][strength]}`}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#25251F]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-glass text-xs"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${passwordMsg.ok ? "bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30" : "bg-[#FDE8E8] text-[#D95353] border border-[#D95353]/30"}`}>
                {passwordMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {passwordMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleChangePassword} disabled={savingPassword || !newPassword}>
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </Card>

          {/* Logout */}
          <Card className="p-6 border-[#E9E1D1] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#25251F]">Sign Out</p>
              <p className="text-xs text-[#777365]">End your current session and return to the login screen.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#D95353] border-[#D95353]/40 hover:bg-[#FDE8E8]">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </Button>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2: AUDIT SENSITIVITY
      ══════════════════════════════════════ */}
      {activeTab === "alerts" && (
        <Card className="p-6 space-y-5 border-[#E9E1D1]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#25251F] tracking-tight">Regulatory Verification Thresholds</h3>
            <p className="text-xs text-[#777365]">These preferences control audit sensitivity and notification triggers. Changes apply locally for now.</p>

            {[
              { label: "SEBI Non-Compliance Alerts", desc: "Notify when a monitored finfluencer fails statutory disclaimer rules.", val: sebiAlerts, set: setSebiAlerts },
              { label: "Pump-and-Dump Volume Anomaly Triggers", desc: "Flag illiquid tickers with sudden social media promotion volume spikes.", val: pumpDumpDetection, set: setPumpDumpDetection },
              { label: "Daily Intelligence Brief Digest", desc: "Email morning summary of top resolved predictions and flagged creators.", val: emailDigest, set: setEmailDigest },
            ].map(({ label, desc, val, set }) => (
              <div key={label} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E9E1D1] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#25251F]">{label}</p>
                  <p className="text-[11px] text-[#777365]">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={val}
                  onClick={() => set(!val)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer shrink-0 ${val ? "bg-[#C49A45]" : "bg-[#E9E1D1]"}`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${val ? "translate-x-[18px]" : "translate-x-0"}`}
                    style={{ width: 18, height: 18 }}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
