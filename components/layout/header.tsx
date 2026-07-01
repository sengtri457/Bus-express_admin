"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Bell,
  LogOut,
  Menu,
  User,
  Settings,
  Shield,
  Activity,
  Bus,
  Calendar,
  Ticket,
} from "lucide-react";
import type { User as UserType, Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  user: Pick<UserType, "name" | "email" | "role">;
  role: Role;
  stats?: {
    totalBookings: number;
    activeTrips: number;
    activeBuses: number;
  };
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Header({
  user,
  role,
  stats = { totalBookings: 148, activeTrips: 24, activeBuses: 18 },
  onMenuClick,
  onSearchClick,
}: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
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

  // Mock notification data
  const mockNotifications = [
    {
      id: 1,
      text: "New schedule created for Phnom Penh - Siem Reap Route",
      time: "10 mins ago",
      unread: true,
    },
    {
      id: 2,
      text: "Bus PP-3456 assigned to Driver John Doe",
      time: "45 mins ago",
      unread: true,
    },
    {
      id: 3,
      text: "Staff status updated for Conductor Meng Ly",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: 4,
      text: "Route Phnom Penh - Kampot modified successfully",
      time: "4 hours ago",
      unread: false,
    },
  ];

  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 md:px-8 shadow-xs">
      {/* Left side: Hamburger (Mobile) & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm md:text-base font-bold text-[#0F172A] whitespace-nowrap truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]">
            Good Morning, {user.name ? user.name : "Operator"}
          </h1>
          <p className="hidden md:block text-xxs font-medium text-[#64748B] mt-0.5 whitespace-nowrap truncate">
            BusExpress Administrator Panel
          </p>
        </div>
      </div>

      {/* Center section: Today's Summary (Desktop only) */}
      {role === "operator_admin" && (
        <div className="hidden xl:flex items-center gap-6 border-l border-[#E5E7EB] pl-6 py-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xxs font-medium text-[#64748B] whitespace-nowrap">
                Total Bookings
              </p>
              <p className="text-xs font-bold text-[#0F172A]">
                {stats.totalBookings}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#10B981]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xxs font-medium text-[#64748B] whitespace-nowrap">
                Active Trips
              </p>
              <p className="text-xs font-bold text-[#0F172A]">
                {stats.activeTrips}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B]">
              <Bus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xxs font-medium text-[#64748B] whitespace-nowrap">
                Active Buses
              </p>
              <p className="text-xs font-bold text-[#0F172A]">
                {stats.activeBuses}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Modern Search Trigger Button */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 px-3 py-1.5 text-xs text-[#64748B] transition-all w-28 md:w-48 shadow-2xs group"
        >
          <Search className="h-4 w-4 shrink-0 text-[#64748B] group-hover:text-[#0F172A]" />
          <span className="hidden md:inline truncate">
            Search operator panel...
          </span>
          <span className="hidden md:inline ml-auto text-xxs font-medium text-[#64748B]/60 border border-[#E5E7EB] bg-white rounded-md px-1.5 py-0.5">
            ⌘K
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-2 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs",
              showNotifications && "bg-gray-50 border-gray-300 text-[#0F172A]",
            )}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <span className="text-xs font-bold text-[#0F172A]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-xxs font-semibold bg-red-50 text-[#EF4444] px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 text-xs leading-relaxed transition-colors hover:bg-gray-50/50 flex gap-2.5",
                      notif.unread && "bg-blue-50/20",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                        notif.unread ? "bg-[#2563EB]" : "bg-gray-300",
                      )}
                    />
                    <div>
                      <p className="text-[#0F172A] font-medium">{notif.text}</p>
                      <p className="text-xxs text-[#64748B] mt-1">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-1 border-t border-gray-100">
                <a
                  href="/operator/reports"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-xxs font-semibold text-[#2563EB] hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                >
                  View all system logs
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2"
          >
            <div className="h-8.5 w-8.5 rounded-full border border-[#E5E7EB] bg-[#2563EB]/10 text-[#2563EB] font-bold flex items-center justify-center shadow-2xs hover:scale-102 transition-transform select-none">
              {user.name ? user.name.charAt(0).toUpperCase() : "O"}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-[#0F172A] truncate">
                  {user.name ?? "Operator User"}
                </p>
                <p className="text-xxs text-[#64748B] truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              <div className="py-1">
                <a
                  href="/operator/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#64748B]">
                  <Shield className="h-4 w-4 text-[#2563EB]" />
                  <span>
                    Role:{" "}
                    <span className="font-semibold capitalize text-[#2563EB]">
                      {role === "operator_admin" ? "Operator" : "Super Admin"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-1.5 mt-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  loading={loggingOut}
                  className="w-full justify-start gap-2.5 px-3 py-2 text-xs font-semibold text-[#EF4444] hover:text-[#EF4444] hover:bg-red-50/50 rounded-xl"
                >
                  {!loggingOut && <LogOut className="h-4 w-4" />}
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
