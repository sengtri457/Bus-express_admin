export const ROLES = {
  SUPER_ADMIN: "super_admin",
  OPERATOR_ADMIN: "operator_admin",
  DRIVER: "driver",
  CONDUCTOR: "conductor",
  PASSENGER: "passenger",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export const BUS_STATUS = {
  ACTIVE: "active",
  MAINTENANCE: "maintenance",
  RETIRED: "retired",
} as const;

export const SCHEDULE_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
} as const;

export const ROUTE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const DAY_LABELS: Record<string, string> = {
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
  "7": "Sun",
};

export const NAV_ITEMS = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: "LayoutDashboard" },
    { label: "Operators", href: "/super-admin/operators", icon: "Building2" },
    { label: "Users", href: "/super-admin/users", icon: "Users" },
    { label: "Promotions", href: "/super-admin/promotions", icon: "Tags" },
    { label: "Reports", href: "/super-admin/reports", icon: "BarChart3" },
  ],
  operator_admin: [
    { label: "Dashboard", href: "/operator", icon: "LayoutDashboard" },
    { label: "Routes", href: "/operator/routes", icon: "Route" },
    { label: "Buses", href: "/operator/buses", icon: "Bus" },
    { label: "Schedules", href: "/operator/schedules", icon: "Calendar" },
    { label: "Staff", href: "/operator/staff", icon: "UserCog" },
    { label: "Penalties", href: "/operator/penalties", icon: "Coins" },
    { label: "Reports", href: "/operator/reports", icon: "BarChart3" },
  ],
} as const;
