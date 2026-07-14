import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SuperAdminReportData {
  totalRevenue: number;
  totalBookings: number;
  activeTrips: number;
  activeOperators: number;
  totalUsers: number;
  activePromotions: number;
  revenueByMethod: { name: string; value: number }[];
  bookingsByStatus: { name: string; value: number }[];
  tripsByStatus: { name: string; value: number }[];
  revenueTrend: { label: string; value: number }[];
  bookingsTrend: { label: string; value: number }[];
  usersByRole: { name: string; value: number }[];
  promoUsageCount: number;
}

interface OperatorReportData {
  operatorName: string;
  logoUrl: string | null;
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  totalStaff: number;
  activeStaff: number;
  tripScheduled: number;
  tripInProgress: number;
  tripCompleted: number;
  todayBookings: number;
  drivers: number;
  conductors: number;
  busChartData: { name: string; value: number }[];
  staffChartData: { name: string; value: number }[];
  tripTrend: { label: string; value: number }[];
  bookingTrend: { label: string; value: number }[];
  
  // Optional revenue data
  totalRevenue?: number;
  cashRevenue?: number;
  bakongRevenue?: number;
  revenueByMethod?: { name: string; value: number }[];
  revenueTrend?: { label: string; value: number }[];
}

interface OperatorSummary {
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

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text("BusExpress", 14, 20);
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text(title, 14, 30);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 37);
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 41, doc.internal.pageSize.getWidth() - 14, 41);
}

function addSection(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);
  doc.setFont("helvetica", "normal");
  return y + 7;
}

function addKeyValueRow(doc: jsPDF, y: number, pairs: [string, string | number][]): number {
  const colW = (doc.internal.pageSize.getWidth() - 40) / pairs.length;
  pairs.forEach(([key, value], i) => {
    const x = 20 + i * colW;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(key, x, y);
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), x, y + 5);
    doc.setFont("helvetica", "normal");
  });
  return y + 12;
}

