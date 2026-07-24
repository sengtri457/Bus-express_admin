import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatPeriodChartDate,
  listPeriodDates,
  type ReportPeriod,
} from "@/lib/services/report-period";
import {
  assertNoQueryError,
  fetchAllReportRows,
} from "@/lib/services/report-query";

interface PaymentRow {
  booking_id: string;
  amount: number | null;
  method: string;
  paid_at: string | null;
}

interface BookingRow {
  status: string;
  booked_at: string | null;
}

interface TripRow {
  status: string;
  trip_date: string;
}

interface StatusRow {
  status: string;
}

interface UserRow extends StatusRow {
  role: string;
}

export interface SystemReportData {
  period: ReportPeriod;
  totalRevenue: number;
  totalBookings: number;
  paidBookings: number;
  activeTripsToday: number;
  periodTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  tripCompletionRate: number;
  tripCancellationRate: number;
  averageTicketValue: number;
  activeOperators: number;
  totalOperators: number;
  totalUsers: number;
  activePromotions: number;
  revenueByMethod: ChartSlice[];
  bookingsByStatus: ChartSlice[];
  tripsByStatus: ChartSlice[];
  revenueTrend: ChartPoint[];
  bookingsTrend: ChartPoint[];
  usersByRole: ChartSlice[];
  promoUsageCount: number;
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

function percentage(value: number, total: number) {
  return total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function dateKey(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

export async function fetchSystemReport(
  supabase: SupabaseClient,
  period: ReportPeriod
): Promise<SystemReportData> {
  const [
    payments,
    bookings,
    trips,
    operators,
    users,
    promotionsResponse,
    promotionUsages,
    activeTripsResponse,
  ] = await Promise.all([
    fetchAllReportRows<PaymentRow>("payments", (from, to) =>
      supabase
        .from("payments")
        .select("booking_id, amount, method, paid_at")
        .eq("status", "paid")
        .gte("paid_at", period.startTimestamp)
        .lt("paid_at", period.endExclusiveTimestamp)
        .order("paid_at")
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<BookingRow>("bookings", (from, to) =>
      supabase
        .from("bookings")
        .select("status, booked_at")
        .gte("booked_at", period.startTimestamp)
        .lt("booked_at", period.endExclusiveTimestamp)
        .order("booked_at")
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<TripRow>("trips", (from, to) =>
      supabase
        .from("trips")
        .select("status, trip_date")
        .gte("trip_date", period.startDate)
        .lte("trip_date", period.endDate)
        .order("trip_date")
        .order("id")
        .range(from, to)
    ),
    fetchAllReportRows<StatusRow>("operators", (from, to) =>
      supabase.from("operators").select("status").order("id").range(from, to)
    ),
    fetchAllReportRows<UserRow>("users", (from, to) =>
      supabase.from("users").select("role, status").order("id").range(from, to)
    ),
    supabase.from("promotions").select("id", { count: "exact", head: true }).eq("is_active", true),
    fetchAllReportRows<{ used_at: string | null }>(
      "promotion usage",
      (from, to) =>
        supabase
          .from("promotion_usages")
          .select("used_at")
          .gte("used_at", period.startTimestamp)
          .lt("used_at", period.endExclusiveTimestamp)
          .order("used_at")
          .order("id")
          .range(from, to)
    ),
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("trip_date", period.today)
      .eq("status", "in_progress"),
  ]);

  assertNoQueryError("active promotions", promotionsResponse);
  assertNoQueryError("today's active trips", activeTripsResponse);

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );
  const paidBookingCount = new Set(
    payments.map((payment) => payment.booking_id)
  ).size;
  const completedTrips = trips.filter(
    (trip) => trip.status === "completed"
  ).length;
  const cancelledTrips = trips.filter(
    (trip) => trip.status === "cancelled"
  ).length;
  const dates = listPeriodDates(period);
  const includeYear = period.dayCount > 120;
  const labelFor = (date: string) => formatPeriodChartDate(date, includeYear);

  const paymentColors: Record<string, string> = {
    cash: "#10b981",
    bakong: "#3b82f6",
  };
  const paymentLabels: Record<string, string> = {
    cash: "Cash",
    bakong: "Bakong",
  };
  const paymentGroups = new Map<string, number>();
  for (const payment of payments) {
    paymentGroups.set(
      payment.method,
      (paymentGroups.get(payment.method) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  const bookingColors: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    boarded: "#10b981",
    cancelled: "#ef4444",
  };
  const tripColors: Record<string, string> = {
    scheduled: "#8b5cf6",
    in_progress: "#3b82f6",
    completed: "#10b981",
    cancelled: "#ef4444",
  };
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

  const countSlices = (
    rows: { status: string }[],
    colors: Record<string, string>
  ) =>
    Object.entries(colors)
      .map(([status, color]) => ({
        name:
          status === "in_progress"
            ? "In Progress"
            : status.charAt(0).toUpperCase() + status.slice(1),
        value: rows.filter((row) => row.status === status).length,
        color,
      }))
      .filter((item) => item.value > 0);

  return {
    period,
    totalRevenue,
    totalBookings: bookings.length,
    paidBookings: paidBookingCount,
    activeTripsToday: activeTripsResponse.count ?? 0,
    periodTrips: trips.length,
    completedTrips,
    cancelledTrips,
    tripCompletionRate: percentage(completedTrips, trips.length),
    tripCancellationRate: percentage(cancelledTrips, trips.length),
    averageTicketValue:
      paidBookingCount > 0
        ? Number((totalRevenue / paidBookingCount).toFixed(2))
        : 0,
    activeOperators: operators.filter(
      (operator) => operator.status === "active"
    ).length,
    totalOperators: operators.length,
    totalUsers: users.length,
    activePromotions: promotionsResponse.count ?? 0,
    promoUsageCount: promotionUsages.length,
    revenueByMethod: [...paymentGroups.entries()]
      .map(([method, value]) => ({
        name: paymentLabels[method] ?? method,
        value: Number(value.toFixed(2)),
        color: paymentColors[method] ?? "#64748b",
      }))
      .filter((item) => item.value > 0),
    bookingsByStatus: countSlices(bookings, bookingColors),
    tripsByStatus: countSlices(trips, tripColors),
    usersByRole: Object.entries(roleColors)
      .map(([role, color]) => ({
        name: roleLabels[role] ?? role,
        value: users.filter((user) => user.role === role).length,
        color,
      }))
      .filter((item) => item.value > 0),
    revenueTrend: dates.map((date) => ({
      label: labelFor(date),
      value: Number(
        payments
          .filter((payment) => dateKey(payment.paid_at) === date)
          .reduce(
            (sum, payment) => sum + Number(payment.amount ?? 0),
            0
          )
          .toFixed(2)
      ),
    })),
    bookingsTrend: dates.map((date) => ({
      label: labelFor(date),
      value: bookings.filter(
        (booking) => dateKey(booking.booked_at) === date
      ).length,
    })),
  };
}
