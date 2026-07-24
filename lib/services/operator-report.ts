import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createReportPeriod,
  formatPeriodChartDate,
  listPeriodDates,
  type ReportPeriod,
} from "@/lib/services/report-period";
import {
  assertNoQueryError,
  fetchAllReportRows,
} from "@/lib/services/report-query";

export interface OperatorReportData {
  period: ReportPeriod;
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
  periodTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalBookings: number;
  paidBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingSuccessRate: number;
  cancellationRate: number;
  averageTicketValue: number;
  revenuePerCompletedTrip: number;
  busChartData: ChartSlice[];
  tripChartData: ChartSlice[];
  staffChartData: ChartSlice[];
  tripTrend: ChartPoint[];
  bookingTrend: ChartPoint[];
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
  revenueByMethod: ChartSlice[];
  revenueTrend: ChartPoint[];
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
  paidBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
  completionRate: number;
  cancellationRate: number;
  averageTicketValue: number;
}

interface ChartSlice {
  name: string;
  value: number;
  color: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface OperatorRow {
  id: string;
  name: string;
  logo_url: string | null;
  status: string;
}

interface StatusRow {
  status: string;
}

interface StaffRow extends StatusRow {
  role: string;
}

interface TripRow extends StatusRow {
  id: string;
  trip_date: string;
  schedule_id?: string;
  schedules?: unknown;
}

interface BookingRow extends StatusRow {
  id: string;
  booked_at: string | null;
  trip_id?: string;
  trips?: unknown;
}

interface PaymentRow extends StatusRow {
  amount: number | null;
  method: string;
  paid_at: string | null;
  booking_id?: string;
  bookings?: unknown;
}

interface AssetRow extends StatusRow {
  operator_id: string;
}

interface RouteRow extends AssetRow {
  id: string;
}

interface ScheduleRow extends StatusRow {
  route_id: string;
}

type RelationValue = Record<string, unknown> | Record<string, unknown>[] | null;

function oneRelation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object"
      ? (first as Record<string, unknown>)
      : null;
  }
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function relationOperatorId(row: {
  routes?: unknown;
  schedules?: unknown;
  trips?: unknown;
  bookings?: unknown;
}) {
  const booking = oneRelation(row.bookings);
  const trip = oneRelation(booking?.trips ?? row.trips);
  const schedule =
    oneRelation(trip?.schedules ?? row.schedules) ??
    (row.routes ? (row as Record<string, unknown>) : null);
  const route = oneRelation(schedule?.routes);
  return typeof route?.operator_id === "string" ? route.operator_id : null;
}

