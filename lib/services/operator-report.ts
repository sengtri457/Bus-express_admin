import { SupabaseClient } from "@supabase/supabase-js";

export interface OperatorReportData {
  operatorName: string;
  logoUrl: string | null;
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  retiredBuses: number;
  totalStaff: number;
  activeStaff: number;
  drivers: number;
  conductors: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  tripScheduled: number;
  tripInProgress: number;
  tripCompleted: number;
  todayBookings: number;
  busChartData: { name: string; value: number; color: string }[];
  tripChartData: { name: string; value: number; color: string }[];
  staffChartData: { name: string; value: number; color: string }[];
  tripTrend: { label: string; value: number }[];
  bookingTrend: { label: string; value: number }[];
  
  // Revenue enhancements
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
  revenueByMethod: { name: string; value: number; color: string }[];
  revenueTrend: { label: string; value: number }[];
}

export interface OperatorSummary {
  operatorId: string;
  operatorName: string;
  logoUrl: string | null;
  status: string;
  totalBuses: number;
  activeBuses: number;
  totalStaff: number;
  activeStaff: number;
  drivers: number;
  conductors: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalBookings: number;
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
}

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

export async function fetchOperatorReport(
  supabase: SupabaseClient,
  operatorId: string
): Promise<OperatorReportData> {
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

  // Direct-query data
  const [busesRes, staffRes] = await Promise.all([
    supabase.from("buses").select("id, status").eq("operator_id", operatorId),
    supabase.from("users")
      .select("id, role, status")
      .eq("operator_id", operatorId)
      .in("role", ["driver", "conductor"]),
  ]);

  const buses = busesRes.data ?? [];
  const staff = staffRes.data ?? [];

  // Routes
  const { data: routes } = await supabase
    .from("routes")
    .select("id, status")
    .eq("operator_id", operatorId);
  const activeRoutes = (routes ?? []).filter((r) => r.status === "active").length;

  // Schedules and Trips
  const [scheduleRes, tripsRes] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, routes!inner(operator_id)")
      .eq("routes.operator_id", operatorId),
    supabase
      .from("trips")
      .select("id, status, trip_date, schedules!inner(route_id, routes!inner(operator_id))")
      .eq("schedules.routes.operator_id", operatorId)
      .gte("trip_date", last14[0])
      .order("trip_date", { ascending: true }),
  ]);

  const scheduleIds = (scheduleRes.data ?? []).map((s) => s.id);
  const trips = tripsRes.data ?? [];
  const todayTrips = trips.filter((t) => t.trip_date === today);

  const tripIds = trips.map((t) => t.id);
  let allBookings: { id: string; status: string; booked_at: string | null }[] = [];
  if (tripIds.length > 0) {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("id, status, booked_at")
      .in("trip_id", tripIds)
      .gte("booked_at", last14[0]);
    allBookings = bookingsData ?? [];
  }

  // Fetch payments for revenue calculations (Filter by this month)
  let payments: { amount: number; method: string; status: string; paid_at: string | null }[] = [];
  if (allBookings.length > 0) {
    const bookingIds = allBookings.map((b) => b.id);
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("amount, method, status, paid_at")
      .in("booking_id", bookingIds);
    payments = paymentsData ?? [];
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
  const todayBookings = allBookings.filter(
    (b) => b.booked_at && b.booked_at.startsWith(today)
  ).length;

  // ---- Revenue calculations ----
  const paidPayments = payments.filter((p) => p.status === "paid");
  const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const cashRevenue = paidPayments
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const bakongRevenue = paidPayments
    .filter((p) => p.method === "bakong")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const revenueByMethod = [
    { name: "Cash", value: Number(cashRevenue.toFixed(2)), color: "#10b981" },
    { name: "Bakong", value: Number(bakongRevenue.toFixed(2)), color: "#3b82f6" },
  ].filter((d) => d.value > 0);

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
    label: new Date(date + "T00:00:00").toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    value: trips.filter((t) => t.trip_date === date).length,
  }));

  const bookingTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    value: allBookings.filter((b) => b.booked_at && b.booked_at.startsWith(date)).length,
  }));

  const revenueTrend = last14.map((date) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    value: paidPayments
      .filter((p) => p.paid_at && p.paid_at.startsWith(date))
      .reduce((s, p) => s + (p.amount ?? 0), 0),
  }));

  return {
    operatorName: operator?.name ?? "Operator",
    logoUrl: operator?.logo_url ?? null,
    totalBuses,
    activeBuses,
    maintenanceBuses,
    retiredBuses,
    totalStaff,
    activeStaff,
    drivers,
    conductors,
    totalRoutes,
    activeRoutes,
    activeSchedules,
    tripScheduled,
    tripInProgress,
    tripCompleted,
    todayBookings,
    busChartData,
    tripChartData,
    staffChartData,
    tripTrend,
    bookingTrend,
    totalRevenue,
    cashRevenue,
    bakongRevenue,
    revenueByMethod,
    revenueTrend,
  };
}

