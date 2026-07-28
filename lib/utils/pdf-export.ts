import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  OperatorReportData,
  OperatorSummary,
} from "@/lib/services/operator-report";
import type { ReportPeriod } from "@/lib/services/report-period";
import type { SystemReportData } from "@/lib/services/system-report";

type RGB = [number, number, number];
type Orientation = "portrait" | "landscape";

type PdfDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const COLOR = {
  navy: [30, 41, 59] as RGB,       // Slate-800
  slate: [71, 85, 105] as RGB,     // Slate-600
  muted: [148, 163, 184] as RGB,   // Slate-400
  line: [226, 232, 240] as RGB,     // Slate-200
  bgBox: [241, 245, 249] as RGB,    // Slate-100 (Header container background)
  white: [255, 255, 255] as RGB,
};

const MARGIN_X = 16;
const CONTENT_BOTTOM = 20;

function money(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function integer(value: number) {
  return value.toLocaleString("en-US");
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generatedAt() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function setText(doc: jsPDF, color: RGB, size: number, weight: "normal" | "bold" = "normal") {
  doc.setTextColor(...color);
  doc.setFontSize(size);
  doc.setFont("helvetica", weight);
}

function lastTableY(doc: jsPDF, fallback: number) {
  return (doc as PdfDocument).lastAutoTable?.finalY ?? fallback;
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF) {
  return doc.internal.pageSize.getHeight();
}

function createDocument(orientation: Orientation, title: string) {
  const doc = new jsPDF(
    orientation === "portrait" ? "p" : "l",
    "mm",
    "a4"
  );
  doc.setProperties({
    title,
    subject: "BusExpress invoice report",
    author: "BusExpress",
    creator: "BusExpress Admin",
  });
  return doc;
}

/**
 * Safe helper to preload image from url using HTML Image element
 */
async function preloadLogo(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draws the clean, soft grey-blue container header at the top,
 * matching the user's reference invoice style.
 */
function drawInvoiceHeader(
  doc: jsPDF,
  title: string,
  docNumber: string,
  docDate: string,
  periodLabel: string,
  logoImg?: HTMLImageElement | null
) {
  const width = pageWidth(doc);
  const headerHeight = 32;
  
  // Clean soft gray-blue top header container background
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, width, headerHeight, "F");

  // Logo rendering
  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", MARGIN_X, 10, 8, 8);
    } catch (e) {
      // Fallback square
      doc.setFillColor(30, 41, 59);
      doc.rect(MARGIN_X, 10, 8, 8, "F");
      setText(doc, COLOR.white, 6, "bold");
      doc.text("BE", MARGIN_X + 4, 15.5, { align: "center" });
    }
  } else {
    // Default square
    doc.setFillColor(30, 41, 59);
    doc.rect(MARGIN_X, 10, 8, 8, "F");
    setText(doc, COLOR.white, 6, "bold");
    doc.text("BE", MARGIN_X + 4, 15.5, { align: "center" });
  }

  // Company details text
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("BusExpress Logistics", MARGIN_X + 11, 13);
  setText(doc, COLOR.slate, 7.5);
  doc.text("support@busexpress.com | busexpress.com", MARGIN_X + 11, 17);

  // Right-aligned Invoice-style header text
  const rightX = width - MARGIN_X;
  setText(doc, COLOR.navy, 18, "bold");
  doc.text(title.toUpperCase(), rightX, 15, { align: "right" });
  
  // Aligned metadata columns to prevent text overlaps
  const labelX = rightX - 65;
  
  setText(doc, COLOR.slate, 8);
  doc.text(`Report Nr:`, labelX, 21);
  setText(doc, COLOR.navy, 8, "bold");
  doc.text(docNumber, rightX, 21, { align: "right" });
  
  setText(doc, COLOR.slate, 8);
  doc.text(`Date:`, labelX, 25);
  setText(doc, COLOR.navy, 8, "bold");
  doc.text(docDate, rightX, 25, { align: "right" });

  setText(doc, COLOR.slate, 8);
  doc.text(`Period:`, labelX, 29);
  setText(doc, COLOR.navy, 8, "bold");
  doc.text(periodLabel, rightX, 29, { align: "right" });
}

