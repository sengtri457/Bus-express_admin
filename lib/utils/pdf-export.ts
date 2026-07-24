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

interface KpiCard {
  label: string;
  value: string;
  detail?: string;
  accent?: RGB;
}

interface BreakdownItem {
  label: string;
  value: number;
  displayValue?: string;
  color?: RGB;
}

interface TrendPoint {
  label: string;
  value: number;
}

const COLOR = {
  navy: [15, 23, 42] as RGB,
  slate: [71, 85, 105] as RGB,
  muted: [100, 116, 139] as RGB,
  line: [226, 232, 240] as RGB,
  surface: [248, 250, 252] as RGB,
  white: [255, 255, 255] as RGB,
  blue: [37, 99, 235] as RGB,
  blueSoft: [239, 246, 255] as RGB,
  emerald: [5, 150, 105] as RGB,
  emeraldSoft: [236, 253, 245] as RGB,
  amber: [217, 119, 6] as RGB,
  red: [220, 38, 38] as RGB,
  violet: [124, 58, 237] as RGB,
};

const MARGIN_X = 14;
const CONTENT_TOP = 52;
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
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pdfText(value: string) {
  return value.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function fitText(doc: jsPDF, value: string, maxWidth: number) {
  const normalized = pdfText(value);
  if (doc.getTextWidth(normalized) <= maxWidth) return normalized;
  let shortened = normalized;
  while (shortened.length > 1 && doc.getTextWidth(`${shortened}...`) > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened.trimEnd()}...`;
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
    subject: "BusExpress management report",
    author: "BusExpress",
    creator: "BusExpress Admin",
  });
  return doc;
}

function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  periodLabel: string,
  accent: RGB
) {
  const width = pageWidth(doc);
  doc.setFillColor(...COLOR.navy);
  doc.rect(0, 0, width, 43, "F");
  doc.setFillColor(...accent);
  doc.rect(0, 0, 4, 43, "F");

  doc.setFillColor(...accent);
  doc.roundedRect(MARGIN_X, 9, 10, 10, 2, 2, "F");
  setText(doc, COLOR.white, 10, "bold");
  doc.text("B", MARGIN_X + 5, 15.7, { align: "center" });
  setText(doc, COLOR.white, 12, "bold");
  doc.text("BusExpress", MARGIN_X + 14, 16);

  setText(doc, COLOR.white, 19, "bold");
  doc.text(fitText(doc, title, width - 105), MARGIN_X, 29);
  setText(doc, [203, 213, 225], 8.5);
  doc.text(fitText(doc, subtitle, width - 105), MARGIN_X, 36);

  const metaX = width - MARGIN_X;
  setText(doc, COLOR.white, 9, "bold");
  doc.text(fitText(doc, periodLabel, 68), metaX, 15, { align: "right" });
  setText(doc, [148, 163, 184], 7.5);
  doc.text(`Generated ${generatedAt()}`, metaX, 21, { align: "right" });
  doc.setDrawColor(51, 65, 85);
  doc.line(width - 72, 26, metaX, 26);
  setText(doc, [148, 163, 184], 7);
  doc.text("INTERNAL MANAGEMENT REPORT", metaX, 32, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, requiredHeight: number) {
  if (y + requiredHeight <= pageHeight(doc) - CONTENT_BOTTOM) return y;
  doc.addPage();
  return 24;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string) {
  y = ensureSpace(doc, y, subtitle ? 15 : 11);
  doc.setFillColor(...COLOR.blue);
  doc.roundedRect(MARGIN_X, y - 4.4, 1.6, subtitle ? 11 : 7, 0.8, 0.8, "F");
  setText(doc, COLOR.navy, 11, "bold");
  doc.text(title, MARGIN_X + 5, y);
  if (subtitle) {
    setText(doc, COLOR.muted, 7.5);
    doc.text(subtitle, MARGIN_X + 5, y + 5);
    return y + 11;
  }
  return y + 7;
}

function drawKpiGrid(
  doc: jsPDF,
  y: number,
  cards: KpiCard[],
  columns: number
) {
  const gap = 4;
  const width =
    (pageWidth(doc) - MARGIN_X * 2 - gap * (columns - 1)) / columns;
  const cardHeight = 23;

  for (let index = 0; index < cards.length; index += columns) {
    y = ensureSpace(doc, y, cardHeight + 5);
    const row = cards.slice(index, index + columns);

    row.forEach((card, column) => {
      const x = MARGIN_X + column * (width + gap);
      const accent = card.accent ?? COLOR.blue;
      doc.setFillColor(...COLOR.white);
      doc.setDrawColor(...COLOR.line);
      doc.roundedRect(x, y, width, cardHeight, 2.2, 2.2, "FD");
      doc.setFillColor(...accent);
      doc.roundedRect(x, y, 2, cardHeight, 1, 1, "F");

      setText(doc, COLOR.muted, 7, "bold");
      doc.text(card.label.toUpperCase(), x + 6, y + 6.5);
      setText(doc, COLOR.navy, 14, "bold");
      const value = doc.splitTextToSize(card.value, width - 10)[0] ?? card.value;
      doc.text(value, x + 6, y + 14.2);
      if (card.detail) {
        setText(doc, COLOR.muted, 6.5);
        doc.text(card.detail, x + 6, y + 19.5);
      }
    });

    y += cardHeight + 5;
  }

  return y;
}

function drawSnapshotStrip(
  doc: jsPDF,
  y: number,
  items: { label: string; value: string }[]
) {
  y = ensureSpace(doc, y, 21);
  const width = pageWidth(doc) - MARGIN_X * 2;
  const itemWidth = width / items.length;
  doc.setFillColor(...COLOR.surface);
  doc.setDrawColor(...COLOR.line);
  doc.roundedRect(MARGIN_X, y, width, 17, 2, 2, "FD");

  items.forEach((item, index) => {
    const x = MARGIN_X + itemWidth * index;
    if (index > 0) {
      doc.setDrawColor(...COLOR.line);
      doc.line(x, y + 3, x, y + 14);
    }
    setText(doc, COLOR.muted, 6.7, "bold");
    doc.text(item.label.toUpperCase(), x + itemWidth / 2, y + 6, {
      align: "center",
    });
    setText(doc, COLOR.navy, 11.5, "bold");
    doc.text(item.value, x + itemWidth / 2, y + 12.8, {
      align: "center",
    });
  });

  return y + 22;
}

function drawBreakdownPanels(
  doc: jsPDF,
  y: number,
  panels: { title: string; items: BreakdownItem[] }[],
  columns: number
) {
  const gap = 4;
  const width =
    (pageWidth(doc) - MARGIN_X * 2 - gap * (columns - 1)) / columns;
  const maxRows = Math.max(1, ...panels.map((panel) => panel.items.length));
  const height = 14 + maxRows * 8;
  y = ensureSpace(doc, y, height + 5);

  panels.forEach((panel, index) => {
    const x = MARGIN_X + index * (width + gap);
    doc.setFillColor(...COLOR.white);
    doc.setDrawColor(...COLOR.line);
    doc.roundedRect(x, y, width, height, 2, 2, "FD");
    doc.setFillColor(...COLOR.surface);
    doc.roundedRect(x, y, width, 10, 2, 2, "F");
    doc.rect(x, y + 7, width, 3, "F");
    setText(doc, COLOR.navy, 8.5, "bold");
    doc.text(panel.title, x + 4, y + 6.5);

    const maxValue = Math.max(1, ...panel.items.map((item) => item.value));
    panel.items.forEach((item, row) => {
      const rowY = y + 15 + row * 8;
      const color = item.color ?? COLOR.blue;
      doc.setFillColor(...color);
      doc.circle(x + 4.5, rowY - 1, 1.2, "F");
      setText(doc, COLOR.slate, 7.2);
      doc.text(item.label, x + 8, rowY);
      setText(doc, COLOR.navy, 7.2, "bold");
      doc.text(
        item.displayValue ?? integer(item.value),
        x + width - 4,
        rowY,
        { align: "right" }
      );
      doc.setFillColor(...COLOR.line);
      doc.roundedRect(x + 8, rowY + 2, width - 12, 1.3, 0.6, 0.6, "F");
      doc.setFillColor(...color);
      doc.roundedRect(
        x + 8,
        rowY + 2,
        Math.max(1, ((width - 12) * item.value) / maxValue),
        1.3,
        0.6,
        0.6,
        "F"
      );
    });
  });

  return y + height + 6;
}

function compactTrend(points: TrendPoint[], maxPoints = 14) {
  if (points.length <= maxPoints) return points;
  const groupSize = Math.ceil(points.length / maxPoints);
  const compacted: TrendPoint[] = [];

  for (let index = 0; index < points.length; index += groupSize) {
    const group = points.slice(index, index + groupSize);
    compacted.push({
      label:
        group.length > 1
          ? `${group[0].label}-${group[group.length - 1].label}`
          : group[0].label,
      value: group.reduce((sum, point) => sum + point.value, 0),
    });
  }

  return compacted;
}

function drawTrendChart(
  doc: jsPDF,
  y: number,
  title: string,
  points: TrendPoint[],
  color: RGB,
  valueFormatter: (value: number) => string
) {
  const height = 58;
  y = ensureSpace(doc, y, height + 5);
  const width = pageWidth(doc) - MARGIN_X * 2;
  const chartX = MARGIN_X + 10;
  const chartY = y + 14;
  const chartWidth = width - 18;
  const chartHeight = 29;
  const data = compactTrend(points);
  const maxValue = Math.max(1, ...data.map((point) => point.value));

  doc.setFillColor(...COLOR.white);
  doc.setDrawColor(...COLOR.line);
  doc.roundedRect(MARGIN_X, y, width, height, 2, 2, "FD");
  setText(doc, COLOR.navy, 9.5, "bold");
  doc.text(title, MARGIN_X + 5, y + 7);
  setText(doc, COLOR.muted, 7);
  doc.text(
    `${points.length} daily records`,
    MARGIN_X + width - 5,
    y + 7,
    { align: "right" }
  );

  doc.setDrawColor(...COLOR.line);
  for (let grid = 0; grid <= 3; grid += 1) {
    const gridY = chartY + (chartHeight / 3) * grid;
    doc.line(chartX, gridY, chartX + chartWidth, gridY);
  }

  const slotWidth = chartWidth / Math.max(1, data.length);
  const barWidth = Math.max(2, Math.min(8, slotWidth * 0.55));
  data.forEach((point, index) => {
    const barHeight = Math.max(0.8, (point.value / maxValue) * chartHeight);
    const x = chartX + slotWidth * index + (slotWidth - barWidth) / 2;
    const barY = chartY + chartHeight - barHeight;
    doc.setFillColor(...color);
    doc.roundedRect(x, barY, barWidth, barHeight, 0.8, 0.8, "F");
  });

  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  labelIndexes.forEach((index) => {
    const point = data[index];
    if (!point) return;
    setText(doc, COLOR.muted, 6.2);
    const label =
      point.label.length > 18 ? `${point.label.slice(0, 17)}...` : point.label;
    doc.text(label, chartX + slotWidth * index + slotWidth / 2, chartY + 35, {
      align: "center",
    });
  });

  setText(doc, color, 7.5, "bold");
  doc.text(
    `Peak ${valueFormatter(maxValue)}`,
    MARGIN_X + width - 5,
    y + height - 5,
    { align: "right" }
  );

  return y + height + 6;
}

function drawDataTable(
  doc: jsPDF,
  y: number,
  title: string,
  head: string[],
  body: (string | number)[][],
  options?: {
    landscape?: boolean;
    accent?: RGB;
    columnStyles?: Record<number, { halign?: "left" | "center" | "right"; cellWidth?: number }>;
  }
) {
  y = ensureSpace(doc, y, 28);
  y = drawSectionTitle(doc, y, title);
  const accent = options?.accent ?? COLOR.navy;
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: options?.landscape ? 7.2 : 8,
      textColor: COLOR.slate,
      cellPadding: 3,
      lineColor: COLOR.line,
      lineWidth: { bottom: 0.15 },
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: accent,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: options?.landscape ? 6.8 : 7.5,
      cellPadding: 3.2,
    },
    alternateRowStyles: {
      fillColor: COLOR.surface,
    },
    columnStyles: options?.columnStyles,
    margin: {
      left: MARGIN_X,
      right: MARGIN_X,
      top: 24,
      bottom: CONTENT_BOTTOM,
    },
    showHead: "everyPage",
  });
  return lastTableY(doc, y) + 8;
}

function addReportNotes(doc: jsPDF, y: number, notes: string[]) {
  y = ensureSpace(doc, y, 17 + notes.length * 4);
  const width = pageWidth(doc) - MARGIN_X * 2;
  doc.setFillColor(...COLOR.blueSoft);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(MARGIN_X, y, width, 12 + notes.length * 4, 2, 2, "FD");
  setText(doc, COLOR.blue, 7.5, "bold");
  doc.text("REPORT NOTES", MARGIN_X + 5, y + 6);
  setText(doc, COLOR.slate, 6.8);
  notes.forEach((note, index) => {
    doc.text(`- ${note}`, MARGIN_X + 5, y + 11 + index * 4);
  });
  return y + 17 + notes.length * 4;
}

function decoratePages(doc: jsPDF, reportName: string, accent: RGB) {
  const totalPages = doc.getNumberOfPages();
  const width = pageWidth(doc);
  const height = pageHeight(doc);

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    if (page > 1) {
      doc.setFillColor(...COLOR.white);
      doc.rect(0, 0, width, 18, "F");
      doc.setFillColor(...accent);
      doc.rect(0, 0, 3, 18, "F");
      setText(doc, COLOR.navy, 8.5, "bold");
      doc.text("BusExpress", MARGIN_X, 10);
      setText(doc, COLOR.muted, 7);
      doc.text(reportName, width - MARGIN_X, 10, { align: "right" });
      doc.setDrawColor(...COLOR.line);
      doc.line(MARGIN_X, 16, width - MARGIN_X, 16);
    }

    doc.setDrawColor(...COLOR.line);
    doc.line(MARGIN_X, height - 14, width - MARGIN_X, height - 14);
    setText(doc, COLOR.muted, 6.5);
    doc.text("BusExpress | Internal use", MARGIN_X, height - 8);
    doc.text(
      `Page ${page} of ${totalPages}`,
      width - MARGIN_X,
      height - 8,
      { align: "right" }
    );
  }
}

export async function generateSuperAdminPdf(data: SystemReportData) {
  const title = "System Performance Report";
  const doc = createDocument("portrait", title);
  drawHeader(
    doc,
    title,
    "Network-wide commercial and operational performance",
    data.period.label,
    COLOR.emerald
  );

  let y = CONTENT_TOP;
  y = drawSectionTitle(doc, y, "Executive Summary", "Selected-period business results");
  y = drawKpiGrid(
    doc,
    y,
    [
      {
        label: "Revenue",
        value: money(data.totalRevenue),
        detail: data.period.label,
        accent: COLOR.emerald,
      },
      {
        label: "Bookings",
        value: integer(data.totalBookings),
        detail: `${integer(data.paidBookings)} paid`,
        accent: COLOR.blue,
      },
      {
        label: "Average Ticket",
        value: money(data.averageTicketValue),
        detail: "Per paid booking",
        accent: COLOR.violet,
      },
      {
        label: "Trips",
        value: integer(data.periodTrips),
        detail: `${integer(data.completedTrips)} completed`,
        accent: COLOR.blue,
      },
      {
        label: "Completion Rate",
        value: `${data.tripCompletionRate}%`,
        detail: "Completed / total trips",
        accent: COLOR.emerald,
      },
      {
        label: "Cancellation Rate",
        value: `${data.tripCancellationRate}%`,
        detail: `${integer(data.cancelledTrips)} cancelled`,
        accent: data.tripCancellationRate > 10 ? COLOR.red : COLOR.amber,
      },
    ],
    3
  );

  y = drawSectionTitle(doc, y, "Current Network Snapshot");
  y = drawSnapshotStrip(doc, y, [
    { label: "Live trips today", value: integer(data.activeTripsToday) },
    {
      label: "Active operators",
      value: `${integer(data.activeOperators)}/${integer(data.totalOperators)}`,
    },
    { label: "Registered users", value: integer(data.totalUsers) },
    { label: "Active promotions", value: integer(data.activePromotions) },
  ]);

  y = drawSectionTitle(doc, y, "Performance Mix");
  y = drawBreakdownPanels(
    doc,
    y,
    [
      {
        title: "Revenue by Method",
        items: data.revenueByMethod.map((item, index) => ({
          label: item.name,
          value: item.value,
          displayValue: money(item.value),
          color: index === 0 ? COLOR.emerald : COLOR.blue,
        })),
      },
      {
        title: "Bookings by Status",
        items: data.bookingsByStatus.map((item) => ({
          label: item.name,
          value: item.value,
          color:
            item.name.toLowerCase() === "cancelled" ? COLOR.red : COLOR.blue,
        })),
      },
      {
        title: "Trips by Status",
        items: data.tripsByStatus.map((item) => ({
          label: item.name,
          value: item.value,
          color:
            item.name.toLowerCase() === "cancelled"
              ? COLOR.red
              : item.name.toLowerCase() === "completed"
                ? COLOR.emerald
                : COLOR.violet,
        })),
      },
    ],
    3
  );

  y = ensureSpace(doc, y, 76);
  y = drawSectionTitle(doc, y, "Daily Trends", "Long periods are grouped into readable buckets");
  y = drawTrendChart(
    doc,
    y,
    "Revenue Trend",
    data.revenueTrend,
    COLOR.emerald,
    money
  );
  y = drawTrendChart(
    doc,
    y,
    "Booking Trend",
    data.bookingsTrend,
    COLOR.blue,
    integer
  );

  y = drawDataTable(
    doc,
    y,
    "User Distribution",
    ["Role", "Users", "Share"],
    data.usersByRole.map((item) => [
      item.name,
      integer(item.value),
      data.totalUsers > 0
        ? `${((item.value / data.totalUsers) * 100).toFixed(1)}%`
        : "0%",
    ]),
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
      },
    }
  );

  addReportNotes(doc, y, [
    `Promotion codes used during the period: ${integer(data.promoUsageCount)}.`,
    "Revenue includes payments with paid status inside the selected period.",
    "Operator, user, and promotion counts are current snapshots.",
  ]);

  decoratePages(doc, title, COLOR.emerald);
  doc.save("busexpress-system-report.pdf");
  return doc;
}

export async function generateOperatorPdf(data: OperatorReportData) {
  const title = "Operator Performance Report";
  const doc = createDocument("portrait", `${data.operatorName} - ${title}`);
  drawHeader(
    doc,
    title,
    data.operatorName,
    data.period.label,
    COLOR.blue
  );

  let y = CONTENT_TOP;
  y = drawSectionTitle(doc, y, "Executive Summary", "Commercial and service delivery results");
  y = drawKpiGrid(
    doc,
    y,
    [
      {
        label: "Revenue",
        value: money(data.totalRevenue),
        detail: data.period.label,
        accent: COLOR.emerald,
      },
      {
        label: "Bookings",
        value: integer(data.totalBookings),
        detail: `${integer(data.paidBookings)} paid`,
        accent: COLOR.blue,
      },
      {
        label: "Average Ticket",
        value: money(data.averageTicketValue),
        detail: "Per paid booking",
        accent: COLOR.violet,
      },
      {
        label: "Completed Trips",
        value: integer(data.completedTrips),
        detail: `${integer(data.periodTrips)} total trips`,
        accent: COLOR.emerald,
      },
      {
        label: "Booking Success",
        value: `${data.bookingSuccessRate}%`,
        detail: `${integer(data.confirmedBookings)} successful`,
        accent: COLOR.blue,
      },
      {
        label: "Trip Cancellation",
        value: `${data.cancellationRate}%`,
        detail: `${integer(data.cancelledTrips)} cancelled`,
        accent: data.cancellationRate > 10 ? COLOR.red : COLOR.amber,
      },
    ],
    3
  );

  y = drawSectionTitle(doc, y, "Current Operational Capacity");
  y = drawSnapshotStrip(doc, y, [
    {
      label: "Active buses",
      value: `${integer(data.activeBuses)}/${integer(data.totalBuses)}`,
    },
    {
      label: "Active routes",
      value: `${integer(data.activeRoutes)}/${integer(data.totalRoutes)}`,
    },
    { label: "Active schedules", value: integer(data.activeSchedules) },
    {
      label: "Active staff",
      value: `${integer(data.activeStaff)}/${integer(data.totalStaff)}`,
    },
  ]);
  y = drawSnapshotStrip(doc, y - 2, [
    {
      label: "Trips today",
      value: integer(
        data.tripScheduled + data.tripInProgress + data.tripCompleted
      ),
    },
    { label: "Bookings today", value: integer(data.todayBookings) },
    {
      label: "Revenue / completed trip",
      value: money(data.revenuePerCompletedTrip),
    },
    {
      label: "Cancelled bookings",
      value: integer(data.cancelledBookings),
    },
  ]);

  y = drawSectionTitle(doc, y, "Operational Mix");
  y = drawBreakdownPanels(
    doc,
    y,
    [
      {
        title: "Fleet Status",
        items: data.busChartData.map((item) => ({
          label: item.name,
          value: item.value,
          color:
            item.name === "Active"
              ? COLOR.emerald
              : item.name === "Maintenance"
                ? COLOR.amber
                : COLOR.red,
        })),
      },
      {
        title: "Staff by Role",
        items: data.staffChartData.map((item, index) => ({
          label: item.name,
          value: item.value,
          color: index === 0 ? COLOR.blue : COLOR.violet,
        })),
      },
      {
        title: "Today's Trips",
        items: [
          {
            label: "Scheduled",
            value: data.tripScheduled,
            color: COLOR.blue,
          },
          {
            label: "In Progress",
            value: data.tripInProgress,
            color: COLOR.amber,
          },
          {
            label: "Completed",
            value: data.tripCompleted,
            color: COLOR.emerald,
          },
        ],
      },
    ],
    3
  );

  if (data.revenueByMethod.length > 0) {
    y = drawSectionTitle(doc, y, "Revenue Collection");
    y = drawBreakdownPanels(
      doc,
      y,
      [
        {
          title: "Payment Methods",
          items: data.revenueByMethod.map((item, index) => ({
            label: item.name,
            value: item.value,
            displayValue: money(item.value),
            color: index === 0 ? COLOR.emerald : COLOR.blue,
          })),
        },
      ],
      1
    );
  }

  y = ensureSpace(doc, y, 76);
  y = drawSectionTitle(doc, y, "Daily Trends", "Long periods are grouped into readable buckets");
  y = drawTrendChart(
    doc,
    y,
    "Revenue Trend",
    data.revenueTrend,
    COLOR.emerald,
    money
  );
  y = drawTrendChart(
    doc,
    y,
    "Trip Trend",
    data.tripTrend,
    COLOR.violet,
    integer
  );
  y = drawTrendChart(
    doc,
    y,
    "Booking Trend",
    data.bookingTrend,
    COLOR.blue,
    integer
  );

  addReportNotes(doc, y, [
    "Period revenue is based on paid payments by payment date.",
    "Fleet, route, schedule, and staff figures are current snapshots.",
    "Average ticket value is calculated per paid booking.",
  ]);

  decoratePages(doc, `${data.operatorName} - ${title}`, COLOR.blue);
  doc.save(
    `busexpress-${safeFilename(data.operatorName) || "operator"}-report.pdf`
  );
  return doc;
}

export async function generateAllOperatorsPdf(
  data: OperatorSummary[],
  period?: ReportPeriod
) {
  const title = "All Operators Comparison Report";
  const doc = createDocument("landscape", title);
  const totalBuses = data.reduce((sum, item) => sum + item.totalBuses, 0);
  const activeBuses = data.reduce((sum, item) => sum + item.activeBuses, 0);
  const totalStaff = data.reduce((sum, item) => sum + item.totalStaff, 0);
  const totalTrips = data.reduce((sum, item) => sum + item.totalTrips, 0);
  const totalBookings = data.reduce(
    (sum, item) => sum + item.totalBookings,
    0
  );
  const totalRevenue = data.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );

  drawHeader(
    doc,
    title,
    "Cross-operator commercial and operational benchmark",
    period?.label ?? "Selected reporting period",
    COLOR.violet
  );

  let y = CONTENT_TOP;
  y = drawSectionTitle(doc, y, "Network Summary");
  y = drawKpiGrid(
    doc,
    y,
    [
      {
        label: "Operators",
        value: integer(data.length),
        accent: COLOR.violet,
      },
      {
        label: "Active Fleet",
        value: `${integer(activeBuses)}/${integer(totalBuses)}`,
        accent: COLOR.blue,
      },
      {
        label: "Staff",
        value: integer(totalStaff),
        accent: COLOR.blue,
      },
      {
        label: "Trips",
        value: integer(totalTrips),
        accent: COLOR.emerald,
      },
      {
        label: "Bookings",
        value: integer(totalBookings),
        accent: COLOR.blue,
      },
      {
        label: "Revenue",
        value: money(totalRevenue),
        accent: COLOR.emerald,
      },
    ],
    6
  );

  y = drawDataTable(
    doc,
    y,
    "Operator Performance Detail",
    [
      "Operator",
      "Status",
      "Fleet",
      "Staff",
      "Routes",
      "Trips",
      "Bookings",
      "Completion",
      "Cancellation",
      "Avg. Ticket",
      "Revenue",
    ],
    data.map((item) => [
      item.operatorName,
      item.status.toUpperCase(),
      `${item.activeBuses}/${item.totalBuses}`,
      `${item.activeStaff}/${item.totalStaff}`,
      `${item.activeRoutes}/${item.totalRoutes}`,
      integer(item.totalTrips),
      integer(item.totalBookings),
      `${item.completionRate}%`,
      `${item.cancellationRate}%`,
      money(item.averageTicketValue),
      money(item.totalRevenue),
    ]),
    {
      landscape: true,
      accent: COLOR.navy,
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
        10: { halign: "right" },
      },
    }
  );

  const revenueRanking = [...data]
    .sort((left, right) => right.totalRevenue - left.totalRevenue)
    .slice(0, 5);
  const bookingRanking = [...data]
    .sort((left, right) => right.totalBookings - left.totalBookings)
    .slice(0, 5);
  const completionRanking = [...data]
    .sort((left, right) => right.completionRate - left.completionRate)
    .slice(0, 5);

  y = drawDataTable(
    doc,
    y,
    "Top Operator Rankings",
    [
      "Rank",
      "Revenue Leader",
      "Revenue",
      "Booking Leader",
      "Bookings",
      "Completion Leader",
      "Completion",
    ],
    Array.from({ length: 5 }, (_, index) => [
      index + 1,
      revenueRanking[index]?.operatorName ?? "-",
      revenueRanking[index] ? money(revenueRanking[index].totalRevenue) : "-",
      bookingRanking[index]?.operatorName ?? "-",
      bookingRanking[index]
        ? integer(bookingRanking[index].totalBookings)
        : "-",
      completionRanking[index]?.operatorName ?? "-",
      completionRanking[index]
        ? `${completionRanking[index].completionRate}%`
        : "-",
    ]),
    {
      landscape: true,
      accent: COLOR.violet,
      columnStyles: {
        0: { halign: "center" },
        2: { halign: "right" },
        4: { halign: "right" },
        6: { halign: "right" },
      },
    }
  );

  addReportNotes(doc, y, [
    "Fleet, staff, route, and schedule figures are current snapshots.",
    "Trip, booking, and revenue figures use the reporting period shown above.",
  ]);

  decoratePages(doc, title, COLOR.violet);
  doc.save("busexpress-all-operators-comparison.pdf");
  return doc;
}
