import type { OperatorReportData, OperatorSummary } from "@/lib/services/operator-report";
import type { ReportPeriod } from "@/lib/services/report-period";
import type { SystemReportData } from "@/lib/services/system-report";

function triggerDownload(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const raw = String(val);
  const str = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportSuperAdminCsv(data: SystemReportData) {
  const lines: string[] = [];

  // Title
  lines.push(`${escape("BusExpress System Report")}`);
  lines.push(`${escape("Generated")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Period")},${escape(data.period.label)}`);
  lines.push("");

  // Key Metrics
  lines.push(`${escape("KEY METRICS")}`);
  lines.push(`${escape("Metric")},${escape("Value")}`);
  lines.push(`${escape("Revenue (Period)")},${escape(`$${data.totalRevenue.toFixed(2)}`)}`);
  lines.push(`${escape("Bookings (Period)")},${escape(data.totalBookings)}`);
  lines.push(`${escape("Paid Bookings")},${escape(data.paidBookings)}`);
  lines.push(`${escape("Trips (Period)")},${escape(data.periodTrips)}`);
  lines.push(`${escape("Completed Trips")},${escape(data.completedTrips)}`);
  lines.push(`${escape("Cancelled Trips")},${escape(data.cancelledTrips)}`);
  lines.push(`${escape("Completion Rate")},${escape(`${data.tripCompletionRate}%`)}`);
  lines.push(`${escape("Cancellation Rate")},${escape(`${data.tripCancellationRate}%`)}`);
  lines.push(`${escape("Average Ticket")},${escape(`$${data.averageTicketValue.toFixed(2)}`)}`);
  lines.push(`${escape("Active Trips (Today)")},${escape(data.activeTripsToday)}`);
  lines.push(`${escape("Active Operators")},${escape(`${data.activeOperators}/${data.totalOperators}`)}`);
  lines.push(`${escape("Total Users")},${escape(data.totalUsers)}`);
  lines.push(`${escape("Active Promotions")},${escape(data.activePromotions)}`);
  lines.push(`${escape("Promo Codes Used")},${escape(data.promoUsageCount)}`);
  lines.push("");

  // Revenue by Method
  lines.push(`${escape("REVENUE BY METHOD")}`);
  lines.push(`${escape("Method")},${escape("Amount")}`);
  data.revenueByMethod.forEach(r => {
    lines.push(`${escape(r.name)},${escape(`$${r.value.toFixed(2)}`)}`);
  });
  lines.push("");

  // Bookings by Status
  lines.push(`${escape("BOOKINGS BY STATUS")}`);
  lines.push(`${escape("Status")},${escape("Count")}`);
  data.bookingsByStatus.forEach(b => {
    lines.push(`${escape(b.name)},${escape(b.value)}`);
  });
  lines.push("");

  // Trips by Status
  lines.push(`${escape("TRIPS BY STATUS")}`);
  lines.push(`${escape("Status")},${escape("Count")}`);
  data.tripsByStatus.forEach(t => {
    lines.push(`${escape(t.name)},${escape(t.value)}`);
  });
  lines.push("");

  // Users by Role
  lines.push(`${escape("USERS BY ROLE")}`);
  lines.push(`${escape("Role")},${escape("Count")}`);
  data.usersByRole.forEach(u => {
    lines.push(`${escape(u.name)},${escape(u.value)}`);
  });
  lines.push("");

  // Revenue Trend (14 Days)
  lines.push(`${escape("REVENUE TREND (LAST 14 DAYS)")}`);
  lines.push(`${escape("Date")},${escape("Revenue")}`);
  data.revenueTrend.forEach(t => {
    lines.push(`${escape(t.label)},${escape(`$${t.value.toFixed(2)}`)}`);
  });
  lines.push("");

  // Bookings Trend (14 Days)
  lines.push(`${escape("BOOKINGS TREND (LAST 14 DAYS)")}`);
  lines.push(`${escape("Date")},${escape("Bookings")}`);
  data.bookingsTrend.forEach(b => {
    lines.push(`${escape(b.label)},${escape(b.value)}`);
  });

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, "busexpress-system-report.csv");
}

