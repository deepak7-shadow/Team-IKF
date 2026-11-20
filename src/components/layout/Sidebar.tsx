import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
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

  const navItems = [
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
      label: "Finfluencer Explorer",
      path: "/finfluencer-explorer",
      icon: Users,
      badge: null,
    },
    {
      label: "Prediction Tracker",
      path: "/prediction-tracker",
      icon: TrendingUp,
      badge: "Live",
      badgeColor: "bg-[#D8F3E5] text-[#258B65] border-[#258B65]/30",
    },
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
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  const displayName = userEmail ? userEmail.split("@")[0] : "Analyst Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside
      className={`h-full flex flex-col justify-between bg-[#F1EBDD]/95 backdrop-blur-2xl border-r border-[#E9E1D1] select-none transition-all duration-300 ${
        isCollapsed && !isMobile ? "w-20" : "w-64"
      }`}
    >
      {/* Top Brand Section */}
      <div>
        <div className="p-4 border-b border-[#E9E1D1] flex items-center justify-between">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-champagne flex items-center justify-center shadow-gold-glow shrink-0 border border-[#C49A45]/30">
              <ShieldCheck className="w-5 h-5 text-[#25251F]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C49A45] ring-2 ring-[#FFFEFA]" />
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-[#25251F] leading-tight flex items-center gap-1">
                  FINTRUST <span className="text-[#A88032] font-black">AI</span>
                </span>
                <span className="text-[10px] text-[#777365] font-medium tracking-wide uppercase">
                  Institutional Audit
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
              className="hidden lg:flex p-1.5 rounded-xl text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#C49A45]" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? "bg-gradient-champagne text-[#25251F] shadow-sm font-bold border border-[#C49A45]/40"
                    : "text-[#777365] hover:text-[#25251F] hover:bg-[#FAF7F0]"
                }`}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#25251F]" : "text-[#777365] group-hover:text-[#25251F]"
                  }`}
                />

                {(!isCollapsed || isMobile) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}

                {(!isCollapsed || isMobile) && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#C49A45]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Status Section */}
      <div className="p-3 border-t border-[#E9E1D1] space-y-2">
        {/* Verification Status Pill (expanded only) */}
        {(!isCollapsed || isMobile) && (
          <div className="p-2.5 rounded-xl bg-[#FFFEFA] border border-[#E9E1D1] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#258B65] shrink-0" />
              <div className="truncate">
                <p className="text-[11px] font-semibold text-[#25251F] truncate">SEBI Reg. Radar</p>
                <p className="text-[10px] text-[#777365]">Online & Active</p>
              </div>
            </div>
            <span className="text-[10px] text-[#9E7828] font-mono font-medium bg-[#F5EEDB] px-1.5 py-0.5 rounded shrink-0 border border-[#C49A45]/30">
              v1.4
            </span>
          </div>
        )}

        {/* User Profile Card */}
        <div
          className={`p-2 rounded-xl bg-[#FFFEFA] border border-[#E9E1D1] flex items-center shadow-sm ${
            isCollapsed && !isMobile ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-champagne flex items-center justify-center font-bold text-xs text-[#25251F] shadow-sm shrink-0 border border-[#C49A45]/30">
              {initials}
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#25251F] truncate capitalize">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#777365] truncate font-mono">
                  {userEmail || "guest@fintrust.ai"}
                </p>
              </div>
            )}
          </div>

          {(!isCollapsed || isMobile) && (
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
          )}
        </div>
      </div>
    </aside>
  );
}
