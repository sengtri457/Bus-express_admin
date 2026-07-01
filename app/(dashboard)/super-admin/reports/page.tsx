import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ReportsClient } from "./client";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default async function SuperAdminReports() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/login");

  const monthStart = startOfMonth();
  const today = todayStr();
  const last14 = lastNDays(14);

  const [paymentsRes, bookingsRes, tripsRes, operatorsRes, usersRes, promosRes, promoUsageRes] =
    await Promise.all([
      supabase.from("payments").select("amount, method, status, paid_at"),
      supabase.from("bookings").select("id, status, booked_at"),
      supabase.from("trips").select("id, status, trip_date"),
      supabase.from("operators").select("id, status"),
      supabase.from("users").select("id, role, status"),
      supabase.from("promotions").select("id, is_active"),
      supabase.from("promotion_usages").select("id, used_at"),
    ]);

  const payments = paymentsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const trips = tripsRes.data ?? [];
  const operators = operatorsRes.data ?? [];
  const users = usersRes.data ?? [];
  const promotions = promosRes.data ?? [];
  const promoUsages = promoUsageRes.data ?? [];

  // ---- Stats Cards ----
  const paidPayments = payments.filter((p) => p.status === "paid");
  const thisMonthPaid = paidPayments.filter((p) => p.paid_at && p.paid_at >= monthStart);
  const totalRevenue = thisMonthPaid.reduce((s, p) => s + (p.amount ?? 0), 0);

  const thisMonthBookings = bookings.filter((b) => b.booked_at && b.booked_at >= monthStart);
  const totalBookings = thisMonthBookings.length;

  const todayTrips = trips.filter((t) => t.trip_date === today);
  const activeTrips = todayTrips.filter((t) => t.status === "in_progress").length;

  const activeOperators = operators.filter((o) => o.status === "active").length;
  const totalUsers = users.length;
  const activePromotions = promotions.filter((p) => p.is_active).length;

  // ---- Revenue by Method ----
  const cashRev = thisMonthPaid.filter((p) => p.method === "cash").reduce((s, p) => s + (p.amount ?? 0), 0);
  const bakongRev = thisMonthPaid.filter((p) => p.method === "bakong").reduce((s, p) => s + (p.amount ?? 0), 0);
  const revenueByMethod = [
    { name: "Cash", value: Number(cashRev.toFixed(2)), color: "#10b981" },
    { name: "Bakong", value: Number(bakongRev.toFixed(2)), color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  // ---- Bookings by Status ----
  const bkStatuses = ["pending", "confirmed", "boarded", "cancelled"] as const;
  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    boarded: "#10b981",
    cancelled: "#ef4444",
  };
  const bookingsByStatus = bkStatuses
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: thisMonthBookings.filter((b) => b.status === s).length,
      color: statusColors[s],
    }))
    .filter((d) => d.value > 0);

  // ---- Trips by Status ----
  const tpStatuses = ["scheduled", "in_progress", "completed", "cancelled"] as const;
  const tripColors: Record<string, string> = {
    scheduled: "#8b5cf6",
    in_progress: "#3b82f6",
    completed: "#10b981",
    cancelled: "#ef4444",
  };
  const tripsByStatus = tpStatuses
    .map((s) => ({
      name: s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1),
      value: trips.filter((t) => t.status === s).length,
      color: tripColors[s],
    }))
    .filter((d) => d.value > 0);

  // ---- Revenue Trend (last 14 days) ----
  const revenueTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: paidPayments
      .filter((p) => p.paid_at && p.paid_at.startsWith(date))
      .reduce((s, p) => s + (p.amount ?? 0), 0),
  }));

  // ---- Bookings Trend (last 14 days) ----
  const bookingsTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: bookings.filter((b) => b.booked_at && b.booked_at.startsWith(date)).length,
  }));

  // ---- Users by Role ----
  const roleColors: Record<string, string> = {
    passenger: "#3b82f6",
    driver: "#10b981",
    conductor: "#f59e0b",
    operator_admin: "#8b5cf6",
    super_admin: "#ef4444",
  };
  const roleLabels: Record<string, string> = {
    passenger: "Passengers",
    driver: "Drivers",
    conductor: "Conductors",
    operator_admin: "Op. Admins",
    super_admin: "Super Admins",
  };
  const roleGroups: Record<string, number> = {};
  users.forEach((u) => {
    const r = u.role ?? "unknown";
    roleGroups[r] = (roleGroups[r] ?? 0) + 1;
  });
  const usersByRole = Object.entries(roleGroups)
    .map(([role, count]) => ({
      name: roleLabels[role] ?? role,
      value: count,
      color: roleColors[role] ?? "#6b7280",
    }))
    .filter((d) => d.value > 0);

  // ---- Promo Usage ----
  const promoUsageCount = promoUsages.length;

  return (
    <ReportsClient
      totalRevenue={totalRevenue}
      totalBookings={totalBookings}
      activeTrips={activeTrips}
      activeOperators={activeOperators}
      totalUsers={totalUsers}
      activePromotions={activePromotions}
      revenueByMethod={revenueByMethod}
      bookingsByStatus={bookingsByStatus}
      tripsByStatus={tripsByStatus}
      revenueTrend={revenueTrend}
      bookingsTrend={bookingsTrend}
      usersByRole={usersByRole}
      promoUsageCount={promoUsageCount}
    />
  );
}
