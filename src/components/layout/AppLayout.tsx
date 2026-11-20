import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <div className="h-screen w-full bg-[#F8F5EC] text-[#25251F] flex relative overflow-hidden font-sans selection:bg-[#C49A45] selection:text-white">
      {/* Background ambient luxury decorative glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top radial warm champagne glow */}
        <div className="absolute -top-40 left-1/3 w-[650px] h-[450px] bg-[#E4C477]/15 rounded-full blur-[140px]" />
        {/* Soft amber glow bottom-right */}
        <div className="absolute -bottom-40 right-10 w-[600px] h-[450px] bg-[#D6A94F]/10 rounded-full blur-[160px]" />
        {/* Delicate ivory accent left */}
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-[#F1EBDD]/60 rounded-full blur-[140px]" />
        {/* Subtle warm micro-grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E9E1D130_1px,transparent_1px),linear-gradient(to_bottom,#E9E1D130_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      </div>

      <div className="flex flex-1 z-10 relative h-full w-full overflow-hidden">
        {/* Desktop Persistent / Collapsible Sidebar */}
        <div
          className={`hidden lg:block shrink-0 h-full transition-all duration-300 ease-in-out ${
            desktopCollapsed ? "w-20" : "w-64"
          }`}
        >
          <Sidebar
            isCollapsed={desktopCollapsed}
            onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Backdrop & Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#25251F]/30 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in-left bg-[#F8F5EC]">
              <Sidebar
                isMobile
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopNav
            onOpenMobile={() => setMobileMenuOpen(true)}
            isCollapsed={desktopCollapsed}
            onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
          />
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