function percentage(value: number, total: number) {
  return total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function sumPayments(payments: PaymentRow[]) {
  return payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

function dateKey(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

export async function fetchOperatorReport(
  supabase: SupabaseClient,
  operatorId: string,
  period: ReportPeriod
): Promise<OperatorReportData> {
  const operatorResponse = await supabase
    .from("operators")
    .select("id, name, logo_url, status")
    .eq("id", operatorId)
    .single();
  assertNoQueryError("operator details", operatorResponse);
  const operator = operatorResponse.data as OperatorRow | null;

  if (!operator) {
    throw new Error("The requested operator does not exist.");
  }
  const todayPeriod = createReportPeriod(period.today, period.today);

  const [
    buses,
    staff,
    routes,
    schedules,
    periodTrips,
    todayTrips,
    periodBookings,
    todayBookings,
    paidPayments,
  ] = await Promise.all([
    fetchAllReportRows<StatusRow>("operator buses", (from, to) =>
      supabase
        .from("buses")
        .select("status")
        .eq("operator_id", operatorId)
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<StaffRow>("operator staff", (from, to) =>
      supabase
        .from("users")
        .select("role, status")
        .eq("operator_id", operatorId)
        .in("role", ["driver", "conductor"])
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<StatusRow>("operator routes", (from, to) =>
      supabase
        .from("routes")
        .select("status")
        .eq("operator_id", operatorId)
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<StatusRow>("operator schedules", (from, to) =>
      supabase
        .from("schedules")
        .select("status, routes!inner(operator_id)")
        .eq("routes.operator_id", operatorId)
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<TripRow>("operator trips", (from, to) =>
      supabase
        .from("trips")
        .select(
          "id, status, trip_date, schedules!inner(routes!inner(operator_id))"
        )
        .eq("schedules.routes.operator_id", operatorId)
        .gte("trip_date", period.startDate)
        .lte("trip_date", period.endDate)
        .order("trip_date", { ascending: true })
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<TripRow>("today's operator trips", (from, to) =>
      supabase
        .from("trips")
        .select(
          "id, status, trip_date, schedules!inner(routes!inner(operator_id))"
        )
        .eq("schedules.routes.operator_id", operatorId)
        .eq("trip_date", period.today)
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<BookingRow>("operator bookings", (from, to) =>
      supabase
        .from("bookings")
        .select(
          "id, status, booked_at, trips!inner(schedules!inner(routes!inner(operator_id)))"
        )
        .eq("trips.schedules.routes.operator_id", operatorId)
        .gte("booked_at", period.startTimestamp)
        .lt("booked_at", period.endExclusiveTimestamp)
        .order("booked_at", { ascending: true })
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<BookingRow>("today's operator bookings", (from, to) =>
      supabase
        .from("bookings")
        .select(
          "id, status, booked_at, trips!inner(schedules!inner(routes!inner(operator_id)))"
        )
        .eq("trips.schedules.routes.operator_id", operatorId)
        .gte("booked_at", todayPeriod.startTimestamp)
        .lt("booked_at", todayPeriod.endExclusiveTimestamp)
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<PaymentRow>("operator payments", (from, to) =>
      supabase
        .from("payments")
        .select(
          "booking_id, amount, method, status, paid_at, bookings!inner(trips!inner(schedules!inner(routes!inner(operator_id))))"
        )
        .eq("status", "paid")
        .eq("bookings.trips.schedules.routes.operator_id", operatorId)
        .gte("paid_at", period.startTimestamp)
        .lt("paid_at", period.endExclusiveTimestamp)
        .order("paid_at", { ascending: true })
        .order("id")
        .range(from, to)
    ),
  ]);

  const activeBuses = buses.filter((bus) => bus.status === "active").length;
  const maintenanceBuses = buses.filter(
    (bus) => bus.status === "maintenance"
  ).length;
  const retiredBuses = buses.filter((bus) => bus.status === "retired").length;
  const activeStaff = staff.filter((member) => member.status === "active").length;
  const drivers = staff.filter((member) => member.role === "driver").length;
  const conductors = staff.filter(
    (member) => member.role === "conductor"
  ).length;
  const activeRoutes = routes.filter((route) => route.status === "active").length;
  const activeSchedules = schedules.filter(
    (schedule) => schedule.status === "active"
  ).length;

  const tripScheduled = todayTrips.filter(
    (trip) => trip.status === "scheduled"
  ).length;
  const tripInProgress = todayTrips.filter(
    (trip) => trip.status === "in_progress"
  ).length;
  const tripCompleted = todayTrips.filter(
    (trip) => trip.status === "completed"
  ).length;
  const completedTrips = periodTrips.filter(
    (trip) => trip.status === "completed"
  ).length;
  const cancelledTrips = periodTrips.filter(
    (trip) => trip.status === "cancelled"
  ).length;

  const confirmedBookings = periodBookings.filter((booking) =>
    ["confirmed", "boarded"].includes(booking.status)
  ).length;
  const cancelledBookings = periodBookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  const totalRevenue = sumPayments(paidPayments);
  const cashRevenue = sumPayments(
    paidPayments.filter((payment) => payment.method === "cash")
  );
  const bakongRevenue = sumPayments(
    paidPayments.filter((payment) => payment.method === "bakong")
  );
  const paidBookingCount = new Set(
    paidPayments
      .map((payment) => payment.booking_id)
      .filter((bookingId): bookingId is string => Boolean(bookingId))
  ).size;
  const paymentMethodColors: Record<string, string> = {
    cash: "#10b981",
    bakong: "#3b82f6",
  };
  const paymentMethods = new Map<string, number>();
  for (const payment of paidPayments) {
    paymentMethods.set(
      payment.method,
      (paymentMethods.get(payment.method) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  const dates = listPeriodDates(period);
  const includeYear = period.dayCount > 120;
  const labelFor = (date: string) => formatPeriodChartDate(date, includeYear);

  return {
    period,
    operatorName: operator.name,
    logoUrl: operator.logo_url,
    totalBuses: buses.length,
    activeBuses,
    maintenanceBuses,
    retiredBuses,
    totalStaff: staff.length,
    activeStaff,
    drivers,
    conductors,
    totalRoutes: routes.length,
    activeRoutes,
    activeSchedules,
    tripScheduled,
    tripInProgress,
    tripCompleted,
    todayBookings: todayBookings.length,
    periodTrips: periodTrips.length,
    completedTrips,
    cancelledTrips,
    totalBookings: periodBookings.length,
    paidBookings: paidBookingCount,
    confirmedBookings,
    cancelledBookings,
    bookingSuccessRate: percentage(confirmedBookings, periodBookings.length),
    cancellationRate: percentage(cancelledTrips, periodTrips.length),
    averageTicketValue:
      paidBookingCount > 0
        ? Number((totalRevenue / paidBookingCount).toFixed(2))
        : 0,
    revenuePerCompletedTrip:
      completedTrips > 0
        ? Number((totalRevenue / completedTrips).toFixed(2))
        : 0,
    totalRevenue,
    cashRevenue,
    bakongRevenue,
    busChartData: [
      { name: "Active", value: activeBuses, color: "#10b981" },
      {
        name: "Maintenance",
        value: maintenanceBuses,
        color: "#f59e0b",
      },
      { name: "Retired", value: retiredBuses, color: "#ef4444" },
    ].filter((item) => item.value > 0),
    tripChartData: [
      { name: "Scheduled", value: tripScheduled, color: "#3b82f6" },
      { name: "In Progress", value: tripInProgress, color: "#f59e0b" },
      { name: "Completed", value: tripCompleted, color: "#10b981" },
    ].filter((item) => item.value > 0),
    staffChartData: [
      { name: "Drivers", value: drivers, color: "#3b82f6" },
      { name: "Conductors", value: conductors, color: "#8b5cf6" },
    ].filter((item) => item.value > 0),
    revenueByMethod: [...paymentMethods.entries()]
      .map(([method, value]) => ({
        name:
          method === "cash"
            ? "Cash"
            : method === "bakong"
              ? "Bakong"
              : method.charAt(0).toUpperCase() + method.slice(1),
        value: Number(value.toFixed(2)),
        color: paymentMethodColors[method] ?? "#64748b",
      }))
      .filter((item) => item.value > 0),
    tripTrend: dates.map((date) => ({
      label: labelFor(date),
      value: periodTrips.filter((trip) => trip.trip_date === date).length,
    })),
    bookingTrend: dates.map((date) => ({
      label: labelFor(date),
      value: periodBookings.filter(
        (booking) => dateKey(booking.booked_at) === date
      ).length,
    })),
    revenueTrend: dates.map((date) => ({
      label: labelFor(date),
      value: Number(
        sumPayments(
          paidPayments.filter((payment) => dateKey(payment.paid_at) === date)
        ).toFixed(2)
      ),
    })),
  };
}

interface SummaryAccumulator {
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
  paidBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
}

function emptySummary(): SummaryAccumulator {
  return {
    totalBuses: 0,
    activeBuses: 0,
    totalStaff: 0,
    activeStaff: 0,
    drivers: 0,
    conductors: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    activeSchedules: 0,
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalBookings: 0,
    paidBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    bakongRevenue: 0,
  };
}

export async function fetchAllOperatorsSummary(
  supabase: SupabaseClient,
  period: ReportPeriod
): Promise<OperatorSummary[]> {
  const [operators, buses, staff, routes, schedules, trips, bookings, payments] =
    await Promise.all([
      fetchAllReportRows<OperatorRow>("operators", (from, to) =>
        supabase
          .from("operators")
          .select("id, name, logo_url, status")
          .order("name")
          .range(from, to)
      ),
      fetchAllReportRows<AssetRow>("buses", (from, to) =>
        supabase
          .from("buses")
          .select("operator_id, status")
          .order("id")
          .range(from, to)
      ),
      fetchAllReportRows<AssetRow & { role: string }>("staff", (from, to) =>
        supabase
          .from("users")
          .select("operator_id, role, status")
          .in("role", ["driver", "conductor"])
          .not("operator_id", "is", null)
          .order("id")
          .range(from, to)
      ),
      fetchAllReportRows<RouteRow>("routes", (from, to) =>
        supabase
          .from("routes")
          .select("id, operator_id, status")
          .order("id")
          .range(from, to)
      ),
      fetchAllReportRows<ScheduleRow & { routes?: RelationValue }>(
        "schedules",
        (from, to) =>
          supabase
            .from("schedules")
            .select("route_id, status, routes!inner(operator_id)")
            .order("id")
            .range(from, to)
      ),
      fetchAllReportRows<TripRow>("trips", (from, to) =>
        supabase
          .from("trips")
          .select(
            "id, status, trip_date, schedules!inner(routes!inner(operator_id))"
          )
          .gte("trip_date", period.startDate)
          .lte("trip_date", period.endDate)
          .order("trip_date")
          .order("id")
          .range(from, to)
      ),
      fetchAllReportRows<BookingRow>("bookings", (from, to) =>
        supabase
          .from("bookings")
          .select(
            "id, status, booked_at, trips!inner(schedules!inner(routes!inner(operator_id)))"
          )
          .gte("booked_at", period.startTimestamp)
          .lt("booked_at", period.endExclusiveTimestamp)
          .order("booked_at")
          .order("id")
          .range(from, to)
      ),
      fetchAllReportRows<PaymentRow>("payments", (from, to) =>
        supabase
          .from("payments")
          .select(
            "booking_id, amount, method, status, paid_at, bookings!inner(trips!inner(schedules!inner(routes!inner(operator_id))))"
          )
          .eq("status", "paid")
          .gte("paid_at", period.startTimestamp)
          .lt("paid_at", period.endExclusiveTimestamp)
          .order("paid_at")
          .order("id")
          .range(from, to)
      ),
    ]);

  const summaries = new Map(
    operators.map((operator) => [operator.id, emptySummary()])
  );
  const paidBookingsByOperator = new Map<string, Set<string>>();
  const routeOwner = new Map(routes.map((route) => [route.id, route.operator_id]));

  for (const bus of buses) {
    const summary = summaries.get(bus.operator_id);
    if (!summary) continue;
    summary.totalBuses += 1;
    if (bus.status === "active") summary.activeBuses += 1;
  }

  for (const member of staff) {
    const summary = summaries.get(member.operator_id);
    if (!summary) continue;
    summary.totalStaff += 1;
    if (member.status === "active") summary.activeStaff += 1;
    if (member.role === "driver") summary.drivers += 1;
    if (member.role === "conductor") summary.conductors += 1;
  }

  for (const route of routes) {
    const summary = summaries.get(route.operator_id);
    if (!summary) continue;
    summary.totalRoutes += 1;
    if (route.status === "active") summary.activeRoutes += 1;
  }

  for (const schedule of schedules) {
    const operatorId =
      relationOperatorId(schedule) ?? routeOwner.get(schedule.route_id);
    const summary = operatorId ? summaries.get(operatorId) : null;
    if (summary && schedule.status === "active") summary.activeSchedules += 1;
  }

  for (const trip of trips) {
    const operatorId = relationOperatorId(trip);
    const summary = operatorId ? summaries.get(operatorId) : null;
    if (!summary) continue;
    summary.totalTrips += 1;
    if (trip.status === "completed") summary.completedTrips += 1;
    if (trip.status === "cancelled") summary.cancelledTrips += 1;
  }

  for (const booking of bookings) {
    const operatorId = relationOperatorId(booking);
    const summary = operatorId ? summaries.get(operatorId) : null;
    if (!summary) continue;
    summary.totalBookings += 1;
    if (["confirmed", "boarded"].includes(booking.status)) {
      summary.confirmedBookings += 1;
    }
    if (booking.status === "cancelled") summary.cancelledBookings += 1;
  }

  for (const payment of payments) {
    const operatorId = relationOperatorId(payment);
    const summary = operatorId ? summaries.get(operatorId) : null;
    if (!operatorId || !summary) continue;
    const amount = Number(payment.amount ?? 0);
    summary.totalRevenue += amount;
    if (payment.method === "cash") summary.cashRevenue += amount;
    if (payment.method === "bakong") summary.bakongRevenue += amount;
    if (payment.booking_id) {
      const bookingIds = paidBookingsByOperator.get(operatorId) ?? new Set<string>();
      bookingIds.add(payment.booking_id);
      paidBookingsByOperator.set(operatorId, bookingIds);
    }
  }

  return operators.map((operator) => {
    const summary = summaries.get(operator.id) ?? emptySummary();
    const paidBookings = paidBookingsByOperator.get(operator.id)?.size ?? 0;
    return {
      operatorId: operator.id,
      operatorName: operator.name,
      logoUrl: operator.logo_url,
      status: operator.status,
      ...summary,
      paidBookings,
      completionRate: percentage(summary.completedTrips, summary.totalTrips),
      cancellationRate: percentage(summary.cancelledTrips, summary.totalTrips),
      averageTicketValue:
        paidBookings > 0
          ? Number(
              (summary.totalRevenue / paidBookings).toFixed(2)
            )
          : 0,
    };
  });
}
