import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export const revalidate = 30;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function last12MonthsLabels() {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleDateString("en", { month: "short", year: "2-digit" }));
  }
  return months;
}

function last14DaysLabels() {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
  }
  return days;
}

export default async function SuperAdminDashboard() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("id", authUser.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/login");

  const adminName = profile?.name ?? authUser.email ?? "Super Admin";
  const adminEmail = profile?.email ?? authUser.email ?? "";

  const today = todayStr();
  const mStart = monthStart();

  const [usersRes, operatorsRes, tripsRes, bookingsRes, paymentsRes] = await Promise.all([
    supabase.from("users").select("id, name, email, role, status, created_at"),
    supabase.from("operators").select("id, name, status, created_at"),
    supabase.from("trips").select("id, status, trip_date"),
    supabase.from("bookings").select("id, status, booked_at"),
    supabase.from("payments").select("amount, status, paid_at"),
  ]);

  const users = usersRes.data ?? [];
  const operators = operatorsRes.data ?? [];
  const trips = tripsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const totalOperators = operators.length;
  const activeOperators = operators.filter((o) => o.status === "active").length;
  const todayTrips = trips.filter((t) => t.trip_date === today);
  const activeTrips = todayTrips.filter((t) => t.status === "in_progress").length;
  const completedTrips = trips.filter((t) => t.status === "completed").length;
  const cancelledTrips = trips.filter((t) => t.status === "cancelled").length;
  const paidPayments = payments.filter((p) => p.status === "paid");
  const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const thisMonthBookings = bookings.filter((b) => b.booked_at && b.booked_at >= mStart);
  const totalBookings = thisMonthBookings.length;
  const newUsersToday = users.filter((u) => u.created_at && u.created_at.startsWith(today)).length;
  const newOperatorsThisWeek = operators.filter((o) => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo;
  }).length;
  const confirmedBookings = thisMonthBookings.filter((b) => b.status === "confirmed" || b.status === "boarded").length;
  const bookingSuccessRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;
  const conversionRate = users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0;

  const passengers = users.filter((u) => u.role === "passenger").length;
  const drivers = users.filter((u) => u.role === "driver").length;
  const conductors = users.filter((u) => u.role === "conductor").length;
  const operatorAdmins = users.filter((u) => u.role === "operator_admin").length;
  const superAdmins = users.filter((u) => u.role === "super_admin").length;
  const activePassengers = users.filter((u) => u.role === "passenger" && u.status === "active").length;

  const monthLabels = last12MonthsLabels();
  const monthlyUsers = new Array(12).fill(0);
  const monthlyOperators = new Array(12).fill(0);
  users.forEach((u) => {
    if (u.created_at) {
      const d = new Date(u.created_at);
      const now = new Date();
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (diffMonths >= 0 && diffMonths < 12) monthlyUsers[11 - diffMonths]++;
    }
  });
  operators.forEach((o) => {
    if (o.created_at) {
      const d = new Date(o.created_at);
      const now = new Date();
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (diffMonths >= 0 && diffMonths < 12) monthlyOperators[11 - diffMonths]++;
    }
  });

  const dayLabels = last14DaysLabels();
  const dailyActiveUsers = dayLabels.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split("T")[0];
    return users.filter((u) => u.created_at && u.created_at.startsWith(dateStr)).length;
  });

  const userGrowthTrend = monthlyUsers;
  const operatorGrowthTrend = monthlyOperators;

  const roleChartData = [
    { name: "Passengers", value: passengers, color: "#3b82f6" },
    { name: "Drivers", value: drivers, color: "#10b981" },
    { name: "Conductors", value: conductors, color: "#f59e0b" },
    { name: "Op. Admins", value: operatorAdmins, color: "#8b5cf6" },
    { name: "Super Admins", value: superAdmins, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const recentUsers = users.slice(0, 6).map((u) => ({
    id: u.id,
    name: u.name ?? "Unknown",
    email: u.email ?? "",
    role: u.role,
    status: u.status,
    created_at: u.created_at,
  }));

  const kpiData = {
    totalUsers,
    activeUsers,
    totalOperators,
    activeTrips,
    totalRevenue,
    totalBookings,
    newUsersToday,
    newOperatorsThisWeek,
    completedTrips,
    cancelledTrips,
    bookingSuccessRate,
    conversionRate,
    activePassengers,
    passengers,
    drivers,
    conductors,
    operatorAdmins,
    superAdmins,
  };

  const chartData = {
    monthLabels,
    userGrowthTrend,
    operatorGrowthTrend,
    dailyActiveUsers,
    roleChartData,
    dayLabels,
  };

  const recentUsersData = recentUsers;

  return (
    <DashboardClient
      kpiData={kpiData}
      chartData={chartData}
      recentUsers={recentUsersData}
      adminName={adminName}
      adminEmail={adminEmail}
    />
  );
}
