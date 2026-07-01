import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OperatorReportsClient } from "./client";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
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

export default async function OperatorReports() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, operator_id")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "operator_admin" || !profile?.operator_id) {
    redirect("/login");
  }

  const operatorId = profile.operator_id;

  const today = todayStr();
  const monthStart = startOfMonth();
  const last14 = lastNDays(14);

  // Basic operator info
  const operatorRes = await supabase
    .from("operators")
    .select("name, logo_url")
    .eq("id", operatorId)
    .single();
  const operator = operatorRes.data;

  // Direct-query data (filtered by operator_id directly)
  const [busesRes, staffRes] = await Promise.all([
    supabase.from("buses").select("id, status").eq("operator_id", operatorId),
    supabase.from("users").select("id, role, status").eq("operator_id", operatorId).in("role", ["driver", "conductor"]),
  ]);

  const buses = busesRes.data ?? [];
  const staff = staffRes.data ?? [];

  // Use joins to flatten the routes -> schedules -> trips chain into single queries
  const { data: routes } = await supabase.from("routes").select("id, status").eq("operator_id", operatorId);
  const activeRoutes = (routes ?? []).filter((r) => r.status === "active").length;

  const [scheduleRes, tripsRes] = await Promise.all([
    supabase.from("schedules").select("id, routes!inner(operator_id)").eq("routes.operator_id", operatorId),
    supabase.from("trips").select("id, status, trip_date, schedules!inner(route_id, routes!inner(operator_id))").eq("schedules.routes.operator_id", operatorId).gte("trip_date", last14[0]).order("trip_date", { ascending: true }),
  ]);

  const scheduleIds = (scheduleRes.data ?? []).map((s) => s.id);
  const trips = tripsRes.data ?? [];
  const todayTrips = trips.filter((t) => t.trip_date === today);

  const tripIds = trips.map((t) => t.id);
  let allBookings: { id: string; status: string; booked_at: string | null }[] = [];
  if (tripIds.length > 0) {
    const { data: bookingsData } = await supabase.from("bookings").select("id, status, booked_at").in("trip_id", tripIds).gte("booked_at", last14[0]);
    allBookings = bookingsData ?? [];
  }

  // ---- Stats ----
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === "active").length;
  const maintenanceBuses = buses.filter((b) => b.status === "maintenance").length;
  const retiredBuses = buses.filter((b) => b.status === "retired").length;

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const drivers = staff.filter((s) => s.role === "driver").length;
  const conductors = staff.filter((s) => s.role === "conductor").length;

  const totalRoutes = (routes ?? []).length;
  const activeSchedules = scheduleIds.length;

  const tripScheduled = todayTrips.filter((t) => t.status === "scheduled").length;
  const tripInProgress = todayTrips.filter((t) => t.status === "in_progress").length;
  const tripCompleted = todayTrips.filter((t) => t.status === "completed").length;
  const todayBookings = allBookings.filter((b) => b.booked_at && b.booked_at.startsWith(today)).length;

  // ---- Charts ----
  const busChartData = [
    { name: "Active", value: activeBuses, color: "#10b981" },
    { name: "Maintenance", value: maintenanceBuses, color: "#f59e0b" },
    { name: "Retired", value: retiredBuses, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const tripChartData = [
    { name: "Scheduled", value: tripScheduled, color: "#3b82f6" },
    { name: "In Progress", value: tripInProgress, color: "#f59e0b" },
    { name: "Completed", value: tripCompleted, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const staffChartData = [
    { name: "Drivers", value: drivers, color: "#3b82f6" },
    { name: "Conductors", value: conductors, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  // ---- Trends (last 14 days) ----
  const tripTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: trips.filter((t) => t.trip_date === date).length,
  }));

  const bookingTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: allBookings.filter((b) => b.booked_at && b.booked_at.startsWith(date)).length,
  }));

  return (
    <OperatorReportsClient
      operatorName={operator?.name ?? "Operator"}
      logoUrl={operator?.logo_url ?? null}
      totalBuses={totalBuses}
      activeBuses={activeBuses}
      totalRoutes={totalRoutes}
      activeRoutes={activeRoutes}
      activeSchedules={activeSchedules}
      totalStaff={totalStaff}
      activeStaff={activeStaff}
      tripScheduled={tripScheduled}
      tripInProgress={tripInProgress}
      tripCompleted={tripCompleted}
      todayBookings={todayBookings}
      drivers={drivers}
      conductors={conductors}
      busChartData={busChartData}
      tripChartData={tripChartData}
      staffChartData={staffChartData}
      tripTrend={tripTrend}
      bookingTrend={bookingTrend}
    />
  );
}
