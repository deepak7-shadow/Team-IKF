import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  BookmarkCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch (err) {
        // Not logged in or anonymous
      }
    }
    loadUser();
  }, []);

  const navSections = [
    {
      title: "Core Verification",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          label: "Claim Analyzer",
          path: "/claim-analyzer",
          icon: ShieldCheck,
          badge: "AI Core",
          badgeColor: "bg-[#F5EEDB] text-[#9E7828] border-[#C49A45]/35",
        },
        {
          label: "Prediction Tracker",
          path: "/prediction-tracker",
          icon: TrendingUp,
          badge: "Live",
          badgeColor: "bg-[#D8F3E5] text-[#258B65] border-[#258B65]/30",
        },
      ],
    },
    {
      title: "Knowledge & Dossiers",
      items: [
        {
          label: "Investor Education",
          path: "/investor-education",
          icon: BookOpen,
          badge: null,
        },
        {
          label: "Saved Reports",
          path: "/saved-reports",
          icon: BookmarkCheck,
          badge: null,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Settings",
          path: "/settings",
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const displayName = userEmail ? userEmail.split("@")[0] : "Analyst Account";
  const initials = displayName.slice(0, 2).toUpperCase();
  const collapsed = isCollapsed && !isMobile;

  return (
    <aside
      className={`h-full flex flex-col justify-between bg-[#F1EBDD]/95 backdrop-blur-2xl border-r border-[#E9E1D1] select-none transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Brand Section */}
      <div>
        <div
          className={`border-b border-[#E9E1D1] ${
            collapsed
              ? "py-3 px-2 flex flex-col items-center gap-2"
              : "p-4 flex items-center justify-between"
          }`}
        >
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 group overflow-hidden ${
              collapsed ? "justify-center" : ""
            }`}
            title="FINTRUST AI — Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow shrink-0 border border-[#C49A45]/30">
              <ShieldCheck className="w-5 h-5 text-[#25251F]" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-[#25251F] flex items-center gap-1.5">
                  FINTRUST <span className="text-[#A88032] font-black">AI</span>
                </span>
                <span className="text-[11px] text-[#777365] font-medium leading-none mt-1">
                  Clarity before conviction.
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`rounded-xl text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0] transition-colors cursor-pointer hidden lg:flex items-center justify-center ${
                collapsed ? "p-1.5 w-7 h-7" : "p-1.5"
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-[#C49A45]" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Menu Sections */}
        <nav className={`space-y-3 ${collapsed ? "py-3 px-2" : "p-3"}`}>
          {navSections.map((section, idx) => (
            <div key={section.title} className="space-y-1.5">
              {!collapsed ? (
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A39E8F] select-none">
                  {section.title}
                </p>
              ) : (
                idx > 0 && <div className="w-6 h-px bg-[#E9E1D1] mx-auto my-2" />
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center rounded-xl text-xs font-semibold transition-all group relative ${
                      collapsed
                        ? "w-11 h-11 justify-center mx-auto"
                        : "gap-3 px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-gradient-champagne text-[#25251F] shadow-sm font-bold border border-[#C49A45]/40"
                        : "text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`shrink-0 transition-colors ${
                        collapsed ? "w-5 h-5" : "w-4 h-4"
                      } ${
                        isActive ? "text-[#25251F]" : "text-[#777365] group-hover:text-[#25251F]"
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && !collapsed && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#C49A45]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom User & Safeguards Section */}
      <div className={`border-t border-[#E9E1D1] mt-auto ${collapsed ? "p-2 space-y-2" : "p-3 space-y-2.5"}`}>
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-[#FFFEFA] border border-[#E9E1D1] space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#258B65]" />
              <span className="text-[10px] font-bold text-[#25251F] uppercase tracking-wider">
                Forensic Guard
              </span>
            </div>
            <p className="text-[10px] text-[#777365] leading-snug">
              Non-advisory research terminal. Governed by statutory compliance norms.
            </p>
          </div>
        )}

        {/* User Profile Card */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-champagne flex items-center justify-center font-bold text-xs text-[#25251F] shadow-sm border border-[#C49A45]/30 cursor-pointer"
              title={`${displayName} (${userEmail || "guest"})`}
            >
              {initials}
            </div>
            <Link
              to="/login"
              title="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#777365] hover:text-[#D95353] hover:bg-[#FDE8E8] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-[#FFFEFA] border border-[#E9E1D1] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-champagne flex items-center justify-center font-bold text-xs text-[#25251F] shadow-sm shrink-0 border border-[#C49A45]/30">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#25251F] truncate capitalize">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#777365] truncate font-mono">
                  {userEmail || "guest@fintrust.ai"}
                </p>
              </div>
            </div>

            <Link
              to="/login"
              title="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="p-1.5 rounded-lg text-[#777365] hover:text-[#D95353] hover:bg-[#FDE8E8] transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
