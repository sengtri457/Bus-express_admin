"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Route,
  Bus,
  Calendar,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Users,
  Tags,
  Navigation,
} from "lucide-react";

interface SidebarProps {
  role: Role;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const operatorSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/operator", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      { label: "Routes", href: "/operator/routes", icon: Route },
      { label: "Buses", href: "/operator/buses", icon: Bus },
      { label: "Schedules", href: "/operator/schedules", icon: Calendar },
      { label: "Staff", href: "/operator/staff", icon: UserCog },
      { label: "Live Tracking", href: "/operator/tracking", icon: Navigation },
    ],
  },
  {
    title: "Analytics",
    items: [{ label: "Reports", href: "/operator/reports", icon: BarChart3 }],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/operator/settings", icon: Settings }],
  },
];

const superAdminSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Operators", href: "/super-admin/operators", icon: Building2 },
      { label: "Users", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Promotions", href: "/super-admin/promotions", icon: Tags },
      { label: "Reports", href: "/super-admin/reports", icon: BarChart3 },
    ],
  },
];

export function Sidebar({
  role,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const sections =
    role === "super_admin" ? superAdminSections : operatorSections;
  const expanded = !isCollapsed || isMobile;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[#E2E8F0] bg-white text-[#0F172A] transition-all duration-300",
        expanded ? "w-56" : "w-[60px]",
      )}
    >
      {/* Brand Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#E2E8F0] px-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Bus icon logo */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white">
            <img src="../assets/images/bus.png" alt="BusExpress Logo" />
          </div>
          {expanded && (
            <span className="text-sm font-bold tracking-tight text-[#0F172A] whitespace-nowrap overflow-hidden">
              BusExpress
            </span>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {expanded && (
              <h3 className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                {section.title}
              </h3>
            )}
            {!expanded && idx > 0 && (
              <div className="my-1 border-t border-[#E2E8F0]" />
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={
                    isMobile && onCloseMobile ? onCloseMobile : undefined
                  }
                  title={!expanded ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50",
                    !expanded && "justify-center px-0",
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 inset-y-1.5 w-0.5 rounded-r-full bg-[#2563EB]" />
                  )}

                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-[#2563EB]"
                        : "text-[#94A3B8] group-hover:text-[#475569]",
                    )}
                  />

                  {expanded && (
                    <span className="truncate leading-none">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Role + Collapse Toggle */}
      <div className="shrink-0 border-t border-[#E2E8F0] p-2">
        {expanded ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {role === "super_admin" ? "SA" : "OP"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0F172A] truncate leading-tight">
                  {role === "super_admin" ? "Super Admin" : "Operator"}
                </p>
                <p className="text-[10px] text-[#94A3B8] truncate leading-tight">
                  Administrator
                </p>
              </div>
            </div>
            {!isMobile && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-[#94A3B8] hover:text-[#475569] transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-[#94A3B8] hover:text-[#475569] transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
