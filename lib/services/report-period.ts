export const REPORT_TIME_ZONE = "Asia/Phnom_Penh";
export const REPORT_UTC_OFFSET = "+07:00";

export interface ReportPeriod {
  startDate: string;
  endDate: string;
  startTimestamp: string;
  endExclusiveTimestamp: string;
  label: string;
  dayCount: number;
  today: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORT_DAYS = 366;

function dateInTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDate(value: string) {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function createReportPeriod(from?: string, to?: string): ReportPeriod {
  const today = dateInTimeZone();
  const defaultStart = `${today.slice(0, 7)}-01`;
  const startDate = parseDate(from ?? "") ? from! : defaultStart;
  const requestedEnd = parseDate(to ?? "") ? to! : today;
  const endDate = requestedEnd < startDate ? startDate : requestedEnd;

  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (dayCount > MAX_REPORT_DAYS) {
    throw new Error(`Report date ranges cannot exceed ${MAX_REPORT_DAYS} days.`);
  }

  return {
    startDate,
    endDate,
    startTimestamp: `${startDate}T00:00:00${REPORT_UTC_OFFSET}`,
    endExclusiveTimestamp: `${addDays(endDate, 1)}T00:00:00${REPORT_UTC_OFFSET}`,
    label:
      startDate === endDate
        ? formatDate(startDate)
        : `${formatDate(startDate)} – ${formatDate(endDate)}`,
    dayCount,
    today,
  };
}

export function listPeriodDates(period: ReportPeriod) {
  return Array.from({ length: period.dayCount }, (_, index) =>
    addDays(period.startDate, index)
  );
}

export function formatPeriodChartDate(value: string, includeYear = false) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "2-digit" } : {}),
    timeZone: "UTC",
  });
}

export function getSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
