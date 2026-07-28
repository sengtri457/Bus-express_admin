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

  // Financial Header Block
  lines.push(`${escape("BUSEXPRESS TRANSPORTATION NETWORK")}`);
  lines.push(`${escape("CONSOLIDATED SYSTEM PERFORMANCE & FINANCIAL STATEMENT")}`);
  lines.push(`${escape("Statement Status")},${escape("Unaudited - Internal Management Report")}`);
  lines.push(`${escape("Reporting Period")},${escape(data.period.label)}`);
  lines.push(`${escape("Statement Date")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Currency")},${escape("USD ($)")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION I: INCOME SUMMARY & CHANNEL SPLIT
  lines.push(`${escape("SECTION I: CONSOLIDATED REVENUE & TRANSACTION STATEMENT")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Account / Description")},${escape("Amount (USD)")},${escape("Share (%)")},${escape("Notes / Payment Channels")}`);
  
  const totalRev = data.totalRevenue;
  const cashRev = data.revenueByMethod.find(r => r.name.toLowerCase() === "cash")?.value ?? 0;
  const bakongRev = data.revenueByMethod.find(r => r.name.toLowerCase() === "bakong")?.value ?? 0;
  
  const cashShare = totalRev > 0 ? (cashRev / totalRev) * 100 : 0;
  const bakongShare = totalRev > 0 ? (bakongRev / totalRev) * 100 : 0;

  lines.push(`${escape("Gross Revenue Receipts (Bakong)")},${escape(bakongRev.toFixed(2))},${escape(bakongShare.toFixed(1) + "%")},${escape("E-Wallet / Mobile Bank Transfer")}`);
  lines.push(`${escape("Gross Revenue Receipts (Cash)")},${escape(cashRev.toFixed(2))},${escape(cashShare.toFixed(1) + "%")},${escape("Physical Currency / On-board")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("TOTAL GROSS OPERATING REVENUE")},${escape(totalRev.toFixed(2))},${escape("100.0%")},${escape("Consolidated receipts")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION II: OPERATING & COMMERCIAL VOLUME
  lines.push(`${escape("SECTION II: SYSTEM OPERATING & VOLUME SUMMARY")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Key Volume Indicator (KVI)")},${escape("Volume / Value")},${escape("Unit / Description")}`);
  lines.push(`${escape("Total Booking Transactions")},${escape(data.totalBookings)},${escape("Tickets booked (Total)")}`);
  lines.push(`${escape("Paid Bookings")},${escape(data.paidBookings)},${escape("Completed ticket sales")}`);
  lines.push(`${escape("Average Ticket Value (ATV)")},${escape(`$${data.averageTicketValue.toFixed(2)}`)},${escape("Average revenue per booking")}`);
  lines.push(`${escape("Promotional Usages")},${escape(data.promoUsageCount)},${escape("Total promotion codes applied")}`);
  lines.push(`${escape("Active Operators")},${escape(`${data.activeOperators} of ${data.totalOperators}`)},${escape("Participating operators")}`);
  lines.push(`${escape("Registered Platform Users")},${escape(data.totalUsers)},${escape("Total registered accounts")}`);
  lines.push("");

  // SECTION III: OPERATIONS LOGISTICS
  lines.push(`${escape("SECTION III: NETWORK LOGISTICS & SCHEDULE PERFORMANCE")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Performance Metric")},${escape("Volume / Rate")},${escape("Target Threshold")}`);
  lines.push(`${escape("Total Scheduled Trips")},${escape(data.periodTrips)},${escape("Trips scheduled in period")}`);
  lines.push(`${escape("Completed Trips")},${escape(data.completedTrips)},${escape("Service run success")}`);
  lines.push(`${escape("Cancelled Trips")},${escape(data.cancelledTrips)},${escape("Service run failures")}`);
  lines.push(`${escape("Trip Completion Rate")},${escape(`${data.tripCompletionRate}%`)},${escape("Target: >= 95.0%")}`);
  lines.push(`${escape("Trip Cancellation Rate")},${escape(`${data.tripCancellationRate}%`)},${escape("Target: <= 5.0%")}`);
  lines.push(`${escape("Active Trips (Today)")},${escape(data.activeTripsToday)},${escape("Real-time live runs")}`);
  lines.push("");

  // SECTION IV: TRANSACTION STATUS MIX
  lines.push(`${escape("SECTION IV: COMMERCIAL TRANSACTION MIX")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Status Label")},${escape("Transaction Count")},${escape("Context")}`);
  data.bookingsByStatus.forEach(b => {
    lines.push(`${escape(b.name)},${escape(b.value)},${escape("Bookings state")}`);
  });
  lines.push("");

  // SECTION V: DAILY REVENUE TREND
  lines.push(`${escape("SECTION V: DAILY TRANSACTION LEDGER (LAST 14 DAYS)")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Transaction Date")},${escape("Gross Revenue (USD)")}`);
  data.revenueTrend.forEach(t => {
    lines.push(`${escape(t.label)},${escape(t.value.toFixed(2))}`);
  });
  lines.push("");

  // SECTION VI: APPROVALS & SIGN-OFF
  lines.push("================================================================================");
  lines.push(`${escape("SECTION VI: AUTHORIZATION & AUDIT SIGN-OFF")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Prepared By: __________________________")},,${escape("Approved By: __________________________")}`);
  lines.push(`${escape("Title: Accountant / Financial Analyst")},,${escape("Title: Finance Director / Controller")}`);
  lines.push(`${escape("Date: " + new Date().toLocaleDateString())},,${escape("Date: " + new Date().toLocaleDateString())}`);
  lines.push("================================================================================");

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, "busexpress-consolidated-statement.csv");
}

export function exportOperatorCsv(data: OperatorReportData) {
  const lines: string[] = [];

  // Financial Header Block
  lines.push(`${escape("BUSEXPRESS TRANSPORTATION NETWORK")}`);
  lines.push(`${escape(data.operatorName.toUpperCase() + " — FINANCIAL & PERFORMANCE STATEMENT")}`);
  lines.push(`${escape("Report Type")},${escape("Operator Operations Summary")}`);
  lines.push(`${escape("Reporting Period")},${escape(data.period.label)}`);
  lines.push(`${escape("Statement Date")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Currency")},${escape("USD ($)")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION I: FINANCIAL SUMMARY
  lines.push(`${escape("SECTION I: OPERATIONAL REVENUE & MARGIN SUMMARY")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Account Category")},${escape("Amount (USD)")},${escape("Share (%)")},${escape("Operational Channel")}`);
  
  const totalRev = data.totalRevenue;
  const cashRev = data.cashRevenue;
  const bakongRev = data.bakongRevenue;
  
  const cashShare = totalRev > 0 ? (cashRev / totalRev) * 100 : 0;
  const bakongShare = totalRev > 0 ? (bakongRev / totalRev) * 100 : 0;

  lines.push(`${escape("Gross Receipts (Bakong)")},${escape(bakongRev.toFixed(2))},${escape(bakongShare.toFixed(1) + "%")},${escape("E-Wallet Transfers")}`);
  lines.push(`${escape("Gross Receipts (Cash)")},${escape(cashRev.toFixed(2))},${escape(cashShare.toFixed(1) + "%")},${escape("Cash collection")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("TOTAL GROSS REVENUE")},${escape(totalRev.toFixed(2))},${escape("100.0%")},${escape("Direct revenue")}`);
  lines.push(`${escape("Average Revenue per Completed Trip")},${escape(data.revenuePerCompletedTrip.toFixed(2))},,${escape("Revenue / success trip")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION II: VOLUME METRICS
  lines.push(`${escape("SECTION II: COMMERCIAL TRANSACTION SUMMARY")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Metric Indicator")},${escape("Value")},${escape("Context")}`);
  lines.push(`${escape("Total Booking Requests")},${escape(data.totalBookings)},${escape("Total bookings processed")}`);
  lines.push(`${escape("Paid Bookings")},${escape(data.paidBookings)},${escape("Tickets sold and paid")}`);
  lines.push(`${escape("Confirmed Bookings")},${escape(data.confirmedBookings)},${escape("Bookings confirmed")}`);
  lines.push(`${escape("Cancelled Bookings")},${escape(data.cancelledBookings)},${escape("Cancelled ticket count")}`);
  lines.push(`${escape("Booking Success Rate")},${escape(`${data.bookingSuccessRate}%`)},${escape("Confirmed / total bookings")}`);
  lines.push(`${escape("Average Ticket Value (ATV)")},${escape(`$${data.averageTicketValue.toFixed(2)}`)},${escape("Average transaction size")}`);
  lines.push("");

  // SECTION III: PHYSICAL ASSETS & LOGISTICS
  lines.push(`${escape("SECTION III: FLEET CAPACITY & TRANSPORTATION LOGISTICS")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Fleet Metric")},${escape("Count / Rate")},${escape("Status Notes")}`);
  lines.push(`${escape("Active Buses / Total Fleet")},${escape(`${data.activeBuses} of ${data.totalBuses}`)},${escape("Operational buses")}`);
  lines.push(`${escape("Active Routes / Total Routes")},${escape(`${data.activeRoutes} of ${data.totalRoutes}`)},${escape("Network coverage")}`);
  lines.push(`${escape("Active Weekly Schedules")},${escape(data.activeSchedules)},${escape("Schedules run")}`);
  lines.push(`${escape("Active Staff / Total Staff")},${escape(`${data.activeStaff} of ${data.totalStaff}`)},${escape("Drivers & conductors")}`);
  lines.push(`${escape("Total Trips (Period)")},${escape(data.periodTrips)},${escape("Trips scheduled")}`);
  lines.push(`${escape("Completed Trips (Period)")},${escape(data.completedTrips)},${escape("Completed run count")}`);
  lines.push(`${escape("Cancelled Trips (Period)")},${escape(data.cancelledTrips)},${escape("Cancelled run count")}`);
  lines.push(`${escape("Trip Cancellation Rate")},${escape(`${data.cancellationRate}%`)},${escape("Cancellation percentage")}`);
  lines.push("");

  // SECTION IV: FLEET DETAIL
  lines.push(`${escape("SECTION IV: ASSET STATUS SPLIT")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Bus Status")},${escape("Count")}`);
  data.busChartData.forEach(b => {
    lines.push(`${escape(b.name)},${escape(b.value)}`);
  });
  lines.push("");

  // SECTION V: DAILY LEDGER
  if (data.revenueTrend && data.revenueTrend.length > 0) {
    lines.push(`${escape("SECTION V: DAILY TRANSACTION LEDGER (LAST 14 DAYS)")}`);
    lines.push("--------------------------------------------------------------------------------");
    lines.push(`${escape("Transaction Date")},${escape("Revenue (USD)")}`);
    data.revenueTrend.forEach(t => {
      lines.push(`${escape(t.label)},${escape(t.value.toFixed(2))}`);
    });
    lines.push("");
  }

  // SECTION VI: APPROVALS & SIGN-OFF
  lines.push("================================================================================");
  lines.push(`${escape("SECTION VI: AUTHORIZATION & AUDIT SIGN-OFF")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Prepared By: __________________________")},,${escape("Approved By: __________________________")}`);
  lines.push(`${escape("Title: Accountant / Financial Analyst")},,${escape("Title: Operations Manager / Auditor")}`);
  lines.push(`${escape("Date: " + new Date().toLocaleDateString())},,${escape("Date: " + new Date().toLocaleDateString())}`);
  lines.push("================================================================================");

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, `busexpress-${safeFilename(data.operatorName)}-statement.csv`);
}

export function exportAllOperatorsCsv(
  data: OperatorSummary[],
  period: ReportPeriod
) {
  const lines: string[] = [];

  // Financial Header Block
  lines.push(`${escape("BUSEXPRESS TRANSPORTATION NETWORK")}`);
  lines.push(`${escape("ALL OPERATORS PERFORMANCE BENCHMARK & COMPARISON STATEMENT")}`);
  lines.push(`${escape("Report Type")},${escape("Consolidated Operators Benchmark")}`);
  lines.push(`${escape("Reporting Period")},${escape(period.label)}`);
  lines.push(`${escape("Statement Date")},${escape(new Date().toLocaleString())}`);
  lines.push(`${escape("Currency")},${escape("USD ($)")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION I: SYSTEM-WIDE COMPARATIVE AGGREGATES
  const totalOps = data.length;
  const totalBuses = data.reduce((s, op) => s + op.totalBuses, 0);
  const activeBuses = data.reduce((s, op) => s + op.activeBuses, 0);
  const totalStaff = data.reduce((s, op) => s + op.totalStaff, 0);
  const totalRevenue = data.reduce((s, op) => s + op.totalRevenue, 0);
  const totalBookings = data.reduce((s, op) => s + op.totalBookings, 0);

  lines.push(`${escape("SECTION I: NETWORK OPERATING & FINANCIAL CONSOLIDATION")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Operational Aggregates")},${escape("Consolidated Value")},${escape("Metric Context")}`);
  lines.push(`${escape("Total Active Operators")},${escape(totalOps)},${escape("Number of bus companies")}`);
  lines.push(`${escape("Network Fleet Utilization")},${escape(`${activeBuses} of ${totalBuses} active`)},${escape("Utilization rate")}`);
  lines.push(`${escape("Total Staff Count")},${escape(totalStaff)},${escape("Drivers & conductors registered")}`);
  lines.push(`${escape("Consolidated Booking Count")},${escape(totalBookings)},${escape("Tickets sold (Period)")}`);
  lines.push(`${escape("Consolidated Network Revenue")},${escape(`$${totalRevenue.toFixed(2)}`)},${escape("Gross tickets value")}`);
  lines.push("================================================================================");
  lines.push("");

  // SECTION II: COMPARISON METRICS TABLE
  lines.push(`${escape("SECTION II: OPERATOR BENCHMARK COMPARISON MATRIX")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push([
    escape("Operator Name"),
    escape("Status"),
    escape("Buses Active"),
    escape("Total Buses"),
    escape("Staff Active"),
    escape("Total Staff"),
    escape("Routes Run"),
    escape("Schedules Run"),
    escape("Total Trips"),
    escape("Completed Trips"),
    escape("Cancelled Trips"),
    escape("Total Bookings"),
    escape("Paid Bookings"),
    escape("Gross Revenue ($)"),
    escape("Cash Receipts ($)"),
    escape("Bakong Receipts ($)"),
    escape("Trip Completion Rate (%)"),
    escape("Trip Cancellation Rate (%)"),
    escape("Average Ticket Value ($)")
  ].join(","));

  data.forEach(op => {
    lines.push([
      escape(op.operatorName),
      escape(op.status.toUpperCase()),
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
      escape(op.totalRevenue.toFixed(2)),
      escape(op.cashRevenue.toFixed(2)),
      escape(op.bakongRevenue.toFixed(2)),
      escape(op.completionRate),
      escape(op.cancellationRate),
      escape(op.averageTicketValue.toFixed(2))
    ].join(","));
  });
  lines.push("");

  // SECTION III: APPROVALS & SIGN-OFF
  lines.push("================================================================================");
  lines.push(`${escape("SECTION III: AUTHORIZATION & AUDIT SIGN-OFF")}`);
  lines.push("--------------------------------------------------------------------------------");
  lines.push(`${escape("Prepared By: __________________________")},,${escape("Approved By: __________________________")}`);
  lines.push(`${escape("Title: Accountant / Financial Analyst")},,${escape("Title: Network Administrator / Auditor")}`);
  lines.push(`${escape("Date: " + new Date().toLocaleDateString())},,${escape("Date: " + new Date().toLocaleDateString())}`);
  lines.push("================================================================================");

  const csvContent = lines.join("\n");
  triggerDownload(csvContent, "busexpress-all-operators-benchmark.csv");
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