export async function fetchAllOperatorsSummary(
  supabase: SupabaseClient
): Promise<OperatorSummary[]> {
  // Fetch all Operators
  const { data: operators } = await supabase
    .from("operators")
    .select("id, name, logo_url, status");

  if (!operators) return [];

  // Fetch Buses, Staff, Routes, Schedules
  const [busesRes, staffRes, routesRes, schedulesRes] = await Promise.all([
    supabase.from("buses").select("operator_id, status"),
    supabase.from("users")
      .select("operator_id, role, status")
      .in("role", ["driver", "conductor"]),
    supabase.from("routes").select("id, operator_id, status"),
    supabase.from("schedules").select("id, route_id"),
  ]);

  const buses = busesRes.data ?? [];
  const staff = staffRes.data ?? [];
  const routes = routesRes.data ?? [];
  const schedules = schedulesRes.data ?? [];

  // Build lookups
  const routeToOperator: Record<string, string> = {};
  routes.forEach((r) => {
    routeToOperator[r.id] = r.operator_id;
  });

  const scheduleToOperator: Record<string, string> = {};
  schedules.forEach((s) => {
    const opId = routeToOperator[s.route_id];
    if (opId) scheduleToOperator[s.id] = opId;
  });

  // Fetch Trips
  const { data: trips } = await supabase
    .from("trips")
    .select("id, schedule_id, status");

  const tripToOperator: Record<string, string> = {};
  trips?.forEach((t) => {
    const opId = scheduleToOperator[t.schedule_id];
    if (opId) tripToOperator[t.id] = opId;
  });

  // Fetch Bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, trip_id, status");

  const bookingToOperator: Record<string, string> = {};
  bookings?.forEach((b) => {
    const opId = tripToOperator[b.trip_id];
    if (opId) bookingToOperator[b.id] = opId;
  });

  // Fetch Payments (For revenue calculations)
  const { data: payments } = await supabase
    .from("payments")
    .select("booking_id, amount, status, method");

  // Summarize per operator
  return operators.map((op) => {
    const opBuses = buses.filter((b) => b.operator_id === op.id);
    const opStaff = staff.filter((s) => s.operator_id === op.id);
    const opRoutes = routes.filter((r) => r.operator_id === op.id);
    
    // Schedules
    const opSchedulesCount = schedules.filter(
      (s) => routeToOperator[s.route_id] === op.id
    ).length;

    // Trips
    const opTrips = (trips ?? []).filter(
      (t) => scheduleToOperator[t.schedule_id] === op.id
    );

    // Bookings
    const opBookings = (bookings ?? []).filter(
      (b) => tripToOperator[b.trip_id] === op.id
    );

    // Payments
    const opPayments = (payments ?? []).filter((p) => {
      const opId = bookingToOperator[p.booking_id];
      return opId === op.id;
    });

    const paidPayments = opPayments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const cashRevenue = paidPayments
      .filter((p) => p.method === "cash")
      .reduce((s, p) => s + (p.amount ?? 0), 0);
    const bakongRevenue = paidPayments
      .filter((p) => p.method === "bakong")
      .reduce((s, p) => s + (p.amount ?? 0), 0);

    return {
      operatorId: op.id,
      operatorName: op.name,
      logoUrl: op.logo_url,
      status: op.status,
      totalBuses: opBuses.length,
      activeBuses: opBuses.filter((b) => b.status === "active").length,
      totalStaff: opStaff.length,
      activeStaff: opStaff.filter((s) => s.status === "active").length,
      drivers: opStaff.filter((s) => s.role === "driver").length,
      conductors: opStaff.filter((s) => s.role === "conductor").length,
      totalRoutes: opRoutes.length,
      activeRoutes: opRoutes.filter((r) => r.status === "active").length,
      activeSchedules: opSchedulesCount,
      totalTrips: opTrips.length,
      completedTrips: opTrips.filter((t) => t.status === "completed").length,
      cancelledTrips: opTrips.filter((t) => t.status === "cancelled").length,
      totalBookings: opBookings.length,
      totalRevenue,
      cashRevenue,
      bakongRevenue,
    };
  });
}
