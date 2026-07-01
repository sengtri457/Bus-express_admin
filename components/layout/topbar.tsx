"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Search,
  Bell,
  LogOut,
  Menu,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";
import type { User as UserType, Role } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface TopbarProps {
  user: Pick<UserType, "name" | "email" | "role">;
  role: Role;
  logoUrl?: string | null;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

function getRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return new Date(iso).toLocaleDateString();
}

export function Topbar({
  user,
  role,
  logoUrl,
  onMenuClick,
  onSearchClick,
}: TopbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function initNotifications() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser || cancelled) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && !cancelled) setNotifications(data);
      if (cancelled) return;

      channel = supabase
        .channel(`notifications-${authUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${authUser.id}`,
          },
          (payload: any) => {
            setNotifications((prev) => [payload.new, ...prev].slice(0, 20));
          },
        )
        .subscribe();
    }

    initNotifications();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function markAllAsRead() {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", authUser.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markAsRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "O";
  const displayName = user.name ?? "Operator";

  return (
    <header className="flex-shrink-0 flex h-12 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6">
      {/* Left: Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search trigger - visible on all breakpoints */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-gray-50 hover:bg-gray-100 hover:border-gray-300 px-3 py-1.5 text-xs text-[#94A3B8] transition-all group"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline text-[#94A3B8] group-hover:text-gray-600 transition-colors">
            Search...
          </span>
          <kbd className="hidden md:inline-flex items-center ml-2 text-[10px] font-medium text-[#94A3B8] border border-gray-200 bg-white rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-1.5 rounded-lg border border-transparent hover:border-[#E2E8F0] hover:bg-gray-50 text-[#64748B] hover:text-[#0F172A] transition-all",
              showNotifications && "bg-gray-50 border-[#E2E8F0] text-[#0F172A]",
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E2E8F0] bg-white shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-[#0F172A]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xxs font-semibold bg-red-50 hover:bg-red-100 text-red-500 px-2 py-0.5 rounded-full transition-colors animate-fade-in"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-[#94A3B8]">
                    No notifications
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        setShowNotifications(false);
                        if (
                          notif.reference_type === "trip" &&
                          notif.reference_id
                        ) {
                          router.push(
                            `/operator/tracking?selectedDriverId=${notif.reference_id}`,
                          );
                        }
                      }}
                      className={cn(
                        "px-4 py-3 text-xs flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer",
                        !notif.is_read && "bg-blue-50/30",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                          !notif.is_read ? "bg-[#2563EB]" : "bg-gray-300",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F172A] font-semibold leading-snug">
                          {notif.title}
                        </p>
                        <p className="text-[#64748B] mt-0.5 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-xxs text-[#94A3B8] mt-1">
                          {getRelativeTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full text-center text-xs font-medium text-[#2563EB] hover:text-blue-700 py-1 transition-colors"
                >
                  Close panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-[#E2E8F0]" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 border border-transparent hover:border-[#E2E8F0] hover:bg-gray-50 transition-all",
              showProfileMenu && "bg-gray-50 border-[#E2E8F0]",
            )}
          >
            {/* Avatar: logo image or gradient initials fallback */}
            <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-[#E2E8F0] bg-gradient-to-br from-[#2563EB] to-[#7C3AED]">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={displayName}
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Hide broken image, gradient bg will show through
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-xs font-semibold text-[#0F172A] max-w-[100px] truncate">
                {displayName}
              </span>
              <span className="text-xxs text-[#94A3B8]">
                {role === "operator_admin" ? "Operator" : "Super Admin"}
              </span>
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#E2E8F0] bg-white shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {displayName}
                </p>
                <p className="text-xxs text-[#94A3B8] truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <a
                  href="/operator/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </a>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569]">
                  <Shield className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>
                    Role:{" "}
                    <span className="font-semibold text-[#2563EB]">
                      {role === "operator_admin" ? "Operator" : "Super Admin"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-1.5 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
