"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { Role, User } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
  user: Pick<User, "name" | "email" | "role">;
  role: Role;
  logoUrl?: string | null;
}

export function DashboardShell({ children, user, role, logoUrl }: DashboardShellProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-[#0F172A]">
      {/* Sidebar: Desktop */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar
          role={role}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Sidebar: Mobile (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 w-64 bg-white shadow-2xl flex flex-col h-full">
            <Sidebar
              role={role}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isMobile
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Layout: Topbar + Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Slim Topbar */}
        <Topbar
          user={user}
          role={role}
          logoUrl={logoUrl}
          onMenuClick={() => setIsMobileOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Overlay (Command Palette style) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-[#0F172A]/50 backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-gray-100 px-4 py-3 gap-3">
              <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search routes, buses, schedules..."
                className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
              <kbd className="shrink-0 text-xxs font-medium text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5 bg-gray-50">
                ESC
              </kbd>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <p className="text-xxs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Navigation</p>
              <div className="space-y-0.5">
                {[
                  { label: "View Routes list", href: "/operator/routes", desc: "Operations / Routes" },
                  { label: "Add new Bus to fleet", href: "/operator/buses", desc: "Operations / Buses" },
                  { label: "Manage Driver Schedules", href: "/operator/schedules", desc: "Operations / Schedules" },
                  { label: "Manage Staff", href: "/operator/staff", desc: "Operations / Staff" },
                  { label: "System Settings", href: "/operator/settings", desc: "System / Settings" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className="text-xxs text-gray-400">{item.desc}</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