export function exportOperatorCsv(data: OperatorReportData) {
  const lines: string[] = [];

  // Title
  lines.push(`${escape(`${data.operatorName} — Performance Report`)}`);
  lines.push(`${escape("Generated")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Period")},${escape(data.period.label)}`);
  lines.push("");

  // Key Metrics
  lines.push(`${escape("KEY METRICS")}`);
  lines.push(`${escape("Metric")},${escape("Value")}`);
  lines.push(`${escape("Revenue (Period)")},${escape(`$${data.totalRevenue.toFixed(2)}`)}`);
  lines.push(`${escape("Buses (Active/Total)")},${escape(`${data.activeBuses}/${data.totalBuses}`)}`);
  lines.push(`${escape("Routes (Active/Total)")},${escape(`${data.activeRoutes}/${data.totalRoutes}`)}`);
  lines.push(`${escape("Active Schedules")},${escape(data.activeSchedules)}`);
  lines.push(`${escape("Staff (Active/Total)")},${escape(`${data.activeStaff}/${data.totalStaff}`)}`);
  lines.push(`${escape("Today's Trips")},${escape(data.tripScheduled + data.tripInProgress + data.tripCompleted)}`);
  lines.push(`${escape("Today's Bookings")},${escape(data.todayBookings)}`);
  lines.push(`${escape("Trips (Period)")},${escape(data.periodTrips)}`);
  lines.push(`${escape("Completed Trips")},${escape(data.completedTrips)}`);
  lines.push(`${escape("Cancelled Trips")},${escape(data.cancelledTrips)}`);
  lines.push(`${escape("Bookings (Period)")},${escape(data.totalBookings)}`);
  lines.push(`${escape("Paid Bookings")},${escape(data.paidBookings)}`);
  lines.push(`${escape("Booking Success Rate")},${escape(`${data.bookingSuccessRate}%`)}`);
  lines.push(`${escape("Trip Cancellation Rate")},${escape(`${data.cancellationRate}%`)}`);
  lines.push(`${escape("Average Ticket")},${escape(`$${data.averageTicketValue.toFixed(2)}`)}`);
  lines.push(`${escape("Revenue per Completed Trip")},${escape(`$${data.revenuePerCompletedTrip.toFixed(2)}`)}`);
  lines.push("");

  // Fleet Status
  lines.push(`${escape("FLEET STATUS")}`);
  lines.push(`${escape("Status")},${escape("Count")}`);
  data.busChartData.forEach(b => {
    lines.push(`${escape(b.name)},${escape(b.value)}`);
  });
  lines.push("");

  // Today's Trips
  lines.push(`${escape("TODAY'S TRIP SUMMARY")}`);
  lines.push(`${escape("Status")},${escape("Count")}`);
  lines.push(`${escape("Scheduled")},${escape(data.tripScheduled)}`);
  lines.push(`${escape("In Progress")},${escape(data.tripInProgress)}`);
  lines.push(`${escape("Completed")},${escape(data.tripCompleted)}`);
  lines.push("");

  // Staff Breakdown
  lines.push(`${escape("STAFF BREAKDOWN")}`);
  lines.push(`${escape("Role")},${escape("Count")}`);
  data.staffChartData.forEach(s => {
    lines.push(`${escape(s.name)},${escape(s.value)}`);
  });
  lines.push("");

  // Revenue Method (if available)
  if (data.revenueByMethod && data.revenueByMethod.length > 0) {
    lines.push(`${escape("REVENUE BY METHOD")}`);
    lines.push(`${escape("Method")},${escape("Amount")}`);
    data.revenueByMethod.forEach(r => {
      lines.push(`${escape(r.name)},${escape(`$${r.value.toFixed(2)}`)}`);
    });
    lines.push("");
  }

  // Daily Revenue (if available)
  if (data.revenueTrend && data.revenueTrend.length > 0) {
    lines.push(`${escape("DAILY REVENUE (LAST 14 DAYS)")}`);
    lines.push(`${escape("Date")},${escape("Revenue")}`);
    data.revenueTrend.forEach(t => {
      lines.push(`${escape(t.label)},${escape(`$${t.value.toFixed(2)}`)}`);
    });
    lines.push("");
  }

  // Daily Trips
  lines.push(`${escape("DAILY TRIPS (LAST 14 DAYS)")}`);
  lines.push(`${escape("Date")},${escape("Trips")}`);
  data.tripTrend.forEach(t => {
    lines.push(`${escape(t.label)},${escape(t.value)}`);
  });
  lines.push("");

  // Daily Bookings
  lines.push(`${escape("DAILY BOOKINGS (LAST 14 DAYS)")}`);
  lines.push(`${escape("Date")},${escape("Bookings")}`);
  data.bookingTrend.forEach(b => {
    lines.push(`${escape(b.label)},${escape(b.value)}`);
  });

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, `busexpress-${data.operatorName.toLowerCase().replace(/\s+/g, "-")}-report.csv`);
}