/**
 * Draws the Report Metadata block below the header.
 */
function drawMetadataBlock(
  doc: jsPDF,
  y: number,
  title: string,
  fields: { label: string; value: string }[]
) {
  setText(doc, COLOR.slate, 8.5, "bold");
  doc.text(title, MARGIN_X, y);
  y += 5;

  fields.forEach((field) => {
    setText(doc, COLOR.muted, 8);
    doc.text(field.label, MARGIN_X, y);
    
    setText(doc, COLOR.navy, 8, "bold");
    doc.text(field.value, MARGIN_X + 32, y); // Safe X offset to prevent label overlap
    y += 4.5;
  });

  return y + 3;
}

/**
 * Draws a clean table matching the reference style:
 * - Simple horizontal row lines, no vertical lines.
 * - Bold slate header text with a thicker line underneath.
 */
function drawInvoiceTable(
  doc: jsPDF,
  y: number,
  columns: { header: string; dataKey: string; width?: number; align?: "left" | "right" | "center" }[],
  rows: any[]
) {
  const width = pageWidth(doc) - MARGIN_X * 2;
  
  const headers = columns.map((col) => col.header.toUpperCase());
  const body = rows.map((row, idx) => 
    columns.map((col) => {
      if (col.dataKey === "_index") {
        return String(idx + 1).padStart(2, "0");
      }
      return String(row[col.dataKey] ?? "-");
    })
  );

  const columnStyles: any = {};
  columns.forEach((col, index) => {
    columnStyles[index] = {
      halign: col.align ?? "left",
      cellWidth: col.width ? (width * col.width) / 100 : undefined,
    };
  });

  autoTable(doc, {
    startY: y,
    head: [headers],
    body,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: COLOR.navy,
      cellPadding: { top: 3.5, bottom: 3.5, left: 1, right: 1 },
      lineColor: COLOR.line,
      lineWidth: { bottom: 0.1 },
    },
    headStyles: {
      textColor: COLOR.slate,
      fontStyle: "bold",
      fontSize: 7.5,
      lineWidth: { bottom: 0.4 },
      lineColor: COLOR.navy,
    },
    columnStyles,
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  return lastTableY(doc, y) + 6;
}

/**
 * Draws the Subtotal, Discount, Grand Total summary block at the bottom right,
 * with clean divider lines.
 */
function drawInvoiceTotalsBox(
  doc: jsPDF,
  y: number,
  items: { label: string; value: string; isBold?: boolean }[]
) {
  const width = pageWidth(doc);
  const rightX = width - MARGIN_X;
  const labelX = rightX - 60;
  
  items.forEach((item, index) => {
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(labelX, y, rightX, y);
    y += 1.5;

    setText(doc, COLOR.slate, 7.5, item.isBold ? "bold" : "normal");
    doc.text(item.label, labelX, y + 3);
    
    setText(doc, COLOR.navy, 7.5, "bold");
    doc.text(item.value, rightX, y + 3, { align: "right" });
    y += 5.5;

    if (index === items.length - 1) {
      doc.setDrawColor(...COLOR.navy);
      doc.setLineWidth(0.4);
      doc.line(labelX, y, rightX, y);
    }
  });

  return y + 2;
}

/**
 * Draws the disclosures details on the bottom left.
 */
function drawBottomLeftDetails(
  doc: jsPDF,
  y: number,
  title: string,
  details: { label: string; value: string }[]
) {
  setText(doc, COLOR.slate, 8, "bold");
  doc.text(title, MARGIN_X, y);
  y += 4.5;

  details.forEach((item) => {
    setText(doc, COLOR.muted, 7.5);
    doc.text(item.label, MARGIN_X, y);
    setText(doc, COLOR.navy, 7.5, "bold");
    doc.text(item.value, MARGIN_X + 32, y); // Offset adjusted to prevent layout overlaps
    y += 4;
  });

  return y;
}

// Removed signature block

function ensureSpace(doc: jsPDF, y: number, requiredHeight: number) {
  if (y + requiredHeight <= pageHeight(doc) - CONTENT_BOTTOM) return y;
  doc.addPage();
  return 24;
}

/**
 * Super Admin Consolidated PDF Report
 */
export async function generateSuperAdminPdf(data: SystemReportData) {
  const title = "Financial Statement";
  const doc = createDocument("portrait", title);
  
  // 1. Header
  drawInvoiceHeader(doc, title, `BE-SA-${data.period.startDate.replace(/-/g, "")}`, generatedAt(), data.period.label);
  
  // 2. Metadata Block
  let y = drawMetadataBlock(doc, 40, "Report Metadata:", [
    { label: "Reporting Scope:", value: "Consolidated Network Operations" },
    { label: "Authorized Role:", value: "Super Administration Group" },
    { label: "Network State:", value: "Unaudited Financial Disclosures" },
  ]);

  // 3. Section Title & Table 1: Financial & Commercial Summary
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth(doc) - MARGIN_X, y);
  y += 5;
  
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("CONSOLIDATED REVENUE & VOLUME LEDGER", MARGIN_X, y);
  y += 4;

  const cashRev = data.revenueByMethod.find(r => r.name.toLowerCase() === "cash")?.value ?? 0;
  const bakongRev = data.revenueByMethod.find(r => r.name.toLowerCase() === "bakong")?.value ?? 0;

  const cancelledBookingsCount = data.bookingsByStatus.find(b => b.name.toLowerCase() === "cancelled")?.value ?? 0;

  const financialRows = [
    { desc: "Operating Ticket Receipts (Bakong E-Wallet)", rate: "E-wallet", qty: integer(data.bakongBookingsCount), total: money(bakongRev) },
    { desc: "Operating Ticket Receipts (Cash Payment)", rate: "Cash", qty: integer(data.cashBookingsCount), total: money(cashRev) },
    { desc: "Operating Ticket Cancellations (No Receipts)", rate: "Refund", qty: integer(cancelledBookingsCount), total: "$0.00" },
    { desc: "Average Booking Ticket Size", rate: "ATV", qty: "N/A", total: money(data.averageTicketValue) },
  ];

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "Description / Account", dataKey: "desc", width: 50, align: "left" },
    { header: "Payment Code", dataKey: "rate", width: 15, align: "left" },
    { header: "Quantity", dataKey: "qty", width: 12, align: "center" },
    { header: "Gross Amount", dataKey: "total", width: 15, align: "right" },
  ], financialRows);

  // 4. Section Title & Table 2: Operations Logistics
  y += 2;
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("TRANSPORTATION & SCHEDULE DISPATCH PERFORMANCE", MARGIN_X, y);
  y += 4;

  const logisticsRows = [
    { desc: "Total Scheduled Trip Runs", target: "N/A", actual: integer(data.periodTrips), variance: "Total runs scheduled" },
    { desc: "Trip Completion Compliance", target: ">= 95.0%", actual: `${data.tripCompletionRate}%`, variance: data.tripCompletionRate >= 95 ? "COMPLIANT" : "VARIANCE DETECTED" },
    { desc: "Trip Cancellation Compliance", target: "<= 5.0%", actual: `${data.tripCancellationRate}%`, variance: data.tripCancellationRate <= 5 ? "COMPLIANT" : "EXCEEDED LIMIT" },
    { desc: "Active Live Trips Today", target: "N/A", actual: integer(data.activeTripsToday), variance: "Live tracking active" },
  ];

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "Operational KPI Metric", dataKey: "desc", width: 50, align: "left" },
    { header: "Target Threshold", dataKey: "target", width: 15, align: "center" },
    { header: "Actual Value", dataKey: "actual", width: 12, align: "center" },
    { header: "Compliance Status", dataKey: "variance", width: 15, align: "right" },
  ], logisticsRows);

  // 5. Section Title & Table 3: User Pool Distribution
  y += 2;
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("PLATFORM USER ACCOUNT MIX", MARGIN_X, y);
  y += 4;

  const userRows = data.usersByRole.map((u) => {
    const share = data.totalUsers > 0 ? ((u.value / data.totalUsers) * 100).toFixed(1) : "0";
    return {
      role: u.name,
      count: integer(u.value),
      share: `${share}%`
    };
  });

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "User Group Role", dataKey: "role", width: 62, align: "left" },
    { header: "Account Count", dataKey: "count", width: 15, align: "center" },
    { header: "Registered Share", dataKey: "share", width: 15, align: "right" },
  ], userRows);

  // 6. Footer section (reconciled block & totals box)
  y = Math.max(y, pageHeight(doc) - 62);
  
  drawBottomLeftDetails(doc, y, "Disclosures & Reconciliations:", [
    { label: "Gross Receipts:", value: "Fully Reconciled" },
    { label: "Promotion Codes Used:", value: String(data.promoUsageCount) },
    { label: "Reporting Base Code:", value: "BE-SYS-CON" },
  ]);

  const endY = drawInvoiceTotalsBox(doc, y, [
    { label: "Gross Operating Receipts:", value: money(data.totalRevenue) },
    { label: "Finalized Ticket Sales:", value: integer(data.paidBookings) },
    { label: "Consolidated Revenue Total:", value: money(data.totalRevenue), isBold: true },
  ]);

  // Removed signature block

  doc.save("busexpress-system-report.pdf");
  return doc;
}

