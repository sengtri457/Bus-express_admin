"use client";

import { usePathname, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import type { ReportPeriod } from "@/lib/services/report-period";

interface ReportPeriodFilterProps {
  period: ReportPeriod;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ReportPeriodFilter({ period }: ReportPeriodFilterProps) {
  const pathname = usePathname();
  const router = useRouter();

  function navigate(from: string, to: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(String(form.get("from")), String(form.get("to")));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reporting period
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">{period.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`${period.today.slice(0, 7)}-01`, period.today)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => navigate(addDays(period.today, -29), period.today)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => navigate(addDays(period.today, -89), period.today)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Last 90 days
          </button>
        </div>
        <form
          key={`${period.startDate}-${period.endDate}`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <label className="text-xs font-medium text-gray-600">
            From
            <input
              name="from"
              type="date"
              defaultValue={period.startDate}
              max={period.today}
              required
              className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs font-medium text-gray-600">
            To
            <input
              name="to"
              type="date"
              defaultValue={period.endDate}
              min={period.startDate}
              max={period.today}
              required
              className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}
