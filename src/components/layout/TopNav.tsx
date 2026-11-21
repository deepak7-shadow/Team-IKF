import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Inbox,
} from "lucide-react";
import { fetchNotifications, supabase } from "../../lib/supabase";
import type { Notification } from "../../types";

interface TopNavProps {
  onOpenMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function TopNav({
  onOpenMobile,
  isCollapsed = false,
  onToggleCollapse,
}: TopNavProps) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const notifs = await fetchNotifications();
        setNotifications(notifs);

        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch (err) {
        console.error("Failed to load nav data:", err);
      }
    }
    loadInitialData();

    // Refresh notifications & user info whenever the auth session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadInitialData();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return {
          title: "Dashboard Overview",
          subtitle: "Real-time market claims and verification analytics",
        };
      case "/claim-analyzer":
        return {
          title: "Claim Analyzer",
          subtitle: "Submit & verify financial claims against factual data",
        };
      case "/prediction-tracker":
        return {
          title: "Prediction Tracker",
          subtitle: "Track forecast outcomes, targets and accuracy",
        };
      case "/investor-education":
        return {
          title: "Investor Education",
          subtitle: "Guides on fraud detection & SEBI advisory standards",
        };
      case "/saved-reports":
        return {
          title: "Saved Reports",
          subtitle: "Audit logs, verified claim history and exported dossiers",
        };
      case "/settings":
        return {
          title: "System Settings",
          subtitle: "API connectors, preferences and security controls",
        };
      default:
        return {
          title: "FINTRUST AI",
          subtitle: "Financial intelligence & verification",
        };
    }
  };

  const currentMeta = getPageTitle(location.pathname);

  const displayName = userEmail ? userEmail.split("@")[0] : "Analyst Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-[#E9E1D1] bg-[#F8F5EC]/95 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-4 shrink-0">
      {/* Left: Mobile hamburger menu & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD] transition-colors cursor-pointer shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-xl text-[#777365] hover:text-[#25251F] hover:bg-[#F1EBDD] transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#C49A45]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-[#25251F] tracking-tight truncate">
            {currentMeta.title}
          </h1>
          <p className="text-[11px] text-[#777365] truncate hidden sm:block max-w-xs md:max-w-md">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-sm lg:max-w-md relative hidden md:block">
        <Search className="w-4 h-4 text-[#777365] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search claims, tickers, creators..."
          className="w-full bg-[#FFFEFA] border border-[#E9E1D1] rounded-xl pl-9 pr-14 py-2 text-xs text-[#25251F] placeholder-[#777365]/60 focus:outline-none focus:border-[#C49A45] focus:ring-1 focus:ring-[#C49A45] transition-all shadow-sm"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#F1EBDD] text-[#777365] border border-[#E9E1D1]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick actions & notification */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Verify Claim Button */}
        <Link
          to="/claim-analyzer"
          className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-xl shadow-gold-glow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">Verify Claim</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#FFFEFA] hover:bg-[#F1EBDD] border border-[#E9E1D1] text-[#777365] hover:text-[#25251F] transition-colors relative cursor-pointer shadow-sm"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C49A45] ring-2 ring-[#FFFEFA]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-[#FFFEFA] p-4 shadow-2xl z-50 animate-fade-in border border-[#E9E1D1] text-[#25251F]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E1D1]">
                <span className="text-xs font-bold text-[#25251F] uppercase tracking-wider">
                  Audit Notifications
                </span>
                {notifications.length > 0 && (
                  <span
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-[#A88032] font-semibold cursor-pointer hover:underline"
                  >
                    Clear all
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#E9E1D1] mt-2 max-h-72 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center space-y-1.5 text-xs text-[#777365]">
                    <Inbox className="w-6 h-6 mx-auto text-[#C49A45] opacity-60" />
                    <p className="font-semibold text-[#25251F]">No new notifications</p>
                    <p className="text-[11px]">System and compliance updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2.5 flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          n.type === "alert"
                            ? "bg-[#FDE8E8] text-[#D95353] border border-[#D95353]/30"
                            : n.type === "success"
                            ? "bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30"
                            : "bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/30"
                        }`}
                      >
                        {n.type === "alert" ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#25251F]">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-[#777365] line-clamp-2 mt-0.5">
                          {n.desc}
                        </p>
                        <p className="text-[9px] text-[#9E9988] mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2.5 border-t border-[#E9E1D1] text-center">
                <Link
                  to="/saved-reports"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-[#A88032] font-semibold hover:text-[#25251F] flex items-center justify-center gap-1"
                >
                  View full activity log <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E9E1D1]">
          <div className="w-8 h-8 rounded-xl bg-gradient-champagne flex items-center justify-center text-xs font-bold text-[#25251F] shadow-sm shrink-0 border border-[#C49A45]/30">
            {initials}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-[#25251F] leading-tight capitalize">
              {displayName}
            </p>
            <p className="text-[10px] text-[#A88032] font-medium">Verified Platform</p>
          </div>
        </div>
      </div>
    </header>
  );
}