/**
 * Individual Operator PDF Report
 */
export async function generateOperatorPdf(data: OperatorReportData) {
  const title = "Operations Statement";
  const doc = createDocument("portrait", `${data.operatorName} - ${title}`);
  
  // Preload operator logo URL asynchronously
  const logoImg = await preloadLogo(data.logoUrl);

  // 1. Header (passing the preloaded operator logo image)
  drawInvoiceHeader(
    doc,
    title,
    `BE-OP-${safeFilename(data.operatorName).slice(0, 5).toUpperCase()}`,
    generatedAt(),
    data.period.label,
    logoImg
  );
  
  // 2. Metadata Block
  let y = drawMetadataBlock(doc, 40, "Operator Information:", [
    { label: "Operator Entity Name:", value: data.operatorName },
    { label: "Authorized Role:", value: "Company Operations Management" },
    { label: "Filing Status:", value: "Unaudited Segment Disclosures" },
  ]);

  // 3. Section Title & Table 1: Financial Performance
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth(doc) - MARGIN_X, y);
  y += 5;
  
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("REVENUE RECEIPTS SUMMARY", MARGIN_X, y);
  y += 4;

  const financialRows = [
    { desc: "Segment Ticket Sales (Bakong Mobile Payment)", channel: "Bakong", qty: integer(data.bakongBookingsCount), total: money(data.bakongRevenue) },
    { desc: "Segment Ticket Sales (Physical Cash Receipts)", channel: "Cash", qty: integer(data.cashBookingsCount), total: money(data.cashRevenue) },
    { desc: "Segment Ticket Cancellations (No Receipts)", channel: "Refund", qty: integer(data.cancelledBookings), total: "$0.00" },
    { desc: "Average Ticket Payout Size", channel: "ATV", qty: "N/A", total: money(data.averageTicketValue) },
  ];

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "Description / Operating Line Item", dataKey: "desc", width: 50, align: "left" },
    { header: "Channel", dataKey: "channel", width: 15, align: "left" },
    { header: "Volume", dataKey: "qty", width: 12, align: "center" },
    { header: "Receipts Amount", dataKey: "total", width: 15, align: "right" },
  ], financialRows);

  // 4. Section Title & Table 2: Logistics & Dispatch Summary
  y += 2;
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("DISPATCH SERVICE PERFORMANCE", MARGIN_X, y);
  y += 4;

  const logisticsRows = [
    { desc: "Total Dispatched Scheduled Runs", target: "N/A", actual: integer(data.periodTrips), note: "Scheduled runs count" },
    { desc: "Trip Success Runs (Completed)", target: ">= 95.0%", actual: `${data.bookingSuccessRate}%`, note: `${integer(data.completedTrips)} dispatches completed` },
    { desc: "Trip Cancellation Failures", target: "<= 5.0%", actual: `${data.cancellationRate}%`, note: `${integer(data.cancelledTrips)} dispatches cancelled` },
    { desc: "Average Revenue / Completed Run", target: "N/A", actual: money(data.revenuePerCompletedTrip), note: "Earning per dispatch" },
  ];

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "Operational KPI Metric", dataKey: "desc", width: 50, align: "left" },
    { header: "Target Threshold", dataKey: "target", width: 15, align: "center" },
    { header: "Actual Performance", dataKey: "actual", width: 12, align: "center" },
    { header: "Performance Notes", dataKey: "note", width: 15, align: "right" },
  ], logisticsRows);

  // 5. Section Title & Table 3: Physical Asset Pool & Staff Capacities
  y += 2;
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("PHYSICAL ASSET UTILIZATION & CAPACITY", MARGIN_X, y);
  y += 4;

  const capacityRows = [
    { desc: "Active Bus Fleet Pool", active: integer(data.activeBuses), total: integer(data.totalBuses), rate: `${((data.activeBuses / Math.max(1, data.totalBuses)) * 100).toFixed(1)}%` },
    { desc: "Active Schedule Rotations", active: integer(data.activeSchedules), total: "N/A", rate: "N/A" },
    { desc: "Active Driver & Conductor Pool", active: integer(data.activeStaff), total: integer(data.totalStaff), rate: `${((data.activeStaff / Math.max(1, data.totalStaff)) * 100).toFixed(1)}%` },
  ];

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 8, align: "left" },
    { header: "Asset Capacity Category", dataKey: "desc", width: 62, align: "left" },
    { header: "Active", dataKey: "active", width: 10, align: "center" },
    { header: "Pool Size", dataKey: "total", width: 10, align: "center" },
    { header: "Active Ratio", dataKey: "rate", width: 10, align: "right" },
  ], capacityRows);

  // 6. Footer section (reconciled block & totals box)
  y = Math.max(y, pageHeight(doc) - 62);
  
  drawBottomLeftDetails(doc, y, "Operational Disclosures:", [
    { label: "Segment Revenue:", value: "Fully Reconciled" },
    { label: "Average Ticket Size:", value: money(data.averageTicketValue) },
    { label: "Filing Base Code:", value: `BE-OP-${safeFilename(data.operatorName).slice(0, 3).toUpperCase()}` },
  ]);

  const endY = drawInvoiceTotalsBox(doc, y, [
    { label: "Segment Gross Receipts:", value: money(data.totalRevenue) },
    { label: "Segment Tickets Sold:", value: integer(data.paidBookings) },
    { label: "Gross Receipts Total:", value: money(data.totalRevenue), isBold: true },
  ]);

  // Removed signature block

  doc.save(`busexpress-${safeFilename(data.operatorName) || "operator"}-report.pdf`);
  return doc;
}