export function exportAllOperatorsCsv(
  data: OperatorSummary[],
  period: ReportPeriod
) {
  const lines: string[] = [];

  // Title
  lines.push(`${escape("All Operators Comparison Report")}`);
  lines.push(`${escape("Generated")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Period")},${escape(period.label)}`);
  lines.push("");

  // Aggregated totals
  const totalOps = data.length;
  const totalBuses = data.reduce((s, op) => s + op.totalBuses, 0);
  const activeBuses = data.reduce((s, op) => s + op.activeBuses, 0);
  const totalStaff = data.reduce((s, op) => s + op.totalStaff, 0);
  const totalRevenue = data.reduce((s, op) => s + op.totalRevenue, 0);
  const totalBookings = data.reduce((s, op) => s + op.totalBookings, 0);

  lines.push(`${escape("SYSTEM-WIDE AGGREGATES")}`);
  lines.push(`${escape("Metric")},${escape("Value")}`);
  lines.push(`${escape("Total Operators")},${escape(totalOps)}`);
  lines.push(`${escape("Total Buses (Active/Total)")},${escape(`${activeBuses}/${totalBuses}`)}`);
  lines.push(`${escape("Total Staff")},${escape(totalStaff)}`);
  lines.push(`${escape("Bookings (Period)")},${escape(totalBookings)}`);
  lines.push(`${escape("Revenue (Period)")},${escape(`$${totalRevenue.toFixed(2)}`)}`);
  lines.push("");

  // Comparison details
  lines.push(`${escape("OPERATOR PERFORMANCE COMPARISON")}`);
  lines.push([
    escape("Operator"),
    escape("Status"),
    escape("Active Buses"),
    escape("Total Buses"),
    escape("Active Staff"),
    escape("Total Staff"),
    escape("Routes"),
    escape("Active Schedules"),
    escape("Trips"),
    escape("Completed Trips"),
    escape("Cancelled Trips"),
    escape("Bookings"),
    escape("Paid Bookings"),
    escape("Revenue"),
    escape("Cash Revenue"),
    escape("Bakong Revenue"),
    escape("Trip Completion Rate"),
    escape("Trip Cancellation Rate"),
    escape("Average Ticket")
  ].join(","));

  data.forEach(op => {
    lines.push([
      escape(op.operatorName),
      escape(op.status),
      escape(op.activeBuses),
      escape(op.totalBuses),
      escape(op.activeStaff),
      escape(op.totalStaff),
      escape(op.totalRoutes),
      escape(op.activeSchedules),
      escape(op.totalTrips),
      escape(op.completedTrips),
      escape(op.cancelledTrips),
      escape(op.totalBookings),
      escape(op.paidBookings),
      escape(`$${op.totalRevenue.toFixed(2)}`),
      escape(`$${op.cashRevenue.toFixed(2)}`),
      escape(`$${op.bakongRevenue.toFixed(2)}`),
      escape(`${op.completionRate}%`),
      escape(`${op.cancellationRate}%`),
      escape(`$${op.averageTicketValue.toFixed(2)}`)
    ].join(","));
  });

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, "busexpress-all-operators-comparison.csv");
}