export async function generateSuperAdminPdf(data: SuperAdminReportData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();

  addHeader(doc, "System Report");

  let y = 48;

  // Key Metrics in grid
  y = addSection(doc, y, "Key Metrics");
  y = addKeyValueRow(doc, y + 2, [
    ["Revenue (Month)", `$${data.totalRevenue.toFixed(2)}`],
    ["Bookings (Month)", String(data.totalBookings)],
    ["Active Trips", String(data.activeTrips)],
  ]);
  y = addKeyValueRow(doc, y, [
    ["Active Operators", String(data.activeOperators)],
    ["Total Users", String(data.totalUsers)],
    ["Active Promotions", String(data.activePromotions)],
  ]);
  y += 4;

  // Users by Role table
  if (data.usersByRole.length > 0) {
    y = addSection(doc, y, "Users by Role");
    autoTable(doc, {
      startY: y + 2,
      head: [["Role", "Count"]],
      body: data.usersByRole.map((r) => [r.name, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Revenue by Method table
  if (data.revenueByMethod.length > 0) {
    y = addSection(doc, y, "Revenue by Method");
    autoTable(doc, {
      startY: y + 2,
      head: [["Method", "Amount"]],
      body: data.revenueByMethod.map((r) => [r.name, `$${r.value.toFixed(2)}`]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Bookings by Status table
  if (data.bookingsByStatus.length > 0) {
    y = addSection(doc, y, "Bookings by Status");
    autoTable(doc, {
      startY: y + 2,
      head: [["Status", "Count"]],
      body: data.bookingsByStatus.map((r) => [r.name, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Trips by Status table
  if (data.tripsByStatus.length > 0) {
    y = addSection(doc, y, "Trips by Status");
    autoTable(doc, {
      startY: y + 2,
      head: [["Status", "Count"]],
      body: data.tripsByStatus.map((r) => [r.name, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Revenue Trend table
  if (data.revenueTrend.length > 0) {
    y = addSection(doc, y, "Daily Revenue (Last 14 Days)");
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    autoTable(doc, {
      startY: y + 2,
      head: [["Date", "Revenue"]],
      body: data.revenueTrend.map((r) => [r.label, `$${r.value.toFixed(2)}`]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 100,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Bookings Trend table
  if (data.bookingsTrend.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    addSection(doc, y, "Daily Bookings (Last 14 Days)");
    autoTable(doc, {
      startY: y + 9,
      head: [["Date", "Bookings"]],
      body: data.bookingsTrend.map((r) => [r.label, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 100,
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `BusExpress System Report — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save("busexpress-system-report.pdf");
}

export async function generateOperatorPdf(data: OperatorReportData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();

  addHeader(doc, `${data.operatorName} — Report`);

  let y = 48;

  // Key Metrics
  y = addSection(doc, y, "Key Metrics");
  
  const metricPairs1: [string, string | number][] = [
    ["Active Buses", `${data.activeBuses}/${data.totalBuses}`],
    ["Active Routes", `${data.activeRoutes}/${data.totalRoutes}`],
    ["Active Schedules", String(data.activeSchedules)],
  ];
  
  const metricPairs2: [string, string | number][] = [
    ["Active Staff", `${data.activeStaff}/${data.totalStaff}`],
    ["Today's Trips", String(data.tripScheduled + data.tripInProgress + data.tripCompleted)],
    ["Today's Bookings", String(data.todayBookings)],
  ];

  if (data.totalRevenue !== undefined) {
    metricPairs1.push(["Revenue (Month)", `$${data.totalRevenue.toFixed(2)}`]);
  }

  y = addKeyValueRow(doc, y + 2, metricPairs1);
  y = addKeyValueRow(doc, y, metricPairs2);
  y += 4;

  // Today's Trips Summary
  y = addSection(doc, y, "Today's Trip Summary");
  autoTable(doc, {
    startY: y + 2,
    head: [["Status", "Count"]],
    body: [
      ["Scheduled", String(data.tripScheduled)],
      ["In Progress", String(data.tripInProgress)],
      ["Completed", String(data.tripCompleted)],
    ],
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 20 },
    tableWidth: 80,
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Revenue by Method Table (if present)
  if (data.revenueByMethod && data.revenueByMethod.length > 0) {
    y = addSection(doc, y, "Revenue by Method");
    autoTable(doc, {
      startY: y + 2,
      head: [["Method", "Amount"]],
      body: data.revenueByMethod.map((r) => [r.name, `$${r.value.toFixed(2)}`]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Fleet Status table
  if (data.busChartData.length > 0) {
    y = addSection(doc, y, "Fleet Status");
    autoTable(doc, {
      startY: y + 2,
      head: [["Status", "Count"]],
      body: data.busChartData.map((b) => [b.name, String(b.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Staff Breakdown table
  if (data.staffChartData.length > 0) {
    y = addSection(doc, y, "Staff Breakdown");
    autoTable(doc, {
      startY: y + 2,
      head: [["Role", "Count"]],
      body: data.staffChartData.map((s) => [s.name, String(s.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Daily Revenue (Last 14 Days)
  if (data.revenueTrend && data.revenueTrend.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    addSection(doc, y, "Daily Revenue (Last 14 Days)");
    autoTable(doc, {
      startY: y + 9,
      head: [["Date", "Revenue"]],
      body: data.revenueTrend.map((t) => [t.label, `$${t.value.toFixed(2)}`]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 100,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Daily Trips (Last 14 Days)
  if (data.tripTrend.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    addSection(doc, y, "Daily Trips (Last 14 Days)");
    autoTable(doc, {
      startY: y + 9,
      head: [["Date", "Trips"]],
      body: data.tripTrend.map((t) => [t.label, String(t.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 100,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Daily Bookings (Last 14 Days)
  if (data.bookingTrend.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    addSection(doc, y, "Daily Bookings (Last 14 Days)");
    autoTable(doc, {
      startY: y + 9,
      head: [["Date", "Bookings"]],
      body: data.bookingTrend.map((b) => [b.label, String(b.value)]),
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20 },
      tableWidth: 100,
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `BusExpress — ${data.operatorName} Report — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`busexpress-${data.operatorName.toLowerCase().replace(/\s+/g, "-")}-report.pdf`);
}

export async function generateAllOperatorsPdf(data: OperatorSummary[]) {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape
  const pageW = doc.internal.pageSize.getWidth();

  addHeader(doc, "All Operators Comparison Report");

  let y = 48;

  // System-wide comparative aggregates
  const totalOps = data.length;
  const totalBuses = data.reduce((s, op) => s + op.totalBuses, 0);
  const activeBuses = data.reduce((s, op) => s + op.activeBuses, 0);
  const totalStaff = data.reduce((s, op) => s + op.totalStaff, 0);
  const totalRevenue = data.reduce((s, op) => s + op.totalRevenue, 0);
  const totalBookings = data.reduce((s, op) => s + op.totalBookings, 0);

  y = addSection(doc, y, "System-wide Comparative Aggregates");
  y = addKeyValueRow(doc, y + 2, [
    ["Total Operators", String(totalOps)],
    ["Total Buses (Active/Total)", `${activeBuses}/${totalBuses}`],
    ["Total Staff", String(totalStaff)],
    ["Total Bookings", String(totalBookings)],
    ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
  ]);
  y += 6;

  // Operator Comparison Table
  y = addSection(doc, y, "Operator Performance Details");
  autoTable(doc, {
    startY: y + 2,
    head: [["Operator", "Status", "Buses (Active)", "Staff (Active)", "Routes", "Schedules", "Trips", "Bookings", "Revenue"]],
    body: data.map((op) => [
      op.operatorName,
      op.status.toUpperCase(),
      `${op.activeBuses}/${op.totalBuses}`,
      `${op.activeStaff}/${op.totalStaff}`,
      String(op.totalRoutes),
      String(op.activeSchedules),
      String(op.totalTrips),
      String(op.totalBookings),
      `$${op.totalRevenue.toFixed(2)}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Leaderboards
  const topRevenue = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  const topBookings = [...data].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);

  if (y > 150) {
    doc.addPage();
    y = 20;
  }

  y = addSection(doc, y, "Operator Rankings");

  // Stack/side-by-side leaderboards in table format
  autoTable(doc, {
    startY: y + 2,
    head: [["Rank", "Top Operator by Revenue", "Revenue", "Top Operator by Bookings", "Bookings"]],
    body: [0, 1, 2, 3, 4].map((idx) => {
      const revOp = topRevenue[idx];
      const bkOp = topBookings[idx];
      return [
        String(idx + 1),
        revOp ? revOp.operatorName : "-",
        revOp ? `$${revOp.totalRevenue.toFixed(2)}` : "-",
        bkOp ? bkOp.operatorName : "-",
        bkOp ? `${bkOp.totalBookings} bookings` : "-",
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    tableWidth: 180,
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `BusExpress — All Operators Comparison Report — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save("busexpress-all-operators-comparison.pdf");
}