/**
 * All Operators Comparison Matrix Report (Landscape)
 */
export async function generateAllOperatorsPdf(
  data: OperatorSummary[],
  period?: ReportPeriod
) {
  const title = "Benchmark Statement";
  const doc = createDocument("landscape", title);
  
  // 1. Header
  drawInvoiceHeader(
    doc,
    title,
    "BE-BM-CONSOLIDATED",
    generatedAt(),
    period?.label ?? "Selected reporting period"
  );

  let y = 40;

  // 2. Summary details block
  const totalOps = data.length;
  const totalBuses = data.reduce((sum, item) => sum + item.totalBuses, 0);
  const activeBuses = data.reduce((sum, item) => sum + item.activeBuses, 0);
  const totalStaff = data.reduce((sum, item) => sum + item.totalStaff, 0);
  const totalTrips = data.reduce((sum, item) => sum + item.totalTrips, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.totalBookings, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  y = drawMetadataBlock(doc, y, "Consolidated Network benchmark scope:", [
    { label: "Total Operators In Scope:", value: String(totalOps) },
    { label: "Active Network Fleet:", value: `${activeBuses} of ${totalBuses} buses active` },
    { label: "Consolidated Bookings:", value: integer(totalBookings) },
  ]);

  // 3. Section Title & Table 1: Operator comparison Matrix (Landscape)
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth(doc) - MARGIN_X, y);
  y += 5;

  setText(doc, COLOR.navy, 9, "bold");
  doc.text("OPERATOR OPERATIONAL & COMMERCIAL BENCHMARK SUMMARY", MARGIN_X, y);
  y += 4;

  const benchmarkRows = data.map((op) => ({
    name: op.operatorName,
    status: op.status.toUpperCase(),
    fleet: `${op.activeBuses}/${op.totalBuses}`,
    staff: `${op.activeStaff}/${op.totalStaff}`,
    routes: String(op.totalRoutes),
    trips: integer(op.totalTrips),
    bookings: integer(op.totalBookings),
    completion: `${op.completionRate}%`,
    avgTicket: money(op.averageTicketValue),
    revenue: money(op.totalRevenue)
  }));

  y = drawInvoiceTable(doc, y, [
    { header: "#", dataKey: "_index", width: 5, align: "left" },
    { header: "Operator Name", dataKey: "name", width: 28, align: "left" },
    { header: "Status", dataKey: "status", width: 10, align: "center" },
    { header: "Fleet (Act/Tot)", dataKey: "fleet", width: 10, align: "center" },
    { header: "Staff (Act/Tot)", dataKey: "staff", width: 10, align: "center" },
    { header: "Routes", dataKey: "routes", width: 7, align: "center" },
    { header: "Scheduled", dataKey: "trips", width: 8, align: "center" },
    { header: "Bookings", dataKey: "bookings", width: 8, align: "center" },
    { header: "Completion", dataKey: "completion", width: 9, align: "center" },
    { header: "Avg Ticket", dataKey: "avgTicket", width: 9, align: "right" },
    { header: "Gross Revenue", dataKey: "revenue", width: 11, align: "right" },
  ], benchmarkRows);

  // 4. Section Title & Table 2: Rankings
  y += 2;
  setText(doc, COLOR.navy, 9, "bold");
  doc.text("OPERATIONAL LEADERBOARD RANKINGS (TOP 5)", MARGIN_X, y);
  y += 4;

  const revenueRanking = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  const bookingRanking = [...data].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);
  const completionRanking = [...data].sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);

  const rankingRows = Array.from({ length: 5 }, (_, idx) => ({
    rank: String(idx + 1).padStart(2, "0"),
    revLeader: revenueRanking[idx] ? `${revenueRanking[idx].operatorName} (${money(revenueRanking[idx].totalRevenue)})` : "-",
    bkLeader: bookingRanking[idx] ? `${bookingRanking[idx].operatorName} (${integer(bookingRanking[idx].totalBookings)} bookings)` : "-",
    compLeader: completionRanking[idx] ? `${completionRanking[idx].operatorName} (${completionRanking[idx].completionRate}%)` : "-",
  }));

  y = drawInvoiceTable(doc, y, [
    { header: "Rank", dataKey: "rank", width: 10, align: "center" },
    { header: "Revenue Leader Category", dataKey: "revLeader", width: 30, align: "left" },
    { header: "Booking Volume Leader Category", dataKey: "bkLeader", width: 30, align: "left" },
    { header: "Completion Rate Leader Category", dataKey: "compLeader", width: 30, align: "left" },
  ], rankingRows);

  // 5. Footer details
  y = Math.max(y, pageHeight(doc) - 48);
  
  drawBottomLeftDetails(doc, y, "Consolidation Scope Details:", [
    { label: "Gross Consolidated Revenue:", value: money(totalRevenue) },
    { label: "Consolidated Ticket Bookings:", value: integer(totalBookings) },
    { label: "Reporting Staff Pool:", value: `${integer(totalStaff)} employees` },
  ]);

  const endY = drawInvoiceTotalsBox(doc, y, [
    { label: "Operators In Benchmark:", value: String(totalOps) },
    { label: "Total Network Trips Scheduled:", value: integer(totalTrips) },
    { label: "Consolidated Operating Revenue:", value: money(totalRevenue), isBold: true },
  ]);

  // Removed signature block

  doc.save("busexpress-all-operators-comparison.pdf");
  return doc;
}
